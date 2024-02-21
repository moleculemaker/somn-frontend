import { Component, Input, OnInit } from '@angular/core';
import { ChemScraperService } from 'src/app/chemscraper.service';
import { ExportRequestBody } from 'src/app/models';

@Component({
  selector: 'chemscraper-export-menu',
  templateUrl: './export-menu.component.html',
  styleUrls: ['./export-menu.component.scss']
})
export class ExportMenuComponent implements OnInit{
  @Input() tableRows: any[];

  @Input() pages_count: number;

  format_checkbox: string[] = [];
  isExportDisabled: boolean;

  // pages: number[] = Array.from({length: 10}, (_, i) => i + 1);
  pages: any[] = [];
  selectedPage: any;

  exportRequestBody : ExportRequestBody = {
    jobId: '',
    cdxml: false,
    cdxml_filter: 'all_molecules',
    cdxml_selected_pages: [],
    csv: false,
    csv_filter: 'full_table',
    csv_molecules: []
  };

  constructor(
    private _chemScraperService: ChemScraperService
  ){ }

  ngOnInit() {
    for(let i = 1; i <= this.pages_count; i++) { // Replace 10 with N to generate numbers up to N
      this.pages.push({label: i.toString(), value: i});
    }

    this.isExportDisabled = true;
    this.selectedPage = this.pages[0].value;

  }

  export(){
    const jobId = window.location.href.split('/').at(-1);
    if(jobId){
      this.exportRequestBody.jobId = jobId;
    }
    if(this.selectedPage && this.exportRequestBody.cdxml_filter == "single_page")
      this.exportRequestBody.cdxml_selected_pages = [this.selectedPage.value];

    if(this.exportRequestBody.csv_filter == "current_view"){
      this.exportRequestBody.csv_molecules = this.tableRows.map(row => row.id)
    }

    this._chemScraperService.exportFiles(this.exportRequestBody).subscribe((file: Blob) => {
      const url = window.URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `chemscraper-${jobId}.zip`); // replace with your filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  onCheckboxesChange(){
    if (this.format_checkbox.includes('CDXML')) {
      this.exportRequestBody.cdxml = true;
    } else {
      this.exportRequestBody.cdxml = false;
    }

    if (this.format_checkbox.includes('CSV')) {
      this.exportRequestBody.csv = true;
    } else {
      this.exportRequestBody.csv = false;
    }
    if(this.pages_count > 0 && ( this.exportRequestBody.cdxml || this.exportRequestBody.csv)){
      this.isExportDisabled = false;
    } else {
      this.isExportDisabled = true;
    }
  }

}
