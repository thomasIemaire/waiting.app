import { Routes } from '@angular/router';
import { FlowsComponent } from './flows.component';
import { PreviewFlowComponent } from './preview-flow/preview-flow.component';
import { pendingChangesGuard } from '../../core/guards/pending-changes.guard';

export const flowsRoutes: Routes = [
    {
        path: '',
        component: FlowsComponent,
        title: "Gestion des flows",
        children: [
            {
                path: 'new',
                component: PreviewFlowComponent,
                canDeactivate: [pendingChangesGuard] // Ajout du guard
            },
            {
                path: ':id',
                component: PreviewFlowComponent,
                canDeactivate: [pendingChangesGuard] // Ajout du guard
            }
        ]
    }
];