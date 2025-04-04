import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { BehaviorSubject } from 'rxjs';
import { Product } from '~/app/services/somn.service';

@Component({
  selector: 'app-yield-filter',
  templateUrl: './yield-filter.component.html',
  styleUrls: ['./yield-filter.component.scss']
})
export class YieldFilterComponent implements OnChanges {
  @Input() originalData: Product[] = [];
  
  data$ = new BehaviorSubject<Product[]>([]);
  @Input() set data(value: Product[]) {
    this.data$.next(value);
  }

  yield$ = new BehaviorSubject<[number, number]>([0, 100]);
  @Input() set selectedYield(value: [number, number]) {
    if (value[0] !== this.yield$.value[0] || value[1] !== this.yield$.value[1]) {
      this.yield$.next(value);
    }
  }

  @Output() selectedYieldChange = new EventEmitter<[number, number]>();
  @ViewChild('filter') filter: OverlayPanel;

  minRange = 0;
  maxRange = 100;

  popupDisplayed = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes["originalData"]) {
      this.minRange = Math.floor(Math.min(...this.originalData.map((d) => d["yield"] * 100)));
      this.maxRange = Math.ceil(Math.max(...this.originalData.map((d) => d["yield"] * 100)));
    }
  }

  onClickClear() {
    this.yield$.next([this.minRange, this.maxRange]);
    this.selectedYieldChange.emit(this.yield$.value);
    this.filter.hide();
  }

  onClickApply() {
    this.selectedYieldChange.emit(this.yield$.value);
    this.filter.hide();
  }
}
