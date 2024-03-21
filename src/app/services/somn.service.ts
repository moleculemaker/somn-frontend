import { Injectable } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { JobCreate } from "../api/mmli-backend/v1";

export type Products = Array<{
  arylHalide:
    | "Chlorobenzene"
    | "Bromobenzene"
    | "Iodobenzene"
    | "Fluorobenzene"
    | "2-Chlorotoluene"
    | "4-Bromoanisole"
    | "1-Iodonaphthalene"
    | "2-Fluoropyridine";
  amine:
    | "Methylamine"
    | "Ethylamine"
    | "Propylamine"
    | "Aniline"
    | "Dimethylamine"
    | "Trimethylamine"
    | "Ethanolamine"
    | "Diphenylamine";
  catalyst:
    | "Platinum"
    | "Palladium"
    | "Rhodium"
    | "Ruthenium"
    | "Iridium"
    | "Nickel"
    | "Copper"
    | "Silver"
    | "Gold"
    | "Cobalt"
    | "Iron"
    | "Molybdenum"
    | "Vanadium"
    | "Zinc"
    | "Titanium"
    | "Aluminum"
    | "Chromium"
    | "Tungsten"
    | "Cerium"
    | "Bismuth";
  solvent: "Dioxane" | "Toulene" | "tAmOH";
  base: "Sodium tert-butoxide" | "Potassium carbonate" | "DBU";
  yield: number;
}>;

function generateData(): Products {
  const solvents: Products[0]["solvent"][] = ["Dioxane", "Toulene", "tAmOH"];
  const bases: Products[0]["base"][] = [
    "Sodium tert-butoxide",
    "Potassium carbonate",
    "DBU",
  ];
  const catalysts: Products[0]["catalyst"][] = [
    "Platinum",
    "Palladium",
    "Rhodium",
    "Ruthenium",
    "Iridium",
    "Nickel",
    "Copper",
    "Silver",
    "Gold",
    "Cobalt",
    "Iron",
    "Molybdenum",
    "Vanadium",
    "Zinc",
    "Titanium",
    "Aluminum",
    "Chromium",
    "Tungsten",
    "Cerium",
    "Bismuth",
  ];
  const arylHalides: Products[0]["arylHalide"][] = [
    "Chlorobenzene",
    "Bromobenzene",
    "Iodobenzene",
    "Fluorobenzene",
    "2-Chlorotoluene",
    "4-Bromoanisole",
    "1-Iodonaphthalene",
    "2-Fluoropyridine",
  ];
  const amines: Products[0]["amine"][] = [
    "Methylamine",
    "Ethylamine",
    "Propylamine",
    "Aniline",
    "Dimethylamine",
    "Trimethylamine",
    "Ethanolamine",
    "Diphenylamine",
  ];

  const data: Products = [];

  // Generating a record for each (solvent x base, catalyst) pair
  solvents.forEach((solvent) => {
    bases.forEach((base) => {
      catalysts.forEach((catalyst) => {
        // Generating a random yield between 0 and 1
        const yieldValue = Math.random();

        // Selecting random arylHalide and amine
        const randomArylHalide =
          arylHalides[Math.floor(Math.random() * arylHalides.length)];
        const randomAmine = amines[Math.floor(Math.random() * amines.length)];

        data.push({
          arylHalide: randomArylHalide,
          amine: randomAmine,
          catalyst,
          solvent,
          base,
          yield: yieldValue,
        });
      });
    });
  });

  return data.sort((a, b) => a.base.localeCompare(b.base));
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
      structures: [],
    },
    amine: {
      commonName: "Amine",
      smiles: "Smiles",
      reactionSite: 1,
      structures: [],
    },
    data: this.data,
  };

  newRequest() {
    return new SomnRequest();
  }

  getHeatmapData() {
    const data = this.data;
    const map = new Map();
    const baseAbbreMap = {
      DBU: "DBU",
      "Sodium tert-butoxide": "NaOtBu",
      "Potassium carbonate": "K2CO3",
    };
    data.forEach((d) => {
      const key = `${d.catalyst}-${d.solvent}/${d.base}`;
      if (map.has(key)) {
        console.warn("ignore data ", d, " because of key duplication");
        return;
      }
      map.set(key, {
        catalyst: d.catalyst,
        solventBase: `${d.solvent} / ${baseAbbreMap[d.base]}`,
        solvent: `${d.solvent}`,
        base: `${d.base}`,
        yield: `${d.yield}`,
      });
    });
    return Array.from(map.values());
  }
}
