import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'ecomCurrency',
    standalone: true
})
export class EcomCurrencyPipe implements PipeTransform {
    transform(value: number | null | undefined, currency: string = 'PEN'): string {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: currency || 'PEN'
        }).format(value || 0);
    }
}
