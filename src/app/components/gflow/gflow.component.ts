import { CommonModule } from '@angular/common';
import {
  AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, inject, Input, OnDestroy, Output, ViewChild,
} from '@angular/core';
import { GflowNodeComponent } from './node/gflow-node.component';
import { GFlowLink, GFlowNode, JsonValue, NodeType, PortKind, PortRef } from './core/gflow.types';
import { PaletteGroup, PaletteItem, PALETTE_GROUPS, NODE_DEFINITION_MAP } from './core/node-definitions';
import { GflowViewportService } from './services/gflow-viewport.service';
import { GflowStateService } from './services/gflow-state.service';
import { GflowRendererService, PendingLink } from './services/gflow-renderer.service';
import { GflowConfigPanelComponent } from './shared/components/gflow-config-panel/gflow-config-panel.component';
import { SwitchConfigEvent } from './configs/config-switch/config-switch.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AutoFocus } from "primeng/autofocus";
import { InputText, InputTextModule } from "primeng/inputtext";
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

const SNAP_THRESHOLD_PX = 48;
const CLICK_TO_DRAG_THRESHOLD_PX = 3;
type ToolType = 'select' | 'pan';

interface DragState {
  active: boolean;
  node: GFlowNode | null;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  group: Array<{ node: GFlowNode; x0: number; y0: number }>;
}

interface PanState {
  active: boolean;
  startX: number;
  startY: number;
  moved: boolean;
}

interface SelectionState {
  active: boolean;
  startX: number; // coord. viewport
  startY: number;
  currentX: number;
  currentY: number;
  style: { left: string; top: string; width: string; height: string };
}

@Component({
  selector: 'app-gflow',
  standalone: true,
  imports: [CommonModule, FormsModule, GflowNodeComponent, GflowConfigPanelComponent, ButtonModule, InputTextModule, ConfirmDialogModule, AutoFocus],
  templateUrl: './gflow.component.html',
  styleUrl: './gflow.component.scss',
  providers: [GflowViewportService, GflowStateService, GflowRendererService, ConfirmationService],
})
export class GflowComponent implements AfterViewInit, OnDestroy {

  @ViewChild('viewport', { static: true }) viewportRef!: ElementRef<HTMLElement>;
  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;

  @Input() navigateBack: string | null = null;
  @Output() saveFlow = new EventEmitter<any>();

  public flow = {
    title: 'Nouveau Flow',
    description: '',
    id: null as string | null
  }

  public isDirty = false;

  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private apiService: ApiService = inject(ApiService);
  private messageService: MessageService = inject(MessageService);

  readonly paletteGroups: PaletteGroup[] = PALETTE_GROUPS;
  readonly paletteWidth = 200;
  paletteOpen = true;
  configOpen = false;

  focusedNode: GFlowNode | null = null;
  focusedLink: GFlowLink | null = null;
  focusedInputMap: JsonValue | null = null;

  currentTool: ToolType = 'pan';
  worldDragging = false;
  skipNextClick = false;
  isEditingTitle = false;

  dragState: DragState = { active: false, node: null, startX: 0, startY: 0, dx: 0, dy: 0, group: [] };
  panState: PanState = { active: false, moved: false, startX: 0, startY: 0 };
  selectionState: SelectionState = {
    active: false, startX: 0, startY: 0, currentX: 0, currentY: 0,
    style: { left: '0px', top: '0px', width: '0px', height: '0px' }
  };
  pendingLink: PendingLink | null = null;
  snappedPort: any = null;

  private hideToolbarTimer: any = null;
  private nodeHideTimer: any = null;

  // Correction : Flag pour demander le centrage après l'init
  private shouldCenterOnStart = false;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    public readonly viewport: GflowViewportService,
    public readonly state: GflowStateService,
    private readonly renderer: GflowRendererService,
    private confirmationService: ConfirmationService
  ) { }

  get links(): GFlowLink[] { return this.state.links; }
  get nodes(): GFlowNode[] { return this.state.nodes; }
  get ox(): number { return this.viewport.ox; }
  get oy(): number { return this.viewport.oy; }
  get scale(): number { return this.viewport.scale; }
  get baseStep(): number { return this.viewport.baseStep; }
  get baseDot(): number { return this.viewport.baseDot; }
  get dotR(): number { return this.viewport.baseDot; }
  get nodeSize(): number { return this.viewport.nodeSize; }
  get pendingPreviewD(): string { return this.renderer.previewPath; }
  get canUndo(): boolean { return false; }
  get canRedo(): boolean { return false; }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    if (event.key === 'Delete') {
      this.onDeleteFromPanel();
    }
  }

  onDeleteFromPanel() {
    const nodesToDelete = this.nodes.filter(n => n.selected || n.id === this.focusedNode?.id);
    const linkToDelete = this.focusedLink;

    const deletableNodes = nodesToDelete.filter(n => n.type !== 'start');
    const startNodeSelected = nodesToDelete.some(n => n.type === 'start');

    if (deletableNodes.length === 0 && !linkToDelete) {
      if (startNodeSelected) {
        this.messageService.add({ severity: 'warn', summary: 'Impossible', detail: 'Le nœud de départ ne peut pas être supprimé.' });
      }
      return;
    }

    const message = deletableNodes.length > 0
      ? `Voulez-vous vraiment supprimer ${deletableNodes.length > 1 ? 'ces éléments' : 'ce nœud'} ?`
      : 'Voulez-vous supprimer ce lien ?';

    this.confirmationService.confirm({
      message: message,
      header: 'Confirmation de suppression',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonProps: { size: "small", severity: "danger", text: true },
      rejectButtonProps: { size: "small", severity: "secondary", text: true },
      accept: () => {
        this.performDeletion(deletableNodes, linkToDelete);
      }
    });
  }

  private performDeletion(nodes: GFlowNode[], link: GFlowLink | null) {
    if (nodes.length > 0) {
      nodes.forEach(n => {
        if (n.type !== 'start') {
          this.state.deleteNode(n.id);
        }
      });
      this.focusNode(null);
    }

    if (link) {
      this.state.removeLink(link.id);
      this.focusLink(null);
    }

    this.afterGraphChange();
    this.closeConfig();
    this.messageService.add({ severity: 'info', summary: 'Supprimé', detail: 'Élément(s) supprimé(s)' });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.flow.id = id;
      this.loadFlowData(id);
    } else {
      // Correction : Création automatique du nœud Start pour un nouveau flow
      this.state.addNode('start', 0, 0);
      this.shouldCenterOnStart = true;
    }
  }

  ngAfterViewInit(): void {
    this.renderer.initialize(this.viewportRef.nativeElement, () => this.cdr.markForCheck());
    this.refreshFocusedInputMap();
    this.renderer.schedule();
    this.updateCursor();

    // Correction : Centrage de la caméra si demandé (nouveau flow)
    if (this.shouldCenterOnStart) {
      // Petit délai pour laisser le DOM se construire (taille viewport)
      setTimeout(() => {
        const startNode = this.nodes.find(n => n.type === 'start');
        if (startNode) {
          this.viewport.centerOn(startNode.x, startNode.y, this.nodeWidth(startNode), this.nodeHeight(startNode));
          this.renderer.schedule();
          this.cdr.detectChanges();
        }
        this.shouldCenterOnStart = false;
      }, 0);
    }
  }

  ngOnDestroy(): void {
    this.renderer.dispose();
    if (this.hideToolbarTimer) clearTimeout(this.hideToolbarTimer);
    if (this.nodeHideTimer) clearTimeout(this.nodeHideTimer);
  }

  loadFlowData(id: string) {
    this.apiService.get<any>(`flows/${id}`).subscribe({
      next: (data: any) => {
        this.flow.title = data.name;
        this.flow.description = data.description;

        if (data.data) {
          const rawNodes = data.data.nodes || [];
          this.state.nodes = rawNodes.map((n: any) => {
            const type = n.type as NodeType;
            const definition = NODE_DEFINITION_MAP[type];
            const configComponent = definition ? definition.create().configComponent : null;

            return {
              ...n,
              inputs: n.inputs || [],
              outputs: n.outputs || [],
              entries: n.entries || [],
              exits: n.exits || [],
              config: n.config || {},
              selected: false,
              focused: false,
              x: Number(n.x),
              y: Number(n.y),
              configComponent: configComponent
            };
          });

          this.state.links = data.data.links || [];

          if (data.data.viewport) {
            this.viewport.ox = Number(data.data.viewport.x);
            this.viewport.oy = Number(data.data.viewport.y);
            this.viewport.scale = Number(data.data.viewport.scale);
          }

          // Correction : Si le flux chargé n'a pas de start, on l'ajoute
          if (!this.state.hasStart()) {
            this.state.addNode('start', 0, 0);
            this.shouldCenterOnStart = true;
          }

          // Si on a ajouté un start au chargement, on centre
          if (this.shouldCenterOnStart) {
            setTimeout(() => {
              const startNode = this.nodes.find(n => n.type === 'start');
              if (startNode) {
                this.viewport.centerOn(startNode.x, startNode.y, this.nodeWidth(startNode), this.nodeHeight(startNode));
                this.renderer.schedule();
              }
            }, 0);
          }

          this.renderer.schedule();
          this.isDirty = false;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger le flux' });
        this.router.navigate(['/flows']);
      }
    });
  }

  onSave() {
    const payload = {
      name: this.flow.title,
      description: this.flow.description || '',
      data: {
        nodes: this.state.nodes,
        links: this.state.links,
        viewport: {
          x: this.viewport.ox,
          y: this.viewport.oy,
          scale: this.viewport.scale
        }
      }
    };

    this.saveFlow.emit(payload);

    if (this.flow.id) {
      this.apiService.put(`flows/${this.flow.id}`, payload).subscribe({
        next: (res: any) => {
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Flux mis à jour' });
          this.isDirty = false;
        },
        error: (err: any) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la sauvegarde' });
          console.error(err);
        }
      });
    } else {
      this.apiService.post(`flows/`, payload).subscribe({
        next: (res: any) => {
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Flux créé' });
          this.isDirty = false;
          if (res.id || res._id) {
            this.flow.id = res.id || res._id;
            this.router.navigate(['/flows', this.flow.id], { replaceUrl: true });
          }
        },
        error: (err: any) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la création' });
          console.error(err);
        }
      });
    }
  }

  startEditingTitle(event: MouseEvent) {
    event.stopPropagation();
    this.isEditingTitle = true;
    this.cdr.detectChanges();
    if (this.titleInput) {
      this.titleInput.nativeElement.focus();
      this.titleInput.nativeElement.select();
    }
  }

  stopEditingTitle() {
    if (!this.isEditingTitle) return;
    this.isEditingTitle = false;
    this.isDirty = true;
  }

  onTitleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.titleInput.nativeElement.blur();
    }
  }

  setTool(tool: ToolType) { this.currentTool = tool; this.updateCursor(); }
  undo() { this.afterGraphChange(); }
  redo() { this.afterGraphChange(); }

  private updateCursor() {
    const el = this.viewportRef.nativeElement;
    el.style.cursor = (this.currentTool === 'pan') ? (this.worldDragging ? 'grabbing' : 'grab') : 'default';
  }

  onWheel(event: WheelEvent) {
    this.viewport.applyWheel(event);
    this.renderer.schedule();
  }

  onViewportMouseDown(ev: MouseEvent) {
    this.skipNextClick = false;

    if (ev.button !== 0) return;
    if (this.dragState.active || this.pendingLink) return;
    if ((ev.target as HTMLElement)?.closest('.input-port, .output-port, .entry-port, .exit-port')) return;

    if (this.currentTool === 'pan') this.beginPan(ev);
    else this.beginSelection(ev);
  }

  onViewportClick() {
    if (this.skipNextClick) { this.skipNextClick = false; return; }
    this.closeConfig();
    this.deselectAll();
  }

  onMouseMove(ev: MouseEvent) {
    if (this.panState.active && (ev.buttons & 1)) { this.updatePan(ev); return; }
  }

  onDocMouseMove(ev: MouseEvent) {
    if (this.dragState.active && this.dragState.node) { this.updateDrag(ev); return; }

    if (this.pendingLink) {
      const world = this.viewport.toWorld(ev.clientX, ev.clientY);
      const snap = this.findSnappablePort(ev.clientX, ev.clientY, this.pendingLink.from);
      if (snap) {
        if (this.snappedPort && this.snappedPort.element !== snap.element) {
          this.snappedPort.element.classList.remove('is-snapped');
        }
        snap.element.classList.add('is-snapped');
        this.snappedPort = snap;
        this.pendingLink = { ...this.pendingLink, mouse: snap.center };
      } else {
        if (this.snappedPort) { this.snappedPort.element.classList.remove('is-snapped'); this.snappedPort = null; }
        this.pendingLink = { ...this.pendingLink, mouse: world };
      }
      this.renderer.updatePendingLink(this.pendingLink);
    }

    if (this.selectionState.active) this.updateSelection(ev);
  }

  onDocMouseUp(ev: MouseEvent) {
    if (this.panState.active) { this.endPan(); }
    if (this.dragState.active && this.dragState.node) { this.endDrag(); }
    if (this.pendingLink) { this.endLink(ev); }
    if (this.selectionState.active) { this.endSelection(); }
    this.renderer.schedule();
  }

  private beginPan(ev: MouseEvent) {
    this.panState = { active: true, moved: false, startX: ev.clientX, startY: ev.clientY };
    this.worldDragging = true; this.updateCursor();
  }
  private updatePan(ev: MouseEvent) {
    if (!this.panState.moved) {
      const dx = Math.abs(ev.clientX - this.panState.startX);
      const dy = Math.abs(ev.clientY - this.panState.startY);
      if (dx + dy > CLICK_TO_DRAG_THRESHOLD_PX) this.panState.moved = true;
    }
    this.viewport.moveBy(ev.movementX, ev.movementY);
    this.renderer.schedule();
  }
  private endPan() {
    if (this.panState.moved) this.skipNextClick = true;
    this.panState.active = false; this.worldDragging = false; this.updateCursor();
  }

  private beginSelection(ev: MouseEvent) {
    if (!ev.shiftKey && !ev.ctrlKey) this.deselectAll();
    const bounds = this.viewportRef.nativeElement.getBoundingClientRect();
    const x = ev.clientX - bounds.left;
    const y = ev.clientY - bounds.top;
    this.selectionState = {
      active: true,
      startX: x, startY: y, currentX: x, currentY: y,
      style: { left: `${x}px`, top: `${y}px`, width: '0px', height: '0px' }
    };
  }
  private updateSelection(ev: MouseEvent) {
    const bounds = this.viewportRef.nativeElement.getBoundingClientRect();
    const x = ev.clientX - bounds.left;
    const y = ev.clientY - bounds.top;
    this.selectionState.currentX = x; this.selectionState.currentY = y;

    const minX = Math.min(this.selectionState.startX, x);
    const minY = Math.min(this.selectionState.startY, y);
    const width = Math.abs(x - this.selectionState.startX);
    const height = Math.abs(y - this.selectionState.startY);

    this.selectionState.style = { left: `${minX}px`, top: `${minY}px`, width: `${width}px`, height: `${height}px` };

    const worldTL = this.viewport.toWorld(bounds.left + minX, bounds.top + minY);
    const worldBR = this.viewport.toWorld(bounds.left + minX + width, bounds.top + minY + height);
    const sel = {
      x: Math.min(worldTL.x, worldBR.x),
      y: Math.min(worldTL.y, worldBR.y),
      w: Math.abs(worldBR.x - worldTL.x),
      h: Math.abs(worldBR.y - worldTL.y)
    };

    this.nodes.forEach(n => {
      const nw = this.nodeWidth(n), nh = this.nodeHeight(n);
      const hit = (sel.x < n.x + nw && sel.x + sel.w > n.x && sel.y < n.y + nh && sel.y + sel.h > n.y);
      if (hit) n.selected = true;
    });
    this.cdr.markForCheck();
  }
  private endSelection() {
    const dx = Math.abs(this.selectionState.currentX - this.selectionState.startX);
    const dy = Math.abs(this.selectionState.currentY - this.selectionState.startY);

    if (dx > 3 || dy > 3) {
      this.skipNextClick = true;
    }

    this.selectionState.active = false;
    this.selectionState.style = { left: '0', top: '0', width: '0', height: '0' };
  }

  startDrag(ev: MouseEvent, node: GFlowNode) {
    if ((ev.target as HTMLElement)?.closest('.input-port, .output-port, .entry-port, .exit-port')) return;
    ev.preventDefault(); ev.stopPropagation();

    if (!node.selected) { this.deselectAll(); node.selected = true; }
    this.focusNode(node);

    const world = this.viewport.toWorld(ev.clientX, ev.clientY);
    this.dragState = {
      active: true, node,
      startX: node.x, startY: node.y,
      dx: world.x - node.x, dy: world.y - node.y,
      group: []
    };

    this.nodes.forEach(other => {
      if (other.selected && other.id !== node.id) this.dragState.group.push({ node: other, x0: other.x, y0: other.y });
    });
  }

  private updateDrag(ev: MouseEvent) {
    const n = this.dragState.node!;
    const world = this.viewport.toWorld(ev.clientX, ev.clientY);

    n.x = world.x - this.dragState.dx;
    n.y = world.y - this.dragState.dy;

    const dx = n.x - this.dragState.startX;
    const dy = n.y - this.dragState.startY;

    for (const g of this.dragState.group) { g.node.x = g.x0 + dx; g.node.y = g.y0 + dy; }

    this.renderer.schedule();
  }

  private endDrag() {
    const n = this.dragState.node!;
    n.x = this.viewport.snap(n.x);
    n.y = this.viewport.snap(n.y);
    for (const g of this.dragState.group) { g.node.x = this.viewport.snap(g.node.x); g.node.y = this.viewport.snap(g.node.y); }
    this.resolveCollisions(n);
    this.dragState = this.blankDragState();
    this.isDirty = true;
  }

  private blankDragState(): DragState {
    return { active: false, node: null, startX: 0, startY: 0, dx: 0, dy: 0, group: [] };
  }

  onDocMouseDown(ev: MouseEvent) {
    const target = ev.target as HTMLElement;
    const portEl = target?.closest('.input-port, .output-port, .entry-port, .exit-port') as HTMLElement | null;
    if (!portEl) return;

    ev.preventDefault(); ev.stopPropagation();
    this.skipNextClick = true;

    const host = portEl.closest('[data-node-id]') as HTMLElement;
    const nodeId = host.getAttribute('data-node-id')!;
    const portIndex = Number(portEl.getAttribute('data-index') || 0);

    let kind: PortKind = 'in';
    if (portEl.classList.contains('output-port')) kind = 'out';
    else if (portEl.classList.contains('entry-port')) kind = 'entry';
    else if (portEl.classList.contains('exit-port')) kind = 'exit';

    const world = this.viewport.toWorld(ev.clientX, ev.clientY);
    this.pendingLink = { from: { nodeId, portIndex, kind }, mouse: world };
    this.renderer.updatePendingLink(this.pendingLink);
  }

  private endLink(ev: MouseEvent) {
    if (this.snappedPort) { this.connectToSnap(); }
    else {
      const portEl = (ev.target as HTMLElement)?.closest('.input-port, .output-port, .entry-port, .exit-port') as HTMLElement | null;
      if (portEl) this.connectToPort(portEl);
      else this.createNodeFromDrop(this.pendingLink!);
    }

    if (this.snappedPort) { this.snappedPort.element.classList.remove('is-snapped'); this.snappedPort = null; }
    this.pendingLink = null;
    this.renderer.updatePendingLink(null);
  }

  private connectToPort(portEl: HTMLElement) {
    const host = portEl.closest('[data-node-id]') as HTMLElement;
    const nodeId = host.getAttribute('data-node-id')!;
    const portIndex = Number(portEl.getAttribute('data-index') || 0);
    let kind: PortKind = 'in';
    if (portEl.classList.contains('output-port')) kind = 'out';
    else if (portEl.classList.contains('entry-port')) kind = 'entry';
    else if (portEl.classList.contains('exit-port')) kind = 'exit';

    const to: PortRef = { nodeId, portIndex, kind };
    this.safeCreateLink(this.pendingLink!.from, to);
  }

  private createNodeFromDrop(pending: PendingLink) {
    const inverse: Record<PortKind, PortKind> = { out: 'in', in: 'out', entry: 'exit', exit: 'entry' };
    const targetKind = inverse[pending.from.kind];

    const x = this.viewport.snap(pending.mouse.x - this.nodeSize / 2);
    const y = this.viewport.snap(pending.mouse.y - this.nodeSize / 2);

    const newNode = this.state.addNode('new', x, y);

    const hasEntries = (newNode.entries?.length ?? 0) > 0;
    const hasExits = (newNode.exits?.length ?? 0) > 0;
    if ((targetKind === 'entry' && !hasEntries) || (targetKind === 'exit' && !hasExits)) {
      this.focusNode(newNode); this.afterGraphChange(); return;
    }

    const newPort: PortRef = { nodeId: newNode.id, portIndex: 0, kind: targetKind };

    if (['out', 'entry'].includes(pending.from.kind)) this.safeCreateLink(pending.from, newPort);
    else this.safeCreateLink(newPort, pending.from);

    this.simplifyNewNode(newNode, targetKind);
    this.focusNode(newNode);
  }

  private simplifyNewNode(node: GFlowNode, used: PortKind) {
    node.entries = used === 'entry' ? node.entries : [];
    node.exits = used === 'exit' ? node.exits : [];
    node.inputs = used === 'in' ? node.inputs : [];
    node.outputs = used === 'out' ? node.outputs : [];
  }

  private safeCreateLink(a: PortRef, b: PortRef) {
    if (a.nodeId === b.nodeId && a.kind === b.kind && a.portIndex === b.portIndex) return;

    const dup = this.links.some(l =>
      l.src.nodeId === a.nodeId && l.src.kind === a.kind && l.src.portIndex === a.portIndex &&
      l.dst.nodeId === b.nodeId && l.dst.kind === b.kind && l.dst.portIndex === b.portIndex
    );
    if (dup) return;

    this.state.createLinkBetween(a, b);
    this.afterGraphChange();
  }

  private connectToSnap() {
    if (!this.pendingLink || !this.snappedPort) return;
    this.safeCreateLink(this.pendingLink.from, this.snappedPort.ref);
  }

  private findSnappablePort(mouseX: number, mouseY: number, source: PortRef) {
    const vp = this.viewportRef.nativeElement;
    let selector = ''; let target: PortKind;
    if (source.kind === 'out') { selector = '.input-port'; target = 'in'; }
    else if (source.kind === 'in') { selector = '.output-port'; target = 'out'; }
    else if (source.kind === 'entry') { selector = '.exit-port'; target = 'exit'; }
    else { selector = '.entry-port'; target = 'entry'; }

    const candidates = vp.querySelectorAll(selector);
    let closest: any = null; let min = Infinity;

    candidates.forEach((el: any) => {
      const element = el as HTMLElement;
      const nodeEl = element.closest('[data-node-id]'); if (!nodeEl) return;
      const nodeId = nodeEl.getAttribute('data-node-id'); if (nodeId === source.nodeId) return;

      const r = element.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.hypot(mouseX - cx, mouseY - cy);
      if (d < SNAP_THRESHOLD_PX && d < min) {
        min = d;
        const idx = Number(element.getAttribute('data-index') || 0);
        closest = { element, ref: { nodeId: nodeId!, portIndex: idx, kind: target }, center: this.viewport.toWorld(cx, cy) };
      }
    });
    return closest;
  }

  focusNode(node: GFlowNode | null) {
    this.focusedNode = node;
    this.focusedLink = null;
    this.nodes.forEach(n => n.focused = n.id === node?.id);
    this.refreshFocusedInputMap();
    this.cdr.markForCheck();
  }

  focusLink(link: GFlowLink | null) {
    this.focusedLink = link;
    this.focusedNode = null;
    this.nodes.forEach(n => { n.focused = false; n.selected = false; });
    if (link) this.openConfig();
    this.cdr.markForCheck();
  }

  centerNode(node: GFlowNode) { this.focusNode(node); this.openConfig(); this.renderer.schedule(); }

  openConfig() { this.configOpen = true; this.refreshFocusedInputMap(); }
  closeConfig() { this.configOpen = false; this.focusNode(null); this.focusLink(null); }

  onNodeConfigChange(evt: unknown) {
    if (!this.focusedNode) return;
    if (this.isSwitchConfigEvent(evt) && evt.type === 'cases-changed') {
      // hook switch…
    }
    // Correction : Propagation de la nouvelle config vers les sorties
    this.state.recomputeDownstreamFrom(this.focusedNode.id);

    // Correction : Force la mise à jour du DOM pour que les nouveaux ports soient créés AVANT le tracé
    this.cdr.detectChanges();

    this.afterGraphChange();
  }

  private isSwitchConfigEvent(e: any): e is SwitchConfigEvent {
    return e && (e.type === 'cases-changed' || e.type === 'config-updated') && 'config' in e;
  }

  private afterGraphChange() {
    this.refreshFocusedInputMap();
    this.cdr.markForCheck();
    this.renderer.schedule();
    this.isDirty = true;
  }
  private refreshFocusedInputMap() {
    this.focusedInputMap = this.focusedNode ? this.state.aggregatedInputMap(this.focusedNode.id) : null;
  }

  togglePalette(ev?: MouseEvent) { if (ev) ev.stopPropagation(); this.paletteOpen = !this.paletteOpen; }

  addFromPalette(item: PaletteItem) {
    const rect = this.viewportRef.nativeElement.getBoundingClientRect();
    const vx = this.paletteOpen ? this.paletteWidth + 80 : rect.width * 0.5;
    const vy = rect.height * 0.5;
    const w = this.viewport.toWorld(rect.left + vx, rect.top + vy);
    this.addNodeAt(item.type, w.x, w.y);
  }

  onPaletteDragStart(ev: DragEvent, item: PaletteItem) {
    ev.dataTransfer?.setData('application/x-node', JSON.stringify(item));
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'copy';
  }
  onWorldDragOver(ev: DragEvent) {
    if (ev.dataTransfer?.types?.includes('application/x-node')) { ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; }
  }

  onWorldDrop(event: DragEvent) {
    const raw = event.dataTransfer?.getData('application/x-node');
    if (!raw) return;
    event.preventDefault();

    const item: PaletteItem = JSON.parse(raw);
    const world = this.viewport.toWorld(event.clientX, event.clientY);

    const hitLink = this.findLinkAt(world.x, world.y);

    if (hitLink) {
      this.splitLinkWithNode(hitLink, item.type, world.x, world.y);
    } else {
      this.addNodeAt(item.type, world.x, world.y);
    }
  }

  onLinkClick(event: MouseEvent, link: GFlowLink) {
    event.stopPropagation();
    this.focusLink(link);
  }

  private findLinkAt(x: number, y: number): GFlowLink | null {
    const threshold = 16;

    for (const link of this.links) {
      if (link.mid) {
        const dist = Math.hypot(link.mid.x - x, link.mid.y - y);
        if (dist < threshold * 3) {
          return link;
        }
      }
    }

    return null;
  }

  private splitLinkWithNode(link: GFlowLink, nodeType: NodeType, x: number, y: number) {
    const nodeX = this.viewport.snap(x - this.nodeSize / 2);
    const nodeY = this.viewport.snap(y - this.nodeSize / 2);
    const newNode = this.state.addNode(nodeType, nodeX, nodeY);

    const hasInput = newNode.inputs && newNode.inputs.length > 0;
    const hasOutput = newNode.outputs && newNode.outputs.length > 0;

    if (!hasInput || !hasOutput) {
      return;
    }

    this.state.removeLink(link.id);

    this.state.createLinkBetween(link.src, {
      nodeId: newNode.id,
      kind: 'in',
      portIndex: 0
    });

    this.state.createLinkBetween({
      nodeId: newNode.id,
      kind: 'out',
      portIndex: 0
    }, link.dst);

    this.focusNode(newNode);
    this.openConfig();
    this.renderer.schedule();
  }

  private addNodeAt(type: any, wx: number, wy: number) {
    // Si on essaie d'ajouter un start et qu'il en existe déjà un, on bloque
    if (type === 'start' && this.state.hasStart()) {
      this.messageService.add({ severity: 'warn', summary: 'Impossible', detail: 'Le flux possède déjà un point de départ.' });
      return;
    }
    const x = this.viewport.snap(wx - this.nodeSize / 2);
    const y = this.viewport.snap(wy - this.nodeSize / 2);
    const node = this.state.addNode(type, x, y);
    this.focusNode(node); this.openConfig(); this.renderer.schedule();
  }

  nodeWidth(_n: GFlowNode): number { return 220; }
  nodeHeight(n: GFlowNode): number {
    const h0 = 60, named = n.outputs.filter(o => !!o.name).length;
    return named > 0 ? h0 + (named * 44) + 10 : 80;
  }

  private resolveCollisions(active: GFlowNode) {
    const margin = this.baseStep;
    const A = { x: active.x, y: active.y, w: this.nodeWidth(active), h: this.nodeHeight(active) };
    const hit = { x: A.x - margin / 2, y: A.y - margin / 2, w: A.w + margin, h: A.h + margin };

    for (const other of this.nodes) {
      if (other.id === active.id) continue;
      if (this.dragState.group.some(g => g.node.id === other.id)) continue;

      const B = { x: other.x, y: other.y, w: this.nodeWidth(other), h: this.nodeHeight(other) };
      const overlap = (hit.x < B.x + B.w && hit.x + hit.w > B.x && hit.y < B.y + B.h && hit.y + hit.h > B.y);
      if (!overlap) continue;

      const cA = { x: A.x + A.w / 2, y: A.y + A.h / 2 };
      const cB = { x: B.x + B.w / 2, y: B.y + B.h / 2 };
      const dx = cB.x - cA.x, dy = cB.y - cA.y;
      const avgW = (A.w + B.w) / 2, avgH = (A.h + B.h) / 2;

      if (Math.abs(dx) / avgW > Math.abs(dy) / avgH) {
        other.x = this.viewport.snap(dx > 0 ? A.x + A.w + margin : A.x - B.w - margin);
      } else {
        other.y = this.viewport.snap(dy > 0 ? A.y + A.h + margin : A.y - B.h - margin);
      }
    }
  }

  private deselectAll() {
    this.nodes.forEach(n => n.selected = false);
    this.focusNode(null);
    this.focusLink(null);
    this.closeConfig();
  }

  exitHidden(node: GFlowNode) {
    return node.type === 'agent' &&
      this.links.some(l => (l.src.nodeId === node.id && ['out', 'in'].includes(l.src.kind)) ||
        (l.dst.nodeId === node.id && ['out', 'in'].includes(l.dst.kind)));
  }
  ioHidden(node: GFlowNode) {
    return node.type === 'agent' &&
      this.links.some(l => (l.src.nodeId === node.id && l.src.kind === 'exit') ||
        (l.dst.nodeId === node.id && l.dst.kind === 'exit'));
  }

  goBackNavigation() {
    if (this.navigateBack)
      this.router.navigate([this.navigateBack]);
  }

  trackByLinkId(_: number, link: GFlowLink) { return link.id; }

  get focusedInputLinks(): GFlowLink[][] {
    return this.focusedNode?.inputs?.map((_, i) => this.state.inputLinks(this.focusedNode!.id, i)) ?? [];
  }
  get focusedOutputLinks(): GFlowLink[][] {
    return this.focusedNode?.outputs?.map((_, i) => this.state.outputLinks(this.focusedNode!.id, i)) ?? [];
  }
}