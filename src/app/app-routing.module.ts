import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ConfigurationComponent } from './components/chemscraper/configuration/configuration.component';
import { ResultsComponent } from './components/chemscraper/results/results.component';

import { LandingPageComponent } from './components/landing-page/landing-page.component';

const routes: Routes = [
  { path: 'configuration', component: ConfigurationComponent },
  { path: 'results', component: ResultsComponent },
  { path: 'results/:id', component: ResultsComponent },
  { path: '', redirectTo: 'configuration', pathMatch: 'full' }
  // { path: '', component: LandingPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
