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
  selected: any[];
  options: any[];
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
          topYieldConditionsRaw: topYieldConditions,
          topYieldConditionsSummary: {
            singleSummary,
            multiSummary,
          }
        });
      }
      return retVal;
    }),
    tap((v) => {
      this.filters['arylHalide'].options = Array.from(new Set(v.flatMap((d: any) => d.arylHalide.name)))
        .map((d: string) => ({ label: d, value: d }));

      this.filters['amine'].options = Array.from(new Set(v.flatMap((d: any) => d.amine.name)))
        .map((d: string) => ({ label: d, value: d }));

      this.filters['reactionCondition'].options = Array.from(new Set(v.flatMap((d: any) => d.topYieldConditions)))
        .map((d: string) => ({ label: d, value: d }));

      this.filters['reactantPair'].options = Array.from(new Set(this.jobInfo.map((d: any) => d.reactant_pair_name)))
        .map((d: any) => ({ label: d, value: d }));
    }),
    tap(() => {
      // show tutorial
      if (!this.tutorialService.showTutorial) {
        this.displayTutorial = true;
      } else {
        this.displayTutorial = false;
      }
    }),
  );

  requestOptions = [
    { label: "Modify and Resubmit Request", icon: "pi pi-refresh", disabled: true },
    { label: "Run a New Request", icon: "pi pi-plus", url: "/somn", target: "_blank" },
  ]

  exportOptions = [
    { label: 'Job Results Summary', 
      items: [
        { label: 'Selected Row(s)', command: () => this.resultsTable.exportCSV({ selectionOnly: true }) },
        // { label: 'Current View', command: () => this.resultsTable.exportCSV() },
        { label: 'Complete Results', command: () => this.resultsTable.exportCSV({ allValues: true }) },
      ]
    },
    { label: 'Reactant Pair Predicted Conditions', 
      items: [
        { label: 'Selected Row(s)', command: () => this.exportReactionConditions(this.selectedTableRows) },
        // { label: 'Current View', },
        { label: 'Complete Results', command: () => this.exportReactionConditions(this.resultsTable.value) },
      ]
    },
  ]

  exportColumns = [
    { field: 'reactantPair', header: 'Reactant Pair Name' },
    { field: 'arylHalide.name', header: 'Aryl Halide' },
    { field: 'amine.name', header: 'Amine' },
    { field: 'topYield.value', header: 'Top Yield' },
    { field: 'topYieldConditions', header: 'Top Yield Conditions' },
  ]

  constructor(
    protected somnService: SomnService,
    private filterService: FilterService,
    private route: ActivatedRoute,
    protected tutorialService: TutorialService,
    private router: Router,
  ) {
    super(somnService);
    
    tutorialService.tutorialKey = 'result-summary-tutorial';

    tutorialService.onStart = () => {
      this.displayTutorial = true;
    };

    tutorialService.driver.setSteps([
      {
        element: '#btn-request-options',
        popover: {
          title: 'Request Options',
          description: 'Modify and resubmit your request, or run a new request in another tab.',
          side: 'bottom',
          align: 'end'
        }
      },
      {
        element: "#btn-export",
        popover: {
          title: "Export",
          description: 'Download your results. Current formats supported include CSV for the job results summary table and all reactant pair predicted conditions.',
          side: "bottom",
          align: "end"
        }
      },
      {
        element: '#container-job-id',
        popover: {
          title: "Job ID",
          description: 'Copy the link to your Job ID to revisit your results at a later time.',
          side: "right",
          align: "center"
        }
      },
      {
        element: '#container-summary',
        popover: {
          title: "Job Results Summary",
          description: 'Explore top predictions (yield % and reaction conditions), summarized for each reactant pair in your job.',
          side: "top",
          align: "center"
        }
      },
      {
        element: '#btn-view-results',
        popover: {
          title: "View Results",
          description: 'Access a separate page with the full predicted conditions results for a given reactant pair using the corresponding “View results” button.',
          side: "left",
          align: "center"
        }
      },
    ]);
  }

  exportReactionConditions(rows: any[]) {
    const csv = rows.map((row) => {
      return row.topYieldConditionsRaw.map((c: any) => `${row.reactantPair},${row.arylHalide.name},${row.amine.name},${row.topYield.value},${c.catalyst[0]},${c.base},${c.solvent}`).join("\n");
    }).join("\n");
    const header = "Reactant Pair Name,Aryl Halide Name,Amine Name,Top Yield,Catalyst,Base,Solvent\n";
    const blob = new Blob([header + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
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
}
