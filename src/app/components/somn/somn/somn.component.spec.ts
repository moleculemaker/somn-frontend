import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SomnComponent } from './somn.component';

describe('SomnComponent', () => {
  let component: SomnComponent;
  let fixture: ComponentFixture<SomnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SomnComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SomnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
