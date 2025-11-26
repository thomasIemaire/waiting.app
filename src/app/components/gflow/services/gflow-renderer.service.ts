import { Injectable, NgZone } from '@angular/core';
import { GflowViewportService } from './gflow-viewport.service';
import { GflowStateService } from './gflow-state.service';
import { PortRef } from '../core/gflow.types';

export interface PendingLink {
  from: PortRef;
  mouse: { x: number; y: number };
}

@Injectable()
export class GflowRendererService {
  private viewport: HTMLElement | null = null;
  private rafId: number | null = null;
  private onRendered: (() => void) | null = null;

  private pendingLink: PendingLink | null = null;
  private pendingPreviewD = '';

  private readonly wireGap = 4;
  private readonly defaultNodeWidth = 220;
  private readonly baseRowHeight = 44;
  private readonly baseNodeHeight = 80; // hauteur min carte

  constructor(
    private readonly zone: NgZone,
    private readonly viewportService: GflowViewportService,
    private readonly state: GflowStateService,
  ) { }

  initialize(viewport: HTMLElement, onRendered: () => void) {
    this.viewport = viewport;
    this.viewportService.setViewport(viewport);
    this.onRendered = onRendered;
    this.schedule();
  }

  dispose() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  schedule() {
    if (this.rafId !== null) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.zone.runOutsideAngular(() => this.recalculate());
      this.zone.run(() => this.onRendered?.());
    });
  }

  updatePendingLink(link: PendingLink | null) {
    this.pendingLink = link;
    this.schedule();
  }

  get previewPath(): string {
    return this.pendingPreviewD;
  }

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  private recalculate() {
    const stub = this.viewportService.baseStep;

    // 1) Liens existants
    for (const link of this.state.links) {
      let p1 = this.portCenterWorld(link.src);
      let p2 = this.portCenterWorld(link.dst);

      if (link.relation === 'entry-exit') {
        // Vertical (entry -> exit)
        p1 = this.applyGap(p1, 'S');
        p2 = this.applyGap(p2, 'N');
        const route = this.routeSoft(p1, p2, 'S', 'N', stub);
        link.d = route.d;
        link.mid = route.mid;
      } else {
        // Horizontal (out -> in)
        p1 = this.applyGap(p1, 'E');
        p2 = this.applyGap(p2, 'W');
        const route = this.routeSoft(p1, p2, 'E', 'W', stub);
        link.d = route.d;
        link.mid = route.mid;
      }
    }

    // 2) Lien en cours
    if (this.pendingLink) {
      let p1 = this.portCenterWorld(this.pendingLink.from);
      const p2 = this.pendingLink.mouse;
      const isVertical = this.pendingLink.from.kind === 'entry' || this.pendingLink.from.kind === 'exit';

      if (isVertical) {
        const startDir = this.pendingLink.from.kind === 'entry' ? 'S' : 'N';
        const endDir = this.pendingLink.from.kind === 'entry' ? 'N' : 'S'; // esthétique opposée
        p1 = this.applyGap(p1, startDir);
        const route = this.routeSoft(p1, p2, startDir, endDir, stub);
        this.pendingPreviewD = route.d;
      } else {
        const dirA: 'E' | 'W' = this.pendingLink.from.kind === 'out' ? 'E' : 'W';
        const dirB: 'E' | 'W' = this.pendingLink.from.kind === 'out' ? 'W' : 'E';
        p1 = this.applyGap(p1, dirA);
        const route = this.routeSoft(p1, p2, dirA, dirB, stub);
        this.pendingPreviewD = route.d;
      }
    } else {
      this.pendingPreviewD = '';
    }
  }

  // ---------------------------------------------------------
  // GEOMETRY HELPERS
  // ---------------------------------------------------------
  private applyGap(p: { x: number; y: number }, dir: 'N' | 'S' | 'E' | 'W'): { x: number; y: number } {
    const g = this.wireGap;
    if (dir === 'E') return { x: p.x + g, y: p.y };
    if (dir === 'W') return { x: p.x - g, y: p.y };
    if (dir === 'S') return { x: p.x, y: p.y + g };
    return { x: p.x, y: p.y - g }; // 'N'
  }

  private portCenterWorld(ref: PortRef) {
    // 1) Essaye via DOM (ports présents/ghostés dans le DOM)
    const cls =
      ref.kind === 'out' ? 'output' :
        ref.kind === 'in' ? 'input' :
          ref.kind === 'entry' ? 'entry' : 'exit';

    const sel = `[data-node-id="${ref.nodeId}"] .${cls}-port[data-index="${ref.portIndex}"]`;
    const el = this.viewport?.querySelector(sel) as HTMLElement | null;

    if (el) {
      // Coordonnées écran:
      const pr = el.getBoundingClientRect();
      const screenX = pr.left + pr.width / 2;
      const screenY = pr.top + pr.height / 2;
      // Converti en Monde via service viewport:
      return this.viewportService.toWorld(screenX, screenY);
    }

    // 2) Fallback géométrique (port introuvable)
    const node = this.state.nodes.find(n => n.id === ref.nodeId);
    if (!node) return { x: 0, y: 0 };

    const w = this.nodeWidth(node);
    const h = this.nodeHeight(node);

    const count =
      ref.kind === 'in' ? (node.inputs?.length || 1) :
        ref.kind === 'out' ? (node.outputs?.length || 1) :
          ref.kind === 'entry' ? (node.entries?.length || 1) :
            (node.exits?.length || 1);

    const i = Math.min(ref.portIndex, Math.max(0, count - 1));
    const gap = h / (count + 1);
    const y = node.y + gap * (i + 1);

    if (ref.kind === 'in') return { x: node.x, y };
    if (ref.kind === 'out') return { x: node.x + w, y };
    if (ref.kind === 'entry') return { x: node.x + w / 2, y: node.y };           // ancrage haut
    /* exit */                 return { x: node.x + w / 2, y: node.y + h };       // ancrage bas
  }

  private nodeWidth(_node: any): number {
    // Si tu as une largeur dynamique ailleurs, remplace par l’appel au service concerné.
    return this.defaultNodeWidth;
  }

  private nodeHeight(node: any): number {
    // Même logique que dans le composant : base + outputs nommés
    const namedOutputs = Array.isArray(node.outputs)
      ? node.outputs.filter((o: any) => !!o?.name).length
      : 0;
    return namedOutputs > 0
      ? 60 + (namedOutputs * this.baseRowHeight) + 10
      : this.baseNodeHeight;
  }

  private routeSoft(
    a: { x: number; y: number },
    b: { x: number; y: number },
    dirA: 'E' | 'W' | 'N' | 'S',
    dirB: 'E' | 'W' | 'N' | 'S',
    stub: number,
  ): { d: string; mid: { x: number; y: number } } {
    const pA = this.offset(a, dirA, stub);
    const pB = this.offset(b, dirB, stub);

    const dist = Math.hypot(pB.x - pA.x, pB.y - pA.y);
    const elasticity = Math.max(stub * 2, dist * 0.5);

    const c1 = { x: pA.x, y: pA.y };
    const c2 = { x: pB.x, y: pB.y };

    if (dirA === 'E') c1.x += elasticity;
    else if (dirA === 'W') c1.x -= elasticity;
    else if (dirA === 'S') c1.y += elasticity;
    else if (dirA === 'N') c1.y -= elasticity;

    if (dirB === 'E') c2.x += elasticity;
    else if (dirB === 'W') c2.x -= elasticity;
    else if (dirB === 'S') c2.y += elasticity;
    else if (dirB === 'N') c2.y -= elasticity;

    const d = [
      `M ${a.x} ${a.y}`,
      `L ${pA.x} ${pA.y}`,
      `C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${pB.x} ${pB.y}`,
      `L ${b.x} ${b.y}`
    ].join(' ');

    // midpoint t = 0.5
    const t = 0.5, u = 1 - t;
    const midX = u * u * u * pA.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * pB.x;
    const midY = u * u * u * pA.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * pB.y;

    return { d, mid: { x: midX, y: midY } };
  }

  private offset(p: { x: number; y: number }, dir: 'E' | 'W' | 'N' | 'S', d: number) {
    if (dir === 'E') return { x: p.x + d, y: p.y };
    if (dir === 'W') return { x: p.x - d, y: p.y };
    if (dir === 'N') return { x: p.x, y: p.y - d };
    return { x: p.x, y: p.y + d }; // 'S'
  }
}
