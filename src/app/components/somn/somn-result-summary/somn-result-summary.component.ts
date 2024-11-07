import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as d3 from 'd3';
import { MenuItem, Message, FilterService } from 'primeng/api';
import { Table } from 'primeng/table';
import { timer, switchMap, takeWhile, shareReplay, tap, map, skipUntil, filter, combineLatest, of, BehaviorSubject, Subscription, forkJoin, take, Observable, combineLatestWith, min, max } from 'rxjs';
import { JobStatus, CheckReactionSiteRequest, CheckReactionSiteResponse, JobType } from '~/app/api/mmli-backend/v1';
import { Product, SomnResponse, SomnService } from '~/app/services/somn.service';
import { TutorialService } from '~/app/services/tutorial.service';
import { JobResult } from '~/app/models/job-result';

import catalystJson from '../about-somn/catalyst_map.json';
import baseJson from '../about-somn/base_map.json';
import solventJson from '../about-somn/solvent_map.json';
import { Slider } from 'primeng/slider';

interface FilterConfig {
  field: string;
  selected: string[];
  options: string[];
  matchMode: string;
}

@Component({
  selector: 'app-somn-result-summary',
  templateUrl: './somn-result-summary.component.html',
  styleUrls: ['./somn-result-summary.component.scss']
})
export class SomnResultSummaryComponent extends JobResult {
  @ViewChild("resultsTable") resultsTable: Table;
  @ViewChild('slider') slider: Slider;
  @ViewChild('inputContainer') rangeInputContainer: ElementRef;

  override jobId: string = this.route.snapshot.paramMap.get("id") || "";
  override jobType: JobType = JobType.Somn;

  displayTutorial: boolean = false;
  exportOptions: MenuItem[] = [];

  yieldMessages: Message[] = [];

  reactantPairOptions = [];
  arylHalideOptions = [];
  amineOptions = [];
  reactionConditionOptions = [];

  showFilter = true;
  selectedTableRows: any[] = [];
  selectedYield: [number, number] = [0, 100];
  numReactantPairSubmitted = 0;

  filters: Record<string, FilterConfig> = {
    reactantPair: {
      field: 'reactantPair',
      selected: [],
      options: [],
      matchMode: 'in',
    },
    arylHalide: {
      field: 'arylHalide.name',
      selected: [],
      options: [],
      matchMode: 'in',
    },
    amine: {
      field: 'amine.name',
      selected: [],
      options: [],
      matchMode: 'in',
    },
    reactionCondition: {
      field: 'topYieldConditions',
      selected: [],
      options: [],
      matchMode: 'subset',
    },
  };

  applyFilters() {
    Object.values(this.filters).forEach(filter => {
      this.resultsTable.filter(filter.selected, filter.field, filter.matchMode);
    });
  }

  clearAllFilters() {
    Object.values(this.filters).forEach(filter => {
      filter.selected = [];
    });
    this.selectedYield = [0, 100];
    this.resultsTable.reset();
  }

  response$ = this.jobResultResponse$.pipe(
    switchMap((resp) => {
      this.numReactantPairSubmitted = this.jobInfo.length;

      const elInfo$: Observable<CheckReactionSiteResponse>[] 
        = this.jobInfo.map((jobInfo: any) => 
            this.service.checkReactionSites(
              jobInfo.el, 
            jobInfo.el_input_type, 
            CheckReactionSiteRequest.RoleEnum.El
          ).pipe(take(1)),
        );

      const nucInfo$: Observable<CheckReactionSiteResponse>[] 
        = this.jobInfo.map((jobInfo: any) => 
          this.service.checkReactionSites(
            jobInfo.nuc, 
            jobInfo.nuc_input_type, 
            CheckReactionSiteRequest.RoleEnum.Nuc
          ).pipe(take(1)),
        );

      const newResp = resp.map((rps: any[]) => 
        rps.map((d: any, i: number) => ({
          ...d,
          iid: i,
          catalyst: catalystJson[d.catalyst as keyof typeof catalystJson],
          solvent: solventJson[d.solvent as keyof typeof solventJson],
          base: baseJson[d.base as keyof typeof baseJson],
        }))
      );

      return combineLatest([
        of(newResp),
        forkJoin(elInfo$),
        forkJoin(nucInfo$)
      ])
    }),
    map(([ resp, el, nuc ]) => {
      const retVal: any[] = [];
      for (let i = 0; i < resp.length; i++) {
        // calculate top yield conditions
        const topYield = Math.max(...resp[i].map((d: any) => Math.floor(d.yield)));
        const topYieldConditions = resp[i].filter((d: any) => Math.floor(d.yield) === topYield);
        const catalystCount = new Set(topYieldConditions.map((c: any) => c.catalyst[0])).size;
        const solventCount = new Set(topYieldConditions.map((c: any) => c.solvent)).size;
        const baseCount = new Set(topYieldConditions.map((c: any) => c.base)).size;

        const getCatalystString = (str: string) => `[Pd(allyl)(${str})][OTf]`;

        const singleSummary = 
          (catalystCount === 1 ? `Catalyst ${getCatalystString(topYieldConditions[0].catalyst[0])}<br>` : '')
          + (baseCount === 1 ? `Base ${topYieldConditions[0].base}<br>` : '')
          + (solventCount === 1 ? `Solvent ${topYieldConditions[0].solvent}` : '');

        const multiSummary = 
          catalystCount > 1 && solventCount > 1 && baseCount > 1 
          ? {
            label: "Multiple Reaction Conditions",
            tooltip: topYieldConditions.slice(0, 3)
              .map((c: any) => `Catalyst ${getCatalystString(c.catalyst[0])} / Base ${c.base} / Solvent ${c.solvent}`)
              .join("<br>") + (topYieldConditions.length > 3 ? `<br>+ ${topYieldConditions.length - 3} more conditions` : ""),
          } 
          : (catalystCount > 1 && solventCount > 1 
            ? {
              label: "Multiple Catalysts / Solvents Combinations",
              tooltip: topYieldConditions.slice(0, 3)
                .map((c: any) => `Catalyst ${getCatalystString(c.catalyst[0])} / Solvent ${c.solvent}`)
                .join("<br>") + (topYieldConditions.length > 3 ? `<br>+ ${topYieldConditions.length - 3} more combinations` : ""),
            } 
            : (catalystCount > 1 && baseCount > 1 
              ? {
                label: "Multiple Catalysts / Bases Combinations",
                tooltip: topYieldConditions.slice(0, 3)
                  .map((c: any) => `Catalyst ${getCatalystString(c.catalyst[0])} / Base ${c.base}`)
                  .join("<br>") + (topYieldConditions.length > 3 ? `<br>+ ${topYieldConditions.length - 3} more combinations` : ""),
              } 
              : (solventCount > 1 && baseCount > 1 
                ? {
                  label: "Multiple Solvents / Bases Combinations",
                  tooltip: topYieldConditions.slice(0, 3)
                    .map((c: any) => `Solvent ${c.solvent} / Base ${c.base}`)
                    .join("<br>") + (topYieldConditions.length > 3 ? `<br>+ ${topYieldConditions.length - 3} more combinations` : ""),
                } 
                : solventCount > 1 
                  ? {
                    label: "Multiple Solvents",
                    tooltip: topYieldConditions.slice(0, 3)
                      .map((c: any) => `Solvent ${c.solvent}`)
                      .join("<br>") + (topYieldConditions.length > 3 ? `<br>+ ${topYieldConditions.length - 3} more solvents` : ""),
                  } 
                  : catalystCount > 1 
                    ? {
                      label: "Multiple Catalysts",
                      tooltip: topYieldConditions.slice(0, 3)
                        .map((c: any) => `Catalyst ${getCatalystString(c.catalyst[0])}`)
                        .join("<br>") + (topYieldConditions.length > 3 ? `<br>+ ${topYieldConditions.length - 3} more catalysts` : ""),
                    } 
                    : baseCount > 1 
                      ? {
                        label: "Multiple Bases",
                        tooltip: topYieldConditions.slice(0, 3)
                          .map((c: any) => `Base ${c.base}`)
                          .join("<br>") + (topYieldConditions.length > 3 ? `<br>+ ${topYieldConditions.length - 3} more bases` : ""),
                      } 
                      : null)));
          

        retVal.push({
          reactantPair: this.jobInfo[i].reactant_pair_name,
          arylHalide: {
            name: this.jobInfo[i].el_name,
            ...el[i],
          },
          amine: {
            name: this.jobInfo[i].nuc_name,
            ...nuc[i],
          },
          topYield: {
            value: topYield,
            count: topYieldConditions.length,
          },
          topYieldConditions: topYieldConditions.map((d: any) => `${d.catalyst[0]} | ${d.base} | ${d.solvent}`),
          topYieldConditionsSummary: {
            singleSummary,
            multiSummary,
          }
        });
      }
      return retVal;
    }),
    tap((v) => {
      this.filters['arylHalide'].options = Array.from(new Set(v.flatMap((d: any) => d.arylHalide.name)));
      this.filters['amine'].options = Array.from(new Set(v.flatMap((d: any) => d.amine.name)));
      this.filters['reactionCondition'].options = Array.from(
        new Set(v.flatMap((d: any) => d.topYieldConditions)));
      this.filters['reactantPair'].options = Array.from(new Set(
        this.jobInfo.map((d: any) => d.reactant_pair_name)
      ));
    }),
  );

  
  // numFilters$ = combineLatest([
  //   this.selectedBases$,
  //   this.selectedCatalysts$,
  //   this.selectedSolvents$,
  // ]).pipe(
  //   map((filters) =>
  //     filters.reduce((p, filter) => (filter.length ? 1 : 0) + p, 0),
  //   ),
  // );

  // exportColumns = [
  //   { field: "amineName", header: "Amine" },
  //   { field: "arylHalideName", header: "Aryl Halide" },
  //   { field: "amineSmiles", header: "Amine SMILES" },
  //   { field: "arylHalideSmiles", header: "Aryl Halide SMILES" },
  //   { field: "catalyst", header: "Catalyst" },
  //   { field: "solvent", header: "Solvent" },
  //   { field: "base", header: "Base" },
  //   { field: "yield", header: "Yield" },
  // ]
  exportFunction({ data, field }: { data: any, field: string }) {
    return field === "catalyst" 
      ? `[Pd(allyl)(${data[0]})][OTf]` 
      : data;
  }

  requestOptions = [
    { label: "Modify and Resubmit Request", icon: "pi pi-refresh", disabled: true },
    { label: "Run a New Request", icon: "pi pi-plus", url: "/somn", target: "_blank" },
  ]

  // exportFileName$ = combineLatest([
  //   this.statusResponse$,
  //   this.response$,
  // ]).pipe(
  //   map(([status, response]) => {
  //     return `${response.reactantPairName}-${status.job_id}`;
  //   }),
  // );

  constructor(
    protected somnService: SomnService,
    private filterService: FilterService,
    private route: ActivatedRoute,
    protected tutorialService: TutorialService,
    private router: Router,
  ) {
    super(somnService);
    
  }

  ngOnInit() {
    this.filterService.register(
      "range",
      (value: number, filter: [number, number]) => {
        return value >= filter[0] && value <= filter[1];
      },
    );
    this.filterService.register(
      "subset",
      (value: any[], filter: any[]) => {
        return filter.every((f) => value.includes(f));
      },
    );
  }

  ngOnDestroy() {
    // this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  viewResults(i: number) {
    this.router.navigate(['somn', 'result', this.jobId, i]);
  }

  copyAndPasteURL(): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = window.location.href;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  onYieldRangeChange(value: [number, number]) {
    if (this.resultsTable) {
      this.resultsTable.filter(value, "topYield.value", "range");
    }

    this.updateRangeDisplay(value);
  }

  updateRangeDisplay(value: [number, number]) {
    if (!this.slider) {
      return;
    }

    setTimeout(() => {
      const [leftHandler, rightHandler] =
        this.slider.el.nativeElement.querySelectorAll(".p-slider-handle");

      if (this.rangeInputContainer) {
        const { x: leftX } = leftHandler.getBoundingClientRect();
        const { x: rightX } = rightHandler.getBoundingClientRect();
        const { x: containerX } =
          this.rangeInputContainer.nativeElement.getBoundingClientRect();
        const [minRange, maxRange]: HTMLInputElement[] = Array.from(
          this.rangeInputContainer.nativeElement.querySelectorAll("input"),
        );
        minRange.style.left = `${leftX - containerX - 12}px`;
        maxRange.style.left = `${rightX - containerX - 12}px`;
        minRange.value = `${value[0]}`;
        maxRange.value = `${value[1]}`;
      }
    });
  }
}
