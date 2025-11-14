import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig, DynamicDialogModule } from 'primeng/dynamicdialog';
import { Textarea } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ApiService } from '../../../../core/services/api.service';
import { Base64File, DndFileComponent } from "../../../dnd-file/dnd-file.component";
import { InputWLabelComponent } from "../../../input-w-label/input-w-label.component";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DynamicDialogModule, Textarea, DndFileComponent, InputWLabelComponent],
  template: `
    <div *ngIf="loaded; else loadingTpl">
      <div class="form__wrapper">
        <app-input-w-label label="Nom" [required]="true" [(value)]="data.name" />

        <div class="input-w-label">
          <span class="input-label">Liste de données (JSON)</span>
          <textarea pInputTextarea pSize="small" [(ngModel)]="dataRaw" rows="10" placeholder="Données (JSON)"></textarea>
        </div>

        <small *ngIf="jsonError" style="color:#d32f2f">
          {{ jsonError }}
        </small>

        <app-dnd-file [acceptedFileTypes]="['.json']" label="liste de données" (fileBase64)="readJson($event)"/>

        <div class="flex justify-end gap-s">
          <p-button size="small" text severity="secondary" label="Annuler" (click)="ref.close(false)"></p-button>
          <p-button size="small" text label="Exporter" (click)="ref.close(false)"></p-button>
          <p-button size="small" label="Enregistrer" [disabled]="!!jsonError" (click)="onConfirm()"></p-button>
        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="form__wrapper">Chargement…</div>
      <div class="dialog-footer">
        <p-button size="small" text severity="secondary" label="Fermer" (click)="ref.close(false)"></p-button>
      </div>
    </ng-template>
  `,
  styles: [`
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    textarea {
      resize: none;
    }
  `]
})
export class DataDialog implements OnInit {
  @Input() public dataId: string = '';

  public data: any;
  public dataRaw = '';           // tampon texte pour le JSON
  public jsonError: string | null = null;
  public loaded = false;

  private api: ApiService = inject(ApiService);

  constructor(public ref: DynamicDialogRef, public cfg: DynamicDialogConfig) { }

  ngOnInit(): void {
    if (!this.dataId) {
      this.data = { name: '', data: [] };
      this.dataRaw = this.jsonify(this.data.data);
      this.loaded = true;
      return;
    }

    this.api.get(`models/data/${this.dataId}`).subscribe({
      next: (res: any) => {
        this.data = res ?? { name: '', data: [] };
        this.dataRaw = this.jsonify(this.data.data);
        this.validateJson();
        this.loaded = true;
      },
      error: () => {
        // fallback minimal en cas d'erreur d’API
        this.data = { name: '', data: [] };
        this.dataRaw = this.jsonify(this.data.data);
        this.loaded = true;
      }
    });
  }

  // Sérialise joliment (évite l’appel dans ngModel)
  public jsonify(obj: any) {
    try {
      return JSON.stringify(obj ?? [], null, 2);
    } catch {
      return '[]';
    }
  }

  // Valide en continu le JSON saisi (à appeler si besoin sur (ngModelChange))
  public validateJson(): void {
    try {
      JSON.parse(this.dataRaw || '[]');
      this.jsonError = null;
    } catch (e: any) {
      this.jsonError = 'JSON invalide : ' + (e?.message ?? '');
    }
  }

  public onConfirm(): void {
    // Dernière validation avant fermeture
    this.validateJson();
    if (this.jsonError) return;

    try {
      const parsed = this.dataRaw ? JSON.parse(this.dataRaw) : [];
      this.data = { ...this.data, data: parsed };
      this.ref.close(this.data);
    } catch (e: any) {
      this.jsonError = 'JSON invalide : ' + (e?.message ?? '');
    }
  }

  public readJson(file: Base64File): void {
    try {
      const b64 = this.extractBase64(file.base64);
      if (!b64) {
        this.jsonError = 'Aucun contenu base64 détecté.';
        return;
      }

      const jsonText = this.base64ToUtf8(b64).trim();
      const parsed = jsonText ? JSON.parse(jsonText) : [];

      this.dataRaw = this.jsonify(parsed);

      this.data.name = file.name.replace(/\.json$/i, '');
      this.data = { ...this.data, data: parsed };

      this.jsonError = null;
    } catch (e: any) {
      this.jsonError = 'JSON invalide : ' + (e?.message ?? '');
    }
  }

  private extractBase64(payload: string | { base64?: string } | null | undefined): string | null {
    if (!payload) return null;

    let raw = typeof payload === 'string' ? payload : payload.base64 ?? '';
    raw = raw.trim();

    const commaIdx = raw.indexOf(',');
    if (raw.startsWith('data:') && commaIdx >= 0) {
      return raw.slice(commaIdx + 1);
    }
    return raw || null;
  }

  private base64ToUtf8(b64: string): string {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }
}
