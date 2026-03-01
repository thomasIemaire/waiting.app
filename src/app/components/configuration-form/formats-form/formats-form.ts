import {
  Component,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext'; // Correction Import
import { ButtonModule } from 'primeng/button'; // Correction Import
import { AutoFocusModule } from 'primeng/autofocus';

type Token = { text: string; key?: string };

@Component({
  selector: 'app-formats-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    AutoFocusModule,
    TooltipModule,
  ],
  templateUrl: './formats-form.html',
  styleUrls: ['./formats-form.scss'],
})
export class FormatsForm implements OnChanges {
  @Input() first = false;
  @Input() keys: any[] = [];

  // Utilisation d'un modèle interne pour ngModel
  public internalFormat = '';
  public tokens: Token[] = [];
  public edit = false;

  @Output() formatChange = new EventEmitter<string>();
  @Output() remove = new EventEmitter<void>();

  @Input()
  set format(value: string | any) {
    // Gestion robuste : accepte string ou objet {format: string}
    let valStr = '';
    if (typeof value === 'string') {
      valStr = value;
    } else if (value && typeof value === 'object' && 'format' in value) {
      valStr = value.format;
    }

    // Mise à jour seulement si changement pour éviter boucles
    if (valStr !== this.internalFormat) {
      this.internalFormat = valStr;
      this.recomputeTokens();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Si les clés changent, on recalcule les labels des tokens
    if (changes['keys'] && !changes['keys'].firstChange) {
      this.recomputeTokens();
    }
  }

  public validateEdit(): void {
    this.edit = false;
    this.onFormatChange();
  }

  public onFormatChange() {
    this.recomputeTokens();
    this.formatChange.emit(this.internalFormat);
  }

  private recomputeTokens() {
    this.tokens = this.tokensOf(this.internalFormat);
  }

  private tokensOf(format: string): Token[] {
    if (!format) return [];
    const out: Token[] = [];
    const re = /\{([^{}]+)\}/g; // Regex pour capturer {variable}
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = re.exec(format)) !== null) {
      // Texte avant le token
      const plain = format.slice(lastIdx, match.index);
      if (plain) out.push({ text: plain });

      // Le token (la clé)
      const key = match[1].trim();
      const keyObj = this.keys.find(k => k.value === key);
      const label = keyObj ? keyObj.label : key;

      out.push({ text: this.keyToLabel(label), key });

      lastIdx = re.lastIndex;
    }

    // Reste du texte à la fin
    if (lastIdx < format.length) {
      out.push({ text: format.slice(lastIdx) });
    }

    return out;
  }

  private keyToLabel(key: string): string {
    if (!key) return '';
    const parts = key.split(/[_\s]+/).filter(Boolean);
    return (parts[parts.length - 1] ?? key).toLowerCase();
  }
}