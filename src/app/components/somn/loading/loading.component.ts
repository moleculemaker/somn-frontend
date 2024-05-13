import { Component } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

@Component({
  selector: "app-loading",
  templateUrl: "./loading.component.html",
  styleUrls: ["./loading.component.scss"],
  host: {
    class: "grow",
  },
})
export class LoadingComponent {
  form = new FormGroup({
    agreeToSubscription: new FormControl(false),
    subscriberEmail: new FormControl("", [Validators.required, Validators.email]),
  });

  // TODO: Implement subscription to job
}
