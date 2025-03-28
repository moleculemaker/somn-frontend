import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as d3 from 'd3';
import { FilterService, MenuItem, Message } from 'primeng/api';
import { Table } from 'primeng/table';
import { switchMap, tap, map, combineLatest, of, BehaviorSubject, Subscription } from 'rxjs';
import { CheckReactionSiteRequest, JobType } from '~/app/api/mmli-backend/v1';
import { Product, SomnResponse, SomnService } from '~/app/services/somn.service';

import { TutorialService } from '~/app/services/tutorial.service';
import { HeatmapComponent } from '../heatmap/heatmap.component';
import { DensityPlotComponent } from '../density-plot/density-plot.component';
import { JobResult } from '~/app/models/job-result';

import catalystJson from '../about-somn/catalyst_map.json';
import baseJson from '../about-somn/base_map.json';
import solventJson from '../about-somn/solvent_map.json';

@Component({
  selector: 'app-somn-result',
  templateUrl: './somn-result.component.html',
  styleUrls: ['./somn-result.component.scss'],
  host: {
    class: "grow flex flex-col"
  }
})
export class SomnResultComponent extends JobResult {
  @ViewChild("resultsTable") resultsTable: Table;
  @ViewChild(HeatmapComponent) heatmapComponent: HeatmapComponent;
  @ViewChild(DensityPlotComponent) densityPlotComponent: DensityPlotComponent;

  override jobId: string = this.route.snapshot.paramMap.get("id") || "";
  override jobType: JobType = JobType.Somn;
  idx: number = parseInt(this.route.snapshot.paramMap.get("idx") || '0');
  currentPage: string = 'result';
  thisJobInfo!: any;
  displayTutorial: boolean = false;
  exportOptions: MenuItem[] = [
    {
      label: 'Visualization (PNG)',
      command: () => {
        const filename = this.thisJobInfo.reactant_pair_name + '-' + this.thisJobInfo.el_name + '-' + this.thisJobInfo.nuc_name;
        this.densityPlotComponent.exportPNG(filename);
        this.heatmapComponent.exportPNG(filename);
      }
    },
    {
      label: 'Table (CSV)',
      items: [
        {
          label: 'Select Row(s)',
          command: () => {
            this.resultsTable.exportCSV({
              selectionOnly: true,
            });
          },
        },
        {
          label: 'Current View',
          command: () => {
            this.resultsTable.exportCSV();
          }
        },
        {
          label: 'Complete Results',
          command: () => {
            this.resultsTable.exportCSV({
              allValues: true,
            });
          }
        }
      ]
    }
  ];

  yieldMessages: Message[] = [];

  response$ = this.jobResultResponse$.pipe(
    tap(() => { this.thisJobInfo = this.jobInfo[this.idx] }),
    switchMap((resp) => {
      return combineLatest([
        of(resp[this.idx]).pipe(
          map((data: SomnResponse) => 
            data.map((d, i) => ({
              ...d,
              iid: i,
              catalyst: catalystJson[d.catalyst],
              solvent: solventJson[d.solvent],
              base: baseJson[d.base],
            })
          )),
        ),
        this.service.checkReactionSites(
          this.thisJobInfo.el, 
          this.thisJobInfo.el_input_type, 
          CheckReactionSiteRequest.RoleEnum.El
        ),
        this.service.checkReactionSites(
          this.thisJobInfo.nuc, 
          this.thisJobInfo.nuc_input_type, 
          CheckReactionSiteRequest.RoleEnum.Nuc
        ),
      ])
    }),
    map(([data, el, nuc]) => {
      // set up high yield messages, if there's any
      let hasMesssage = false;
      data.forEach((d, i) => {
        if (d.yield >= 120 && !hasMesssage) {
          this.yieldMessages.push({
            severity: 'warn',
            summary: 'High Yield',
            detail: `High yield of ${d.yield}% for reaction ${i + 1}`,
          });
          hasMesssage = true;
        }
      })

      let elReactionSites = el.reaction_site_idxes.map((v, i) => ({
        idx: i,
        value: `${v}`,
        svg: '',
      }));
      let elSelectedReactionSite = this.thisJobInfo.el_idx === '-'
        ? elReactionSites[0]
        : elReactionSites.find((v) => v.value === `${this.thisJobInfo.el_idx}`)!;

      let nucReactionSites = nuc.reaction_site_idxes.map((v, i) => ({
        idx: i,
        value: `${v}`,
        svg: '',
      }));
      let nucSelectedReactionSite = this.thisJobInfo.nuc_idx === '-'
        ? nucReactionSites[0]
        : nucReactionSites.find((v) => v.value === `${this.thisJobInfo.nuc_idx}`)!;

      return {
        data: data.map((d, i) => ({ ...d, yield: Math.max(0, d.yield) })),
        reactantPairName: this.thisJobInfo.reactant_pair_name || 'reactant pair',
        arylHalide: {
          name: this.thisJobInfo.el_name || 'aryl halide',
          smiles: el.smiles || 'aryl halide smiles',
          reactionSitesOptions: elReactionSites,
          reactionSite: elSelectedReactionSite,
          structure: el.svg,
        },
        amine: {
          name: this.thisJobInfo.nuc_name || 'amine',
          smiles: nuc.smiles || 'amine smiles',
          reactionSitesOptions: nucReactionSites,
          reactionSite: nucSelectedReactionSite,
          structure: nuc.svg,
        },
      };
    }),

    tap((data) => {
      // show tutorial
      if (!this.tutorialService.showTutorial) {
        this.displayTutorial = true;
      } else {
        this.displayTutorial = false;
      }
    }),
    map((resp) => ({
      ...resp,
      data: resp.data.map((d: Product) => ({
        ...d,
        yield: d.yield / 100,
        amineName: resp.amine.name,
        arylHalideName: resp.arylHalide.name,
        amineSmiles: resp.amine.smiles,
        arylHalideSmiles: resp.arylHalide.smiles,
      })),
    }))
  );

  showFilters$ = new BehaviorSubject(true);

  selectedProducts$ = new BehaviorSubject<number[]>([]);
  selectedCatalysts$ = new BehaviorSubject<any[]>([]);
  selectedBases$ = new BehaviorSubject<any[]>([]);
  selectedSolvents$ = new BehaviorSubject<any[]>([]);
  selectedYield$ = new BehaviorSubject<[number, number]>([0, 100]);
  numFilters$ = combineLatest([
    this.selectedBases$,
    this.selectedCatalysts$,
    this.selectedSolvents$,
  ]).pipe(
    map((filters) =>
      filters.reduce((p, filter) => (filter.length ? 1 : 0) + p, 0),
    ),
  );

  solventsOptions$ = this.response$.pipe(
    map((response) => [...new Set(response.data.flatMap((d) => d.solvent))]
      .map((v) => ({ label: v, value: v }))),
  );
  basesOptions$ = this.response$.pipe(
    map((response) => [...new Set(response.data.flatMap((d) => d.base))]
      .map((v) => ({ label: v, value: v }))),
  );
  catalystsOptions$ = this.response$.pipe(
    map((response) => [...new Set(response.data.map((d) => d.catalyst[0]))]
      .map((v) => ({ label: v, value: v }))),
  );

  filteredDataWithoutYieldRange$ = combineLatest([
    this.response$,
    this.selectedCatalysts$,
    this.selectedBases$,
    this.selectedSolvents$,
    this.selectedProducts$,
  ]).pipe(
    map(
      ([
        response,
        selectedCatalysts,
        selectedBases,
        selectedSolvents,
        selectedProducts,
      ]) =>
        [
          response.data,
          response.data.filter(
            (data) =>
              (
                (selectedCatalysts.length
                  ? selectedCatalysts.includes(data["catalyst"][0])
                  : true) &&
                (selectedBases.length
                  ? selectedBases.includes(data["base"])
                  : true) &&
                (selectedSolvents.length
                  ? selectedSolvents.includes(data["solvent"])
                  : true)
              ) || (
                (selectedProducts.length
                  ? selectedProducts.includes(data["iid"])
                  : false)
              ),
          ),
        ]
    ),
    tap(([
      data,
      filteredData,
    ]) => {
      const allResultsContainer = d3.select("#color-key-all-results");
      const filteredResultsContainer = d3.select("#color-key-filtered-results");
      const width = 40;
      const height = 6;
      const cornerRadius = 3;
      allResultsContainer.selectAll("*").remove(); // Clear existing legend

      if (filteredData.length === data.length) {
        const gradient = this.somnService.getGradientByData(data)
          .attr('id', 'legend-gradient');
        allResultsContainer.html(gradient.node()!.outerHTML);

        // No filters applied - show single color scale
        allResultsContainer.append("rect")
          .attr("width", width)
          .attr("height", height)
          .attr("rx", cornerRadius)
          .attr("ry", cornerRadius)
          .style("fill", `url(#legend-gradient)`);

      } else {
        const gradient = this.somnService.getGradientByData(filteredData)
          .attr('id', 'legend-gradient');
        filteredResultsContainer.html(gradient.node()!.outerHTML);

        // Original data (gray) scale
        allResultsContainer.append("rect")
          .attr("width", width)
          .attr("height", height)
          .attr("rx", cornerRadius)
          .attr("ry", cornerRadius)
          .style("fill", "lightgray");

        // Filtered data scale
        filteredResultsContainer.append("rect")
          .attr("width", width)
          .attr("height", height)
          .attr("rx", cornerRadius)
          .attr("ry", cornerRadius)
          .style("fill", `url(#legend-gradient)`);
      }
    }),
    map(([_, filteredData]) => filteredData)
  );

  dataWithColor$ = this.filteredDataWithoutYieldRange$.pipe(
    map((data: Product[]) => {
      const colorScale = this.somnService.getColorScale(data);
      return data.map((d) => ({
        ...d,
        color: colorScale(d.yield),
      })).sort((a, b) => b["yield"] - a["yield"])
    }),
  );

  selectedTableRows$ = combineLatest([
    this.selectedProducts$,
    this.dataWithColor$,
  ]).pipe(
    map(([selectedProducts, data]) =>
      data.filter((d) => selectedProducts.includes(d.iid))
    )
  );

  topYieldConditions$ = this.dataWithColor$.pipe(
    map((data) => {
      const yields = Math.max(...data.map((d) => Math.floor(d["yield"] * 100)));
      return {
        topYield: yields,
        conditions: data.filter((d) => Math.floor(d["yield"] * 100) >= yields),
      }
    }),
  );

  heatmapData$ = combineLatest(([
    this.response$,
    this.selectedYield$,
    this.selectedBases$,
    this.selectedCatalysts$,
    this.selectedSolvents$,
    this.selectedProducts$,
  ])).pipe(
    map(([response, yieldRange, bases, catalysts, solvents, selection]) => {
      const data = response.data;
      const map = new Map();
      const isHighlighted = (d: any) => {
        return (
          (
            (bases.length ? bases.includes(d.base) : true) &&
            (catalysts.length ? catalysts.includes(d.catalyst[0]) : true) &&
            (solvents.length ? solvents.includes(d.solvent) : true) &&
            d.yield >= yieldRange[0] / 100 &&
            d.yield <= yieldRange[1] / 100
          ) || (
            (selection.length ? selection.includes(d.iid) : false)
          )
        );
      }
      data.forEach((d: Product) => {
        const key = `${d.catalyst[0]}-${d.solvent}/${d.base}`;
        if (map.has(key)) {
          console.warn("ignore data ", d, " because of key duplication");
          return;
        }
        map.set(key, {
          catalyst: d.catalyst,
          solventBase: `${d.base} / ${d.solvent}`,
          solvent: `${d.solvent}`,
          base: `${d.base}`,
          yield: d.yield,
          iid: d.iid,
          isHighlighted: isHighlighted(d),
        });
      });
      return Array.from(map.values());
    }),
  );

  selectedHeatmapCells$ = combineLatest([
    this.selectedProducts$,
    this.heatmapData$,
  ]).pipe(
    map(([selectedProducts, data]) =>
      data.filter((d) => selectedProducts.includes(d.iid))
    )
  );

  subscriptions: Subscription[] = [];

  exportColumns = [
    { field: "amineName", header: "Amine" },
    { field: "arylHalideName", header: "Aryl Halide" },
    { field: "amineSmiles", header: "Amine SMILES" },
    { field: "arylHalideSmiles", header: "Aryl Halide SMILES" },
    { field: "catalyst", header: "Catalyst" },
    { field: "solvent", header: "Solvent" },
    { field: "base", header: "Base" },
    { field: "yield", header: "Yield" },
  ]
  exportFunction({ data, field }: { data: any, field: string }) {
    return field === "catalyst" 
      ? `[Pd(allyl)(${data[0]})][OTf]` 
      : data;
  }

  requestOptions = [
    { label: "Modify and Resubmit Request", icon: "pi pi-refresh", command: () => {
      this.currentPage = 'input';
    } },
    { label: "Run a New Request", icon: "pi pi-plus", url: "/somn", target: "_blank" },
  ]

  exportFileName$ = combineLatest([
    this.statusResponse$,
    this.response$,
  ]).pipe(
    map(([status, response]) => {
      return `${response.reactantPairName}-${status.job_id}`;
    }),
  );

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

  constructor(
    protected somnService: SomnService,
    private filterService: FilterService,
    private route: ActivatedRoute,
    private router: Router,
    protected tutorialService: TutorialService,
  ) {
    super(somnService);
    // setup tutorial
    tutorialService.tutorialKey = 'show-result-page-tutorial';

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
          description: 'Download your results. Current formats supported include PNG for visualizations (yield % distribution and heatmap) and CSV for tabular results.',
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
        element: '#container-reactants',
        popover: {
          title: "Reactants",
          description: 'Review your input reactant pair.',
          side: "right",
          align: "center"
        }
      },
      {
        element: '#container-top-predictions',
        popover: {
          title: "Top Predictions Summary",
          description: 'Preview the highest yield % and associated reaction conditions predicted for your request.',
          side: "left",
          align: "center"
        }
      },
      {
        element: '#container-predicted-conditions',
        popover: {
          title: "Predicted Conditions",
          description: 'Explore the reaction conditions and yield % predictions for your request via filters, yield % distribution and heatmap visualizations, and tabular results.',
          side: "top",
          align: "center"
        }
      },
      {
        element: '#container-filters',
        popover: {
          title: "Filter",
          description: 'Use the filter bar to refine your results view by catalyst, base, solvent, or yield %.',
          side: "top",
          align: "center"
        }
      },
      {
        element: '#diagram-yield-distribution',
        popover: {
          title: "Yield % Distribution",
          description: 'Use the sliders and/or input boxes to filter your results view by yield %.',
          side: "top",
          align: "center"
        }
      },
      {
        element: '#diagram-heatmap',
        popover: {
          title: "Heatmap",
          description: 'Hover or click on an individual square in the heatmap to view the yield % details for that set of reaction conditions.',
          side: "top",
          align: "center"
        }
      },
      {
        element: '#container-table',
        popover: {
          title: "Table",
          description: 'Sort, scroll, and page through the tabular view to find reaction conditions of interest.',
          side: "left",
          align: "center"
        }
      },
    ]);
  }

  ngOnInit() {
    this.filterService.register(
      "range",
      (value: number, filter: [number, number]) => {
        return value * 100 >= filter[0] && value * 100 <= filter[1];
      },
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  clearAllFilters() {
    this.selectedBases$.next([]);
    this.selectedCatalysts$.next([]);
    this.selectedSolvents$.next([]);
    this.selectedYield$.next([0, 100]);
    this.resultsTable.reset();
  }

  onYieldRangeChange(value: [number, number]) {
    const v = this.selectedYield$.value;
    if (v[0] === value[0] && v[1] === value[1]) {
      return;
    }

    this.selectedYield$.next(value);
    if (this.resultsTable) {
      this.resultsTable.filter(value, "yield", "range");
    }
  }

  onSelectedHeatmapCellsChange(cells: any) {
    this.selectedProducts$.next(cells.map((d: Product) => d.iid));
  }

  onTableSelectionChange(rows: any) {
    this.selectedProducts$.next(rows.map((d: Product) => d.iid));
  }

  backToAllResults() {
    this.router.navigate(['somn', 'result', this.jobId]);
  }
}
