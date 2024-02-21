export * from './chemScraper.service';
import { ChemScraperService } from './chemScraper.service';
export * from './default.service';
import { DefaultService } from './default.service';
export * from './files.service';
import { FilesService } from './files.service';
export * from './jobs.service';
import { JobsService } from './jobs.service';
export const APIS = [ChemScraperService, DefaultService, FilesService, JobsService];
