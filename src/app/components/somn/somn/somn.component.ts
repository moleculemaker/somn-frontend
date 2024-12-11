import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { SomnRequest, SomnService } from "~/app/services/somn.service";
import { TutorialService } from "~/app/services/tutorial.service";
import { ReactionSiteInput } from "../marvinjs-input/marvinjs-input.component";
import tutorialJson from './tutorial.json'
import { CheckReactionSiteRequest } from "~/app/api/mmli-backend/v1";

@Component({
  selector: "app-somn",
  templateUrl: "./somn.component.html",
  styleUrls: ["./somn.component.scss"],
  host: {
    class: "flex grow",
  },
})
export class SomnComponent {

  readonly CheckReactionSiteRequest = CheckReactionSiteRequest;

  request = this.somnService.newRequest();
  displayTutorial: boolean = true;
  displayHeavyAtomsDialog: boolean = false;
  arylHalideHasHeavyAtoms: boolean = false;
  amineHasHeavyAtoms: boolean = false;

  constructor(
    private somnService: SomnService,
    private router: Router,
    protected tutorialService: TutorialService,
  ) {
    tutorialService.tutorialKey = 'configuration-page-tutorial';
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
        element: '#btn-use-example',
        popover: {
          title: 'Input Options',
          description: 'Start from an example or add your own reactant pair.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: "#input-name-reactant-pair",
        popover: {
          title: "Reactant Pair Name",
          description: 'Enter a name for your reactant pair. This will help you distinguish between reactant pair results if you run more than one job using Somn.',
          side: "top",
          align: "center",
        }
      },
      {
        element: '#input-reactants',
        popover: {
          title: "Enter Reactants",
          description: 'Name your reactants and add structures by inputting a SMILES string or by drawing or uploading a structure in another format (e.g., CXDML, InChI, SMARTS, etc.).',
          side: "top",
          align: "center",
          popoverClass: '!w-[520px] !max-w-[520px]',
          onPopoverRender: (popover, options) => {
            if (options.config.onPopoverRender) {
              options.config.onPopoverRender(popover, options);
            }
            
            const descriptionDOM = popover.description;
            descriptionDOM.innerHTML = tutorialJson['input-reactants'];
          }
        },
      },
      {
        popover: {
          title: "Reaction Sites",
          description: 'Reactants with multiple reaction site will require you to specify the intended reaction site using the dropdown menu provided.',
          popoverClass: '!w-[520px] !max-w-[520px]',
          onPopoverRender: (popover, options) => {
            if (options.config.onPopoverRender) {
              options.config.onPopoverRender(popover, options);
            }

            const descriptionDOM = popover.description;
            descriptionDOM.innerHTML = tutorialJson['reaction-sites'];
          }
        }
      },
      {
        element: '#input-subscription-email',
        popover: {
          title: "Email",
          description: 'Add your email if you’d like to receive a notification when your results are ready. You’ll also have the option to add your email after submitting your job.',
          side: "top",
          align: "center"
        }
      },
      {
        element: '#btn-use-somn',
        popover: {
          title: "Analyze Using Somn",
          description: 'When you’re finished configuring your request, submit your job for analysis.',
          side: "top",
          align: "center"
        }
      }
    ]);
  }

  useExample() {
    this.request.useExample();
  }

  onSubmit(request: SomnRequest) {
    if (!this.request.form.valid) {
      return;
    }

    if (this.arylHalideHasHeavyAtoms || this.amineHasHeavyAtoms) {
      this.displayHeavyAtomsDialog = true;
      return;
    }

    this.submitJob();
  }

  submitJob() {
    this.somnService.createJobAndRunSomn(
      this.request.toRequestBody()
    ).subscribe((response) => {
      this.router.navigate(['somn', 'result', response.job_id]);
    })
  }

  onReactionSiteChange(controlName: 'amine' | 'arylHalide', value: ReactionSiteInput) {
    this.request.form.controls[controlName].setValue(value);
    this.request.form.updateValueAndValidity();
  }
}
