import { SomnTools } from "../enums/somn-tools";
import { ToolStatus } from "../enums/tool-status";

export const NOVOSTOIC_TOOLS_STATUS_MAP: Record<SomnTools, ToolStatus> = {
  [SomnTools.OVERALL_STOICHIOMETRY]: ToolStatus.RUNNING,
  [SomnTools.PATHWAY_SEARCH]: ToolStatus.DISABLED,
  [SomnTools.THERMODYNAMICAL_FEASIBILITY]: ToolStatus.DISABLED,
  [SomnTools.ENZYME_ACTIVITY]: ToolStatus.DISABLED,
  [SomnTools.NA]: ToolStatus.DISABLED,
};
