import { Component } from '@angular/core';

@Component({
  selector: 'app-center-layout',
  templateUrl: './center-layout.component.html',
  styleUrls: ['./center-layout.component.scss'],
  host: {
    class: 'grow flex flex-col justify-center'
  }
})
export class CenterLayoutComponent {

}
