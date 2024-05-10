import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { BehaviorSubject, Observable, combineLatest, map, of, tap } from "rxjs";
import { SomnService } from "~/app/services/somn.service";
import { Table } from "primeng/table";
import { FilterService } from "primeng/api";
import { Products } from "~/app/services/somn.service";

import amineJson from "./amine_smiles.json";
import arylHalideJson from "./bromide_smiles.json";
import baseJson from "./base_map.json";
import solventJson from "./solvent_map.json";
import catalystJson from "./catalyst_map.json";
import testJson from "./test.json";

import * as d3 from "d3";

enum ActiveAboutPanel {
  ABOUT,
  TRAINING_DATA,
  GITHUB,
  PUBLICATIONS,
  GET_INVOLVED,
}

type TrainingData = Products[0] & {
  solvent: string;
};

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

  activePanel$ = new BehaviorSubject(ActiveAboutPanel.ABOUT);

  @ViewChild("resultsTable") resultsTable: Table;

  trainingData$: Observable<Array<TrainingData>> = of(testJson.map((data) => ({
    el_name: arylHalideJson[`${data["arylHalide"]}` as keyof typeof arylHalideJson],
    nuc_name: amineJson[`${data["amine"]}` as keyof typeof amineJson],
    base: baseJson[`${data["base"]}` as keyof typeof baseJson],
    catalyst: catalystJson[`${data["catalyst"]}` as keyof typeof catalystJson],
    solvent: solventJson[`${data["solvent"]}` as keyof typeof solventJson],
    yield: data["yield"] / 100,
    stdev: 0,
  }) as TrainingData));
  filteredTrainingData$ = new BehaviorSubject([]);

  showFilters$ = new BehaviorSubject(true);

  selectedArylHalides$ = new BehaviorSubject<any[]>([]);
  selectedCatalysts$ = new BehaviorSubject<any[]>([]);
  selectedAmines$ = new BehaviorSubject<any[]>([]);
  selectedBases$ = new BehaviorSubject<any[]>([]);
  selectedSolvents$ = new BehaviorSubject<any[]>([]);
  selectedYield$ = new BehaviorSubject<[number, number]>([0, 100]);

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
              ? selectedArylHalides.includes(data["el_name"])
              : true) &&
            (selectedAmines.length
              ? selectedAmines.includes(data["nuc_name"])
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

  dataWithColor$ = this.trainingData$.pipe(
    map((response) => 
      response.map((d) => ({ 
        ...d, 
        color: this.getColorAtPercentage(
          d["yield"], 
          d3.min(response, d => d["yield"])!, 
          d3.max(response, d => d["yield"])!
        )
      })).sort((a, b) => b["yield"] - a["yield"])
    ),
  );

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
    map((data) => [...new Set(data.flatMap((d) => d.el_name))]),
  );
  aminesOptions$ = this.trainingData$.pipe(
    map((data) => [...new Set(data.flatMap((d) => d.nuc_name))]),
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

  columns = [
    { field: "arylHalide", header: "Aryl Halide" },
    { field: "amine", header: "Amine" },
    { field: "base", header: "Base" },
    { field: "catalyst", header: "Catalyst" },
    { field: "solvent", header: "Solvent" },
    { field: "yield", header: "Yield" },
  ]

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
    if (value[0] === this.selectedYield$.value[0] 
      && value[1] === this.selectedYield$.value[1]) {
      return;
    }

    this.selectedYield$.next(value);
    if (this.resultsTable) {
      this.resultsTable.filter(value, "yield", "range");
    }
  }
}
