// Based on https://burakcanekici.medium.com/uploading-file-with-drag-drop-on-angular-9a42202fe23f
import { Directive, HostListener, HostBinding, Output, EventEmitter, Input } from '@angular/core';

@Directive({
  selector: '[fileDragDrop]'
})

export class FileDragNDropDirective {
  //@Input() private allowed_extensions : Array<string> = ['png', 'jpg', 'bmp'];
  @Output() private filesChangeEmiter : EventEmitter<FileList> = new EventEmitter();
  //@Output() private filesInvalidEmiter : EventEmitter<File[]> = new EventEmitter();
  @HostBinding('style.background') private background = '#f8f9fa';
  @HostBinding('style.border') private borderStyle = '1px dashed';
  @HostBinding('style.border-color') private borderColor = '#dee2e6';
  @HostBinding('style.border-radius') private borderRadius = '5px';

  constructor() { }

  @HostListener('dragover', ['$event']) public onDragOver(evt: DragEvent){
    evt.preventDefault();
    evt.stopPropagation();
    this.background = '#e8e9ea';
    this.borderColor = '#bec2c6';
    this.borderStyle = '1px dashed';
  }

  @HostListener('dragleave', ['$event']) public onDragLeave(evt: DragEvent){
    evt.preventDefault();
    evt.stopPropagation();
    this.background = '#f8f9fa';
    this.borderColor = '#dee2e6';
    this.borderStyle = '1px dashed';
  }

  @HostListener('dragenter', ['$event']) public onDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('drop', ['$event']) public onDrop(event: DragEvent){
    event.preventDefault();
    event.stopPropagation();
    this.background = '#eee';
    this.borderColor = '#696D7D';
    this.borderStyle = '2px dashed';
    if (event && event.dataTransfer) {
      let files = event.dataTransfer.files;
      this.filesChangeEmiter.emit(files);

    }

  }
}
