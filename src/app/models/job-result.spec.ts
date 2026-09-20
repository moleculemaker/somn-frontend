import { fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';

import { JobResult } from './job-result';
import { JobStatus, JobType } from '~/app/api/mmli-backend/v1';

/**
 * The polling lifecycle: one shared poll, the result fetched exactly once when the
 * job completes, loading left up on error so <app-loading> can show its error state.
 */
const DELAY_MS = 0; // the delay() applied to the result in jobResultResponse$

function makeJobResult(statuses: { phase: JobStatus }[], resultValue: any = []) {
  let call = 0;
  const service: any = {
    getResultStatus: jasmine.createSpy('getResultStatus')
      .and.callFake(() => of({ job_info: JSON.stringify({ el_name_map: {}, nuc_name_map: {}, info: [] }), ...statuses[Math.min(call++, statuses.length - 1)] })),
    getResult: jasmine.createSpy('getResult').and.returnValue(of(resultValue)),
  };
  const jr = new JobResult(service);
  jr.jobType = 'test' as JobType;
  jr.jobId = 'job-1';
  return { jr, service };
}

describe('JobResult polling lifecycle', () => {
  it('clears loading and fetches the result exactly once when the job completes', fakeAsync(() => {
    const { jr, service } = makeJobResult([{ phase: JobStatus.Processing }, { phase: JobStatus.Completed }]);
    let loading = true;
    jr.isLoading$.subscribe((v) => (loading = v));
    jr.jobResultResponse$.subscribe();

    tick(0);       // poll 1: processing
    expect(loading).toBeTrue();
    tick(10000);   // poll 2: completed, fetch
    tick(DELAY_MS + 1);

    expect(service.getResult).toHaveBeenCalledTimes(1);
    expect(loading).toBeFalse();
  }));

  it('keeps loading and does not fetch a result when the job errors', fakeAsync(() => {
    const { jr, service } = makeJobResult([{ phase: JobStatus.Processing }, { phase: JobStatus.Error }]);
    let loading = true;
    jr.isLoading$.subscribe((v) => (loading = v));
    jr.jobResultResponse$.subscribe();

    tick(0);
    tick(10000);
    tick(DELAY_MS + 1);

    expect(service.getResult).not.toHaveBeenCalled();
    expect(loading).toBeTrue();
  }));

  it('handles an already-completed first poll', fakeAsync(() => {
    const { jr, service } = makeJobResult([{ phase: JobStatus.Completed }]);
    let loading = true;
    jr.isLoading$.subscribe((v) => (loading = v));
    jr.jobResultResponse$.subscribe();

    tick(0);
    tick(DELAY_MS + 1);

    expect(service.getResult).toHaveBeenCalledTimes(1);
    expect(loading).toBeFalse();
  }));

  it('runs one poll no matter how many consumers subscribe', fakeAsync(() => {
    // The header, the loading screen and the result pipeline all read the status.
    // Before the stream was shared, each started its own timer and its own
    // requests, and the result gate could miss the terminal status.
    const { jr, service } = makeJobResult([{ phase: JobStatus.Completed }]);
    jr.statusResponse$.subscribe();
    jr.statusResponse$.subscribe();
    jr.jobResultResponse$.subscribe();

    tick(0);
    tick(DELAY_MS + 1);

    expect(service.getResultStatus).toHaveBeenCalledTimes(1);
    expect(service.getResult).toHaveBeenCalledTimes(1);
  }));
});
