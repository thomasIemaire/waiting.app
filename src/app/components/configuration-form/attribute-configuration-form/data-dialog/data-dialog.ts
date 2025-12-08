import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig, DynamicDialogModule } from 'primeng/dynamicdialog';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ApiService } from '../../../../core/services/api.service';
import { Base64File, DndFileComponent } from "../../../dnd-file/dnd-file.component";
import { InputWLabelComponent } from "../../../input-w-label/input-w-label.component";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DynamicDialogModule, TextareaModule, DndFileComponent, InputWLabelComponent],
  template: `
    <div *ngIf="loaded; else loadingTpl">
      <div class="form__wrapper">
        <app-input-w-label label="Nom" [required]="true" [(value)]="data.name" />

        <div class="input-w-label">
          <span class="input-label">Liste de données (JSON)</span>
          <textarea pInputTextarea pSize="small" [(ngModel)]="dataRaw" (ngModelChange)="validateJson()" rows="10" placeholder="Données (JSON)"></textarea>
        </div>

        <small *ngIf="jsonError" style="color:var(--red-500); display: block; margin-top: 0.25rem;">
          <i class="pi pi-times-circle"></i> {{ jsonError }}
        </small>

        <app-dnd-file [acceptedFileTypes]="['.json']" label="liste de données" (fileBase64)="readJson($event)"/>

        <div class="flex justify-end gap-s" style="margin-top: 1rem;">
          <p-button size="small" text severity="secondary" label="Annuler" (click)="ref.close(false)"></p-button>
          <p-button size="small" label="Enregistrer" [disabled]="!!jsonError || !data.name" (click)="onConfirm()"></p-button>
        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="flex align-center justify-center p-4">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      </div>
    </ng-template>
  `,
  styles: [`
    .form__wrapper { display: flex; flex-direction: column; gap: 1rem; }
    textarea { resize: vertical; width: 100%; font-family: monospace; }
  `]
})
export class DataDialog implements OnInit {
  @Input() public dataId: string = '';

  public data: any = { name: '', data: [] };
  public dataRaw = '';
  public jsonError: string | null = null;
  public loaded = false;

  private api: ApiService = inject(ApiService);

  constructor(public ref: DynamicDialogRef, public cfg: DynamicDialogConfig) {
    // CORRECTION ICI : Gestion unifiée de la récupération des données
    if (this.cfg.data) {
      // Priorité à la propriété directe 'dataId' envoyée par le nouveau code
      // Fallback sur 'inputValues.dataId' pour la rétrocompatibilité
      this.dataId = this.cfg.data.dataId || (this.cfg.data.inputValues ? this.cfg.data.inputValues.dataId : '');
    }
  }

  ngOnInit(): void {
    if (!this.dataId) {
      this.initData({ name: '', data: [] });
      return;
    }

    this.api.get(`models/data/${this.dataId}`).subscribe({
      next: (res: any) => this.initData(res),
      error: (err) => {
        console.error(err);
        this.initData({ name: '', data: [] });
      }
    });
  }

  private initData(dataObj: any) {
    this.data = dataObj ?? { name: '', data: [] };
    this.dataRaw = JSON.stringify(this.data.data, null, 2);
    this.validateJson();
    this.loaded = true;
  }

  public validateJson(): void {
    try {
      const val = this.dataRaw.trim();
      if (val) JSON.parse(val);
      this.jsonError = null;
    } catch (e: any) {
      this.jsonError = 'JSON invalide';
    }
  }

  public onConfirm(): void {
    this.validateJson();
    if (this.jsonError) return;

    try {
      const parsedData = this.dataRaw ? JSON.parse(this.dataRaw) : [];
      const payload = { ...this.data, data: parsedData };

      const request$ = this.dataId
        ? this.api.put(`models/data/${this.dataId}`, payload)
        : this.api.post('models/data/', payload);

      request$.subscribe({
        next: (savedData: any) => this.ref.close(savedData),
        error: (err) => {
          console.error("Save error", err);
          this.jsonError = "Erreur serveur lors de la sauvegarde.";
        }
      });
    } catch (e) {
      this.jsonError = "Erreur inattendue lors du traitement.";
    }
  }

  public readJson(file: Base64File): void {
    if (!file.base64) return;
    try {
      const content = file.base64.split(',')[1] || file.base64;
      // Utilisation de decodeURIComponent pour mieux gérer l'UTF-8 si possible
      const jsonText = decodeURIComponent(escape(atob(content)));
      const parsed = JSON.parse(jsonText);

      this.data.name = file.name.replace(/\.json$/i, '');
      this.dataRaw = JSON.stringify(parsed, null, 2);
      this.jsonError = null;
    } catch (e) {
      this.jsonError = "Impossible de lire le fichier JSON.";
      console.error(e);
    }
  }
}