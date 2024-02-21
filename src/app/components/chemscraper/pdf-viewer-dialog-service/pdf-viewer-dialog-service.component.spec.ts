import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfViewerDialogServiceComponent } from './pdf-viewer-dialog-service.component';

describe('PdfViewerDialogServiceComponent', () => {
  let component: PdfViewerDialogServiceComponent;
  let fixture: ComponentFixture<PdfViewerDialogServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfViewerDialogServiceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfViewerDialogServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
