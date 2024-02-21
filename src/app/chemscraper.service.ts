import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { PostResponse, ChemScraperAnalyzeRequestBody, ExampleData, FileUploadResponse, ExportRequestBody, Job } from './models';
import {
  AnalyzeRequestBody,
  ChemScraperService as ChemScraperApiService,
  DefaultService,
  //Molecule,
  //ExportRequestBody,
  JobsService,
  FilesService,
  Molecule
} from "./api/mmli-backend/v1";
import {EnvironmentService} from "./services/environment.service";

@Injectable({
  providedIn: 'root'
})
export class ChemScraperService {

  responseFromExample: PostResponse = {
    jobId: "example_PDF",
    submitted_at: "2020-01-01 10:10:10"
  };

  constructor(
    private apiService: DefaultService,

    private jobsService: JobsService,
    private filesService: FilesService,
    private chemscraperService: ChemScraperApiService
  ) {  }

  getExampleResponse(dataLabel: string): Observable<PostResponse>{
    this.responseFromExample.jobId = dataLabel;
    const respond = of(this.responseFromExample);
    return respond;
  }

  analyzeDocument(requestBody: AnalyzeRequestBody): Observable<PostResponse>{
    return this.chemscraperService.analyzeDocumentsChemscraperAnalyzePost(requestBody);
  }

  fileUpload(formData: FormData, jobID?: string): Observable<FileUploadResponse>{
    const fileData = formData.get('file') as Blob;
    return this.filesService.uploadFileBucketNameUploadPost('chemscraper', fileData, jobID);
  }

  getResultStatus(jobID: string): Observable<Job>{
    return this.jobsService.getJobByTypeAndJobIdAndRunIdJobTypeJobsJobIdRunIdGet('chemscraper', jobID, '0');
  }

  getResult(jobID: string): Observable<Molecule[]>{
    return this.filesService.getResultsBucketNameResultsJobIdGet('chemscraper', jobID);
  }

  getError(jobID: string): Observable<string>{
    return this.filesService.getErrorsBucketNameErrorsJobIdGet('chemscraper', jobID);
  }

  getInputPDf(jobID: string): Observable<string[]>{
    return this.filesService.getInputFileBucketNameInputsJobIdGet('chemscraper', jobID);
  }

  exportFiles(requestBody: ExportRequestBody): Observable<any> {
    return this.filesService.analyzeDocumentsBucketNameExportResultsPost('chemscraper', requestBody, 'body', false, { httpHeaderAccept: 'application/zip' as any });
  }

  getSimilaritySortedOrder(jobID: string, smile: string): Observable<number[]>{
    //let params = new HttpParams();
    //params = params.append('smile_string', smile);
    //return this.http.get<number[]>(this.SERVER_URL + 'similarity-sorted-order/' + jobID, { params: params });
    return this.apiService.getSimilaritySortedOrderChemscraperSimilaritySortedOrderJobIdGet(jobID, smile)
  }

  flagMolecule(jobID: string, molecule: Molecule) {
    return this.chemscraperService.flagMoleculeChemscraperFlagPost({
      smile: molecule.SMILE,
      doc_id: molecule.doc_no,
      job_id: jobID
    });
  }

  unflagMolecule(jobID: string, molecule: Molecule) {
    return this.chemscraperService.deleteFlaggedMoleculeChemscraperFlagDelete({
      smile: molecule.SMILE,
      // TODO: does this need doc_no?
      job_id: jobID
    });
  }
}
