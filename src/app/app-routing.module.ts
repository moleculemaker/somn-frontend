import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { LandingPageComponent } from "./components/landing-page/landing-page.component";
import { AboutSomnComponent } from "./components/somn/about-somn/about-somn.component";

const routes: Routes = [
  // { path: "", redirectTo: "", pathMatch: "full" },
  { path: "about", component: AboutSomnComponent },
  { path: "", component: LandingPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
