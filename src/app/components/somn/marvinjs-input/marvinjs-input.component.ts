import { Component, ElementRef, Input, ViewChild, forwardRef } from "@angular/core";
import { AbstractControl, AsyncValidator, ControlValueAccessor, NG_ASYNC_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors } from "@angular/forms";
import { SafeHtml } from "@angular/platform-browser";
import { BehaviorSubject, Observable, catchError, combineLatest, debounceTime, filter, interval, map, of, skipUntil, switchMap, take, takeUntil, tap, timer } from "rxjs";
import { SomnService } from "~/app/services/somn.service";

import * as d3 from "d3";

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
export class MarvinjsInputComponent implements ControlValueAccessor, AsyncValidator {
  @Input() placeholder: string = "";
  @Input() type: string = '';
  @Input() errors: ValidationErrors | null;
  @Input() dirty: boolean = false;
  @ViewChild('svgContainer') svgContainer: ElementRef<HTMLDivElement>;

  _value = "";
  get value() {
    return this._value;
  }
  set value(value: string) {
    this._value = value;
    this.onChange(value);
    this.onTouched();
  }

  _smiles = "";
  get smiles() {
    return this._smiles;
  }

  set smiles(value: string) {
    this._smiles = value;
    if (this.value !== value) {
      this.value = value;
    }
  }

  isInfo = false;
  colors = ['#DDCC7780', '#33228880', '#CC667780', '#AADDCC80', '#66332280']

  showDialog$ = new BehaviorSubject(false);
  svg$ = new BehaviorSubject<string>("");
  reactionSitesOptions$ = new BehaviorSubject<any[]>([]);
  selectedReactionSite$ = new BehaviorSubject<number>(0);
  svgSetupNeeded$ = new BehaviorSubject<boolean>(true);

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
      theHighlight?.setAttribute('rx', '20');
      theHighlight?.setAttribute('ry', '20');
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
    interval(1000)
      .pipe(takeUntil(this.svgSetupNeeded$.pipe(filter((v) => !v))))
      .subscribe(() => {
        if (this.svgContainer && this.svgContainer.nativeElement.innerHTML !== "") {
          const svg = this.svgContainer.nativeElement.querySelector('svg');
          const ellipses = d3.select(svg).selectAll('ellipse');
          const colors = ['#DDCC7780', '#33228880', '#CC667780', '#AADDCC80', '#66332280'];

          if (ellipses.size() <= 1) {
            return;
          }

          ellipses.each((d, i, nodes) => {
            const node = d3.select(nodes[i]);
            node
              .attr('style', 'cursor: pointer;')
              .attr('rx', 12)
              .attr('ry', 12)
              .attr('fill', colors[i % colors.length]);
          });

          ellipses.on('click', (e, d) => {
            const className = e.target.getAttribute('class');
            const data = className.split('atom-')[1];
            this.selectedReactionSite$.next(parseInt(data));
          });
          
          this.svgSetupNeeded$.next(false);
        }
      });

    this.selectedReactionSite$.subscribe((idx) => {
      if (this.svgContainer && this.svgContainer.nativeElement.innerHTML !== "") {
        const svg = this.svgContainer.nativeElement.querySelector('svg');
        const ellipses = d3.select(svg).selectAll('ellipse');

        if (ellipses.size() <= 1) {
          return;
        }

        ellipses.each((d, i, nodes) => {
          const node = d3.select(nodes[i]);
          const className = node.attr('class');
          const data = parseInt(className.split('atom-')[1]);

          node
            .attr('data-idx', data)
            .attr('style', 'cursor: pointer;')
            .attr('rx', 12)
            .attr('ry', 12)
            .attr('fill', idx === data ? this.colors[i % this.colors.length] : '#5F6C8D40');
        });

        ellipses.on('click', (e) => {
          const data = e.target.getAttribute('data-idx');
          this.selectedReactionSite$.next(parseInt(data));
        });
        
        this.svgSetupNeeded$.next(false);
      }
    });
  }
  
  /* -------------------------------------------------------------------------- */
  /*                      Control Value Accessor Interface                      */
  /* -------------------------------------------------------------------------- */
  disabled = false;
  onChange = (value: string) => {};
  onTouched = () => {};

  writeValue(obj: string): void {
    this.value = obj;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /* -------------------------------------------------------------------------- */
  /*                          Async Validator Interface                         */
  /* -------------------------------------------------------------------------- */
  onValidatorChange = () => {};

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
        console.log(resp.svg);
        this.svgSetupNeeded$.next(true);
        this.reactionSitesOptions$.next(reactionSitesOptions);
        this.svg$.next(resp.svg);
      }),
      catchError((e) => {
        return of({ chemicalNotSupported: true });
      }),
      take(1),
    );
  }

  registerOnValidatorChange?(fn: () => void): void {
    this.onValidatorChange = fn;
  }
}
