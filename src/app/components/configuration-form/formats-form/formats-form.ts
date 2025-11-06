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
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { AutoFocusModule } from 'primeng/autofocus';

type FormatObj = { format: string };
type Token = { text: string; key?: string };

@Component({
  selector: 'app-formats-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputText,
    Button,
    AutoFocusModule,
    TooltipModule,
  ],
  templateUrl: './formats-form.html',
  styleUrls: ['./formats-form.scss'],
})
export class FormatsForm implements OnChanges {
  @Input() first = false;
  @Input() keys: any[] = [];

  @Output() formatChange = new EventEmitter<string>();
  @Output() remove = new EventEmitter<void>();

  private _format = '';
  public tokens: Token[] = [];
  public edit = false;

  @Input()
  set format(value: string | FormatObj | null | undefined) {
    if (typeof value === 'string') {
      this._format = value;
    } else if (value && typeof value === 'object' && 'format' in value) {
      this._format = (value as FormatObj).format;
    } else {
      this._format = '';
    }
    this.recomputeTokens();
  }

  get format(): string {
    return this._format;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['keys'] && !changes['keys'].firstChange) {
      this.recomputeTokens();
    }
  }

  onFormatChange() {
    this.recomputeTokens();
    this.emit();
  }

  private emit() {
    this.formatChange.emit(this._format);
  }

  private recomputeTokens() {
    this.tokens = this.tokensOf(this._format);
  }

  tokensOf(format: string): Token[] {
    if (!format) return [];
    const out: Token[] = [];
    const re = /\{([^{}]+)\}/g;
    let lastIdx = 0;
    let m: RegExpExecArray | null;

    while ((m = re.exec(format)) !== null) {
      let plain = format.slice(lastIdx, m.index);
      if (plain) out.push({ text: plain });

      const key = m[1].trim();
      const value = this.keys.find(k => k.value === key)?.label || key;
      out.push({ text: this.keyToLabel(value), key });

      lastIdx = re.lastIndex;
    }

    if (lastIdx < format.length) {
      let tail = format.slice(lastIdx);
      tail = tail.replace(/^\s+/, ' ');
      out.push({ text: tail });
    }

    return out;
  }

  private keyToLabel(key: string): string {
    const parts = key.split(/[_\s]+/).filter(Boolean);
    const last = parts[parts.length - 1] ?? key;
    return last.toLowerCase();
  }
}
