import { Component } from "@angular/core";
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from "primeng/api";

@Component({
    selector: 'app-flows',
    imports: [CommonModule, ToastModule],
    template: `
    <p-toast />
    <div class="flows__wrapper">
        
    </div>
    `,
    styleUrls: ['./flows.component.scss'],
    providers: [MessageService]
})
export class FlowsComponent {

}