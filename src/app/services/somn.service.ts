import { Injectable } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, Validators } from "@angular/forms";
import { BodyCreateJobJobTypeJobsPost, CheckReactionSiteRequest, FilesService, Job, JobType, JobsService, SomnService as SomeApiService } from "../api/mmli-backend/v1";

import sampleRequest from '../../assets/example_request.json';

import { Observable, map } from "rxjs";
import { CheckReactionSiteResponse } from "../api/mmli-backend/v1/model/checkReactionSiteResponse";
import * as d3 from "d3";

import catalystJson from '../components/somn/about-somn/catalyst_map.json';
import baseJson from '../components/somn/about-somn/base_map.json';
import solventJson from '../components/somn/about-somn/solvent_map.json';
import { ReactionSiteInput } from "../components/somn/marvinjs-input/marvinjs-input.component";

type ValueOf<T> = T[keyof T];

export type Product = {
  catalyst: ValueOf<typeof catalystJson>;
  solvent: ValueOf<typeof solventJson>;
  base: ValueOf<typeof baseJson>;
  yield: number;
  stdev: number;
  iid: number;
};

export type SomnResponse = Array<Omit<Product, "catalyst" | "solvent" | "base">
& {
  catalyst: keyof typeof catalystJson;
  solvent: keyof typeof solventJson;
  base: keyof typeof baseJson;
}>;

export class SomnRequest {
  private reactionSiteValidator(control: AbstractControl) {
    if (!control.value.input || !control.value.reactionSite) {
      return { required: true };
    }
    return null;
  }

  private nameValidator(control: AbstractControl) {
    if (!control.value || !control.value.trim().length) {
      return { required: true };
    }
    return null;
  }

  form = new FormGroup({
    reactantPairName: new FormControl("", [Validators.required, this.nameValidator]),

    arylHalideName: new FormControl("", [Validators.required, this.nameValidator]),
    arylHalide: new FormControl<ReactionSiteInput>({
      input: "",
      input_type: CheckReactionSiteRequest.InputTypeEnum.Smi,
      reactionSite: null
    }, [this.reactionSiteValidator]),

    amineName: new FormControl("", [Validators.required, this.nameValidator]),
    amine: new FormControl<ReactionSiteInput>({
      input: "",
      input_type: CheckReactionSiteRequest.InputTypeEnum.Smi,
      reactionSite: null
    }, [this.reactionSiteValidator]),
    

    agreeToSubscription: new FormControl(false),
    subscriberEmail: new FormControl("", [Validators.email]),
  });

  useExample() {
    this.form.setValue(sampleRequest as any);
  }

  toRequestBody(): BodyCreateJobJobTypeJobsPost {
    const job_info = {
      reactant_pair_name: (this.form.controls["reactantPairName"].value || "").trim().replace(/ /g, "_"),
      
      nuc_name: (this.form.controls["amineName"].value || "").trim().replace(/ /g, "_"),
      nuc: this.form.controls["amine"].value?.input || "",
      nuc_input_type: this.form.controls["amine"].value?.input_type || CheckReactionSiteRequest.InputTypeEnum.Smi,
      nuc_idx: this.form.controls["amine"].value?.reactionSite || "-",

      el_name: (this.form.controls["arylHalideName"].value || "").trim().replace(/ /g, "_"),
      el: this.form.controls["arylHalide"].value?.input || "",
      el_input_type: this.form.controls["arylHalide"].value?.input_type || CheckReactionSiteRequest.InputTypeEnum.Smi,
      el_idx: this.form.controls["arylHalide"].value?.reactionSite || "-",
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

  checkReactionSites(
    input: string, 
    inputType: CheckReactionSiteRequest.InputTypeEnum, 
    role: CheckReactionSiteRequest.RoleEnum, 
    hightlight_idxes?: number[]
  ): Observable<CheckReactionSiteResponse> {
    return this.somnService.checkReactionSitesSomnAllReactionSitesPost({
      input: input,
      input_type: inputType,
      role: role,
    });
  }

  getResultStatus(jobID: string): Observable<Job>{
    return this.jobsService.listJobsByTypeAndJobIdJobTypeJobsJobIdGet(JobType.Somn, jobID)
      .pipe(map((jobs) => jobs[0]));
  }

  getResult(jobID: string): Observable<Product[]>{
    return this.filesService.getResultsBucketNameResultsJobIdGet(JobType.Somn, jobID)
      .pipe(
        map((data: SomnResponse) => data.map((d, i) => ({
          ...d,
          iid: i,
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

  exportPNG(svgEl: SVGElement, filename: string) {
    console.log(filename, svgEl.innerHTML);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    const svgString = new XMLSerializer().serializeToString(svgEl);
    const svg = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svg);

    canvas.height = parseInt(svgEl.getAttribute('height')!);
    canvas.width = parseInt(svgEl.getAttribute('width')!);

    img.src = url;
    img.onload = function() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL();
      link.click();

      link.remove();
      canvas.remove();
    }
  }
}
