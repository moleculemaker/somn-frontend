import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AboutSomnComponent } from "./about-somn.component";

describe("AboutSomnComponent", () => {
  let component: AboutSomnComponent;
  let fixture: ComponentFixture<AboutSomnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AboutSomnComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutSomnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
