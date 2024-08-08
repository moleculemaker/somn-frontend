import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, NG_ASYNC_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validators } from "@angular/forms";
import { BehaviorSubject, Observable, catchError, combineLatest, debounceTime, filter, interval, map, of, switchMap, takeUntil, tap } from "rxjs";
import { SomnService, ReactionSiteInput, ReactionSiteInputFormControls } from "~/app/services/somn.service";

@Component({
  selector: "app-marvinjs-input",
  templateUrl: "./marvinjs-input.component.html",
  styleUrls: ["./marvinjs-input.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MarvinjsInputComponent),
      multi: true
    },
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: forwardRef(() => MarvinjsInputComponent),
      multi: true
    }
  ]
})
export class MarvinjsInputComponent {
  @Input() placeholder: string = "";
  @Input() type: string = '';
  @Input() set value(v: Partial<ReactionSiteInput>) {
    if (this.doNotSyncValue) {
      this.doNotSyncValue = false;
      return;
    }
    this.formGroup.setValue({
      smiles: v.smiles || "",
      reactionSite: v.reactionSite || null,
    });
  };

  @Output() valueChange = new EventEmitter<ReactionSiteInput>();

  formGroup = new FormGroup<ReactionSiteInputFormControls>({
    smiles: new FormControl("", [Validators.required], [this.validate.bind(this)]),
    reactionSite: new FormControl<number|null>(null, [Validators.required]),
  });

  colors = ['#DDCC7780', '#33228880', '#CC667780', '#AADDCC80', '#66332280']
  doNotSyncValue = false;
  popupDisplayed = false;

  showDialog$ = new BehaviorSubject(false);
  svg$ = new BehaviorSubject<string>("");
  reactionSitesOptions$ = new BehaviorSubject<any[]>([]);
  svgSetupNeeded$ = new BehaviorSubject<boolean>(true);

  selectedReactionSiteIndex$ = combineLatest([
    this.reactionSitesOptions$,
    this.formGroup.controls['reactionSite'].valueChanges,
  ]).pipe(
    map(([options, v]) => options.findIndex((option) => option.value === v))
  )

  reactionSiteSvgs$ = combineLatest([
    this.svg$,
    this.reactionSitesOptions$,
  ]).pipe(
    filter(([svg, options]) => svg !== "" && options.length > 0),
    map(([svg, options]) => options.map((option, i) => {
      const newElement = document.createElement('div');
      newElement.innerHTML = svg;

      const svgEl = newElement.querySelector('svg')!;
      svgEl.setAttribute('width', '200px');
      svgEl.setAttribute('height', '125px');

      const highlights = newElement.querySelectorAll('ellipse');
      highlights.forEach((highlight) => {
        highlight.removeAttribute('style');
        highlight.setAttribute('fill', '#00000000');
      });

      const theHighlight = newElement.querySelector(`ellipse.atom-${option.value}`);
      theHighlight?.setAttribute('fill', this.colors[i % this.colors.length]);

      return {
        ...option,
        svg: newElement.innerHTML,
      };
    }))
  )

  constructor(
    private somnService: SomnService,
  ) {
    this.formGroup.statusChanges.subscribe((v) => {
      if (v === 'VALID') {
        this.valueChange.emit(this.formGroup.value as ReactionSiteInput); 
      } 

      else if (v === 'INVALID') {
        this.valueChange.emit({ smiles: "", reactionSite: 0 });
      }

      this.doNotSyncValue = true;
    });
  }

  validate(control: AbstractControl<any, any>): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> {
    return control.valueChanges.pipe(
      debounceTime(1000),
      switchMap((v) => this.somnService.checkReactionSites(v, this.type)),
      tap((resp) => { 
        const reactionSitesOptions: any[] = [];
        resp.reaction_site_idxes.forEach((atomIdx, i) => {
          reactionSitesOptions.push({
            label: `${i}`,
            value: atomIdx
          });
        });
        
        if (resp.reaction_site_idxes.length == 1) {
          const container = document.createElement('div');
          container.innerHTML = resp.svg;
          container.querySelectorAll('ellipse').forEach((el) => {el.remove()});
          this.formGroup.controls['reactionSite'].setValue("-");
          this.svg$.next(container.innerHTML);

        } else {
          this.formGroup.controls['reactionSite'].setValue(null);
          this.reactionSitesOptions$.next(reactionSitesOptions);
          this.svg$.next(resp.svg);
        }
      }),
      map((resp) => {
        // I have no idea why return of(null) does not work here,
        // however putting everything in catchError works
        if (!resp.reaction_site_idxes.length) {
          throw new Error('No reaction sites found');;
        }
        throw new Error('good');
      }),
      catchError((e) => {
        switch (e.message) {
          case 'No reaction sites found':
            return of({ noReactionSitesFound: true });

          case 'Chemical not supported':
            return of({ chemicalNotSupported: true });

          case 'good':
            return of(null);

          default:
            return of({ invalidUserInput: true })
        }
      }),
    );
  }
}
