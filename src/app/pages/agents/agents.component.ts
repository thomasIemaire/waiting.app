import { Component } from "@angular/core";
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from "primeng/api";

@Component({
    selector: 'app-agents',
    imports: [CommonModule, ToastModule],
    template: `
    <p-toast />
    <div class="agents__wrapper">
        
    </div>
    `,
    styleUrls: ['./agents.component.scss'],
    providers: [MessageService]
})
export class AgentsComponent {

}