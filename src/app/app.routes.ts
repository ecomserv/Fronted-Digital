import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'cotizacion',
        pathMatch: 'full'
    },
    {
        path: 'cotizacion',
        loadComponent: () =>
            import('./features/quoting/quote-form/quote-form.component')
                .then(m => m.QuoteFormComponent),
        title: 'Nueva Cotización - ECOMSERV'
    },
    {
        path: '**',
        redirectTo: 'cotizacion'
    }
];
