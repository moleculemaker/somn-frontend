import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { LandingPageComponent } from "./components/landing-page/landing-page.component";
import { AboutSomnComponent } from "./components/somn/about-somn/about-somn.component";
import { SomnComponent } from "./components/somn/somn/somn.component";
import { MainLayoutComponent } from "./components/somn/main-layout/main-layout.component";
import { SomnResultComponent } from "./components/somn/somn-result/somn-result.component";
import { CenterLayoutComponent } from "./components/somn/center-layout/center-layout.component";

const routes: Routes = [
  {
    path: "",
    component: CenterLayoutComponent,
    children: [
      { path: "about", component: AboutSomnComponent },
      { path: "", pathMatch: "full", redirectTo: "home" },
      { path: "results/:id", redirectTo: "somn/result/:id" },
      {
        path: "somn",
        component: MainLayoutComponent,
        children: [
          { path: "", component: SomnComponent },
          { path: "result/:id", component: SomnResultComponent }
        ]
      },
      { path: "home", component: LandingPageComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
