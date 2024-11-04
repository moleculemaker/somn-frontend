import { Injectable } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
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

  private duplicationValidator(control: AbstractControl) {
    const c = control as FormArray;
    const reactantPairs = c.getRawValue();

    const checkDifferentNameForSameInput = (controlName: string) => {
      const inputMap = new Map<string, AbstractControl>();

      reactantPairs.forEach((rp: any, index: number) => {
        const input = rp[controlName].input;
        if (input && !inputMap.has(input)) {
          inputMap.set(input, c.at(index).get(`${controlName}Name`)!);
        }
      });
      
      reactantPairs.forEach((rp: any, index: number) => {
        const nameControl = c.at(index).get(`${controlName}Name`)!;
        const originalNameControl = inputMap.get(rp[controlName].input);
        if (originalNameControl && nameControl !== originalNameControl) {
          nameControl?.setValue(originalNameControl?.value, { emitEvent: false, onlySelf: true });
          nameControl?.disable({ emitEvent: false, onlySelf: true });
        }

        else {
          nameControl?.enable({ emitEvent: false, onlySelf: true });
        }
      });
    }

    const checkSameNameForDifferentInputs = (controlName: string) => {
      const nameMap = new Map<string, {
        value: string;
        count: number;
      }>();

      reactantPairs.forEach((rp: any) => {
        const name = rp[`${controlName}Name`]?.trim();
        const input = rp[controlName]?.input;
        
        if (name && input) {
          const key = `${name}-${input}`;
          if (!nameMap.has(key)) {
            nameMap.set(key, { value: name, count: 1 });
          } else {
            nameMap.get(key)!.count++;
          }
        }
      });

      reactantPairs.forEach((rp: any, index: number) => {
        const nameControl = c.at(index).get(`${controlName}Name`)!;
        const name = rp[`${controlName}Name`]?.trim();
        const input = rp[controlName]?.input;
        
        if (name && input) {
          const key = `${name}-${input}`;
          const entry = nameMap.get(key)!;
          
          if (entry.count > 1) {
            const currentCount = entry.count--;
            const newName = `${name}-${currentCount}`;
            nameControl.setValue(newName, { emitEvent: false, onlySelf: true });
          }
        }
      });
    }

    checkDifferentNameForSameInput("arylHalide");
    checkDifferentNameForSameInput("amine");
    checkSameNameForDifferentInputs("arylHalide");
    checkSameNameForDifferentInputs("amine");
    return null;
  }

  form = new FormGroup({
    reactantPairs: new FormArray([
      this.createReactantPairForm()
    ], [this.duplicationValidator]),

    agreeToSubscription: new FormControl(false),
    subscriberEmail: new FormControl("", [Validators.email]),
  });

  createReactantPairForm() {
    return new FormGroup({
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

      status: new FormControl<"view" | "edit">("edit")
    });
  }

  useExample() {
    this.form.setValue(sampleRequest as any);
  }

  toRequestBody(): BodyCreateJobJobTypeJobsPost {
    const reactantPairs = this.form.controls["reactantPairs"].value;
    const job_info = reactantPairs.map((rp) => ({
      reactant_pair_name: rp.reactantPairName?.trim().replace(/ /g, "_") || "-",

      nuc_name: rp.amineName?.trim().replace(/ /g, "_") || "-",
      nuc: rp.amine?.input || "",
      nuc_input_type: rp.amine?.input_type || CheckReactionSiteRequest.InputTypeEnum.Smi,
      nuc_idx: rp.amine?.reactionSite || "-",

      el_name: rp.arylHalideName?.trim().replace(/ /g, "_") || "-",
      el: rp.arylHalide?.input || "",
      el_input_type: rp.arylHalide?.input_type || CheckReactionSiteRequest.InputTypeEnum.Smi,
      el_idx: rp.arylHalide?.reactionSite || "-",
    }));
    return {
      email: this.form.controls["subscriberEmail"].value || "",
      job_info: JSON.stringify(job_info),
    };
  }

  addReactantPair() {
    this.form.controls["reactantPairs"].push(this.createReactantPairForm());
  }

  removeReactantPair(index: number) {
    this.form.controls["reactantPairs"].removeAt(index);
    if (!this.form.controls["reactantPairs"].length) {
      this.addReactantPair();
    }
  }

  duplicateReactantPair(index: number) {
    const rp = this.form.controls["reactantPairs"].controls[index];
    const newRp = this.createReactantPairForm();
    newRp.patchValue(rp.getRawValue());

    newRp.controls["amineName"].disable({ emitEvent: false });
    newRp.controls["arylHalideName"].disable({ emitEvent: false });
    newRp.updateValueAndValidity({ emitEvent: false });

    this.form.controls["reactantPairs"].insert(index + 1, newRp);
  }

  private clearAllInputHelper(form: FormGroup | FormArray) {
    Object.entries(form.controls).forEach(([key, control]) => {
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.clearAllInputHelper(control);
      } else {
        control.reset();
      }
    });
  }

  clearAll() {
    this.clearAllInputHelper(this.form.controls["reactantPairs"]);
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
