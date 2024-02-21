import { Component, ElementRef, Input, ViewChild, AfterViewInit} from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

@Component({
  selector: 'chemscraper-pdf-context-viewer',
  templateUrl: './pdf-context-viewer.component.html',
  styleUrls: ['./pdf-context-viewer.component.scss']
})
export class PdfContextViewerComponent implements AfterViewInit{

  @Input()
  pdfUrl: String = "";

  @Input()
  startX: number = 0;

  @Input()
  startY: number = 0;

  @Input()
  width: number = 0;

  @Input()
  height: number = 0;

  @Input()
  pageNumber: string = "1";

  @Input()
  showContext: boolean = false;

  @ViewChild('pdfContextViewerCanvas') pdfContextViewerCanvas: ElementRef;

  pdfDoc: PDFDocumentProxy;
  boxPadding: number = 5;

  ngAfterViewInit(){
    let loadingTask = pdfjsLib.getDocument(this.pdfUrl);

    loadingTask.promise
    .then(pdfDoc => {
      // Load the first page
      this.pdfDoc = pdfDoc;
      const totalPages = pdfDoc.numPages;
      const page_no = parseInt(this.pageNumber);

      if (this.pageNumber && page_no >= 1 && page_no <= totalPages) {
        // Request the specified page
        this.renderPage(page_no);
      }
    })
    .catch(error => {
      console.error('Error loading PDF:', error);
    });

  }

  renderPage(page_no: number) {
    this.pdfDoc.getPage(page_no).then((page) => {

      const originX = page.view[0];
      const originY = page.view[1];
      const canvas = this.pdfContextViewerCanvas.nativeElement as HTMLCanvasElement;
      const context = canvas.getContext('2d');

      const viewport = page.getViewport({ scale: 1 });
      let scale = Math.min(viewport.width / this.width, viewport.height / this.height);
      if(this.showContext){
        scale = 1.5;
      }

      let boxX = scale * (this.startX * 72.0) / 300 - originX - this.boxPadding;
      let boxY = scale * (this.startY * 72.0) / 300 - originY - this.boxPadding;
      let boxWidth = scale * (this.width * 72.0) / 300 + ( 2 * this.boxPadding );
      let boxHeight = scale * (this.height * 72.0) / 300 + ( 2 * this.boxPadding );
      if(this.showContext){
        boxX = boxX - 300;
        boxY = boxY - 150;
        boxWidth = boxWidth + 600;
        boxHeight = boxHeight + 300;
      }
      boxX = boxX ? boxX : 0;
      boxY = boxY ? boxY : 0;


      canvas.width = boxWidth;
      canvas.height = boxHeight;

      viewport.transform = [scale, 0, 0, -scale, -1 * boxX, scale*(viewport.height) - boxY];

      const renderContext = {
        canvasContext: context!,
        viewport: viewport,
      };

      let renderTask = page.render(renderContext);

      if(this.showContext){
        renderTask.promise.then( () => {

              let higlightBoxX = 300 / scale;
              let higlightBoxY = 150 / scale;
              let hightlightBoxWidth = (this.width * 72.0) / 300 + ( 2 * this.boxPadding );
              let hightlightBoxHeight = (this.height * 72.0) / 300 + ( 2 * this.boxPadding );

              let scaledBox = {x: scale * higlightBoxX, y: scale * higlightBoxY, width: scale * hightlightBoxWidth, height: scale * hightlightBoxHeight}

              const cornerRadius = scale * 5;
              if(context){
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
                context.fillStyle = "rgba(5, 0, 255, 0.1)";
                context.strokeStyle = 'rgba(5, 0, 255, 1)';
                context.fill(path);
                context.stroke(path);
              }
        });
      }

    });


  }

}
