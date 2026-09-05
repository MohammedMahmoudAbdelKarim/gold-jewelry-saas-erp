import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[appCellTemplate]',
  standalone: true
})
export class CellTemplateDirective {
  @Input('appCellTemplate') columnName!: string;

  constructor(public templateRef: TemplateRef<any>) {}
}
