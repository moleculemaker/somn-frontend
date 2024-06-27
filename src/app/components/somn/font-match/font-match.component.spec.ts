import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FontMatchComponent } from './font-match.component';

describe('FontMatchComponent', () => {
  let component: FontMatchComponent;
  let fixture: ComponentFixture<FontMatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FontMatchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FontMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
