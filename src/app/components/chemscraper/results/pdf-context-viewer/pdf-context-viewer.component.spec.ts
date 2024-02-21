import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfContextViewerComponent } from './pdf-context-viewer.component';

describe('PdfContextViewerComponent', () => {
  let component: PdfContextViewerComponent;
  let fixture: ComponentFixture<PdfContextViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfContextViewerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfContextViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
