import { SafeHtml } from "@angular/platform-browser";

/** Legacy models - prefer models from modules/api/v1/models */

export interface PredictionRow {
  sequence: string;
  ecNumbers: string[];
  score: number[];
  level: string[];
}

export interface ExampleData {
  label: string;
  data: string;
}

export interface SingleSeqResult {
  ecNumber: string;
  score: number;
}

export interface SeqResult {
  sequence: string;
  result: SingleSeqResult[];
}

export interface SingleSeqData {
  header: string;
  sequence: string;
}

export interface ChemScraperAnalyzeRequestBody {
  jobId: string;
  user_email: string;
  fileList: string[];
}

export interface ExportRequestBody {
  jobId: string;
  cdxml: boolean;
  cdxml_filter: string;
  cdxml_selected_pages: number[];
  csv: boolean;
  csv_filter: string;
  csv_molecules: number[];
}

export interface PostResponse {
  jobId: string;
  submitted_at: string;
}

export interface Molecule {
  id: number;
  doc_no: string;
  file_path: string;
  page_no: string;
  name: string;
  SMILE: string;
  structure: SafeHtml;
  minX: string;
  minY: string;
  width: string;
  height: string;
  PubChemCID: string;
  molecularFormula: string;
  molecularWeight: string;
  chemicalSafety: string[];
  Description: string;
  Location: string;
  OtherInstances: string[];
  fingerprint: string;
}

export interface FileUploadResponse {
  jobID: string;
  uploaded_at: string;
}

export interface PollingResponseStatus {
  jobId: string;
  url: string;
  status: string;
  created_at: string;
}

export interface PollingResponseResult {
  jobId: string;
  url: string;
  status: string;
  created_at: string;
  results: SeqResult[];
}

export interface HighlightBox {
  moleculeId: number;
  moleculeName: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Job {
  job_info: string;
  email: string;
  job_id: string;
  run_id: number;
  phase: string;
  type: string;
  image: string;
  command: string;
  time_created: number;
  time_start: number;
  time_end: number;
  deleted: number;
  user_agent: string;
}
