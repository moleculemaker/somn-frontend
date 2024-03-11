import { Component } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

@Component({
  selector: "app-subscriber-email-input",
  templateUrl: "./subscriber-email-input.component.html",
  styleUrls: ["./subscriber-email-input.component.scss"],
})
export class SubscriberEmailInputComponent {
  subscriptionForm = new FormGroup({
    agreeToSubscription: new FormControl(false),
    subscriberEmail: new FormControl("", [
      Validators.required,
      Validators.email,
    ]),
  });

  constructor() {}
}
