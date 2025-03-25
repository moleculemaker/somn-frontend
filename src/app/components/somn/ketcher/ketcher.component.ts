import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BehaviorSubject, combineLatest, filter, interval, map, shareReplay, take, takeWhile, tap } from 'rxjs';

@Component({
  selector: 'app-ketcher',
  template: `
<iframe 
  id="ketcher-iframe"
  [src]="ketcherUrl" 
  frameBorder="0"
  class="p-0 m-0 w-full h-full">
</iframe>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: KetcherComponent,
      multi: true
    }
  ],
})
export class KetcherComponent implements ControlValueAccessor {
  @Input() set smiles(value: string) {
    this.inputSmiles$.next(value);
  }

  get smiles() {
    return this.inputSmiles$.value;
  }

  @Output() smilesChange = new EventEmitter<string>();

  ketcherUrl: SafeResourceUrl;

  private inputSmiles$ = new BehaviorSubject<string>('');

  private onTouched = () => { };
  private onChange = (s: string | undefined) => { };

  private ketcherInstance$ = interval(500).pipe(
    map(() => {
      const iframe: HTMLIFrameElement = document.querySelector('#ketcher-iframe')!;
      return (iframe.contentWindow as any).ketcher;
    }),
    takeWhile(instance => !instance, true),
    filter(instance => !!instance),
    tap(() => console.log('ketcher instance ready')),
    take(1),
    shareReplay(1),
  );

  constructor(private sanitizer: DomSanitizer) {
    combineLatest([
      this.inputSmiles$, 
      this.ketcherInstance$
    ]).subscribe(([inputSmiles, instance]) => {
      instance.getSmiles().then((outputSmiles: string) => {
        if (outputSmiles !== inputSmiles) {
          instance.setMolecule(inputSmiles || '');
        }
      });
    });

    this.ketcherInstance$.subscribe(instance => {
      instance.editor.subscribe('change', () => {
        instance.getSmiles()
          .then((outputSmiles: string) => {
            if (outputSmiles !== this.smiles) {
              this.onChange(outputSmiles);
              this.onTouched();
              this.smilesChange.emit(outputSmiles);
            }
          })
          .catch((error: any) => {
            console.error('Error getting SMILES:', error);
          });
      });
    });
  }

  ngOnInit() {
    // You can host a standalone Ketcher instance or use a CDN
    const url = '/ketcher';
    this.ketcherUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // connect ngModel to inputSmiles$
  writeValue(val: string): void {
    this.inputSmiles$.next(val);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(): void {
    // not supported
  }
}