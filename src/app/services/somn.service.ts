import { Injectable } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { JobCreate } from "../api/mmli-backend/v1";

import sampleRequest from '../../assets/example_request.json';
import sampleResponse from '../../assets/example_response.json';

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
  return sampleResponse as Products;
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

  toJobCreate(): JobCreate {
    return {
      job_info: JSON.stringify({
        reactantPairName: this.form.controls["reactantPairName"].value,

        arylHalideName: this.form.controls["arylHalideName"].value,
        arylHalideSmiles: this.form.controls["arylHalideSmiles"].value,
        arylHalideReactionSite:
          this.form.controls["arylHalideReactionSite"].value,

        amineName: this.form.controls["amineName"].value,
        amineSmiles: this.form.controls["amineSmiles"].value,
        amineReactionSite: this.form.controls["amineReactionSite"].value,
      }),
      email: this.form.controls["subscriberEmail"].value || "",
      job_id: undefined,
      run_id: 0,
    };
  }
}

@Injectable({
  providedIn: "root",
})
export class SomnService {
  data = generateData();

  constructor() {}

  response = {
    arylHalides: {
      commonName: "Aryl Halides",
      smiles: "Smiles",
      reactionSite: 1,
      structures: ["https://fakeimg.pl/640x360"],
    },
    amine: {
      commonName: "Amine",
      smiles: "Smiles",
      reactionSite: 1,
      structures: ["https://fakeimg.pl/640x360"],
    },
    data: this.data.map((d) => ({
      ...d,
      yield: d.yield / 100,
    }))
  };

  newRequest() {
    return new SomnRequest();
  }

  exampleRequest() {
    const request = new SomnRequest();
    request.form.setValue(sampleRequest);
    return request;
  }

  getHeatmapData() {
    const data = this.data;
    const map = new Map();
    data.forEach((d) => {
      const key = `${d.catalyst}-${d.solvent}/${d.base}`;
      if (map.has(key)) {
        console.warn("ignore data ", d, " because of key duplication");
        return;
      }
      map.set(key, {
        catalyst: d.catalyst,
        solventBase: `${d.solvent} / ${d.base}`,
        solvent: `${d.solvent}`,
        base: `${d.base}`,
        yield: d.yield,
      });
    });

    return Array.from(map.values());
  }
}
