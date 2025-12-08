import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";

@Component({
    selector: 'app-document-select-sections',
    imports: [CommonModule, FormsModule],
    template: `
    <div class="document-select-sections__wrapper">
        <div class="group-cells" *ngFor="let _ of [].constructor(rows); let r = index">
            
            <div class="cell" 
                [class.color-1]="selectedCells[r * cols + c] === 1"
                [class.color-2]="selectedCells[r * cols + c] === 2"
                *ngFor="let _ of [].constructor(cols); let c = index"
                (click)="toggleCell(r, c)">
            </div>

        </div>
    </div>`,
    styles: `
    .document-select-sections__wrapper {
        display: flex;
        flex-direction: column;
        aspect-ratio: 10/16;
        height: 128px;
        gap: .25rem;

        .group-cells {
            flex: 1;
            display: flex;
            gap: .25rem;

            .cell {
                flex: 1;
                height: 100%;
                border-radius: .25rem;
                cursor: pointer;
                background: var(--p-inputtext-background);
                border: 1px solid var(--p-inputtext-border-color);
                box-shadow: var(--p-inputtext-shadow);

                transition: background-color .1s, transform .1s;
                
                &:hover {
                    background-color: var(--primary-color-100);
                    transform: scale(1.1);
                }

                &:active {
                    transform: scale(.9);
                }

                &.color-1 {
                    background-color: var(--primary-color-300);
                }

                &.color-2 {
                    background-color: var(--primary-color-600);
                }
            }
        }

        > :first-child {
            > :first-child {
                border-top-left-radius: .5rem;
            }
            > :last-child {
                border-top-right-radius: .5rem;
            }
        }

        > :last-child {
            > :first-child {
                border-bottom-left-radius: .5rem;
            }
            > :last-child {
                border-bottom-right-radius: .5rem;
            }
        }
    }
    `
})
export class DocumentSelectSectionsComponent {
    public rows: number = 3;
    public cols: number = 3;

    public selectedCells: (0 | 1 | 2)[] = Array(this.rows * this.cols).fill(0);

    public toggleCell(row: number, col: number): void {
        const index = row * this.cols + col;
        this.selectedCells[index] = (this.selectedCells[index] + 1) % 3 as 0 | 1 | 2;
    }
}