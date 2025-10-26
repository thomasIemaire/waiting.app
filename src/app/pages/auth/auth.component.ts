import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
    selector: 'app-auth',
    imports: [RouterOutlet],
    template: `
        <router-outlet></router-outlet>
    `,
    styleUrls: ['./auth.component.scss']
})
export class AuthComponent { }
