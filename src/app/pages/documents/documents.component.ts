import { Component, inject } from "@angular/core";
import { DndFileComponent } from "../../components/dnd-file/dnd-file.component";
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from "primeng/api";
import { ButtonModule } from 'primeng/button';
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter, map, Observable, startWith } from "rxjs";

@Component({
    selector: 'app-documents',
    imports: [CommonModule, DndFileComponent, ToastModule, ButtonModule, RouterOutlet],
    template: `
    <p-toast />
    <div class="documents__wrapper">
        <ng-container *ngIf="showDnd$ | async">
            <app-dnd-file
                label="document"
                [acceptedFileTypes]="['.pdf', '.jpg', '.png']"
                (filesUploaded)="onFilesUploaded($event)"
                [autoUpload]="true"/>
        </ng-container>

        <div class="router-outlet__wrapper">
            <router-outlet />   
        </div>
    </div>
    `,
    styleUrls: ['./documents.component.scss'],
    providers: [MessageService]
})
export class DocumentsComponent {
    private router: Router = inject(Router);

    showDnd$: Observable<boolean>;

    constructor() {
        this.showDnd$ = this.router.events.pipe(
            filter((event: any) => event instanceof NavigationEnd),
            map((event: NavigationEnd) => event.urlAfterRedirects === '/documents'),
            startWith(this.router.url === '/documents')
        );
    }

    onFilesUploaded(ids: string[]): void {
        if (ids[0])
            this.router.navigate([`documents/${ids[0]}`]);
    }
}