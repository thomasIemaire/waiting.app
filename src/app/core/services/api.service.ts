import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: 'root' })
export class ApiService {
    
    private apiUrl = `${environment.apiUrl}/api`;
    public publicUrl = `${environment.apiUrl}/public`;

    constructor(private http: HttpClient) { }

    get<T>(endpoint: string, headers?: HttpHeaders, params?: any): Observable<T> {
        return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { headers, params });
    }

    post<T>(endpoint: string, body: any, headers?: HttpHeaders, params?: any): Observable<T> {
        return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, { headers, params });
    }

    put<T>(endpoint: string, body: any, headers?: HttpHeaders, params?: any): Observable<T> {
        return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body, { headers, params });
    }

    delete<T>(endpoint: string, headers?: HttpHeaders, params?: any): Observable<T> {
        return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, { headers, params });
    }
}