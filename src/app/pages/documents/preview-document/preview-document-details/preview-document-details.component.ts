import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { Form, FormsComponent } from "../../../../components/forms/forms.component";
import { TableFormsComponent, TableForm } from "../../../../components/table-forms/table-forms.component";
import { DeviceService } from "../../../../core/services/device.service";

@Component({
    selector: 'app-preview-document-details',
    imports: [TableFormsComponent, FormsComponent],
    template: `
    <div class="preview-document-details__wrapper" [class.mobile]="!deviceService.isDesktopSize">
        <app-forms [(form)]="globalForm" class="extended" />
        <app-table-forms [(form)]="lineForm" class="extended" />
        <app-forms [(form)]="vatForm" />
        <app-forms [(form)]="amountsForm" />
    </div>
    `,
    styleUrls: ['./preview-document-details.component.scss']
})
export class PreviewDocumentDetailsComponent {
    @Input() data?: any;

    @Output() dataChange = new EventEmitter<any>();

    public globalForm!: Form;
    public lineForm!: TableForm;
    public vatForm!: Form;
    public amountsForm!: Form;

    public deviceService: DeviceService = inject(DeviceService);

    ngOnInit() {
        this.initForms();
    }

    ngOnChanges() {
        this.initForms();
    }

    private initForms(): void {
        this.lineForm = this.getLineForm();
        this.vatForm = this.getVatForm();
        this.amountsForm = this.getAmountsForm();
        this.globalForm = this.getGlobalForm();
    }

    private getGlobalForm(): Form {
        const analysis = this.data?.analysis?.extracted;
        return {
            label: 'Informations générales de la facture',
            columns: 2,
            items: [
                { label: 'Date', value: analysis?.invoice[0]?.date ?? '', recommended: true },
                { label: 'Échéance', value: analysis?.invoice[0]?.dueDate ?? '' },
                { label: 'Numéro de la facture', value: analysis?.invoice[0]?.number ?? '', recommended: true },
                { label: 'Numéro de commande', value: analysis?.order[0]?.number ?? '' },
                { label: 'Mode de règlement', value: analysis?.invoice[0]?.payment_method ?? '' },
                { label: 'Devise', value: analysis?.invoice[0]?.currency ?? '' }
            ]
        };
    }

    private getLineForm(): TableForm {
        const items = this.data?.analysis?.extracted?.items ?? [];
        const mappedRows = this.mapItemsToRows(items);

        return {
            label: 'Ligne(s) de la facture',
            cols: [
                { field: 'reference', header: 'Référence' },
                { field: 'label', header: 'Désignation' },
                { field: 'quantity', header: 'Quantité' },
                { field: 'unitPrice', header: 'Prix unitaire' },
                { field: 'totalExclTax', header: 'Total HT' },
                { field: 'taxRate', header: 'Taux de TVA' },
            ],
            rows: mappedRows
        };
    }

    /**
 * Parse un nombre "fr" depuis string:
 * - "50,000" -> 50
 * - "45,000    Px" -> 45
 * - "1 234,56" -> 1234.56
 */
    private parseFrNumber(input: unknown): number | null {
        if (input === null || input === undefined) return null;
        if (typeof input === 'number' && Number.isFinite(input)) return input;

        const s = String(input)
            .replace(/\u00A0/g, ' ')     // nbsp
            .trim();
        if (!s) return null;

        // garder uniquement un "token" numérique plausible (ex: "45,000    Px" -> "45,000")
        const match = s.match(/-?\d[\d\s.,]*/);
        if (!match) return null;

        const token = match[0]
            .replace(/\s+/g, '')        // remove spaces (thousands sep)
            .replace(',', '.');         // decimal comma -> dot

        const n = Number(token);
        return Number.isFinite(n) ? n : null;
    }

    /** Extrait un taux depuis "V20", "20%", "20,0" ... */
    private parseTaxRate(input: unknown): number | null {
        if (input === null || input === undefined) return null;
        if (typeof input === 'number' && Number.isFinite(input)) return input;

        const s = String(input).trim();
        if (!s) return null;

        const m = s.match(/(\d+(?:[.,]\d+)?)/);
        if (!m) return null;

        const n = Number(m[1].replace(',', '.'));
        return Number.isFinite(n) ? n : null;
    }

    private mapItemsToRows(items: any[]): any[] {
        const rows: any[] = [];

        for (const it of (items ?? [])) {
            const refRaw = it?.reference ?? "";
            const labelRaw = it?.description ?? "";

            const qty = this.parseFrNumber(it?.quantity);
            let unit = this.parseFrNumber(it?.unit_price_excl_tax);
            let ht = this.parseFrNumber(it?.line_total_excl_tax);

            // si ton API te donne parfois directement le montant de taxe
            const taxAmount = this.parseFrNumber(it?.tax_amount);
            const taxRate = this.parseTaxRate(it?.tax_rate); // ex "V20" -> 20

            // ignorer les lignes totalement vides
            const isEmpty =
                (!String(refRaw || "").trim()) &&
                (!String(labelRaw || "").trim()) &&
                (!qty || qty === 0) &&
                (!unit || unit === 0) &&
                (!ht || ht === 0) &&
                (!taxRate || taxRate === 0) &&
                (!taxAmount || taxAmount === 0);

            if (isEmpty) continue;

            // calculs manquants
            let unitCalculated = false;
            let htCalculated = false;

            if ((ht === null || ht === 0) && qty !== null && qty > 0 && unit !== null) {
                ht = qty * unit;
                htCalculated = true;
            }

            if ((unit === null || unit === 0) && qty !== null && qty > 0 && ht !== null) {
                unit = ht / qty;
                unitCalculated = true;
            }

            rows.push({
                items: {
                    reference: { value: String(refRaw || "").trim() },
                    label: { value: String(labelRaw || "").trim() },
                    quantity: { value: qty ?? "" },
                    unitPrice: { value: unit ?? "" },
                    totalExclTax: { value: ht ?? "" },
                    // si tu veux garder "V20" en affichage, remplace value: taxRate par value: it?.tax_rate
                    taxRate: { value: taxRate ?? (it?.tax_rate ?? "") },
                }
            });
        }

        return rows;
    }

    private getVatForm(): Form {
        const analysis = this.data?.analysis?.extracted;
        return {
            label: 'TVA de la facture',
            items: [
                { label: 'Taux', value: analysis?.invoice[0]?.tax_rate ?? '', recommended: true },
                { label: 'Base', value: analysis?.invoice[0]?.tax_base ?? '', recommended: true },
            ]
        };
    }

    private getAmountsForm(): Form {
        const analysis = this.data?.analysis?.extracted;
        return {
            label: 'Montants de la facture',
            items: [
                { label: 'HT', value: analysis?.invoice[0]?.total_excl_tax ?? '', recommended: true },
                { label: 'TVA', value: analysis?.invoice[0]?.tax_amount ?? '', recommended: true },
                { label: 'TTC', value: analysis?.invoice[0]?.total_incl_tax ?? '', recommended: true }
            ]
        };
    }

    private mapAnalysisLinesToRows(lineCols: any): any[] {
        const labels: any[] = lineCols?.label ?? [];
        const qtys: any[] = lineCols?.quantity ?? [];
        const units: any[] = lineCols?.unitprice ?? [];
        const totals: any[] = lineCols?.totalprice ?? [];
        const tvas: any[] = lineCols?.tva ?? [];
        const refs: any[] = lineCols?.reference ?? [];

        const n = Math.max(labels.length, qtys.length, units.length, totals.length, tvas.length, refs.length);

        const rows: any[] = [];

        for (let i = 0; i < n; i++) {
            const refRaw = refs[i] ?? "";
            const labelRaw = labels[i] ?? "";
            const qtyRaw = qtys[i] ?? "";
            const unitRaw = units[i] ?? "";
            const totRaw = totals[i] ?? "";
            const tvaRaw = tvas[i] ?? "";

            // parse numériques
            const qty = qtyRaw;
            let unit = unitRaw;
            let ht = totRaw;
            const tvaTx = tvaRaw;

            // ignorer les lignes totalement vides
            const isEmpty =
                (!refRaw || refRaw === "") &&
                (!labelRaw || labelRaw === "") &&
                (qty === null || qty === 0) &&
                (unit === null || unit === 0) &&
                (ht === null || ht === 0) &&
                (tvaTx === null || tvaTx === 0);
            if (isEmpty) continue;

            // calculs manquants
            let unitCalculated = false;
            let htCalculated = false;

            if ((ht === null || ht === 0) && qty !== null && qty > 0 && unit !== null) {
                ht = qty * unit;
                htCalculated = true;
            }

            if ((unit === null || unit === 0) && qty !== null && qty > 0 && ht !== null) {
                unit = ht / qty;
                unitCalculated = true;
            }

            rows.push({
                items: {
                    reference: { value: String(refRaw || "").trim() },
                    label: { value: String(labelRaw || "").trim() },
                    quantity: { value: qty ?? "" },
                    unitPrice: { value: unit, calculated: unitCalculated || undefined },
                    totalExclTax: { value: ht, calculated: htCalculated || undefined },
                    taxRate: { value: tvaTx },
                }
            });
        }

        return rows;
    }
}
