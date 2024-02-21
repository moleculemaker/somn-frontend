/**
 * This service enables the tracking of user activity within the application.
 * 
 * The current implementation uses Matomo. While the @ngx-matomo library offers
 * ways to track activity directly from component templates, we're adding this
 * wrapper in case we later replace Matomo.
 *
 * Note automatic tracking of route changes is already enabled in AppModule.
 */
import { Injectable } from '@angular/core';
import { MatomoTracker } from '@ngx-matomo/tracker';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {

  constructor(
    private readonly tracker: MatomoTracker
  ) { }

  trackPasteData(numSequences: number): void {
    this.tracker.trackEvent('Configuration', 'Paste data', 'Number of sequences', numSequences);
  }

  trackValidationWarning(message: string): void {
    this.tracker.trackEvent('Configuration', 'Validation warning', message);
  }

  trackValidationError(message: string): void {
    this.tracker.trackEvent('Configuration', 'Validation error', message);
  }

  trackSelectExampleData(exampleDataSet: string): void {
    this.tracker.trackEvent('Configuration', 'Select example data', exampleDataSet);
  }
}

