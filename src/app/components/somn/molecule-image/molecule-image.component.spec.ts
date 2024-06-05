import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoleculeImageComponent } from './molecule-image.component';

describe('MoleculeImageComponent', () => {
  let component: MoleculeImageComponent;
  let fixture: ComponentFixture<MoleculeImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MoleculeImageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoleculeImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
