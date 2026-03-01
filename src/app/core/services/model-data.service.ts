import { inject, Injectable } from "@angular/core";
import { ApiService } from "./api.service";

@Injectable({
    providedIn: 'root'
})
export class ModelDataService {

    datas: any[] = [];

    private apiService: ApiService = inject(ApiService);

    constructor() {
        this.loadDatas();
    }

    public deleteData(id: string): void {
        this.apiService.delete(`models/data/${id}`).subscribe(() => {
            this.loadDatas();
        });
    }

    private loadDatas(): void {
        this.apiService.get<any[]>('models/data/').subscribe((data: any[]) => {
            this.datas = data.map(dataItem => ({
                label: dataItem.name,
                value: dataItem._id
            }));
        });
    }
}