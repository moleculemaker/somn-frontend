import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, forwardRef } from "@angular/core";
import { AbstractControl, ControlValueAccessor, FormControl, FormGroup, NG_ASYNC_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validators } from "@angular/forms";
import { BehaviorSubject, Observable, catchError, combineLatest, debounceTime, filter, interval, map, of, switchMap, take, takeUntil, tap } from "rxjs";
import { SomnService } from "~/app/services/somn.service";
import { ReactionSiteOption } from "../molecule-image/molecule-image.component";
import { CheckReactionSiteRequest, CheckReactionSiteResponse, CheckReactionSiteResponseInvalid } from "~/app/api/mmli-backend/v1";
import { HttpErrorResponse } from "@angular/common/http";

export type ReactionSiteInput = Omit<CheckReactionSiteRequest, 'role'> & {
  reactionSite: string | null;
};

@Component({
  selector: "app-marvinjs-input",
  templateUrl: "./marvinjs-input.component.html",
  styleUrls: ["./marvinjs-input.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MarvinjsInputComponent),
      multi: true
    }
  ]
})
export class MarvinjsInputComponent implements ControlValueAccessor {
  @Input() placeholder: string = "";
  @Input() type: CheckReactionSiteRequest.RoleEnum = CheckReactionSiteRequest.RoleEnum.El;

  @Input() value: Partial<ReactionSiteInput>;
  @Output() valueChange = new EventEmitter<ReactionSiteInput>();

  readonly somnErrorTypes = CheckReactionSiteResponseInvalid.TypeEnum;

  fileInputFormControl = new FormControl("", [Validators.required], [this.fileValidate.bind(this)]);
  smilesFormControl = new FormControl("", [Validators.required], [this.smilesValidate.bind(this)]);
  reactionSiteFormControl = new FormControl("", [Validators.required]);
  inputTypeFormControl = new FormControl<CheckReactionSiteRequest.InputTypeEnum>(
    CheckReactionSiteRequest.InputTypeEnum.Smi,
    [Validators.required]
  );

  colors = ['#DDCC7780', '#33228880', '#CC667780', '#AADDCC80', '#66332280']
  popupDisplayed = false;

  showDialog$ = new BehaviorSubject(false);

  reactionSitesOptions : ReactionSiteOption[] = [];
  _selectedReactionSite : ReactionSiteOption | null = null;
  validatedResponse: CheckReactionSiteResponse | null = null;

  onTouched = () => {};

  get selectedReactionSite() {
    return this._selectedReactionSite;
  }

  set selectedReactionSite(value: ReactionSiteOption | null) {
    this._selectedReactionSite = value;
    if (this.reactionSitesOptions.length === 1) {
      this.reactionSiteFormControl.setValue('-');
    } else {
      this.reactionSiteFormControl.setValue(value?.value!);
    }
  }

  constructor(private somnService: SomnService) {}

  onSmilesInput(smiles: string | Event) {
    this.inputTypeFormControl.setValue(CheckReactionSiteRequest.InputTypeEnum.Smi);
    this.smilesFormControl.setValue(typeof smiles === 'string' 
      ? smiles 
      : (smiles.target as HTMLInputElement).value
    );
  }

  onFileInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.cdxml,.cml';  // Only allow CDXML and CML files
    
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 100000) {
          alert('File is too large. Maximum size is 100KB.');
          return;
        }

        const extension = file.name.split('.').pop();

        file.text().then((text) => {
          this.inputTypeFormControl.setValue(extension as CheckReactionSiteRequest.InputTypeEnum);
          this.fileInputFormControl.setValue(text);
          this.fileInputFormControl.markAsDirty();
        });
      }
    };
    
    input.click();
  }

  writeValue(obj: any): void {
    if (obj) {
      this.inputTypeFormControl.setValue(obj.input_type);
      switch (obj.input_type) {
        case CheckReactionSiteRequest.InputTypeEnum.Cml:
        case CheckReactionSiteRequest.InputTypeEnum.Cdxml:
          this.fileInputFormControl.setValue(obj.input);
          this.fileInputFormControl.updateValueAndValidity();
          break;
        case CheckReactionSiteRequest.InputTypeEnum.Smi:
          this.smilesFormControl.setValue(obj.input);
          this.smilesFormControl.updateValueAndValidity();
          break;
      }
    }
  }

  registerOnChange(fn: any): void {
    combineLatest([
      this.inputTypeFormControl.valueChanges,
      this.fileInputFormControl.valueChanges,
      this.smilesFormControl.valueChanges,
      this.reactionSiteFormControl.valueChanges,
    ])
    .pipe(
      filter(([inputType, file, smiles, _]) => {
        switch (inputType) {
          case CheckReactionSiteRequest.InputTypeEnum.Cml:
          case CheckReactionSiteRequest.InputTypeEnum.Cdxml:
            return file !== null;
          case CheckReactionSiteRequest.InputTypeEnum.Smi:
            return smiles !== null;
          default:
            return false;
        }
      }),
    )
    .subscribe(([inputType, file, smiles, reactionSite]) => {
      const payload = {
        input: file || smiles || '',
        input_type: inputType || CheckReactionSiteRequest.InputTypeEnum.Smi,
        reactionSite,
      }
      fn(payload);
    });
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // throw new Error("Method not implemented.");
  }

  onInputValidated(resp: CheckReactionSiteResponse) {
    this.validatedResponse = resp;

    this.reactionSitesOptions = [];
    resp.reaction_site_idxes.forEach((atomIdx, i) => {
      const newElement = document.createElement('div');
      newElement.innerHTML = resp.svg!;

      const svgEl = newElement.querySelector('svg')!;
      svgEl.setAttribute('width', '200px');
      svgEl.setAttribute('height', '125px');

      const highlights = newElement.querySelectorAll('ellipse');
      highlights.forEach((highlight) => {
        highlight.removeAttribute('style');
        highlight.setAttribute('fill', '#00000000');
      });

      const theHighlight = newElement.querySelector(`ellipse.atom-${atomIdx}`);
      theHighlight?.setAttribute('fill', this.colors[i % this.colors.length]);

      this.reactionSitesOptions.push({
        idx: i,
        value: `${atomIdx}`,
        svg: newElement.innerHTML,
      });
    });

    // it's possible that the reaction site is set in form before the svg is set
    // so check the form value and update the svg if necessary
    if (this.reactionSitesOptions.length === 1) {
      this.selectedReactionSite = this.reactionSitesOptions[0];
    } else {
      this.selectedReactionSite = this.reactionSitesOptions
        .find((option) => option.value === this.reactionSiteFormControl.value) || null;
    }
  }

  smilesValidate(control: AbstractControl) {
    return of(control.value).pipe(
      filter(() => 
        this.inputTypeFormControl.value === CheckReactionSiteRequest.InputTypeEnum.Smi
      ),
      tap(() => {
        this.validatedResponse = null;
        this.reactionSiteFormControl.setValue(null);

        this.fileInputFormControl.setValue(null);
        this.fileInputFormControl.markAsPristine();
      }),
      switchMap((v: string) => 
        this.somnService.checkReactionSites(
          v, 
          CheckReactionSiteRequest.InputTypeEnum.Smi, 
          this.type as CheckReactionSiteRequest.RoleEnum
        )
      ),
      tap((resp) => this.onInputValidated(resp)),
      map((resp) => 
        resp.reaction_site_idxes.length 
        ? null 
        : { noReactionSitesFound: true }
      ),
      catchError(({ error }: HttpErrorResponse & { error: CheckReactionSiteResponseInvalid }) => {
        error.type = CheckReactionSiteResponseInvalid.TypeEnum._3dGen;

        return of({ [error.type]: true });
      }),
    );
  }

  fileValidate(control: AbstractControl) {
    return of(control.value).pipe(
      filter(() => 
        this.inputTypeFormControl.value === CheckReactionSiteRequest.InputTypeEnum.Cml || 
        this.inputTypeFormControl.value === CheckReactionSiteRequest.InputTypeEnum.Cdxml
      ),
      tap(() => {
        this.validatedResponse = null;
        this.reactionSiteFormControl.setValue(null);
      }),
      switchMap((v: string) => 
        this.somnService.checkReactionSites(
          v, 
          this.inputTypeFormControl.value!,
          this.type as CheckReactionSiteRequest.RoleEnum,
        )
      ),
      tap((resp) => this.onInputValidated(resp)),
      tap((resp) => this.smilesFormControl.setValue(resp.smiles, { emitEvent: false })),
      map((resp) => 
        resp.reaction_site_idxes.length 
        ? null 
        : { noReactionSitesFound: true }
      ),
      catchError(({ error }: HttpErrorResponse & { error: CheckReactionSiteResponseInvalid }) => {
        return of({ [error.type]: true });
      }),
    );
  }
}
