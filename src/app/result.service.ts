import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, delay, timer, Subscription, Subject } from 'rxjs';
import { PollingResponseStatus, PollingResponseResult } from './models';
import { switchMap, tap, share, retry, takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ResultService {

  private resuts$: Observable<PollingResponseStatus>;
  private stopPolling = new Subject();
  _url_status: string = 'https://jobmgr.mmli1.ncsa.illinois.edu/api/v1' + '/job/status';
  _url_result: string = 'https://jobmgr.mmli1.ncsa.illinois.edu/api/v1' + '/job/result';
  jobID: string;
  dummyChooseArray: number[] = [0, 0, 0, 0, 0];
  private dummyRunningResult: PollingResponseResult = {
    jobId: "1",
    url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    status: "executing",
    created_at: "2020-01-01 10:10:10",
    results: []
  };

  private dummyFailedResult: PollingResponseResult = {
    jobId: "2",
    url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    status: "failed",
    created_at: "2020-01-01 10:10:10",
    results: []
  };

  private dummyCompleteResult: PollingResponseResult = {
    jobId: "1",
    url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    status: "completed",
    created_at: "2020-01-01 10:10:10",
    results: [
      {
        sequence: "header1",
        result: [
          {
            ecNumber: "EC:1.3.8.1",
            score: 10.3423
          },
          {
            ecNumber: "EC:1.3.8.2",
            score: 5.8673
          }
        ]
      },
      {
        sequence: "header2",
        result: [
          {
            ecNumber: "EC:1.3.8.3",
            score: 2.4593
          }
        ]
      }
    ]
  };

  constructor(private http: HttpClient) {
    this.resuts$ = timer(1, 10000).pipe(
      switchMap((x) =>
        this.http.post<PollingResponseResult>(this._url_status, {'jobId' : this.jobID})
        // this.tempSelectResult()
      ),
      retry(),
      takeUntil(this.stopPolling)
    );
  }

  // tempSelectResult(): Observable<PollingResponseResult> {
    // const runningRespond = of(this.dummyRunningResult);
    // const dealyRunningRespond = runningRespond.pipe(delay(200));

    // const failedResult = of(this.dummyFailedResult);
    // const dealyFailedRespond = failedResult.pipe(delay(200));

    // const completeResult = of(this.dummyCompleteResult);
    // const dealyCompleteResult = completeResult.pipe(delay(200));

    // if (choseResponse == 0) {
    //   return dealyRunningRespond;
    // }
    // else if (choseResponse == 1) {
    //   return dealyCompleteResult;
    // }
    // else {
    //   return dealyFailedRespond;
    // }
    // return this.http.post<PollingResponseResult>(this._url_status, this.jobID);
  // }

  // getResult(responseNumber: number): Observable<PollingResponseResult> {
  //   this.dummyChooseArray.push(responseNumber);
  //   return this.resuts$;
  // }

  gotEndResult() {
    this.stopPolling.next(1);
  }

  ngOnDestroy() {
    this.stopPolling.next(1);
  }

  getResponse(jobID: any): Observable<PollingResponseResult>{
    this.jobID = jobID;
    return this.http.post<PollingResponseResult>(this._url_result, {'jobId' : jobID}) //should return a jobID
  }
  getResult(jobID: any): Observable<PollingResponseStatus>{
    this.jobID = jobID;
    return this.resuts$;
    // return this.http.post<PollingResponseStatus>(this._url_status, jobID);
  }

}
