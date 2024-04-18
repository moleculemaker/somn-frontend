import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YieldFilterComponent } from './yield-filter.component';

describe('YieldFilterComponent', () => {
  let component: YieldFilterComponent;
  let fixture: ComponentFixture<YieldFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ YieldFilterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(YieldFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
