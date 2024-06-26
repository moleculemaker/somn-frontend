/**
 * FastAPI
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 0.1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { JobStatus } from './jobStatus';
import { JobType } from './jobType';


export interface Job { 
    job_info?: string;
    email?: string;
    job_id?: string;
    run_id?: string;
    phase?: JobStatus;
    type?: JobType;
    image?: string;
    command?: string;
    time_created?: number;
    time_start?: number;
    time_end?: number;
    deleted?: number;
    user_agent?: string;
}
export namespace Job {
}


