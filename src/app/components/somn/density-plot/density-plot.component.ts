import {
  AfterViewInit,
  OnChanges,
  Component,
  ElementRef,
  Input,
  ViewChild,
  SimpleChanges,
  Output,
  EventEmitter,
} from "@angular/core";
import * as d3 from "d3";
import { Slider } from "primeng/slider";
import { BehaviorSubject, combineLatest, tap } from "rxjs";
import { Products } from "~/app/services/somn.service";

@Component({
  selector: "app-density-plot",
  templateUrl: "./density-plot.component.html",
  styleUrls: ["./density-plot.component.scss"],
})
export class DensityPlotComponent implements AfterViewInit, OnChanges {
  @Input() styleClass: string = "";
  @Input() data: Products;
  @ViewChild("container") container: ElementRef<HTMLDivElement>;
  @ViewChild("inputContainer") rangeInputContainer: ElementRef<HTMLDivElement>;
  @ViewChild("slider") slider: Slider;
  @Output() selectedRegionChange = new EventEmitter<[number, number]>();

  selectedRegionMin$ = new BehaviorSubject(0);
  selectedRegionMax$ = new BehaviorSubject(100);
  selectedRegion$ = combineLatest([
    this.selectedRegionMin$,
    this.selectedRegionMax$,
  ]).pipe(
    tap(([min, max]) => {
      this.updateRangeDisplay(min, max);
      this.render();
      this.selectedRegionChange.emit([min, max]);
    }),
  );

  ngAfterViewInit() {
    this.render();
    setTimeout(() => {
      this.updateRangeDisplay(
        this.selectedRegionMin$.value,
        this.selectedRegionMax$.value,
      );
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["data"] && changes["data"].currentValue && this.container) {
      this.render();
    }
  }

  render(
    data: Products = this.data,
    minVal: number = this.selectedRegionMin$.value,
    maxVal: number = this.selectedRegionMax$.value,
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
      let maxData = Math.ceil(d3.max(data.map((d) => d["yield"]))! * 100) / 100;

      let density: [number, number][] = [[0, 0]];

      let yields = data.map((d) => d["yield"]);
      let thresholds = [];

      for (let i = 0; i <= maxData * 100; i += 1) {
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
      density = density.map(([x, y]) => [x, y / max]);

      let selectedDensity = density.filter(
        ([x, y]) => x >= minVal / 100 && x <= maxVal / 100,
      );

      selectedDensity.unshift(selectedDensity[0]);
      selectedDensity.unshift([selectedDensity[0][0], 0]);
      selectedDensity.unshift([selectedDensity[0][0], 0]);
      selectedDensity.unshift([selectedDensity[0][0], 0]);
      selectedDensity.unshift([0, 0]);

      selectedDensity.push(selectedDensity[selectedDensity.length - 1]);
      selectedDensity.push([selectedDensity[selectedDensity.length - 1][0], 0]);
      selectedDensity.push([selectedDensity[selectedDensity.length - 1][0], 0]);
      selectedDensity.push([selectedDensity[selectedDensity.length - 1][0], 0]);
      selectedDensity.push([maxData, 0]);

      let lineGenerator = d3
        .line()
        .curve(d3.curveBasis)
        .x((d) => x(d[0]))
        .y((d) => y(d[1]));

      let gradient = svg
        .append("defs")
        .append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#470459");

      gradient
        .append("stop")
        .attr("offset", "50%")
        .attr("stop-color", "#2E8C89");

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#F5E61D");

      // Plot the area
      svg
        .append("path")
        .attr("fill", "url(#gradient)")
        .attr("opacity", ".4")
        .attr("d", lineGenerator(density));

      svg
        .append("path")
        .attr("fill", "url(#gradient)")
        .attr("opacity", "1")
        .attr("d", lineGenerator(selectedDensity));

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
            .tickValues([0.0, 0.25, 0.5, 0.75, 1.0]),
        );
      svg
        .selectAll("#x-axis .tick line")
        .attr("stroke", "#DEE2E6")
        .attr("stroke-dasharray", "5")
        .attr("stroke-width", "2");
      svg.select("#x-axis .domain").attr("stroke", "transparent");
      svg
        .selectAll("#x-axis .tick text")
        .attr("fill", "#495057")
        .attr("font-weight", "300")
        .attr("transform", `translate(0, ${-height})`);
      svg
        .selectAll("#x-axis .tick:first-of-type text")
        .attr("transform", `translate(18, ${-height})`);
      svg
        .selectAll("#x-axis .tick:last-of-type text")
        .attr("transform", `translate(-20, ${-height})`);
      svg
        .selectAll("#x-axis .tick:first-of-type")
        .attr("transform", `translate(1, 0)`);
      svg
        .selectAll("#x-axis .tick:last-of-type")
        .attr("transform", `translate(${width - 1}, 0)`);

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
    this.selectedRegionMin$.next(
      Math.max(0, Math.min(parseInt(value) || 0, 100)),
    );
  }

  updateMaxRange(value: string) {
    this.selectedRegionMax$.next(
      Math.max(0, Math.min(parseInt(value) || 0, 100)),
    );
  }

  updateRangeDisplay(min: number, max: number) {
    if (!this.slider) {
      return;
    }

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
  }
}
