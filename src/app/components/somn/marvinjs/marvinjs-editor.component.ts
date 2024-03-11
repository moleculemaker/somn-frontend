import {
  AfterContentInit,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { ReplaySubject, Subscription, take } from "rxjs";
import { MarvinJSUtilInstance, Sketch } from "./index";

export type onChangeFunc<T> = (newValue: T) => void;
export type onTouchedFunc = () => void;

declare let MarvinJSUtil: MarvinJSUtilInstance;

@Component({
  selector: 'app-marvin-js-editor',
  template: '<iframe id="sketch" src="/demo.html" height="100%" width="100%" style="border: 0; padding: 0; margin: 0"></iframe>',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi:true,
      useExisting: MarvinJsEditorComponent
    }
  ]
})
export class MarvinJsEditorComponent implements ControlValueAccessor, AfterContentInit {
  @Input()
  smiles = '';
  @Output()
  smilesChange = new EventEmitter<string>();

  sketcherInstance$ = new ReplaySubject<Sketch>(1);

  private onTouched: onTouchedFunc = () => {};
  private onChange: onChangeFunc<string | undefined> = s => {};

  private isTouched = false;
  private sub: Subscription;

  ngAfterContentInit(): void {
    // Short delay for the iframe to render
    setTimeout(() => {
      this.grabSketcherInstance().then(() => {
        console.log('init SMILES in editor: ', this.smiles);
        this.sketcherInstance$.pipe(
          take(1)
        ).subscribe(sketcherInstance => {
          if (this.smiles) {
            sketcherInstance?.importStructure('auto', this.smiles).then();
          } else {
            sketcherInstance?.clear();
          }
        });
      });
    }, 2000);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  writeValue(val: string): void {
    this.sub = this.sketcherInstance$.subscribe(sketcherInstance => {
      if (val) {
        sketcherInstance?.importStructure('mol', val).then();
      } else {
        sketcherInstance?.clear();
      }
    });
  }

  markAsTouched(): void {
    if (!this.isTouched) {
      this.onTouched();
      this.isTouched = true;
    }
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


  getWebServices(base: string = 'http://localhost:8080') {
    const services = {
      "clean2dws" : base + "/rest-v1/util/convert/clean",
      "clean3dws" : base + "/rest-v1/util/convert/clean",
      "molconvertws" : base + "/rest-v1/util/calculate/molExport",
      "stereoinfows" : base + "/rest-v1/util/calculate/cipStereoInfo",
      "reactionconvertws" : base + "/rest-v1/util/calculate/reactionExport",
      "hydrogenizews" : base + "/rest-v1/util/convert/hydrogenizer",
      "automapperws" : base + "/rest-v1/util/convert/reactionConverter",
      "aromatizews" : base + "/rest-v1/util/calculate/molExport"
    };
    return services;
  }

  grabSketcherInstance(): Promise<void> {
    return MarvinJSUtil.getEditor('sketch').catch(err => {
      console.error('Sketcher not yet ready! ', err);
      // try again in 100ms when the first attempt was too early
      setTimeout(() => {
        this.grabSketcherInstance();
      }, 100);
    }).then(
      (sketcherInstance: any) => {
        this.sketcherInstance$.next(sketcherInstance);
        sketcherInstance.on('molchange', async () => {
          this.markAsTouched();
          const smiles = sketcherInstance.isEmpty()
            ? ''
            : await sketcherInstance.exportStructure('smiles');
          this.smilesChange.emit(this.smiles = smiles);
          this.onChange(this.smiles);
        });
        return sketcherInstance;
      },
      (err) => {
        console.error('Sketcher not yet ready! ', err);
        // try again in 100ms when the first attempt was too early
        setTimeout(() => {
          this.grabSketcherInstance();
        }, 100);
      }
    );
  }
}
