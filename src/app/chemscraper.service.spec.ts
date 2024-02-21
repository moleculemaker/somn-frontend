import { TestBed } from '@angular/core/testing';

import { ChemScraperService } from './chemscraper.service';

describe('FileUploadService', () => {
  let service: ChemScraperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChemScraperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
