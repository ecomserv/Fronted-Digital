import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./features/auth/login/login.component')
                .then(m => m.LoginComponent),
        title: 'Iniciar Sesión - ECOMSERV'
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./features/dashboard/dashboard.component')
                .then(m => m.DashboardComponent),
        canActivate: [authGuard],
        title: 'Panel Principal - ECOMSERV'
    },
    {
        path: 'cotizacion',
        loadComponent: () =>
            import('./features/quoting/quote-form/quote-form.component')
                .then(m => m.QuoteFormComponent),
        canActivate: [authGuard],
        title: 'Nueva Cotización - ECOMSERV'
    },
    {
        path: 'cotizaciones',
        loadComponent: () =>
            import('./features/quoting/quotes-list/quotes-list.component')
                .then(m => m.QuotesListComponent),
        canActivate: [authGuard],
        title: 'Cotizaciones Guardadas - ECOMSERV'
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
