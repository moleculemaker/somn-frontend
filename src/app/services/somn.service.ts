import { Injectable } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { FilesService, Job, JobType, JobsService, SomnRequestBody } from "../api/mmli-backend/v1";
import { JobCreate } from "../api/mmli-backend/v1/model/jobCreate";

import sampleRequest from '../../assets/example_request.json';
import sampleResponse from '../../assets/example_response.json';
import { Observable, map } from "rxjs";

export type Products = Array<{
  nuc_name: string;
  el_name: string;
  catalyst: number | string;
  solvent: number | string;
  base: string;
  yield: number;
  stdev: number;
}>;

function generateData(): Products {
  return (sampleResponse as Products).sort((a, b) => a.base.localeCompare(b.base));
}

export class SomnRequest {
  form = new FormGroup({
    reactantPairName: new FormControl("", [Validators.required]),

    arylHalideName: new FormControl("", [Validators.required]),
    arylHalideSmiles: new FormControl("", [Validators.required]),
    arylHalideReactionSite: new FormControl(0, [Validators.required]),

    amineName: new FormControl("", [Validators.required]),
    amineSmiles: new FormControl("", [Validators.required]),
    amineReactionSite: new FormControl(0, [Validators.required]),

    agreeToSubscription: new FormControl(false),
    subscriberEmail: new FormControl("", [Validators.email]),
  });

  toRequestBody(): SomnRequestBody {
    return {
      user_email: this.form.controls["subscriberEmail"].value || "",
      jobId: '',
      reactant_pair_name: this.form.controls["reactantPairName"].value || "",
      nuc_name: this.form.controls["amineName"].value || "",
      nuc: this.form.controls["amineSmiles"].value || "",
      el_name: this.form.controls["arylHalideName"].value || "",
      el: this.form.controls["arylHalideSmiles"].value || "",
    };
  }
}

@Injectable({
  providedIn: "root",
})
export class SomnService {
  data = generateData();

  constructor(
    private jobsService: JobsService,
    private filesService: FilesService,
  ) {}

  response = {
    reactantPairName: sampleRequest.reactantPairName,
    arylHalides: {
      name: sampleRequest.arylHalideName,
      smiles: sampleRequest.arylHalideSmiles,
      reactionSite: sampleRequest.arylHalideReactionSite,
      structures: ["https://fakeimg.pl/640x360"],
    },
    amine: {
      name: sampleRequest.amineName,
      smiles: sampleRequest.amineSmiles,
      reactionSite: sampleRequest.amineReactionSite,
      structures: ["https://fakeimg.pl/640x360"],
    },
    data: this.data.map((d) => ({
      ...d,
      yield: d.yield / 100,
    }))
  };

  createJobAndRunSomn(requestBody: SomnRequestBody): Observable<Job>{
    const jobCreate: JobCreate = {
      job_info: JSON.stringify(requestBody),
      email: requestBody.user_email,
    }
    return this.jobsService.createJobJobTypeJobsPost(JobType.Somn, jobCreate);
  }

  getResultStatus(jobID: string): Observable<Job>{
    return this.jobsService.listJobsByTypeAndJobIdJobTypeJobsJobIdGet(JobType.Somn, jobID)
      .pipe(map((jobs) => jobs[0]));
  }

  getResult(jobID: string): Observable<any>{
    return this.filesService.getResultsBucketNameResultsJobIdGet(JobType.Somn, jobID);
  }

  getError(jobID: string): Observable<string>{
    return this.filesService.getErrorsBucketNameErrorsJobIdGet(JobType.Somn, jobID);
  }

  newRequest() {
    return new SomnRequest();
  }

  exampleRequest() {
    const request = new SomnRequest();
    request.form.setValue(sampleRequest);
    return request;
  }
}
