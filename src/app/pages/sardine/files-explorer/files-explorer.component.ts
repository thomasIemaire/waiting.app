import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { SardineService } from '../../../core/services/sardine.service';
import { switchMap } from 'rxjs';

@Component({
    selector: 'app-files-explorer',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="files-explorer__container">
      <div class="files-explorer__wrapper">
        <div class="files-explorer-header__wrapper">
          <span class="files-explorer-header__title">Classification</span>
        </div>

        <div class="files-explorer-content__wrapper">
          <div class="content-add-section__wrapper">
            <div class="content-add-section__add" (click)="addClassification()">
              <i class="pi pi-plus"></i>
            </div>
          </div>

          <div class="content-dataset-section__wrapper">
            <span class="content-section__title">
              Taille du dataset · {{ totalFiles }}
            </span>

            <div class="content-dataset-section__files-wrapper">
              <div class="file-item__wrapper" *ngFor="let group of files | keyvalue">
                <div class="file-item__group" (click)="toggleGroup(group.key)">
                  <i class="pi" [ngClass]="isOpen(group.key) ? 'pi-folder-open' : 'pi-folder'"></i>
                  <div class="file-item__group-name">{{ group.key }} · {{ group.value.length }}</div>
                  <i class="pi" [ngClass]="isOpen(group.key) ? 'pi-angle-up' : 'pi-angle-down'"></i>
                </div>

                <div *ngIf="isOpen(group.key)" class="files-explorer-content__details-wrapper">
                  <div class="file-item__details" *ngFor="let detail of group.value" (click)="openDocument(detail, group.key)">
                    <span class="file-item__name">{{ detail.name }}</span>
                  </div>
                  <div *ngIf="group.value.length === 0" class="file-item__details empty">
                    (Vide)
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styleUrls: ['./files-explorer.component.scss'],
})
export class FilesExplorerComponent implements OnInit {
    private sardineService = inject(SardineService);
    public userService = inject(UserService);

    // Données dynamiques
    public files: Record<string, any[]> = {};
    private openedGroups = new Set<string>();

    ngOnInit() {
        // Charge l'arbre et se recharge automatiquement après un ajout/sauvegarde
        this.sardineService.refreshTree$.pipe(
            switchMap(() => this.sardineService.getTree())
        ).subscribe({
            next: (tree) => {
                this.files = tree;
            },
            error: (err) => console.error('Erreur chargement tree', err)
        });
    }

    get totalFiles(): number {
        return Object.values(this.files || {}).reduce((acc, arr) => acc + arr.length, 0);
    }

    toggleGroup(key: string): void {
        this.openedGroups.has(key) ? this.openedGroups.delete(key) : this.openedGroups.add(key);
    }

    isOpen(key: string): boolean {
        return this.openedGroups.has(key);
    }

    addClassification() {
        const name = prompt("Nom de la nouvelle classification :");
        if (name) {
            this.sardineService.addClassification(name).subscribe({
                error: (e) => alert("Erreur : " + e.error?.message || "Impossible de créer")
            });
        }
    }

    openDocument(fileDetail: any, classification: string) {
        this.sardineService.getDocumentContent(fileDetail.name, classification).subscribe(doc => {
            if (doc) {
                this.sardineService.documentToLoad$.next(doc);
            }
        });
    }
}