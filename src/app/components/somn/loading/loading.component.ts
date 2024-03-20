import { Component } from "@angular/core";
import { interval } from "rxjs";

@Component({
  selector: "app-loading",
  templateUrl: "./loading.component.html",
  styleUrls: ["./loading.component.scss"],
  host: {
    class: "grow",
  },
})
export class LoadingComponent {
  loadingValue$ = interval(200);
}
