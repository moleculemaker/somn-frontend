import { Injectable } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BodyCreateJobJobTypeJobsPost, FilesService, Job, JobType, JobsService, SomnService as SomeApiService } from "../api/mmli-backend/v1";
import { JobCreate } from "../api/mmli-backend/v1/model/jobCreate";

import sampleRequest from '../../assets/example_request.json';
import sampleResponse from '../../assets/example_response.json';
import { Observable, map } from "rxjs";
import { CheckReactionSiteResponse } from "../api/mmli-backend/v1/model/checkReactionSiteResponse";

export type Products = Array<{
  nuc_name: string;
  el_name: string;
  catalyst: number | string;
  solvent: number | string;
  base: string;
  yield: number;
  stdev: number;
}>;

export interface ReactionSiteInput {
  smiles: string;
  reactionSite: number;
}

export type ReactionSiteInputFormControls = { [key in keyof ReactionSiteInput]: FormControl };

function generateData(): Products {
  return (sampleResponse as Products).sort((a, b) => a.base.localeCompare(b.base));
}

export class SomnRequest {
  form = new FormGroup({
    reactantPairName: new FormControl("", [Validators.required]),

    arylHalideName: new FormControl("", [Validators.required]),
    arylHalide: new FormGroup<ReactionSiteInputFormControls>({
      smiles: new FormControl<string>("", [Validators.required]),
      reactionSite: new FormControl<number|null>(null, [Validators.required]),
    }),

    amineName: new FormControl("", [Validators.required]),
    amine: new FormGroup<ReactionSiteInputFormControls>({
      smiles: new FormControl("", [Validators.required]),
      reactionSite: new FormControl<number|null>(null, [Validators.required]),
    }),

    agreeToSubscription: new FormControl(false),
    subscriberEmail: new FormControl("", [Validators.email]),
  });

  toRequestBody(): BodyCreateJobJobTypeJobsPost {
    const job_info = {
      reactant_pair_name: this.form.controls["reactantPairName"].value || "",
      
      nuc_name: this.form.controls["amineName"].value || "",
      nuc: this.form.controls["amine"].value.smiles || "",
      nuc_idx: this.form.controls["amine"].value.reactionSite || "-",

      el_name: this.form.controls["arylHalideName"].value || "",
      el: this.form.controls["arylHalide"].value.smiles || "",
      el_idx: this.form.controls["arylHalide"].value.reactionSite || "-",
    }
    return {
      email: this.form.controls["subscriberEmail"].value || "",
      job_info: JSON.stringify(job_info),
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
    private somnService: SomeApiService,
  ) {}

  response = {
    reactantPairName: sampleRequest.reactantPairName,
    arylHalides: {
      name: sampleRequest.arylHalideName,
      smiles: sampleRequest.arylHalide.smiles,
      reactionSite: sampleRequest.arylHalide.reactionSite,
      structures: ["https://fakeimg.pl/640x360"],
    },
    amine: {
      name: sampleRequest.amineName,
      smiles: sampleRequest.amine.smiles,
      reactionSite: sampleRequest.amine.reactionSite,
      structures: ["https://fakeimg.pl/640x360"],
    },
    data: this.data.map((d) => ({
      ...d,
      yield: d.yield / 100,
    }))
  };

  createJobAndRunSomn(requestBody: BodyCreateJobJobTypeJobsPost): Observable<Job>{
    return this.jobsService.createJobJobTypeJobsPost(JobType.Somn, requestBody);
  }

  checkReactionSites(smiles: string, type: string, hightlight_idxes?: number[]): Observable<CheckReactionSiteResponse> {
    return this.somnService.checkReactionSitesSomnAllReactionSitesGet(smiles, type, hightlight_idxes);
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

  updateSubscriberEmail(jobId: string, email: string) {
    return this.jobsService.patchExistingJobJobTypeJobsJobIdRunIdPatch(JobType.Somn, {
      job_id: jobId,
      run_id: 0,
      email: email,
    });
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
