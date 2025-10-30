import { Component, inject } from "@angular/core";
import { Base64File, DndFileComponent } from "../../components/dnd-file/dnd-file.component";
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from "primeng/api";
import { ButtonModule } from 'primeng/button';
import { Router, RouterOutlet } from "@angular/router";

@Component({
    selector: 'app-documents',
    imports: [CommonModule, DndFileComponent, ToastModule, ButtonModule, RouterOutlet],
    template: `
    <p-toast />
    <div class="documents__wrapper">
        <app-dnd-file 
            [mode]="isMobile ? 'mobile' : 'dragdrop'"
            label="document"
            [acceptedFileTypes]="['.pdf', '.jpg', '.png']"
            (filesUploaded)="onFilesUploaded($event)"
            [autoUpload]="true"/>
        <router-outlet />   
    </div>
    `,
    styleUrls: ['./documents.component.scss'],
    providers: [MessageService]
})
export class DocumentsComponent {
    private router: Router = inject(Router);

    public isMobile: boolean = /Mobi|Android|iPhone|iPad|iPod|Windows Phone|IEMobile|BlackBerry|BB10/i
        .test(navigator.userAgent);

    onFilesUploaded(ids: string[]): void {
        if (ids[0])
            this.router.navigate([`documents/${ids[0]}`]);
    }
}