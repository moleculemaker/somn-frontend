import {APP_INITIALIZER, NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PanelModule } from 'primeng/panel';
import { PrimeIcons} from 'primeng/api';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { StepsModule } from 'primeng/steps';
import { TableModule } from 'primeng/table';
import { FileUploadModule } from 'primeng/fileupload';
import { MessagesModule } from 'primeng/messages';
import { DropdownModule } from 'primeng/dropdown';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ListboxModule } from 'primeng/listbox';
import { InputTextModule } from 'primeng/inputtext';
import { SidebarModule } from 'primeng/sidebar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';

import { LandingPageComponent} from './components/landing-page/landing-page.component';

import { ConfigurationComponent} from './components/chemscraper/configuration/configuration.component';
import { ResultsComponent } from './components/chemscraper/results/results.component';

import { ChemScraperService } from './chemscraper.service';
import { HttpClientModule } from '@angular/common/http';
import { NgxMatomoTrackerModule } from '@ngx-matomo/tracker';
import { NgxMatomoRouterModule } from '@ngx-matomo/router';
import { FileDragNDropDirective } from './components/chemscraper/configuration/file-drag-n-drop.directive';
import { PdfViewerComponent } from './components/chemscraper/pdf-viewer/pdf-viewer.component';
import { PdfViewerDialogServiceComponent } from './components/chemscraper/pdf-viewer-dialog-service/pdf-viewer-dialog-service.component';

import { EnvironmentService } from "@services/environment.service";
import { MenuModule } from "primeng/menu";
import { MarvinJsModule } from "./components/chemscraper/marvinjs/marvinjs.module";
import { DialogModule } from "primeng/dialog";
import { ExportMenuComponent } from './components/chemscraper/results/export-menu/export-menu.component';
import { PdfContextViewerComponent } from './components/chemscraper/results/pdf-context-viewer/pdf-context-viewer.component';

import { ApiModule, Configuration } from "@api/mmli-backend/v1";
import { SafePipe } from "./pipes/safe.pipe";

const initAppFn = (envService: EnvironmentService) => {
  return () => envService.loadEnvConfig('/assets/config/envvars.json');
};


@NgModule({
  declarations: [
    AppComponent,
    SafePipe,

    LandingPageComponent,
    FileDragNDropDirective,
    ConfigurationComponent,
    ResultsComponent,
    PdfViewerComponent,
    PdfViewerDialogServiceComponent,
    ExportMenuComponent,
    PdfContextViewerComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    MessagesModule,
    ButtonModule,
    InputTextareaModule,
    PanelModule,
    ProgressBarModule,
    SelectButtonModule,
    SkeletonModule,
    ProgressSpinnerModule,
    StepsModule,
    DropdownModule,
    TableModule,
    InputTextModule,
    ListboxModule,
    OverlayPanelModule,
    SidebarModule,
    RadioButtonModule,
    CheckboxModule,
    FileUploadModule,
    PanelModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NgxMatomoTrackerModule.forRoot({
      siteId: 5,
      trackerUrl: 'https://matomo.mmli1.ncsa.illinois.edu/'
    }),
    NgxMatomoRouterModule,
    MenuModule,

    ApiModule.forRoot(() => new Configuration()),
    ReactiveFormsModule,
    MarvinJsModule,
    DialogModule
  ],
  providers: [
    ChemScraperService,
    EnvironmentService,
    {
      provide: APP_INITIALIZER,
      useFactory: initAppFn,
      multi: true,
      deps: [EnvironmentService],
    },],
  bootstrap: [AppComponent]
})
export class AppModule { }
