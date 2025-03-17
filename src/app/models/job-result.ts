import { timer, switchMap, tap, takeWhile, BehaviorSubject, skipUntil, filter, map, delay, shareReplay } from "rxjs";
import { JobStatus, JobType } from "~/app/api/mmli-backend/v1";
import { SomnService } from '~/app/services/somn.service';

export class JobResult {
    jobId: string;
    jobType: JobType;
    jobInfo: any;

    isLoading$ = new BehaviorSubject(true); //TODO: change it to true
    resultLoaded$ = new BehaviorSubject(false);

    elNameMap: any;
    nucNameMap: any;

    statusResponse$ = timer(0, 10000).pipe(
        switchMap(() => this.service.getResultStatus(
            this.jobType,
            this.jobId,
        )),
        tap(() => this.resultLoaded$.value ? null : this.isLoading$.next(true)),
        tap((job) => {
            const info = JSON.parse(job.job_info || '[]');
            if (info.el_name_map && info.nuc_name_map) {
                this.elNameMap = info.el_name_map;
                this.nucNameMap = info.nuc_name_map;
                this.jobInfo = info['info'].map((info: any) => ({
                    ...info,
                    el_name: this.elNameMap[info.el_name] || info.el_name,
                    nuc_name: this.nucNameMap[info.nuc_name] || info.nuc_name
                  }));
            } else {
                this.jobInfo = info instanceof Array ? info : [info]; // backward compatibility
            }
        }),
        takeWhile((data) =>
            data.phase === JobStatus.Processing
            || data.phase === JobStatus.Queued
            , true),
        tap((data) => { console.log('job status: ', data) }),
    );

    jobResultResponse$ = this.statusResponse$.pipe(
        skipUntil(this.statusResponse$.pipe(filter((job) => job.phase === JobStatus.Completed))),
        switchMap(() => this.service.getResult(this.jobType, this.jobId)),
        tap((data) => {
            data.forEach((d: any) => {
                d.el_name = this.elNameMap[d.el_name] || d.el_name;
                d.nuc_name = this.nucNameMap[d.nuc_name] || d.nuc_name;
            });
        }),
        tap(() => this.isLoading$.next(false)),
        tap(() => this.resultLoaded$.next(true)),
        tap((data) => { console.log('result: ', data) }),
        shareReplay(1),
    );

    constructor(
        protected service: SomnService,
    ) { }
}