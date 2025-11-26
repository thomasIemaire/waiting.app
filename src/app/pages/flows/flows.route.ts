import { Routes } from '@angular/router';
import { FlowsComponent } from './flows.component';
import { PreviewFlowComponent } from './preview-flow/preview-flow.component';

export const flowsRoutes: Routes = [
    {
        path: '',
        component: FlowsComponent,
        title: "Gestion des flows",
        children: [
            {
                path: ':id',
                component: PreviewFlowComponent
            }
        ]
    }
];
