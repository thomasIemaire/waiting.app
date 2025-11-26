import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GFlowLink, GFlowNode, PortKind } from '../core/gflow.types';

@Component({
  selector: 'app-gflow-node',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gflow-node.component.html',
  styleUrls: ['./gflow-node.component.scss']
})
export class GflowNodeComponent {
  @Input({ required: true }) item!: GFlowNode;
  @Input() links: GFlowLink[] = [];

  get hasNamedOutputs(): boolean {
    return this.item.outputs.some(p => !!p.name);
  }

  isPortConnected(kind: PortKind, index: number): boolean {
    const nodeId = this.item.id;
    return this.links.some(link => {
      const isSource = link.src.nodeId === nodeId && link.src.kind === kind && link.src.portIndex === index;
      const isDest = link.dst.nodeId === nodeId && link.dst.kind === kind && link.dst.portIndex === index;
      return isSource || isDest;
    });
  }
}