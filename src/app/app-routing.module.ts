import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { LandingPageComponent } from "./components/landing-page/landing-page.component";
import { AboutSomnComponent } from "./components/somn/about-somn/about-somn.component";
import { SomnComponent } from "./components/somn/somn/somn.component";

const routes: Routes = [
  // { path: "", redirectTo: "", pathMatch: "full" },
  { path: "about", component: AboutSomnComponent },
  { path: "", component: LandingPageComponent },
  { path: "somn", component: SomnComponent, data: { activeTab: 0 } },
  { path: "somn/result/:id", component: SomnComponent, data: { activeTab: 1 } },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
