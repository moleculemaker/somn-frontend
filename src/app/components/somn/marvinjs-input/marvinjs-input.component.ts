import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, forwardRef } from "@angular/core";
import { AbstractControl, ControlValueAccessor, FormControl, FormGroup, NG_ASYNC_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validators } from "@angular/forms";
import { BehaviorSubject, Observable, catchError, combineLatest, debounceTime, filter, interval, map, of, switchMap, take, takeUntil, tap } from "rxjs";
import { SomnService } from "~/app/services/somn.service";
import { ReactionSiteOption } from "../molecule-image/molecule-image.component";
import { CheckReactionSiteRequest } from "~/app/api/mmli-backend/v1";

export interface ReactionSiteInput {
  smiles: string | null;
  reactionSite: string | null;
}

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
  @Input() type: string = '';

  @Input() value: Partial<ReactionSiteInput>;
  @Output() valueChange = new EventEmitter<ReactionSiteInput>();

  form = new FormGroup({
    smiles: new FormControl("", [Validators.required], [this.validate.bind(this)]),
    reactionSite: new FormControl<string | null>(null, [Validators.required]),
  });

  colors = ['#DDCC7780', '#33228880', '#CC667780', '#AADDCC80', '#66332280']
  popupDisplayed = false;

  showDialog$ = new BehaviorSubject(false);
  svgSetupNeeded$ = new BehaviorSubject<boolean>(true);

  reactionSitesOptions : ReactionSiteOption[] = [];
  _selectedReactionSite : ReactionSiteOption | null = null;
  svg : string | null = null;

  onTouched = () => {};

  get selectedReactionSite() {
    return this._selectedReactionSite;
  }

  set selectedReactionSite(value: ReactionSiteOption | null) {
    this._selectedReactionSite = value;
    if (this.reactionSitesOptions.length === 1) {
      this.form.controls['reactionSite'].setValue('-');
    } else {
      this.form.controls['reactionSite'].setValue(value?.value!);
    }
  }

  constructor(private somnService: SomnService) {}

  writeValue(obj: any): void {
    if (obj) {
      this.form.setValue(obj);
    }
  }

  registerOnChange(fn: any): void {
    this.form.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // throw new Error("Method not implemented.");
  }

  validate(control: AbstractControl<any, any>): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> {
    // const value = control.value;
    return of(control.value).pipe(
      tap(() => {
        this.form.controls['reactionSite'].setValue(null);
      }),
      switchMap((v) => this.somnService.checkReactionSites(
        v, 
        CheckReactionSiteRequest.InputTypeEnum.Smi,
        this.type === 'nuc' ? CheckReactionSiteRequest.RoleEnum.Nuc : CheckReactionSiteRequest.RoleEnum.El,
      )),
      tap((resp) => {
        this.svg = resp.svg;

        this.reactionSitesOptions = [];
        resp.reaction_site_idxes.forEach((atomIdx, i) => {
          const newElement = document.createElement('div');
          newElement.innerHTML = this.svg!;

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
            .find((option) => option.value === this.form.controls['reactionSite'].value) || null;
        }
      }),
      map((resp) => 
        resp.reaction_site_idxes.length 
        ? null 
        : { noReactionSitesFound: true }
      ),
      catchError((e) => {
        switch (e.message) {
          case 'Chemical not supported':
            return of({ chemicalNotSupported: true });
          default:
            return of({ invalidUserInput: true });
        }
      }),
    );
  }
}
