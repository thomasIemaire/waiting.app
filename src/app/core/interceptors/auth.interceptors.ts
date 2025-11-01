import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { TokenService } from "../services/token.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private tokenService = inject(TokenService);

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.tokenService.getToken();
        if (token) {
            const cloned = req.clone({
                headers: req.headers.set("Authorization", `Bearer ${token}`)
            });
            return next.handle(cloned);
        } else {
            return next.handle(req);
        }
    }
}