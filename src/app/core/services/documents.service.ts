import { inject, Injectable } from "@angular/core";
import { ApiService } from "./api.service";
import { firstValueFrom } from 'rxjs';
import { Base64File } from "../../components/dnd-file/dnd-file.component";

@Injectable({ providedIn: 'root' })
export class DocumentsService {

    private apiService: ApiService = inject(ApiService);

    public async uploadDocument(file: Base64File): Promise<any> {
        try {
            const response: any = await firstValueFrom(this.apiService.post(`documents/`, {
                filename: file.name,
                contentType: file.type,
                data: file.base64
            }));
            return response;
        } catch (err: any) {
            throw new Error(err?.error?.message || 'Une erreur est survenue lors de l\'envoi du document.');
        }
    }

    public async uploadDocuments(files: Base64File[]): Promise<any[]> {
        return await Promise.all(files.map(file => this.uploadDocument(file)));
    }

    public async getDocuments(): Promise<any[]> {
        try {
            const response: any = await firstValueFrom(this.apiService.get(`documents/`));
            return response;
        } catch (err: any) {
            throw new Error(err?.error?.message || 'Une erreur est survenue lors de la récupération des documents.');
        }
    }

    public async getDocumentById(id: string): Promise<any> {
        try {
            const response = await firstValueFrom(this.apiService.get(`documents/${id}`));
            return response;
        } catch (err: any) {
            throw new Error(err?.error?.message || 'Une erreur est survenue lors de la récupération du document.');
        }
    }

    public async processDocument(id: string): Promise<any> {
        try {
            const response = await firstValueFrom(this.apiService.post(`ai/document`, { document_id: id }));
            return response;
        } catch (err: any) {
            throw new Error(err?.error?.message || 'Une erreur est survenue lors du traitement du document.');
        }
    }
}