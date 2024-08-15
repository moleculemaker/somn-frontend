import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CenterLayoutComponent } from './center-layout.component';

describe('CenterLayoutComponent', () => {
  let component: CenterLayoutComponent;
  let fixture: ComponentFixture<CenterLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CenterLayoutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CenterLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
