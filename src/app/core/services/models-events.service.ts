import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModelsEventsService {
    private _modelCreated$ = new Subject<any>();
    modelCreated$ = this._modelCreated$.asObservable();

    notifyModelCreated(model: any) {
        this._modelCreated$.next(model);
    }
}