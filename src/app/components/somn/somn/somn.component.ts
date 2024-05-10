import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { CheckReactionSiteResponse } from "~/app/api/mmli-backend/v1";
import { SomnRequest, SomnService } from "~/app/services/somn.service";

@Component({
  selector: "app-somn",
  templateUrl: "./somn.component.html",
  styleUrls: ["./somn.component.scss"],
  host: {
    class: "flex grow",
  },
})
export class SomnComponent {
  request = this.somnService.newRequest();

  constructor(
    private somnService: SomnService,
    private router: Router,
  ) {}

  useExample() {
    this.request = this.somnService.exampleRequest();
  }

  onSubmit(request: SomnRequest) {
    if (!this.request.form.valid) {
      return;
    }

    this.somnService.createJobAndRunSomn(
      this.request.toRequestBody()
    ).subscribe((response) => {
      this.router.navigate(['somn', 'result', response.job_id]);
    })
  }

  onValueChange(
    controlName: keyof typeof this.request.form.controls, 
    value: any
  ) {
    const thisValue = this.request.form.controls[controlName].value;

    if (JSON.stringify(thisValue) === JSON.stringify(value)) {
      return;
    }

    this.request.form.controls[controlName].setValue(value as never);
  }
}
