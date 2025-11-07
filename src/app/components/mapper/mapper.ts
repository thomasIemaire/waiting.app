import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AutoFocusModule } from 'primeng/autofocus';
import { TooltipModule } from 'primeng/tooltip';
import { KeyFilterModule } from 'primeng/keyfilter';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { label } from '@primeuix/themes/aura/metergroup';
import { InputWLabelComponent } from "../input-w-label/input-w-label.component";

class Node {
  constructor(public parent: Node | null, public label: string = '', public children: Node[] = [], public root: string = '') { }

  get key(): string {
    return (`${(this.parent?.key ?? this.root)}_${this.label}`).toUpperCase();
  }
}

type JsonObj = Record<string, unknown>;

function isPlainObject(v: unknown): v is JsonObj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function buildJson(nodes: Node[]): JsonObj {
  return nodes.reduce<JsonObj>((acc, node) => {
    const key = (node.label ?? '').trim();
    if (!key) return acc;

    const children = node.children ?? [];
    const value: unknown = children.length ? buildJson(children) : node.key;

    if (key in acc && isPlainObject(acc[key]) && isPlainObject(value)) {
      acc[key] = { ...(acc[key] as JsonObj), ...(value as JsonObj) };
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
}

@Component({
  selector: 'app-mapper',
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, AutoFocusModule, TooltipModule, KeyFilterModule, Toast, InputWLabelComponent],
  templateUrl: './mapper.html',
  styleUrls: [ './mapper.scss' ],
  standalone: true,
  providers: [MessageService]
})
export class Mapper {
  @Input() label: string = 'Schéma';
  @Input() required: boolean = false;
  
  @Input() root: string = 'root';

  private rootNode: Node = new Node(null, '', [], this.root);

  @Input() mapper: Node[] = [ this.rootNode ];

  @Input() json?: any;

  @Input() isRoot: boolean = false;

  @Output() jsonChange = new EventEmitter<Record<string, unknown>>();

  @Output() keysChange = new EventEmitter<string[]>();

  labelRegex: RegExp = /^[a-z_]+$/;

  private messageService: MessageService = inject(MessageService);

  ngOnInit() {
    this.reloadJson();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['root'])
      this.mapper.forEach(node => {
        if (node.parent === null) node.root = this.root;
      });
      this.reloadJson();
  }

  private reloadJson() {
    if (this.json) {
      if (Object.keys(this.json).length)
        this.mapper = this.buildMapper(this.json);
      else if (this.isRoot)
        this.mapper = [ this.rootNode ];
    }
  }

  private buildMapper(
    obj: Record<string, unknown>,
    parent: Node | null = null
  ): Node[] {
    return Object.entries(obj).map(([key, value]) => {
      const node = new Node(parent, key, [], this.root);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        node.children = this.buildMapper(value as Record<string, unknown>, node);
      }
      return node;
    });
  }

  public addNode(parent: Node | null): void {
    const node = new Node(parent);
    this.mapper.push(node);
    if (parent === null) {
      node.root = this.root;
    }
  }

  public addChild(node: Node): void {
    (node.children ??= []).push(new Node(node));
  }

  public copyNode(node: Node): void {
    window.navigator.clipboard.writeText(node.key);
    this.messageService.add({severity:'success', summary: 'Clé copiée', detail: `${node.key} a été copié dans le presse-papier.`});
  }

  public removeNodeIfEmpty(node: Node): void {
    if ((node.label ?? '').trim() === '' && !(this.isRoot && this.isFirstNode(node))) {
      const i = this.mapper.indexOf(node);
      if (i > -1) this.mapper.splice(i, 1);
      this.emitJson();
    } else if ((node.label ?? '').trim() === '' && this.isRoot && this.isFirstNode(node)) {
      node.children = [];
    }
  }

  public isLastNode(node: Node): boolean {
    return node === this.mapper[this.mapper.length - 1];
  }

  public isFirstNode(node: Node): boolean {
    return node === this.mapper[0];
  }

  public emitJson(): void {
    this.jsonChange.emit(buildJson(this.mapper));
    this.keysChange.emit(this.getLeafKeys());
  }

  public getLeafKeys(): string[] {
    const keys: any[] = [];
    const traverse = (nodes: Node[]) => {
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        } else {
          keys.push({ label: node.label, value: node.key });
        }
      }
    };
    traverse(this.mapper);    
    return keys;
  }

  public onChildJsonChange(): void {
    this.emitJson();
  }

  public trackByIndex = (_: number, __: Node) => _;
}