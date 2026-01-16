import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { BehaviorSubject, tap } from 'rxjs';

export interface SardineDocument {
    _id?: string;
    filename: string;
    classification: string;
    base64: string;
    zones: any[];
    width?: number;
    height?: number;
    mime_type?: string;
    page_index?: number;
}

@Injectable({ providedIn: 'root' })
export class SardineService {
    private api = inject(ApiService);

    // Signaux pour rafraîchir l'interface
    public refreshTree$ = new BehaviorSubject<void>(undefined);
    public documentToLoad$ = new BehaviorSubject<SardineDocument | null>(null);

    // Récupérer l'arborescence
    getTree() {
        return this.api.get<Record<string, any[]>>('sardine/tree');
    }

    // Sauvegarder un fichier
    saveDocument(doc: SardineDocument) {
        return this.api.post('sardine/document', doc).pipe(
            tap(() => this.refreshTree$.next())
        );
    }

    // Charger un fichier
    getDocumentContent(filename: string, classification: string) {
        return this.api.get<SardineDocument>('sardine/document', undefined, { filename, classification });
    }

    // Créer un dossier
    addClassification(name: string) {
        return this.api.post('sardine/classification', { name }).pipe(
            tap(() => this.refreshTree$.next())
        );
    }

    deleteDocument(filename: string, classification: string) {
        // On passe les paramètres en query params
        return this.api.delete('sardine/document', undefined, { filename, classification }).pipe(
            // Important : on rafraîchit l'arbre après la suppression
            tap(() => this.refreshTree$.next())
        );
    }
}