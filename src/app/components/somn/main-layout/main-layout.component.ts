import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  host: {
    class: "grow"
  }
})
export class MainLayoutComponent implements OnInit {
  jobId = this.router.url.split('somn/result/').length > 1 
    ? this.router.url.split('somn/result/')[this.router.url.split('somn/result/').length - 1]
    : null;
  tabs: MenuItem[] = [
    { label: "Request Configuration" },
    { label: "Model Results", disabled: !this.jobId },
  ];
  activeTab$ = new BehaviorSubject(this.tabs[0]);
  menuChanged = true;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.router.url.includes('/somn/result')) {
      this.updateTab(this.tabs[1]);
    }
  }

  onActiveTabChange(tab: MenuItem) {
    if (tab.label === this.tabs[0].label) {
      if (this.jobId) {
        window.open(this.router.url.replace(/result\/.*/g, ''), '_blank');
        // TODO: update tab display, primeNG bug
        // this.updateTab(this.tabs[1]);
      }
    } else if (tab.label === this.tabs[1].label) {
      if (this.jobId) {
        this.router.navigate(['somn', 'result', this.jobId]);
        this.updateTab(this.tabs[1]);
      } else {
        this.updateTab(this.tabs[0]);
      }
    }
  }

  private updateTab(tab: MenuItem) {
    this.menuChanged = false;
    this.activeTab$.next(tab);
    setTimeout(() => {
      this.menuChanged = true;
    }, 200);
  }
}
