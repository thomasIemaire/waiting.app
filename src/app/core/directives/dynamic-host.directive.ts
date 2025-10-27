import {
    Directive, Input, OnChanges, OnDestroy, SimpleChanges,
    ViewContainerRef, Injector, ComponentRef, Type
} from '@angular/core';
import { Subscription } from 'rxjs';

@Directive({
    selector: '[appDynamicHost]',
    standalone: true
})
export class DynamicHostDirective implements OnChanges, OnDestroy {
    @Input('appDynamicHost') component!: Type<any>;
    @Input() inputs: Record<string, any> = {};
    // Map outputName -> handler(value) ; ex: { open: (row) => this.onOpen(row) }
    @Input() outputs: Record<string, (value: any) => void> = {};

    private cmpRef?: ComponentRef<any>;
    private subs: Subscription[] = [];

    constructor(private vcr: ViewContainerRef, private injector: Injector) { }

    ngOnChanges(changes: SimpleChanges): void {
        // (Re)création si le type change
        if (changes['component']) {
            this.destroy();
            if (this.component) {
                this.cmpRef = this.vcr.createComponent(this.component, { injector: this.injector });
            }
        }

        // (Re)push des inputs
        if (this.cmpRef && (changes['inputs'] || changes['component'])) {
            Object.assign(this.cmpRef.instance, this.inputs || {});
            this.cmpRef.changeDetectorRef.detectChanges();
        }

        // (Re)abonnement aux outputs
        if (this.cmpRef && (changes['outputs'] || changes['component'])) {
            this.subs.forEach(s => s.unsubscribe());
            this.subs = [];
            const inst: any = this.cmpRef.instance;
            Object.entries(this.outputs || {}).forEach(([prop, handler]) => {
                const out = inst?.[prop];
                if (out && typeof out.subscribe === 'function') {
                    this.subs.push(out.subscribe((v: any) => handler(v)));
                }
            });
        }
    }

    ngOnDestroy(): void { this.destroy(); }

    private destroy() {
        this.subs.forEach(s => s.unsubscribe());
        this.subs = [];
        this.vcr.clear();
        this.cmpRef?.destroy();
        this.cmpRef = undefined;
    }
}
