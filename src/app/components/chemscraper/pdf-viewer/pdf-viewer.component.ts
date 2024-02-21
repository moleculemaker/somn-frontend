import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { HighlightBox } from 'src/app/models';

@Component({
  selector: 'chemscraper-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent {
  @Input()
  pdfUrl: String = "";

  @Input()
  highlightBoxes: HighlightBox[][] = [];

  @Output()
  scrollToMolecule = new EventEmitter<number>();


  pdf: PDFDocumentProxy;
  totalPages: number = 0;
  pageNumber: number = 1;
  pageRendering: boolean = false;
  pageNumPending: number = -1;
  pdfData: Uint8Array;
  scale: number = 1;
  boxPadding: number = 5;
  highlightedMoleculeId: number = -1;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
  canvasBoxes: Path2D[] = [];
  hoveredMoleculeTooltipText: string = "";

  tooltipStyle = {};

  constructor(){}

  ngOnInit(){
    let loadingTask = pdfjsLib.getDocument(this.pdfUrl);

    loadingTask.promise.then((pdf) =>{
      this.pdf = pdf;
      this.totalPages = pdf.numPages;
      if(this.totalPages > 0){
        this.renderPage(this.pageNumber);
      }
    }, function (reason) {
      // PDF loading error
      console.error(reason);
    });

  }

  renderPage(pageNumber: number) {
    this.pageRendering = true;
    this.pdf.getPage(pageNumber).then((page) => {

      let scale = this.scale;
      let viewport = page.getViewport({scale: scale});

      const originX = page.view[0];
      const originY = page.view[1];

      // Prepare canvas using PDF page dimensions
      this.canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
      this.context = this.canvas.getContext('2d');
      this.canvas.height = viewport.height;
      this.canvas.width = viewport.width;

      // Render PDF page into canvas context
      let renderContext = {
        canvasContext: this.context!,
        viewport: viewport
      };
      let renderTask = page.render(renderContext);
      renderTask.promise.then( () => {
        this.pageRendering = false;

        if(this.highlightBoxes && pageNumber < this.highlightBoxes.length){
          this.canvasBoxes = [];
          this.highlightBoxes[pageNumber].forEach( (box) => {
            let boxX = (box.x * 72.0) / 300 - originX - this.boxPadding;
            let boxY = (box.y * 72.0) / 300 - originY - this.boxPadding;
            boxX = boxX ? boxX : 0;
            boxY = boxY ? boxY : 0;
            let boxWidth = (box.width * 72.0) / 300 + ( 2 * this.boxPadding );
            let boxHeight = (box.height * 72.0) / 300 + ( 2 * this.boxPadding );

            let scaledBox = {x: scale * boxX, y: scale * boxY, width: scale * boxWidth, height: scale * boxHeight}

            const cornerRadius = scale * 5;
            if(this.context){
              let path = new Path2D();
              path.moveTo(scaledBox.x + cornerRadius, scaledBox.y);
              path.lineTo(scaledBox.x + scaledBox.width - cornerRadius, scaledBox.y);
              path.arcTo(scaledBox.x + scaledBox.width, scaledBox.y, scaledBox.x + scaledBox.width, scaledBox.y + cornerRadius, cornerRadius);
              path.lineTo(scaledBox.x + scaledBox.width, scaledBox.y + scaledBox.height - cornerRadius);
              path.arcTo(scaledBox.x + scaledBox.width, scaledBox.y + scaledBox.height, scaledBox.x + scaledBox.width - cornerRadius, scaledBox.y + scaledBox.height, cornerRadius);
              path.lineTo(scaledBox.x + cornerRadius, scaledBox.y + scaledBox.height);
              path.arcTo(scaledBox.x, scaledBox.y + scaledBox.height, scaledBox.x, scaledBox.y + scaledBox.height - cornerRadius, cornerRadius);
              path.lineTo(scaledBox.x, scaledBox.y + cornerRadius);
              path.arcTo(scaledBox.x, scaledBox.y, scaledBox.x + cornerRadius, scaledBox.y, cornerRadius);
              path.closePath();
              this.context.fillStyle = "rgba(34, 64, 99, 0.1)";
              this.context.strokeStyle = 'rgba(34, 64, 99, 1)';
              if(this.highlightedMoleculeId >= 0 && box.moleculeId == this.highlightedMoleculeId){
                this.context.fillStyle = "rgba(5, 0, 255, 0.1)";
                this.context.strokeStyle = 'rgba(5, 0, 255, 1)';
              }
              this.context.fill(path);
              this.context.stroke(path);
              this.canvasBoxes.push(path);
            }
          });
        }
        if (this.pageNumPending !== -1) {
          this.renderPage(this.pageNumPending);
          this.pageNumPending = -1;
        }
      });
    });
  }

  queueRenderPage(num: number) {
    if (this.pageRendering) {
      this.pageNumPending = num;
    } else {
      this.renderPage(num);
    }
  }

  onPrevPage() {
    if (this.pageNumber <= 1) {
      return;
    }
    this.pageNumber--;
    this.queueRenderPage(this.pageNumber);
  }

  onNextPage() {
    if (this.pageNumber >= this.totalPages) {
      return;
    }
    this.pageNumber++;
    this.queueRenderPage(this.pageNumber);
  }

  goToPage(num: number){
    if (this.pageNumber < 1 && this.pageNumber > this.totalPages) {
      return;
    }
    this.pageNumber = num;
    this.queueRenderPage(this.pageNumber);
  }

  zoomIn(){
    this.scale += 0.1;
    this.renderPage(this.pageNumber);
  }

  zoomOut(){
    this.scale -= 0.1;
    this.renderPage(this.pageNumber);
  }

  getCurrentZoom() {
    return Math.floor(this.scale * 100);
  }

  highlightMolecule(moleculeIndex: number, page_num: number = -1) {
    this.highlightedMoleculeId = moleculeIndex;

    if(page_num == -1){
      this.queueRenderPage(this.pageNumber);
    } else {
      this.goToPage(page_num);
    }

  }

  onCanvasClick(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (let i = 0; i < this.canvasBoxes.length; i++) {
      if (this.context && this.context.isPointInPath(this.canvasBoxes[i], x, y)) {
        this.scrollToMolecule.emit(this.highlightBoxes[this.pageNumber][i].moleculeId);
        return;
      }
    }
  }

  onCanvasMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let isOverMolecule = -1;

    for (let i = 0; i < this.canvasBoxes.length; i++) {
      if (this.context && this.context.isPointInPath(this.canvasBoxes[i], x, y)) {
        isOverMolecule = i;
        let moleculeName = this.highlightBoxes[this.pageNumber][isOverMolecule].moleculeName;
        if (moleculeName == 'Unavailable') {
          this.hoveredMoleculeTooltipText = 'Unable to identify';
        } else {
          this.hoveredMoleculeTooltipText = `Matched as ${moleculeName}`;
        }
        break;
      }
    }

    if (isOverMolecule >= 0) {
      // Show tooltip and set its position
      this.tooltipStyle = {
        display: 'block',
        top: `${y}px`,
        left: `${x}px`,
      };
    } else {
      // Hide tooltip
      this.tooltipStyle = {
        display: 'none'
      };
    }
  }

  onCanvasMouseOut(event: MouseEvent): void {
    // Hide tooltip when mouse leaves the canvas
    this.tooltipStyle = {
      display: 'none'
    };
  }


}
