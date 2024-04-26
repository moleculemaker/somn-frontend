import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SomnResultComponent } from './somn-result.component';

describe('SomnResultComponent', () => {
  let component: SomnResultComponent;
  let fixture: ComponentFixture<SomnResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SomnResultComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SomnResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
