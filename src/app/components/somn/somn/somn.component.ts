import { Component, ViewChild } from "@angular/core";
import { FilterService, MenuItem } from "primeng/api";
import { Table } from "primeng/table";
import { BehaviorSubject, combineLatest, map, of } from "rxjs";
import { SomnService } from "~/app/services/somn.service";

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
  activeTab$ = new BehaviorSubject(this.tabs[0]);
  loading$ = new BehaviorSubject(false);

  heatmapData$ = of(this.somnService.getHeatmapData());
  filteredTrainingData$ = new BehaviorSubject([]);

  showFilters$ = new BehaviorSubject(false);

  selectedArylHalides$ = new BehaviorSubject<any[]>([]);
  selectedCatalysts$ = new BehaviorSubject<any[]>([]);
  selectedAmines$ = new BehaviorSubject<any[]>([]);
  selectedBases$ = new BehaviorSubject<any[]>([]);
  selectedSolvents$ = new BehaviorSubject<any[]>([]);
  selectedYield$ = new BehaviorSubject([0, 100]);

  filteredDataWithoutYieldRange$ = combineLatest([
    this.response$,
    this.selectedArylHalides$,
    this.selectedAmines$,
    this.selectedCatalysts$,
    this.selectedBases$,
    this.selectedSolvents$,
  ]).pipe(
    map(
      ([
        response,
        selectedArylHalides,
        selectedAmines,
        selectedCatalysts,
        selectedBases,
        selectedSolvents,
      ]) =>
        response.data.filter(
          (data) =>
            (selectedArylHalides.length
              ? selectedArylHalides.includes(data["arylHalide"])
              : true) &&
            (selectedAmines.length
              ? selectedAmines.includes(data["amine"])
              : true) &&
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
    this.selectedArylHalides$,
    this.selectedAmines$,
    this.selectedCatalysts$,
    this.selectedSolvents$,
  ]).pipe(
    map((filters) =>
      filters.reduce((p, filter) => (filter.length ? 1 : 0) + p, 0),
    ),
  );

  arylHalidesOptions$ = this.response$.pipe(
    map((response) => [...new Set(response.data.flatMap((d) => d.arylHalide))]),
  );
  aminesOptions$ = this.response$.pipe(
    map((response) => [...new Set(response.data.flatMap((d) => d.amine))]),
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

  clearAllFilters() {
    this.selectedBases$.next([]);
    this.selectedArylHalides$.next([]);
    this.selectedAmines$.next([]);
    this.selectedCatalysts$.next([]);
    this.selectedSolvents$.next([]);
    this.resultsTable.reset();
  }

  onYieldRangeChange(value: [number, number]) {
    this.selectedYield$.next(value);
    if (this.resultsTable) {
      this.resultsTable.filter(value, "yield", "range");
    }
  }
}