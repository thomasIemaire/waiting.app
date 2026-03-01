import { Routes } from '@angular/router';
import { AgentsComponent } from './agents.component';
import { PreviewAgentComponent } from './preview-agent/preview-agent.component';

export const agentsRoutes: Routes = [
    {
        path: '',
        component: AgentsComponent,
        title: "Gestion des agents",
        children: [
            {
                path: ':id',
                component: PreviewAgentComponent,
                title: "Gestion des agents"
            }
        ]
    }
];
