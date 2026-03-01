import { Directive, HostListener } from '@angular/core';
import { FocusTargetService } from '../services/focus-target.service';

@Directive({
    selector: '[pdfTargetInput]',
})
export class PdfTargetInputDirective {
    constructor(private focusTargetService: FocusTargetService) { }

    @HostListener('focus', ['$event'])
    onFocus(event: FocusEvent): void {
        this.focusTargetService.setLastFocused(event.target);
    }
}