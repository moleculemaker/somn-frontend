import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from "@angular/core";
import { Router } from "@angular/router";
import { SomnRequest, SomnService } from "~/app/services/somn.service";
import { TutorialService } from "~/app/services/tutorial.service";
import tutorialJson from './tutorial.json'
import { CheckReactionSiteRequest, CheckReactionSiteResponse } from "~/app/api/mmli-backend/v1";
import { combineLatest, forkJoin, Observable, Subscription } from "rxjs";

@Component({
  selector: "app-somn",
  templateUrl: "./somn.component.html",
  styleUrls: ["./somn.component.scss"],
  host: {
    class: "flex flex-col grow",
  },
})
export class SomnComponent implements OnDestroy {
  @Input() showTab: boolean = true;
  @Input() formValue: any;

  readonly CheckReactionSiteRequest = CheckReactionSiteRequest;

  request = this.somnService.newRequest();
  displayTutorial: boolean = true;
  displayHeavyAtomsDialog: boolean = false;
  arylHalideHasHeavyAtoms: boolean = false;
  amineHasHeavyAtoms: boolean = false;

  subscriptions: Subscription[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formValue'] && changes['formValue'].currentValue) {
      console.log('formValue: ', changes['formValue'].currentValue);
      const formValue = changes['formValue'].currentValue;
      const rpForms = formValue.map((rp: any) => ({
        reactantPairName: rp.reactant_pair_name,
          amineName: rp.nuc_name,
          amine: {
            input: rp.nuc,
            input_type: rp.nuc_input_type,
            reactionSite: rp.nuc_idx,
          },
          arylHalideName: rp.el_name,
          arylHalide: {
            input: rp.el,
            input_type: rp.el_input_type,
            reactionSite: rp.el_idx,
          },
          status: 'view',
      }));

      const svg$: Observable<{ 
        amine: CheckReactionSiteResponse, 
        arylHalide: CheckReactionSiteResponse 
      }>[] = rpForms.map((rp: any) => forkJoin({
        amine: this.somnService.checkReactionSites(rp.amine.input, rp.amine.input_type, CheckReactionSiteRequest.RoleEnum.Nuc),
        arylHalide: this.somnService.checkReactionSites(rp.arylHalide.input, rp.arylHalide.input_type, CheckReactionSiteRequest.RoleEnum.El),
      }));

      const subscription = combineLatest(svg$).subscribe((results) => {
        results.forEach(({ amine, arylHalide }, i) => {
          rpForms[i].amine = { ...rpForms[i].amine, ...amine };
          rpForms[i].arylHalide = { ...rpForms[i].arylHalide, ...arylHalide };
        });

        rpForms.forEach((rp: any, i: number) => {
          this.request.addReactantPair();
          this.request.form.controls['reactantPairs'].at(i).patchValue(rp);
        });
      });

      this.subscriptions.push(subscription);
    }
  }

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
        element: '#container-manage-reactant-pairs',
        popover: {
          title: "Manage Reactant Pairs",
          description: 'Add a new reactant pair or clear all input reactant pairs.',
          side: "bottom",
          align: "center",
        },
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

    this.request.form.statusChanges.subscribe(() => {
      console.log(
        'form: ', this.request.form.value,
        '\nstatus: ', this.request.form.status,
        '\nerrors: ', this.request.form.errors
      );
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
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
      if (this.router.url.search(/\/.*\/result\//) !== -1) {
        window.open(
          this.router.url.replace(/\/result\/.*/g, `/result/${response.job_id}`), 
          '_blank'
        );
      } else {
        this.router.navigate(['somn', 'result', response.job_id]);
      }
    })
  }
}
