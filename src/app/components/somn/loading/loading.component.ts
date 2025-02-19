import { Component } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { SomnService } from "~/app/services/somn.service";

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

  jobId: string = this.route.snapshot.paramMap.get("id") || "";

  constructor(
    private route: ActivatedRoute,
    private somnService: SomnService,
  ) {}

  onSubmit() {
    if (this.form.invalid) {
      return;
    }
    
    this.somnService.updateSubscriberEmail(this.jobId, 
      this.form.controls["subscriberEmail"].value || ''
    ).subscribe((res) => {
      console.log(res);
    });
  }
}
