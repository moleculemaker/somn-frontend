import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SomnResultSummaryComponent } from './somn-result-summary.component';

describe('SomnResultSummaryComponent', () => {
  let component: SomnResultSummaryComponent;
  let fixture: ComponentFixture<SomnResultSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SomnResultSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SomnResultSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
