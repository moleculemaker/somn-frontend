import { Injectable } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { FilesService, Job, JobCreate, JobType, JobsService, SomnRequestBody } from "../api/mmli-backend/v1";
import { SomnService as SomApiService } from "../api/mmli-backend/v1/api/somn.service";

import sampleRequest from '../../assets/example_request.json';
import sampleResponse from '../../assets/example_response.json';
import { Observable, switchMap, take } from "rxjs";
import { PostResponse } from "../models";

export type Products = Array<{
  catalyst:
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16
    | 17
    | 18
    | 19
    | 20
    | 21
  solvent: "Dioxane" | "Toulene" | "tAmOH";
  base: "K2CO3" | "NaOtBu" | "DBU";
  yield: number;
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
      amine_name: this.form.controls["amineName"].value || "",
      amine_smiles: this.form.controls["amineSmiles"].value || "",
      aryl_halide_name: this.form.controls["arylHalideName"].value || "",
      aryl_halide_smiles: this.form.controls["arylHalideSmiles"].value || "",
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
    private somnService: SomApiService,
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

  createJobAndRunSomn(requestBody: SomnRequestBody): Observable<PostResponse>{
    const jobCreate: JobCreate = {
      job_info: JSON.stringify(requestBody),
      email: requestBody.user_email,
    }

    return this.jobsService.createJobJobTypeJobsPost(JobType.Somn, jobCreate)
      .pipe(switchMap((response) => {
        console.log('Job created', response);
        requestBody.jobId = response.job_id!;
        return this.somnService.startSomnSomnRunPost(requestBody)
      }))
  }

  getResultStatus(jobID: string): Observable<Job>{
    return this.jobsService.getJobByTypeAndJobIdAndRunIdJobTypeJobsJobIdRunIdGet(JobType.Somn, jobID, '0');
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

  // getHeatmapData() {
  //   const data = this.data;
  //   const map = new Map();
  //   data.forEach((d) => {
  //     const key = `${d.catalyst}-${d.solvent}/${d.base}`;
  //     if (map.has(key)) {
  //       console.warn("ignore data ", d, " because of key duplication");
  //       return;
  //     }
  //     map.set(key, {
  //       catalyst: d.catalyst,
  //       solventBase: `${d.base} / ${d.solvent}`,
  //       solvent: `${d.solvent}`,
  //       base: `${d.base}`,
  //       yield: d.yield,
  //     });
  //   });

  //   return Array.from(map.values());
  // }
}
