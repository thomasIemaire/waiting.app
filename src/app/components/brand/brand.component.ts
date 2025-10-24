import { Component } from "@angular/core";

@Component({
    selector: 'app-brand',
    imports: [],
    template: `
    <div class="brand__container">
        <div class="brand__wrapper">
            <span class="brand__left-part">sen</span>
            <span class="brand__right-part">doc</span>
        </div>
    </div>
    `,
    styleUrl: './brand.component.scss'
})
export class BrandComponent { }