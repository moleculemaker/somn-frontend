import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriberEmailInputComponent } from './subscriber-email-input.component';

describe('SubscriberEmailInputComponent', () => {
  let component: SubscriberEmailInputComponent;
  let fixture: ComponentFixture<SubscriberEmailInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubscriberEmailInputComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscriberEmailInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
