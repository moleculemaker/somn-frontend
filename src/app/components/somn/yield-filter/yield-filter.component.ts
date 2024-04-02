import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { BehaviorSubject } from 'rxjs';
import { Products } from '~/app/services/somn.service';

@Component({
  selector: 'app-yield-filter',
  templateUrl: './yield-filter.component.html',
  styleUrls: ['./yield-filter.component.scss']
})
export class YieldFilterComponent {
  data$ = new BehaviorSubject<Products>([]);
  @Input() set data(value: Products) {
    this.data$.next(value);
  }
  @Input() selectedYield: [number, number] = [0, 100];
  @Output() selectedYieldChange = new EventEmitter<[number, number]>();
  @ViewChild('filter') filter: OverlayPanel;

  yield$ = new BehaviorSubject<[number, number]>([0, 100]);

  onClickClear() {
    this.filter.hide();
  }

  onClickApply() {
    this.selectedYieldChange.emit(this.yield$.value);
    this.filter.hide();
  }
}
