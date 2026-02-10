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
        path: '',
        loadComponent: () =>
            import('./shared/components/app-shell/app-shell.component')
                .then(m => m.AppShellComponent),
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./features/dashboard/dashboard.component')
                        .then(m => m.DashboardComponent),
                title: 'Panel Principal - ECOMSERV'
            },
            {
                path: 'cotizacion',
                loadComponent: () =>
                    import('./features/quoting/quote-form/quote-form.component')
                        .then(m => m.QuoteFormComponent),
                title: 'Nueva Cotización - ECOMSERV'
            },
            {
                path: 'cotizaciones',
                loadComponent: () =>
                    import('./features/quoting/quotes-list/quotes-list.component')
                        .then(m => m.QuotesListComponent),
                title: 'Cotizaciones Guardadas - ECOMSERV'
            },
            {
                path: 'informe',
                loadComponent: () =>
                    import('./features/reports/report-form/report-form.component')
                        .then(m => m.ReportFormComponent),
                title: 'Nuevo Informe - ECOMSERV'
            },
            {
                path: 'informes',
                loadComponent: () =>
                    import('./features/reports/reports-list/reports-list.component')
                        .then(m => m.ReportsListComponent),
                title: 'Informes Guardados - ECOMSERV'
            },
            {
                path: 'clientes',
                loadComponent: () =>
                    import('./features/clients/clients.component')
                        .then(m => m.ClientsComponent),
                title: 'Clientes - ECOMSERV'
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
