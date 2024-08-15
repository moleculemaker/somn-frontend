import { Injectable } from '@angular/core';
import { Config, Driver, driver, PopoverDOM, State,  } from 'driver.js';
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

  constructor() {
    this.driver.setConfig({ 
      showProgress: true,
      onPopoverRender: (
        popover: PopoverDOM, 
        opts: { 
          config: Config, 
          state: State
        }) => {
          const container = document.createElement('div');

          const nextBtn = document.createElement('button');
          nextBtn.innerHTML = this.driver.isLastStep() ? 'Done' : 'Next';
          nextBtn.onclick = this.driver.moveNext;
          nextBtn.className = 'btn-popover btn-popover-next';

          const prevBtn = document.createElement('button');
          prevBtn.innerHTML = 'Back';
          prevBtn.onclick = this.driver.movePrevious;
          prevBtn.disabled = this.driver.isFirstStep();
          prevBtn.className = 'btn-popover btn-popover-prev';

          const stepText = document.createElement('span');
          stepText.innerHTML = `${opts.state.activeIndex! + 1} of ${opts.config.steps?.length}`;

          container.appendChild(prevBtn);
          container.appendChild(stepText);
          container.appendChild(nextBtn);

          container.className = 'flex items-center justify-between w-full';

          popover.footer.innerHTML = '';
          popover.footer.appendChild(container);
        },
    });
  }

  start() { 
    this.onStart();
  }
}
