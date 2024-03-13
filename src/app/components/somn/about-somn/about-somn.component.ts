import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { BehaviorSubject, combineLatest, map, of, tap } from "rxjs";
import { SomnService } from "~/app/services/somn.service";
import { Table } from "primeng/table";
import { FilterService } from "primeng/api";

enum ActiveAboutPanel {
  ABOUT,
  TRAINING_DATA,
  GITHUB,
  PUBLICATIONS,
  GET_INVOLVED,
}

@Component({
  selector: "app-about-somn",
  templateUrl: "./about-somn.component.html",
  styleUrls: ["./about-somn.component.scss"],
  host: {
    class: "grow",
  },
})
export class AboutSomnComponent implements OnInit {
  readonly ActiveAboutPanel = ActiveAboutPanel;

  activePanel$ = new BehaviorSubject(ActiveAboutPanel.TRAINING_DATA);

  @ViewChild("diagramContainer") diagramContainer: ElementRef<HTMLDivElement>;
  @ViewChild("resultsTable") resultsTable: Table;

  trainingData$ = of(this.somnService.getData());
  filteredTrainingData$ = new BehaviorSubject([]);

  showFilters$ = new BehaviorSubject(false);

  selectedArylHalides$ = new BehaviorSubject<any[]>([]);
  selectedCatalysts$ = new BehaviorSubject<any[]>([]);
  selectedAmines$ = new BehaviorSubject<any[]>([]);
  selectedBases$ = new BehaviorSubject<any[]>([]);
  selectedSolvents$ = new BehaviorSubject<any[]>([]);
  selectedYield$ = new BehaviorSubject([0, 100]);

  filteredTrainingDataWithoutYieldRange$ = combineLatest([
    this.trainingData$,
    this.selectedArylHalides$,
    this.selectedAmines$,
    this.selectedCatalysts$,
    this.selectedBases$,
    this.selectedSolvents$,
  ]).pipe(
    map(
      ([
        trainingData,
        selectedArylHalides,
        selectedAmines,
        selectedCatalysts,
        selectedBases,
        selectedSolvents,
      ]) =>
        trainingData.filter(
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

  arylHalidesOptions$ = this.trainingData$.pipe(
    map((data) => [...new Set(data.flatMap((d) => d.arylHalide))]),
  );
  aminesOptions$ = this.trainingData$.pipe(
    map((data) => [...new Set(data.flatMap((d) => d.amine))]),
  );
  solventsOptions$ = this.trainingData$.pipe(
    map((data) => [...new Set(data.flatMap((d) => d.solvent))]),
  );
  basesOptions$ = this.trainingData$.pipe(
    map((data) => [...new Set(data.flatMap((d) => d.base))]),
  );
  catalystsOptions$ = this.trainingData$.pipe(
    map((data) => [...new Set(data.flatMap((d) => d.catalyst))]),
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
