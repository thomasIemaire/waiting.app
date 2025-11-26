import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GFlowLink, GFlowNode, JsonValue } from '../core/gflow.types';

@Component({
    template: ''
})
export abstract class BaseConfigComponent {
    // Le nœud actuellement sélectionné
    @Input({ required: true }) node!: GFlowNode;

    // Le contexte global (utile pour les menus déroulants, validations, etc.)
    @Input() nodes: GFlowNode[] = [];
    @Input() links: GFlowLink[] = [];

    // Les variables disponibles en entrée (pour l'autocomplétion)
    @Input() inputMap: JsonValue | null = null;

    // Événement à émettre quand la config change pour mettre à jour le graphe
    @Output() configChange = new EventEmitter<unknown>();
}