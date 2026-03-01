import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FilesExplorerComponent } from "./files-explorer/files-explorer.component";
import { YoloEditorComponent } from "./yolo-editor/yolo-editor.component";

@Component({
    selector: 'app-sardine',
    imports: [CommonModule, FilesExplorerComponent, YoloEditorComponent],
    template: `
    <div class="sardine__wrapper">
        <app-files-explorer></app-files-explorer>
        <app-yolo-editor></app-yolo-editor>
    </div>
    `,
    styleUrls: ['./sardine.component.scss']
})
export class SardineComponent {
}