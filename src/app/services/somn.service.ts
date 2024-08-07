import { Injectable } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BodyCreateJobJobTypeJobsPost, FilesService, Job, JobType, JobsService, SomnService as SomeApiService } from "../api/mmli-backend/v1";
import { JobCreate } from "../api/mmli-backend/v1/model/jobCreate";

import sampleRequest from '../../assets/example_request.json';
import sampleResponse from '../../assets/example_response.json';

import { Observable, map } from "rxjs";
import { CheckReactionSiteResponse } from "../api/mmli-backend/v1/model/checkReactionSiteResponse";
import * as d3 from "d3";

import catalystJson from '../components/somn/about-somn/catalyst_map.json';
import baseJson from '../components/somn/about-somn/base_map.json';
import solventJson from '../components/somn/about-somn/solvent_map.json';

type ValueOf<T> = T[keyof T];

export type Product = {
  catalyst: ValueOf<typeof catalystJson>;
  solvent: ValueOf<typeof solventJson>;
  base: ValueOf<typeof baseJson>;
  yield: number;
  stdev: number;
};

export interface ReactionSiteInput {
  smiles: string;
  reactionSite: number;
}

export type SomnResponse = Array<Omit<Product, "catalyst" | "solvent" | "base">
& {
  catalyst: keyof typeof catalystJson;
  solvent: keyof typeof solventJson;
  base: keyof typeof baseJson;
}>;

export type ReactionSiteInputFormControls = { [key in keyof ReactionSiteInput]: FormControl };

export class SomnRequest {
  form = new FormGroup({
    reactantPairName: new FormControl("", [Validators.required]),

    arylHalideName: new FormControl("", [Validators.required]),
    arylHalide: new FormGroup<ReactionSiteInputFormControls>({
      smiles: new FormControl<string>("", [Validators.required]),
      reactionSite: new FormControl<number|null>(null),
    }),

    amineName: new FormControl("", [Validators.required]),
    amine: new FormGroup<ReactionSiteInputFormControls>({
      smiles: new FormControl("", [Validators.required]),
      reactionSite: new FormControl<number|null>(null),
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
  constructor(
    private jobsService: JobsService,
    private filesService: FilesService,
    private somnService: SomeApiService,
  ) {}

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

  getResult(jobID: string): Observable<Product[]>{
    return this.filesService.getResultsBucketNameResultsJobIdGet(JobType.Somn, jobID)
      .pipe(
        map((data: SomnResponse) => data.map((d) => ({
          ...d,
          catalyst: catalystJson[d.catalyst],
          solvent: solventJson[d.solvent],
          base: baseJson[d.base],
        })
      )));
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

  getColorScale(data: Product[]) {
    return d3.scaleLinear(
      [
        d3.min(data.map((d) => d["yield"]))!,
        d3.median(data.map((d) => d["yield"]))!,
        Math.min(d3.max(data.map((d) => d["yield"]))!, 1.2),
        1.21,
        Infinity,
      ],
      ["#470459", "#2E8C89", "#F5E61D", "#FFF2E2", "#FFF2E2"],
    );
  }
  
  getGradientByData(data: Product[]) {    

    let legendGradient = d3.create('defs')
      .append("linearGradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");

    let colorScale = this.getColorScale(data);

    legendGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", colorScale(d3.min(data.map((d) => d["yield"]))!));

    legendGradient
      .append("stop")
      .attr("offset", "50%")
      .attr("stop-color", colorScale(d3.median(data.map((d) => d["yield"]))!));

    let cap = Math.min(d3.max(data.map((d) => d["yield"]))!, 1.2);
    legendGradient
      .append("stop")
      .attr("offset", "99%")
      .attr("stop-color", colorScale(cap));

    legendGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", colorScale(1.21));

    return legendGradient;
  }
}
