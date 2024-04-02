import { Component, ViewChild } from "@angular/core";
import * as d3 from "d3";
import { FilterService, MenuItem } from "primeng/api";
import { Table } from "primeng/table";
import { BehaviorSubject, combineLatest, map, of } from "rxjs";
import { SomnRequest, SomnService } from "~/app/services/somn.service";

@Component({
  selector: "app-somn",
  templateUrl: "./somn.component.html",
  styleUrls: ["./somn.component.scss"],
  host: {
    class: "grow",
  },
})
export class SomnComponent {
  @ViewChild("resultsTable") resultsTable: Table;

  request = this.somnService.newRequest();
  response$ = of(this.somnService.response);

  tabs: MenuItem[] = [
    { label: "Request Configuration" },
    { label: "Model Results" },
  ];
  activeTab$ = new BehaviorSubject(this.tabs[1]);
  loading$ = new BehaviorSubject(false);

  heatmapData$ = of(this.somnService.getHeatmapData());
  filteredTrainingData$ = new BehaviorSubject([]);

  showFilters$ = new BehaviorSubject(false);

  selectedCatalysts$ = new BehaviorSubject<any[]>([]);
  selectedBases$ = new BehaviorSubject<any[]>([]);
  selectedSolvents$ = new BehaviorSubject<any[]>([]);
  selectedYield$ = new BehaviorSubject([0, 100]);

  dataWithColor$ = this.response$.pipe(
    map((response) => 
      response.data.map((d) => ({ 
        ...d, 
        color: this.getColorAtPercentage(
          d["yield"], 
          d3.min(response.data, d => d["yield"])!, 
          d3.max(response.data, d => d["yield"])!
        )
      }))
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

  constructor(
    private somnService: SomnService,
    private filterService: FilterService,
  ) {}

  ngOnInit() {
    this.filterService.register(
      "range",
      (value: number, filter: [number, number]) => {
        return value * 100 >= filter[0] && value * 100 <= filter[1];
      },
    );
  }

  useExample() {
    this.request = this.somnService.exampleRequest();
  }

  onSubmit(request: SomnRequest) {
    this.activeTab$.next(this.tabs[1]);
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
    this.selectedYield$.next(value);
    if (this.resultsTable) {
      this.resultsTable.filter(value, "yield", "range");
    }
  }
}
