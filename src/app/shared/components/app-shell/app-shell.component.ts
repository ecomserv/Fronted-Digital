import { Component, inject, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToolbarService } from '../../../core/services/toolbar.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <!-- Slim Top Bar: brand + contextual actions -->
    <header class="shell-header">
      <div class="shell-header-inner">
        <!-- Left: Brand -->
        <div class="shell-left">
          <a routerLink="/dashboard" class="shell-brand">
            <div class="shell-logo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span class="shell-brand-text">ECOMSERV</span>
          </a>
        </div>

        <!-- Right: Toolbar actions + Theme + Logout -->
        <div class="shell-right">
          @for (action of toolbarService.actions(); track action.id) {
            <button
              class="toolbar-action"
              [class.active]="action.active?.() ?? false"
              [disabled]="(action.disabled?.() ?? false) || (action.loading?.() ?? false)"
              (click)="action.callback()">
              @if (action.loading?.()) {
                <span class="spinner-sm"></span>
              } @else {
                <i class="pi {{ action.icon }}" aria-hidden="true"></i>
              }
              <span class="action-label">{{ action.label }}</span>
            </button>
          }

          @if (toolbarService.actions().length) {
            <span class="shell-divider"></span>
          }

          <!-- Theme toggle -->
          <button class="shell-icon-btn" (click)="themeService.toggle()">
            @if (themeService.effective() === 'dark') {
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            } @else {
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            }
          </button>

          <!-- Logout -->
          <button class="shell-icon-btn shell-logout-btn" (click)="logout()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <main class="shell-content">
      <router-outlet />
    </main>

    <!-- Bottom Tab Bar -->
    <nav class="bottom-bar" role="navigation" aria-label="Navegación principal">
      <!-- Home - icon only -->
      <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="tab-item tab-icon-only">
        <div class="tab-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
      </a>

      <!-- Nuevo - with dropdown -->
      <div class="tab-item tab-main tab-dropdown-wrapper" [class.active]="isNuevoActive()"
        (click)="toggleNuevoDropdown($event)">
        <div class="tab-icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </div>
        <span class="tab-label">Nuevo</span>
        @if (showNuevoDropdown()) {
          <div class="tab-dropdown" (click)="$event.stopPropagation()">
            <a class="dropdown-item" routerLink="/cotizacion" (click)="closeDropdowns()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>Nueva Cotización</span>
            </a>
            <a class="dropdown-item" routerLink="/informe" (click)="closeDropdowns()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span>Nuevo Informe</span>
            </a>
          </div>
        }
      </div>

      <!-- Guardados -->
      <a routerLink="/cotizaciones" routerLinkActive="active" class="tab-item tab-main">
        <div class="tab-icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <span class="tab-label">Guardados</span>
      </a>

      <!-- Clientes -->
      <a routerLink="/clientes" routerLinkActive="active" class="tab-item tab-main">
        <div class="tab-icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <span class="tab-label">Clientes</span>
      </a>


    </nav>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
      background: var(--surface-bg);
    }

    /* ======================== SLIM TOP BAR ======================== */
    .shell-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: var(--nav-bg);
      border-bottom: 1px solid var(--nav-border);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      height: 64px;
      display: flex;
      align-items: center;
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .shell-header-inner {
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
      gap: 12px;
    }

    /* Left: Brand */
    .shell-left {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .shell-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      flex-shrink: 0;
    }

    .shell-logo {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--ecom-blue-500), var(--ecom-blue-700));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .shell-logo svg {
      width: 22px;
      height: 22px;
    }

    .shell-brand-text {
      font-weight: 700;
      font-size: 18px;
      color: var(--text-primary);
      letter-spacing: -0.3px;
    }

    /* Right: Actions */
    .shell-right {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .shell-divider {
      width: 1px;
      height: 20px;
      background: var(--border-subtle);
      margin: 0 2px;
    }

    /* Toolbar actions */
    .toolbar-action {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      border: 1px solid var(--border-subtle);
      background: var(--surface-card);
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
      padding: 0;
    }

    .toolbar-action:hover {
      background: var(--surface-hover);
      border-color: var(--border-default);
      color: var(--text-primary);
    }

    .toolbar-action.active {
      background: var(--ecom-blue-500);
      border-color: var(--ecom-blue-500);
      color: white;
    }

    .toolbar-action:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .toolbar-action i {
      font-size: 26px;
    }

    .action-label {
      display: none;
    }

    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid var(--border-default);
      border-top-color: var(--ecom-blue-500);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Shell icon buttons */
    .shell-icon-btn {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      border: 1px solid var(--border-subtle);
      background: var(--surface-card);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }

    .shell-icon-btn:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
      border-color: var(--border-default);
    }

    .shell-logout-btn {
      border-color: var(--accent-red-subtle);
      color: var(--accent-red);
      background: transparent;
    }

    .shell-logout-btn:hover {
      background: var(--accent-red);
      color: white;
      border-color: var(--accent-red);
    }

    /* ======================== CONTENT AREA ======================== */
    .shell-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding-top: 64px;
      padding-bottom: 80px; /* space for bottom bar */
    }

    /* ======================== BOTTOM TAB BAR ======================== */
    .bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: var(--nav-bg);
      border-top: 1px solid var(--nav-border);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      display: flex;
      align-items: stretch;
      justify-content: space-around;
      height: 72px;
      padding: 0 4px;
      padding-bottom: env(safe-area-inset-bottom, 0);
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    /* Tab item base */
    .tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      text-decoration: none;
      color: var(--text-muted);
      border: none;
      background: none;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      padding: 6px 4px;
      -webkit-tap-highlight-color: transparent;
    }

    /* Icon-only tabs (Home, Más) - narrower */
    .tab-icon-only {
      flex: 0 0 48px;
      min-width: 48px;
    }

    /* Main tabs (Nuevo, Guardados, Clientes) - wider */
    .tab-main {
      flex: 1 1 0;
      max-width: 110px;
    }

    .tab-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 32px;
      border-radius: 16px;
      transition: all 0.2s ease;
    }

    .tab-main .tab-icon-wrap {
      width: 48px;
      height: 36px;
      border-radius: 18px;
    }

    .tab-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.01em;
      line-height: 1;
      white-space: nowrap;
      transition: color 0.2s ease;
    }

    /* Hover */
    .tab-item:hover {
      color: var(--text-secondary);
    }

    .tab-item:hover .tab-icon-wrap {
      background: var(--surface-hover);
    }

    /* Active state */
    .tab-item.active {
      color: var(--ecom-blue-500);
    }

    .tab-item.active .tab-icon-wrap {
      background: var(--accent-blue-subtle);
    }

    .tab-item.active .tab-label {
      color: var(--ecom-blue-500);
    }

    /* Active indicator dot for main tabs */
    .tab-main.active::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--ecom-blue-500);
    }

    /* ======================== TAB DROPDOWN ======================== */
    .tab-dropdown-wrapper {
      position: relative;
      cursor: pointer;
    }

    .tab-dropdown {
      position: absolute;
      bottom: calc(100% + 12px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--surface-card);
      border: 1px solid var(--border-default);
      border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08);
      padding: 6px;
      min-width: 200px;
      z-index: 200;
      animation: dropdownSlideUp 0.2s ease;
    }

    @keyframes dropdownSlideUp {
      from { opacity: 0; transform: translateX(-50%) translateY(8px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    .tab-dropdown::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      width: 12px;
      height: 12px;
      background: var(--surface-card);
      border-right: 1px solid var(--border-default);
      border-bottom: 1px solid var(--border-default);
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      text-decoration: none;
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 600;
      transition: all 0.15s ease;
      cursor: pointer;
      white-space: nowrap;
    }

    .dropdown-item:hover {
      background: var(--accent-blue-subtle);
      color: var(--ecom-blue-500);
    }

    .dropdown-item svg {
      flex-shrink: 0;
      color: var(--text-muted);
      transition: color 0.15s;
    }

    .dropdown-item:hover svg {
      color: var(--ecom-blue-500);
    }

    /* Dropdown overlay backdrop (for closing) */
    .dropdown-backdrop {
      position: fixed;
      inset: 0;
      z-index: 150;
    }



    /* ======================== RESPONSIVE ======================== */
    @media (max-width: 768px) {
      .shell-header-inner {
        padding: 0 8px;
        gap: 4px;
      }

      .shell-brand-text {
        display: none;
      }

      .shell-divider {
        display: none;
      }
    }

    @media (max-width: 400px) {
      .shell-logo {
        width: 28px;
        height: 28px;
        border-radius: 7px;
      }

      .shell-logo svg {
        width: 15px;
        height: 15px;
      }

      .tab-main {
        max-width: 90px;
      }

      .tab-label {
        font-size: 10px;
      }
    }

    /* Desktop: widen bottom bar items, constrain width */
    @media (min-width: 769px) {
      .bottom-bar {
        max-width: 500px;
        left: 50%;
        transform: translateX(-50%);
        border-radius: 20px 20px 0 0;
        border-left: 1px solid var(--nav-border);
        border-right: 1px solid var(--nav-border);
        box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
      }
    }
  `]
})
export class AppShellComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  toolbarService = inject(ToolbarService);
  private router = inject(Router);
  private elRef = inject(ElementRef);

  showOverflow = signal(false);
  showNuevoDropdown = signal(false);
  currentUrl = signal('');

  // Computed active states for tab highlighting
  isNuevoActive = computed(() => {
    const url = this.currentUrl();
    return url.startsWith('/cotizacion') && !url.startsWith('/cotizaciones') || url.startsWith('/informe') && !url.startsWith('/informes');
  });

  constructor() {
    // Track current URL for active tab highlighting
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.currentUrl.set(e.urlAfterRedirects || e.url);
    });
    // Set initial URL
    this.currentUrl.set(this.router.url);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: Event) {
    if (this.showOverflow() && !this.elRef.nativeElement.querySelector('.overflow-wrapper')?.contains(event.target as Node)) {
      this.showOverflow.set(false);
    }
    // Close dropdowns when clicking outside
    this.showNuevoDropdown.set(false);
  }

  toggleNuevoDropdown(event: Event): void {
    event.stopPropagation();
    const wasOpen = this.showNuevoDropdown();
    this.showNuevoDropdown.set(!wasOpen);
  }

  closeDropdowns(): void {
    this.showNuevoDropdown.set(false);
  }

  toggleOverflow(event: Event): void {
    event.stopPropagation();
    this.showOverflow.update(v => !v);
  }

  onOverflowAction(action: any): void {
    action.callback();
    this.showOverflow.set(false);
  }

  logout(): void {
    this.authService.logout();
  }
}
