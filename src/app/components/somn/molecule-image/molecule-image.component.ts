import { AfterViewChecked, AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-molecule-image',
  templateUrl: './molecule-image.component.html',
  styleUrls: ['./molecule-image.component.scss']
})
export class MoleculeImageComponent implements AfterViewInit, OnChanges {
  @Input() molecule: string;
  @Input() width: number = 300;
  @Input() height: number = 150;
  @Input() reactionSite: number;
  @Output() reactionSiteClick = new EventEmitter<number>();
  @ViewChild('container') container: ElementRef<HTMLDivElement>;

  image = '';
  colors = ['#DDCC7780', '#33228880', '#CC667780', '#AADDCC80', '#66332280'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reactionSite'] 
      && !Object.is(null, changes['reactionSite'].currentValue)
      && changes['reactionSite'].currentValue !== changes['reactionSite'].previousValue
    ) {
      if (!this.container) {
        return;
      }
      
      const svgContainer = d3.select(this.container.nativeElement);
      if (svgContainer.empty()) {
        return;
      }

      const thisReactionSite = svgContainer.select(`.atom-${this.reactionSite}`);
      if (thisReactionSite.empty()) {
        return;
      }

      const idx = parseInt(svgContainer.select(`.atom-${this.reactionSite}`).attr('data-idx'));
      svgContainer.selectAll('ellipse').attr('fill', '#5F6C8D40');
      svgContainer.select(`.atom-${this.reactionSite}`)
        .attr('fill', this.colors[idx % this.colors.length]);
    }
  }

  ngAfterViewInit(): void {
    const element = this.container.nativeElement;
    element.innerHTML = this.molecule;
    element.querySelector('svg')?.setAttribute('width', `${this.width}px`);
    element.querySelector('svg')?.setAttribute('height', `${this.height}px`);
    element.querySelector('svg rect')?.setAttribute('style', 'opacity:1.0;fill:#FFFFFF00;stroke:none');

    const svgContainer = d3.select(element);
    const ellipses = svgContainer.selectAll('ellipse')
      .attr('ry', 20)
      .attr('rx', 20);

    svgContainer.select('rect').style('fill', '#ffffff00');
    const gradient = svgContainer
      .select('svg')
      .append('defs')
      .append('radialGradient')
      .attr('id', 'outline');
      
    gradient.append('stop')
      .attr('offset', '90%')
      .attr('stop-color', '#3B82F6');

    gradient.append('stop')
      .attr('offset', '91%')
      .attr('stop-color', '#3B82F6');

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#BFDBFE');

    ellipses.each((d, i, nodes) => {
      const node = d3.select(nodes[i]);
      node
        .attr('data-idx', i)
        .attr('style', 'cursor: pointer;')
        .attr('fill', this.colors[i % this.colors.length]);
    });

    ellipses.on('mouseenter', (e, d) => {
      d3.select(e.target)
        .attr('stroke', 'url(#outline)')
        .attr('stroke-width', 6);
    });

    ellipses.on('mouseleave', (e, d) => {
      d3.select(e.target)
        .attr('stroke', 'none');
    });

    ellipses.on('click', (e, d) => {
      const className = e.target.getAttribute('class');
      const data = className.split('atom-')[1];
      this.reactionSiteClick.emit(parseInt(data));
    });
  }
}
