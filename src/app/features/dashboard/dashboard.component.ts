import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
   selector: 'app-dashboard',
   standalone: true,
   imports: [CommonModule, RouterModule],
   template: `
    <div class="dashboard-layout">
      <!-- Top Navigation -->
      <header class="navbar">
        <div class="container nav-container">
          <a routerLink="/dashboard" class="brand" title="Ir al Dashboard">
             <div class="logo-circle-small">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
               </svg>
             </div>
             <span class="brand-text">ECOMSERV</span>
          </a>
          
          <div class="user-menu">
            <span class="user-name">{{ authService.currentUser()?.name || 'Usuario' }}</span>
            <button class="logout-btn" (click)="logout()" title="Cerrar Sesión">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
               </svg>
            </button>
          </div>
        </div>
      </header>
      
      <!-- Main Content -->
      <main class="container main-content">
        <div class="welcome-section">
          <h1>Bienvenido, {{ authService.currentUser()?.name || 'Usuario' }}</h1>
          <p>Seleccione una opción para comenzar</p>
        </div>
        
        <div class="menu-grid">
           <!-- Card: Nueva Cotizacion -->
           <a routerLink="/cotizacion" class="menu-card primary">
             <div class="card-icon">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
               </svg>
             </div>
             <div class="card-content">
               <h3>Nueva Cotizacion</h3>
               <p>Crear una nueva cotizacion y generar PDF.</p>
             </div>
             <div class="card-arrow">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <line x1="5" y1="12" x2="19" y2="12"/>
                 <polyline points="12 5 19 12 12 19"/>
               </svg>
             </div>
           </a>

           <!-- Card: Cotizaciones Guardadas -->
           <a routerLink="/cotizaciones" class="menu-card secondary">
             <div class="card-icon">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
               </svg>
             </div>
             <div class="card-content">
               <h3>Cotizaciones Guardadas</h3>
               <p>Ver, descargar y eliminar cotizaciones creadas.</p>
             </div>
             <div class="card-arrow">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <line x1="5" y1="12" x2="19" y2="12"/>
                 <polyline points="12 5 19 12 12 19"/>
               </svg>
             </div>
           </a>
           
           <!-- Placeholder Card: Clientes (Inactive) -->
           <div class="menu-card disabled">
             <div class="card-icon">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
               </svg>
             </div>
             <div class="card-content">
               <h3>Clientes</h3>
               <p>Próximamente: Gestión de base de datos de clientes.</p>
             </div>
           </div>
           
           <!-- Placeholder Card: Productos (Inactive) -->
           <div class="menu-card disabled">
             <div class="card-icon">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
               </svg>
             </div>
             <div class="card-content">
               <h3>Productos</h3>
               <p>Próximamente: Catálogo de productos y precios.</p>
             </div>
           </div>
        </div>
      </main>
    </div>
  `,
   styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #f8fafc;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Navbar */
    .navbar {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      height: 70px;
      display: flex;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .nav-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100%;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo-circle-small {
       width: 40px;
       height: 40px;
       background: linear-gradient(135deg, #3b82f6, #2563eb);
       border-radius: 10px;
       display: flex;
       align-items: center;
       justify-content: center;
       color: white;
    }
    
    .brand-text {
       font-weight: 700;
       font-size: 20px;
       color: #0f172a;
       letter-spacing: -0.5px;
    }
    
    .user-menu {
       display: flex;
       align-items: center;
       gap: 16px;
    }
    
    .user-name {
       font-weight: 500;
       color: #64748b;
    }
    
    .logout-btn {
       background: #fee2e2;
       color: #ef4444;
       border: none;
       width: 40px;
       height: 40px;
       border-radius: 10px;
       display: flex;
       align-items: center;
       justify-content: center;
       cursor: pointer;
       transition: all 0.2s ease;
    }
    
    .logout-btn:hover {
       background: #fecaca;
    }
    
    /* Main Content */
    .main-content {
       padding-top: 48px;
       padding-bottom: 48px;
    }
    
    .welcome-section {
       margin-bottom: 40px;
    }
    
    h1 {
       font-size: 32px;
       font-weight: 800;
       color: #0f172a;
       margin: 0 0 8px;
       letter-spacing: -1px;
    }
    
    p {
       color: #64748b;
       font-size: 18px;
       margin: 0;
    }
    
    /* Grid */
    .menu-grid {
       display: grid;
       grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
       gap: 24px;
    }
    
    .menu-card {
       background: white;
       border-radius: 20px;
       padding: 32px;
       display: flex;
       flex-direction: column;
       gap: 20px;
       text-decoration: none;
       border: 1px solid #e2e8f0;
       transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
       position: relative;
       overflow: hidden;
    }
    
    .menu-card:not(.disabled):hover {
       transform: translateY(-5px);
       box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.1);
       border-color: #cbd5e1;
    }
    
    .card-icon {
       width: 60px;
       height: 60px;
       border-radius: 16px;
       display: flex;
       align-items: center;
       justify-content: center;
    }
    
    /* Primary Card Style */
    .menu-card.primary .card-icon {
       background: #eff6ff;
       color: #3b82f6;
    }

    .menu-card.primary:hover .card-icon {
       background: #3b82f6;
       color: white;
    }

    .menu-card.primary .card-arrow,
    .menu-card.secondary .card-arrow {
       position: absolute;
       bottom: 24px;
       right: 24px;
       color: #cbd5e1;
       transition: all 0.3s ease;
    }

    .menu-card.primary:hover .card-arrow {
       color: #3b82f6;
       transform: translateX(5px);
    }

    /* Secondary Card Style */
    .menu-card.secondary .card-icon {
       background: #f0fdf4;
       color: #22c55e;
    }

    .menu-card.secondary:hover .card-icon {
       background: #22c55e;
       color: white;
    }

    .menu-card.secondary:hover .card-arrow {
       color: #22c55e;
       transform: translateX(5px);
    }
    
    /* Disabled Card Style */
    .menu-card.disabled {
       opacity: 0.6;
       cursor: not-allowed;
       background: #f1f5f9;
       border-style: dashed;
    }
    
    .menu-card.disabled .card-icon {
       background: #e2e8f0;
       color: #94a3b8;
    }
    
    .card-content h3 {
       font-size: 20px;
       font-weight: 700;
       margin: 0 0 8px;
       color: #0f172a;
    }
    
    .card-content p {
       font-size: 15px;
       color: #64748b;
       line-height: 1.5;
    }
  `]
})
export class DashboardComponent {

   constructor(public authService: AuthService) { }

   logout() {
      this.authService.logout();
   }
}
