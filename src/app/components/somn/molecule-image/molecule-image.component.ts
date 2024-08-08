import { AfterViewChecked, AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import * as d3 from 'd3';

export interface ReactionSiteOption {
  idx: number;
  value: string;
  svg: string;
}

@Component({
  selector: 'app-molecule-image',
  templateUrl: './molecule-image.component.html',
  styleUrls: ['./molecule-image.component.scss']
})
export class MoleculeImageComponent implements AfterViewInit, OnChanges {
  @Input() molecule: string;
  @Input() width: number = 300;
  @Input() height: number = 150;
  @Input() selectedReactionSite: ReactionSiteOption | null;
  @Input() reactionSitesOptions: ReactionSiteOption[];
  @Output() selectedReactionSiteChange = new EventEmitter<ReactionSiteOption>();
  @ViewChild('container') container: ElementRef<HTMLDivElement>;

  image = '';
  colors = ['#DDCC7780', '#33228880', '#CC667780', '#AADDCC80', '#66332280'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedReactionSite'] 
      && !Object.is(null, changes['selectedReactionSite'].currentValue)
      && changes['selectedReactionSite'].currentValue !== changes['selectedReactionSite'].previousValue
    ) {
      this.updateHighlightedReactionSite();
    }

    if (changes['molecule'] 
      && !Object.is(null, changes['molecule'].currentValue)
      && changes['molecule'].currentValue !== changes['molecule'].previousValue
    ) {
      this.setupMoleculeImage();
      this.updateHighlightedReactionSite();
    }
  }

  ngAfterViewInit(): void {
    this.setupMoleculeImage();
    this.updateHighlightedReactionSite();
  }

  setupMoleculeImage() {
    if (!this.container) {
      return;
    }
    
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

    // setup gradient for molecule hover
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
      const idx = node.attr('class').split('atom-')[1];

      node
        .datum(this.reactionSitesOptions.find((o) => o.value === idx))
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
      this.selectedReactionSiteChange.emit(d as ReactionSiteOption);
    });
  }

  updateHighlightedReactionSite() {
    if (!this.container) {
      return;
    }
    
    const svgContainer = d3.select(this.container.nativeElement);
    if (svgContainer.empty()) {
      return;
    }

    const selectedReactionSite = this.selectedReactionSite;
    if (!selectedReactionSite) {
      return;
    }

    const thisReactionSite = svgContainer.select(`.atom-${selectedReactionSite.value}`);
    if (thisReactionSite.empty()) {
      return;
    }

    svgContainer.selectAll('ellipse').attr('fill', '#5F6C8D40');
    svgContainer.select(`.atom-${selectedReactionSite.value}`)
      .attr('fill', this.colors[selectedReactionSite.idx % this.colors.length]);
  }
}
