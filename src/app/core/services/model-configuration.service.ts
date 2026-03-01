import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class ModelConfigurationService {

    configurations: any[] = [];

    private apiService: ApiService = inject(ApiService);

    constructor() {
        this.loadConfigurations();
    }

    public deleteConfiguration(id: string): void {
        this.apiService.delete(`models/configurations/${id}`).subscribe(() => {
            this.loadConfigurations();
        });
    }

    private loadConfigurations(): void {
        this.apiService.get<any[]>('models/configurations/').subscribe((data: any[]) => {
            this.configurations = data.map(config => ({
                label: config.name,
                value: config._id
            }));
        });
    }

    public loadConfigurationById(id: string): void {
        this.apiService.get<any>(`models/configurations/${id}`).subscribe((data: any) => {
            return data;
        });
    }

}