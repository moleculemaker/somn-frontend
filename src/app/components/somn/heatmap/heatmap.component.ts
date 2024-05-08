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

interface HeatmapData {
  solventBase: string;
  solvent: string;
  base: string;
  catalyst: string;
  yield: number;
  isHighlighted: boolean;
  rowId: number;
}

@Component({
  selector: "app-heatmap",
  templateUrl: "./heatmap.component.html",
  styleUrls: ["./heatmap.component.scss"],
})
export class HeatmapComponent implements AfterViewInit, OnChanges {
  @Input() styleClass: string = "";
  @Input() data: HeatmapData[] = [];
  @Input() selectedCell: number | null = null;
  @Output() selectedCellChange = new EventEmitter<number | null>();
  @ViewChild("heatmapContainer") container: ElementRef<HTMLDivElement>;

  ngAfterViewInit() {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["data"] && changes["data"].currentValue && this.container) {
      this.render(this.data, null);
    }
    if (changes["selectedCell"]) {
      this.render();
    }
  }

  render(data: HeatmapData[] = this.data, selectedCell: number | null = this.selectedCell) {
    setTimeout(() => {
      if (!this.container) {
        return;
      }

      let containerEl = this.container.nativeElement;
      let margin = { top: 120, right: 20, bottom: 100, left: 140 },
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
      let myGroups = new Set(this.data.map((d) => d.catalyst));
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

      // Build color scale
      let colorScale = d3
        .scaleLinear(["#470459", "#2E8C89", "#F5E61D"])
        .domain([0, 
          d3.mean(data.map((d) => d.yield))!,
          d3.max(data.map((d) => d.yield))!
        ]);

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

        console.log(event)
      };
      let mousedown = (event: MouseEvent, d: any) => {
        if (!d.isHighlighted) {
          this.selectedCellChange.emit(null);
          return;
        }
        this.selectedCellChange.emit(d.rowId);
      }
      let mouseleave = (event: MouseEvent, d: any) => {
        tooltip.style("opacity", 0);
      };

      // add the squares
      svg
        .selectAll()
        .data(this.data.filter(d => d.rowId !== selectedCell), (d: any) => d.solventBase + ":" + d.catalyst)
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("x", (d: any) => x(d.catalyst) || "unknown")
        .attr("y", (d) => y(d.solventBase) || "unknown")
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("fill", (d) => d.isHighlighted ? colorScale(d.yield) : "#DEE2E6")
        .on("mouseover", mouseover)
        .on("mousedown", mousedown)
        .on("mouseleave", mouseleave);

      svg
        .selectAll()
        .data(this.data.filter(d => d.rowId === selectedCell), (d: any) => d.solventBase + ":" + d.catalyst)
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("x", (d: any) => x(d.catalyst) || "unknown")
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
        .attr("transform", "translate(200, 60)")
        .text("Catalyst");
    });
  }
}
