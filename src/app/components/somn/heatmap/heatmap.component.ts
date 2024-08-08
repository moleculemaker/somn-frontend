import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import * as d3 from "d3";
import { Product, SomnService } from "~/app/services/somn.service";

type HeatmapData = Product & { 
  solventBase: string;
  isHighlighted: boolean; 
  iid: number 
};

@Component({
  selector: "app-heatmap",
  templateUrl: "./heatmap.component.html",
  styleUrls: ["./heatmap.component.scss"],
})
export class HeatmapComponent implements AfterViewInit, OnChanges {
  @Input() styleClass: string = "";
  @Input() data: HeatmapData[] = [];
  @Input() selectedCells: Product[] = [];
  @Output() selectedCellsChange = new EventEmitter<Product[]>();
  @ViewChild("heatmapContainer") container: ElementRef<HTMLDivElement>;

  constructor(private somnService: SomnService) {}

  ngAfterViewInit() {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes["data"] && changes["data"].currentValue && this.container)
      || (changes["selectedCells"])) {
      this.render();
    }
  }

  render(data: HeatmapData[] = this.data, selectedCells: Product[] = this.selectedCells) {
    setTimeout(() => {
      if (!this.container) {
        return;
      }

      let containerEl = this.container.nativeElement;
      let margin = { top: 60, right: 20, bottom: 100, left: 140 },
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

      // Labels of row and columns
      let myGroups = new Set(this.data.map((d) => d.catalyst[0]));
      let myVars = new Set(this.data.map((d) => d.solventBase));

      // Build X scales and axis:
      let x = d3.scaleBand().range([0, width]).domain(myGroups).padding(0.01);
      let xAxis = svg
        .append("g")
        .attr("id", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      xAxis
        .selectAll("text") // Select all text elements of the x-axis
        .style("text-anchor", "start") // Set text anchor to end
        .attr("transform", "translate(10, 0) rotate(55)"); // Rotate text by -45 degrees;

      // Build Y scales and axis:
      let y = d3.scaleBand().range([height, 0]).domain(myVars).padding(0.01);
      let yAxis = svg.append("g").attr("id", "y-axis").call(d3.axisLeft(y));

      xAxis.selectAll("line").style("opacity", "0");
      yAxis.selectAll("line").style("opacity", "0");
      svg.selectAll(".domain").style("opacity", "0");

      d3.selectAll(".tooltip").remove();

      let tooltip = d3
        .select(containerEl)
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "fixed")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px");

      // Three function that change the tooltip when user hover / move / leave a cell
      let mouseover = (event: MouseEvent, d: any) => {
        tooltip.style("opacity", 1);
        tooltip
          .html((d.yield.toFixed(4) * 100).toFixed(2) + "%")
          .style("left", (event.x - 20) + "px")
          .style("top", (event.y - 40) + "px")
          .style("pointer-events", "none");
      };
      let mousedown = (event: MouseEvent, d: any) => {
        if (!d.isHighlighted) {
          return;
        }
        let idx = selectedCells.findIndex((c) => c.iid === d.iid);
        if (idx > -1) {
          selectedCells.splice(idx, 1);
        } else {
          selectedCells.push(d);
        }
        this.render(data, selectedCells);
        this.selectedCellsChange.emit(selectedCells);
      }
      let mouseleave = (event: MouseEvent, d: any) => {
        tooltip.style("opacity", 0);
      };

      const colorScale = this.somnService.getColorScale(data);

      // add the squares
      svg
        .selectAll()
        .data(this.data.filter((d) => !selectedCells.map((c) => c.iid).includes(d.iid)), (d: any) => d.solventBase + ":" + d.catalyst[0])
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("x", (d: any) => x(d.catalyst[0]) || "unknown")
        .attr("y", (d) => y(d.solventBase) || "unknown")
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("fill", (d) => d.isHighlighted ? colorScale(d.yield) : "#DEE2E6")
        .on("mouseover", mouseover)
        .on("mousedown", mousedown)
        .on("mouseleave", mouseleave);

      svg
        .selectAll()
        .data(this.data.filter((d) => selectedCells.map((c) => c.iid).includes(d.iid)), (d: any) => d.solventBase + ":" + d.catalyst[0])
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("x", (d: any) => x(d.catalyst[0]) || "unknown")
        .attr("y", (d) => y(d.solventBase) || "unknown")
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("stroke", "white")
        .attr("stroke-width", 3)
        .attr("fill", (d) => colorScale(d.yield))
        .on("mouseover", mouseover)
        .on("mousedown", mousedown)
        .on("mouseleave", mouseleave);

      svg
        .select("#y-axis")
        .append("text")
        .style("text-anchor", "end")
        .attr("fill", "black")
        .attr("font-weight", "600")
        .attr("transform", "translate(-100, 60) rotate(-90)")
        .text("Solvent/Base");

      svg
        .select("#x-axis")
        .append("text")
        .style("text-anchor", "end")
        .attr("fill", "black")
        .attr("font-weight", "600")
        .attr("transform", "translate(200, 90)")
        .text("Catalyst");
    });
  }
}
