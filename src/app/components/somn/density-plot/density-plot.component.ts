import {
  AfterViewInit,
  OnChanges,
  Component,
  ElementRef,
  Input,
  ViewChild,
  Output,
  EventEmitter,
  OnDestroy,
} from "@angular/core";
import * as d3 from "d3";
import { Slider } from "primeng/slider";
import { BehaviorSubject, combineLatest, debounceTime, filter, map, takeLast, tap, throttleTime } from "rxjs";
import { Product, SomnService } from "~/app/services/somn.service";

@Component({
  selector: "app-density-plot",
  templateUrl: "./density-plot.component.html",
  styleUrls: ["./density-plot.component.scss"],
})
export class DensityPlotComponent implements AfterViewInit, OnDestroy {
  @Input() styleClass: string = "";

  originalData$ = new BehaviorSubject<Product[]>([]);
  @Input() set originalData(value: Product[]) {
    this.originalData$.next(value);
  }

  data$ = new BehaviorSubject<Product[]>([]);
  @Input() set data(value: Product[]) {
    this.data$.next(value);
  }

  @Input() set selectedRegion(value: [number, number]) {
    this.selectedRegionMin$.next(value[0]);
    this.selectedRegionMax$.next(value[1]);
  }
  
  @Output() selectedRegionChange = new EventEmitter<[number, number]>();

  @ViewChild("container") container: ElementRef<HTMLDivElement>;
  @ViewChild("inputContainer") rangeInputContainer: ElementRef<HTMLDivElement>;
  @ViewChild("slider") slider: Slider;

  selectedRegionMin$ = new BehaviorSubject(0);
  selectedRegionMax$ = new BehaviorSubject(100);
  
  selectedRegion$ = combineLatest([
    this.selectedRegionMin$,
    this.selectedRegionMax$,
  ]).pipe(
    tap(([min, max]) => {
      this.updateRangeDisplay(min, max);
      this.selectedRegionChange.emit([min, max]);
    }),
  );
  
  minRange$ = this.data$.pipe(
    filter((data) => data.length > 0),
    map((data) => parseInt((d3.min(data.map((d) => d["yield"]))! * 100).toFixed(2))),
    tap((min) => { this.selectedRegionMin$.next(min); })
  );

  maxRange$ = this.data$.pipe(
    filter((data) => data.length > 0),
    map((data) => parseInt((d3.max(data.map((d) => d["yield"]))! * 100 + 1).toFixed(2))),
    tap((max) => { this.selectedRegionMax$.next(max); })
  );

  subscription = combineLatest([
    this.data$,
    this.originalData$,
    this.selectedRegionMin$,
    this.selectedRegionMax$,
    this.minRange$,
    this.maxRange$,
  ]).pipe(
    filter(([data]) => data.length > 0),
    tap(([data, originalData, min, max, minRange, maxRange]) => {
      this.render(data, originalData, min, max, minRange, maxRange);
    }),
    debounceTime(100),
    tap(([data, originalData, min, max, minRange, maxRange]) => {
      const regionMin = Math.max(minRange, Math.min(min, maxRange));
      const regionMax = Math.max(minRange, Math.min(max, maxRange));
      if (min < minRange || min > maxRange) {
        this.selectedRegionMin$.next(regionMin);
      }
      if (max < minRange || max > maxRange) {
        this.selectedRegionMax$.next(regionMax);
      }
    }),
  ).subscribe();

  constructor(private somnService: SomnService) {}

  ngAfterViewInit() {
    this.updateRangeDisplay(
      this.selectedRegionMin$.value,
      this.selectedRegionMax$.value,
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  render(
    data: Product[],
    originalData: Product[],
    selectedMinVal: number,
    selectedMaxVal: number,
    minRange: number,
    maxRange: number,
  ) {
    setTimeout(() => {
      if (!this.container) {
        return;
      }

      let containerEl = this.container.nativeElement;
      let margin = { top: 0, right: 0, bottom: 0, left: 40 },
        width = containerEl.clientWidth - margin.left - margin.right,
        height = containerEl.clientHeight - margin.top - margin.bottom;

      // append the svg object to the body of the page if not exist
      let svgEl = this.container.nativeElement.querySelector("svg");
      if (svgEl) {
        containerEl.removeChild(svgEl);
      }

      let svg = d3
        .select(containerEl)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      let x = d3.scaleLinear().domain([0, 1]).range([0, width]);
      let y = d3.scaleLinear().range([height, 0]).domain([0, 1]);

      function createDensity(data: Product[], minRange: number, maxRange: number) {
        let yields = data.map((d) => d["yield"]);
        let thresholds = [];
        let density: [number, number][] = [[minRange / 100, 0]];

        for (let i = minRange; i <= maxRange; i += 1) {
          thresholds.push(i / 100);
        }

        function kde(kernel: Function, thresholds: number[], data: number[]) {
          return thresholds.map((t) => [t, d3.mean(data, (d) => kernel(t - d))]);
        }

        function epanechnikov(bandwidth: number) {
          return (x: number) =>
            Math.abs((x /= bandwidth)) <= 1
              ? (0.75 * (1 - x * x)) / bandwidth
              : 0;
        }

        density.push(
          ...(kde(epanechnikov(0.05), thresholds, yields) as [number, number][]),
        );

        density.push([density[density.length - 1][0], 0]);

        // Normalize the density
        const max = d3.max(density.map((d) => d[1]))!;

        return density.map(([x, y]) => [x, y / max]) as [number, number][];
      }

      let lineGenerator = d3
        .line()
        .curve(d3.curveBasis)
        .x((d) => x(d[0]))
        .y((d) => y(d[1]));

      const gradient = this.somnService.getGradientByData(data)
        .attr("id", "gradient");
      svg.html(gradient.node()!.outerHTML + svg.html());

      // Plot the area
      if (originalData.length) {
        let originalDensity: [number, number][] = createDensity(
          originalData, 
          d3.min(originalData.map((d) => d["yield"]))! * 100,
          d3.max(originalData.map((d) => d["yield"]))! * 100,
        );
        svg
          .append("path")
          .attr("fill", "#DEE2E6")
          .attr("opacity", ".65")
          .attr("transform", "scale(1, 0.8) translate(0, 40)")
          .attr("d", lineGenerator(originalDensity));
      }

      let density: [number, number][] = createDensity(data, minRange, maxRange);        
      svg
        .append("path")
        .attr("fill", "url(#gradient)")
        .attr("opacity", ".4")
        .attr("transform", "scale(1, 0.8) translate(0, 40)")
        .attr("d", lineGenerator(density));


      let selectedDensity = density.filter(
        ([x, y]) => x >= selectedMinVal / 100 && x <= selectedMaxVal / 100,
      );

      selectedDensity.unshift(selectedDensity[0]);
      selectedDensity.unshift([selectedDensity[0][0], 0]);
      selectedDensity.unshift([selectedDensity[0][0], 0]);
      selectedDensity.unshift([selectedDensity[0][0], 0]);
      selectedDensity.unshift([minRange / 100, 0]);

      selectedDensity.push(selectedDensity[selectedDensity.length - 1]);
      selectedDensity.push([selectedDensity[selectedDensity.length - 1][0], 0]);
      selectedDensity.push([selectedDensity[selectedDensity.length - 1][0], 0]);
      selectedDensity.push([selectedDensity[selectedDensity.length - 1][0], 0]);
      selectedDensity.push([maxRange / 100, 0]);
      svg
        .append("path")
        .attr("fill", "url(#gradient)")
        .attr("opacity", "1")
        .attr("transform", "scale(1, 0.8) translate(0, 40)")
        .attr("d", lineGenerator(selectedDensity));

      const maxYield = originalData.length
        ? Math.ceil(d3.max(originalData.map((d) => d['yield']))! * 100) / 100
        : Math.ceil(d3.max(data.map((d) => d['yield']))! * 100) / 100;
      // add the x Axis
      svg
        .append("g")
        .attr("id", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(
          d3
            .axisBottom(x)
            .tickFormat(d3.format(".0%"))
            .tickSize(-150)
            .tickValues([0.0, maxYield, 0.25, 0.5, 0.75, 1.0])
        );
      svg
        .selectAll("#x-axis .tick line")
        .attr("stroke", "#DEE2E6")
        .attr('transform', 'scale(1, 0.9)')
        .attr("stroke-dasharray", "5")
        .attr("stroke-width", "2");
      svg.select("#x-axis .domain").attr("stroke", "transparent");
      svg
        .selectAll("#x-axis .tick text")
        .attr("fill", "#495057")
        .attr("font-weight", "300")
        .attr("transform", `translate(0, ${-height + 20})`);
      svg
        .selectAll("#x-axis .tick:first-of-type text")
        .attr("transform", `translate(18, ${-height + 20})`);
      svg
        .selectAll("#x-axis .tick:last-of-type text")
        .attr("transform", `translate(-20, ${-height + 20})`);
      svg
        .selectAll("#x-axis .tick:first-of-type")
        .attr("transform", `translate(1, 0)`);
      svg
        .selectAll("#x-axis .tick:last-of-type")
        .attr("transform", `translate(${width - 1}, 0)`);

      svg
        .selectAll("#x-axis .tick")
        .filter((d) => d === maxYield)
        .each(function (d: any, i, g) {
          d3.select(g[0]).select("text").attr("transform", `translate(0, ${-height})`);
          d3.select(g[0]).select("line").attr('transform', 'scale(1, 1)')
        });

      // add the y Axis
      svg
        .append("g")
        .attr("id", "y-axis")
        .call(d3.axisLeft(y).tickValues([0, 1]));
      svg.selectAll("#y-axis .domain").attr("stroke", "transparent");
      svg.selectAll("#y-axis .tick line").attr("stroke", "transparent");
      svg.selectAll("#y-axis .tick text").attr("font-weight", "300");
      svg
        .selectAll("#y-axis .tick:first-of-type text")
        .attr("transform", "translate(0, -5)");
      svg
        .selectAll("#y-axis .tick:last-of-type text")
        .attr("transform", `translate(0, 16)`);
      svg
        .select("#y-axis")
        .append("text")
        .style("text-anchor", "end")
        .attr("fill", "black")
        .attr("font-weight", "600")
        .attr("transform", "translate(-20, 70) rotate(-90)")
        .text("Density");
    });

    return null;
  }

  updateMinRange(value: string) {
    this.selectedRegionMin$.next(parseInt(value) || 0);
  }

  updateMaxRange(value: string) {
    this.selectedRegionMax$.next(parseInt(value) || 0);
  }

  updateRangeDisplay(min: number, max: number) {
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
        const [minRange, maxRange] = Array.from(
          this.rangeInputContainer.nativeElement.querySelectorAll("input"),
        );
        minRange.style.left = `${leftX - containerX - 12}px`;
        maxRange.style.left = `${rightX - containerX - 12}px`;
        minRange.value = `${min}`;
        maxRange.value = `${max}`;
      }
    });
  }
}
