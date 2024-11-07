import { timer, switchMap, tap, takeWhile, BehaviorSubject, skipUntil, filter, map, delay, shareReplay } from "rxjs";
import { JobStatus, JobType } from "~/app/api/mmli-backend/v1";
import { SomnService } from '~/app/services/somn.service';

export class JobResult {
    jobId: string;
    jobType: JobType;
    jobInfo: any;

    isLoading$ = new BehaviorSubject(true); //TODO: change it to true
    resultLoaded$ = new BehaviorSubject(false);

    statusResponse$ = timer(0, 10000).pipe(
        switchMap(() => this.service.getResultStatus(
            this.jobType,
            this.jobId,
        )),
        tap(() => this.resultLoaded$.value ? null : this.isLoading$.next(true)),
        tap((data) => { this.jobInfo = JSON.parse(data.job_info || '[]') }),
        takeWhile((data) =>
            data.phase === JobStatus.Processing
            || data.phase === JobStatus.Queued
            , true),
        tap((data) => { console.log('job status: ', data) }),
    );

    jobResultResponse$ = this.statusResponse$.pipe(
        skipUntil(this.statusResponse$.pipe(filter((job) => job.phase === JobStatus.Completed))),
        switchMap(() => this.service.getResult(this.jobType, this.jobId)),
        tap(() => this.isLoading$.next(false)),
        tap(() => this.resultLoaded$.next(true)),
        tap((data) => { console.log('result: ', data) }),
        shareReplay(1),
    );

    constructor(
        protected service: SomnService,
    ) { }
}