import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { BrandComponent } from "../../components/brand/brand.component";

@Component({
    selector: 'app-auth',
    imports: [RouterOutlet, BrandComponent],
    template: `
    <div class="auth__wrapper">
        <!-- <div class="auth__left-wrapper">
            <div class="auth__left-content">
                
            </div>
        </div> -->
        <div class="auth__right-wrapper">
            <div class="auth_brand">
                <app-brand size="large" />
                <div class="auth_brand-text">
                    <div>Compagnon de votre</div>
                    <div>Dématérialisation</div>
                </div>
            </div>
            <div class="auth__form">
                <router-outlet></router-outlet> 
            </div>
        </div>
    </div>
    `,
    styleUrls: ['./auth.component.scss']
})
export class AuthComponent { }
