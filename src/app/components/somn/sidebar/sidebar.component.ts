import { Component } from "@angular/core";
import { SomnTools } from "~/app/enums/somn-tools";
import { ToolStatus } from "~/app/enums/tool-status";
import { NOVOSTOIC_TOOLS_STATUS_MAP } from "~/app/constants/somn-tools-status";
import { BehaviorSubject } from "rxjs";

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.scss"],
})
export class SidebarComponent {
  readonly SomnTools = SomnTools;
  readonly NOVOSTOIC_TOOLS_STATUS_MAP = NOVOSTOIC_TOOLS_STATUS_MAP;
  readonly ToolStatus = ToolStatus;

  selectedTool$ = new BehaviorSubject(SomnTools.OVERALL_STOICHIOMETRY);
  collapsed$ = new BehaviorSubject(false);
}
