import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarvinjsInputComponent } from './marvinjs-input.component';

describe('MarvinjsInputComponent', () => {
  let component: MarvinjsInputComponent;
  let fixture: ComponentFixture<MarvinjsInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarvinjsInputComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarvinjsInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
