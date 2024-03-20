import { Component, EventEmitter, Input, Output } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Component({
  selector: "app-marvinjs-input",
  templateUrl: "./marvinjs-input.component.html",
  styleUrls: ["./marvinjs-input.component.scss"],
})
export class MarvinjsInputComponent {
  @Input() placeholder: string = "";
  @Input() smiles: string = "";
  @Output() smilesChange = new EventEmitter();

  showDialog$ = new BehaviorSubject(false);
}
