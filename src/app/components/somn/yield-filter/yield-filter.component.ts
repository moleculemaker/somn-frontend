import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { BehaviorSubject } from 'rxjs';
import { Product } from '~/app/services/somn.service';

@Component({
  selector: 'app-yield-filter',
  templateUrl: './yield-filter.component.html',
  styleUrls: ['./yield-filter.component.scss']
})
export class YieldFilterComponent {
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

  onClickClear() {
    this.filter.hide();
  }

  onClickApply() {
    this.selectedYieldChange.emit(this.yield$.value);
    this.filter.hide();
  }
}
