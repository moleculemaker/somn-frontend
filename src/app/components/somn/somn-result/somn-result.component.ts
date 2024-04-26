import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as d3 from 'd3';
import { FilterService } from 'primeng/api';
import { Table } from 'primeng/table';
import { timer, switchMap, takeWhile, tap, map, skipUntil, filter, of, BehaviorSubject, combineLatest, take, shareReplay, Subscription } from 'rxjs';
import { JobStatus } from '~/app/api/mmli-backend/v1';
import { SomnService } from '~/app/services/somn.service';

@Component({
  selector: 'app-somn-result',
  templateUrl: './somn-result.component.html',
  styleUrls: ['./somn-result.component.scss'],
  host: {
    class: "grow flex"
  }
})
export class SomnResultComponent {
  @ViewChild("resultsTable") resultsTable: Table;
  
  jobId: string = this.route.snapshot.paramMap.get("id") || "";

  statusResponse$ = timer(0, 10000).pipe(
    switchMap(() => this.somnService.getResultStatus(this.jobId)),
    takeWhile((data) => 
      data.phase === JobStatus.Processing 
      || data.phase === JobStatus.Queued
    , true),
    shareReplay(1),
    tap((data) => { console.log('job status: ', data.phase) }),
  );

  isLoading$ = this.statusResponse$.pipe(
    map((job) => job.phase === JobStatus.Processing || job.phase === JobStatus.Queued),
  );

  response$ = this.statusResponse$.pipe(
    skipUntil(this.statusResponse$.pipe(filter((job) => job.phase === JobStatus.Completed))),
    switchMap(() => this.somnService.getResult(this.jobId)),
    tap((data) => { console.log('result: ', data) }),
    shareReplay(1),
    switchMap((data) => of(this.somnService.response)), 
    map((resp) => ({
      ...resp,
      data: resp.data.map((d, i) => ({
        ...d,
        amineName: resp.amine.name,
        arylHalideName: resp.arylHalides.name,
        amineSmiles: resp.amine.smiles,
        arylHalideSmiles: resp.arylHalides.smiles,
        rowId: i,
      })),
    }))//TODO: replace with actual response
  );

  showFilters$ = new BehaviorSubject(true);

  selectedCell$ = new BehaviorSubject<number | null>(null);
  selectedRow$ = new BehaviorSubject<any | null>(null);

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
    map((response) => [...new Set(response.data.flatMap((d) => d.solvent))]),
  );
  basesOptions$ = this.response$.pipe(
    map((response) => [...new Set(response.data.flatMap((d) => d.base))]),
  );
  catalystsOptions$ = this.response$.pipe(
    map((response) => [...new Set(response.data.flatMap((d) => d.catalyst))]),
  );

  dataWithColor$ = this.response$.pipe(
    map((response) => 
      response.data.map((d) => ({ 
        ...d, 
        color: this.getColorAtPercentage(
          d["yield"], 
          d3.min(response.data, d => d["yield"])!, 
          d3.max(response.data, d => d["yield"])!
        )
      })).sort((a, b) => b["yield"] - a["yield"])
    ),
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

  filteredDataWithoutYieldRange$ = combineLatest([
    this.response$,
    this.selectedCatalysts$,
    this.selectedBases$,
    this.selectedSolvents$,
  ]).pipe(
    map(
      ([
        response,
        selectedCatalysts,
        selectedBases,
        selectedSolvents,
      ]) =>
        response.data.filter(
          (data) =>
            (selectedCatalysts.length
              ? selectedCatalysts.includes(data["catalyst"])
              : true) &&
            (selectedBases.length
              ? selectedBases.includes(data["base"])
              : true) &&
            (selectedSolvents.length
              ? selectedSolvents.includes(data["solvent"])
              : true),
        ),
    ),
  );

  heatmapData$ = combineLatest(([
    this.response$,
    this.selectedYield$,
    this.selectedBases$,
    this.selectedCatalysts$,
    this.selectedSolvents$,
  ])).pipe(
    map(([response, yieldRange, bases, catalysts, solvents]) => {
      const data = response.data;
      const map = new Map();
      const isHighlighted = (d: any) => {
        return (
          (bases.length ? bases.includes(d.base) : true) &&
          (catalysts.length ? catalysts.includes(d.catalyst) : true) &&
          (solvents.length ? solvents.includes(d.solvent) : true) &&
          d.yield >= yieldRange[0] / 100 &&
          d.yield <= yieldRange[1] / 100
        );
      }
      data.forEach((d) => {
        const key = `${d.catalyst}-${d.solvent}/${d.base}`;
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
          rowId: d.rowId,
          isHighlighted: isHighlighted(d),
        });
      });
      return Array.from(map.values());
    }),
  );

  subscriptions: Subscription[] = [];

  columns = [
    { field: "amineName", header: "Amine" },
    { field: "arylHalideName", header: "Aryl Halide" },
    { field: "amineSmiles", header: "Amine SMILES" },
    { field: "arylHalideSmiles", header: "Aryl Halide SMILES" },
    { field: "catalyst", header: "Catalyst" },
    { field: "solvent", header: "Solvent" },
    { field: "base", header: "Base" },
    { field: "yield", header: "Yield" },
  ]

  requestOptions = [
    { label: "Modify and Resubmit Request", icon: "pi pi-refresh", disabled: true },
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

  constructor(
    private somnService: SomnService,
    private filterService: FilterService,
    private route: ActivatedRoute,
  ) {
    const sub1 = combineLatest([
      this.selectedCell$,
      this.response$,
    ]).pipe(tap(([cell, response]) => {
      if (cell === null
        || this.selectedRow$.value?.rowId === cell
      ) {
        return;
      }
      this.selectedRow$.next(response.data.find((d) => d.rowId === cell));
    })).subscribe();

    const sub2 = this.selectedRow$.subscribe((row) => {
      if (row === null
        || this.selectedCell$.value === row.rowId
      ) {
        return;
      }
      this.selectedCell$.next(row.rowId);
    });

    this.subscriptions.push(sub1, sub2);
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
    this.resultsTable.reset();
  }

  getColorAtPercentage(percentage: number, min: number, max: number) {
    percentage = percentage > 1 ? percentage / 100 : percentage;
    const colorStops = [
      { offset: "0%", color: "#470459" },
      { offset: "50%", color: "#2E8C89" },
      { offset: "100%", color: "#F5E61D" }
    ];

    // Create a scale to map the percentage to the corresponding color stop
    const scale = d3.scaleLinear(colorStops.map(stop => stop.color))
      .domain(colorStops.map(stop => parseFloat(stop.offset)));

    return scale((percentage - min) / (max - min) * 100);
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

  onExportResults() {
    this.resultsTable.exportCSV({

    });
  }
}