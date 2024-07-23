import { Injectable } from '@angular/core';
import { Driver, driver } from 'driver.js';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TutorialService {
  public driver: Driver = driver();
  public tutorialKey = '';
  public onStart = () => {
    this.driver.drive();
  };

  get showTutorial() {
    return localStorage.getItem(this.tutorialKey) === 'true';
  }

  set showTutorial(value) {
    localStorage.setItem(this.tutorialKey, value.toString());
  }

  constructor() {}

  start() { 
    this.onStart();
  }
}
