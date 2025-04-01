import { Component, OnInit, ViewChild } from "@angular/core";
import { UserInfoService } from "./services/userinfo.service";
import { MenuItem } from "primeng/api";
import { TutorialService } from "./services/tutorial.service";
import { Tooltip } from "primeng/tooltip";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  emailstring: string =
    "mailto:somn-feedback@moleculemaker.org?Subject=User feedback for Somn";
  showCite: boolean = false;

  showComingSoonPopup: boolean = false;
  comingSoonTimerID: number | null = null;
  autocloseComingSoonPopup: boolean = true;

  @ViewChild(Tooltip) tooltip: Tooltip;

  get userMenuItems(): Array<MenuItem> {
    return this.userInfo
      ? [
          {
            label: "Sign Out",
            icon: "pi pi-fw pi-sign-out",
            command: () => this.logout(),
          },
        ]
      : [];
  }

  get tutorialMenuItems(): Array<MenuItem> {
    return [
      {
        label: "Interactive Walkthrough",
        command: () => {
          this.tutorialService.driver.getConfig().steps?.length 
          ? this.tutorialService.start() 
          : this.tooltip.activate();
        },
      },
      {
        label: "Video Demo",
        icon: "pi pi-arrow-up-right",
        command: () => window.open("https://youtu.be/eQ2N8R1p3zU", "_blank"),
      },
    ];
  }

  get userInfo() {
    return this.userInfoService.userInfo;
  }

  constructor(
    private userInfoService: UserInfoService,
    protected tutorialService: TutorialService
  ) {}

  ngOnInit() {
    this.userInfoService.fetchUserInfo();
    this.comingSoonTimerID = setTimeout(() => {
      this.toggleComingSoonPopup();
    }, 2000);
  }

  citeButton() {
    this.showCite = !this.showCite;
  }

  toggleComingSoonPopup() {
    this.showComingSoonPopup = !this.showComingSoonPopup;

    if (this.comingSoonTimerID) {
      clearTimeout(this.comingSoonTimerID);
    }

    if (this.autocloseComingSoonPopup) {
      this.autocloseComingSoonPopup = false;

      this.comingSoonTimerID = setTimeout(() => {
        this.toggleComingSoonPopup();
      }, 8000);
    }
  }

  login() {
    this.userInfoService.login();
  }

  logout() {
    this.userInfoService.logout();
  }
}
