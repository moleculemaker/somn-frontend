import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { Driver, driver } from "driver.js";
import { ConfirmationService } from "primeng/api";
import { TutorialService } from "~/app/services/tutorial.service";

@Component({
  selector: "landing-page",
  templateUrl: "./landing-page.component.html",
  styleUrls: ["./landing-page.component.scss"],
})
export class LandingPageComponent {
  displayTutorial: boolean = true;

  constructor(
    protected tutorialService: TutorialService,
  ) {
    tutorialService.tutorialKey = 'show-landing-page-tutorial';
    if (!tutorialService.showTutorial) {
      this.displayTutorial = true;
    } else {
      this.displayTutorial = false;
    }

    tutorialService.onStart = () => {
      this.displayTutorial = true;
    };

    tutorialService.driver.setSteps([
      {
        element: '.login_button',
        popover: {
          title: 'My Account',
          description: 'Log in or sign up for an account to access your profile and settings',
          side: 'bottom',
          align: 'end'
        }
      },
      {
        element: "#btn-about-somn",
        popover: {
          title: "About Somn",
          description: 'Learn about the model, access training data, Github public code repository, and publications.',
          side: "bottom",
          align: "end"
        }
      },
      {
        element: '#container-somn-workflow',
        popover: {
          title: "Somn Workflow",
          description: 'Learn about what to expect as you navigate through the Somn tool and workflow.',
          side: "top",
          align: "center"
        }
      },
      {
        element: '#btn-start-using-somn',
        popover: {
          title: "Start Using Somn",
          description: 'Enter the Somn tool to begin configuring your job request.',
          side: "top",
          align: "center"
        }
      }
    ]);
  }
}
