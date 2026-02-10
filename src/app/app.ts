import { Component, PLATFORM_ID, Inject, signal, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet />

    @if (showInstallPromotion()) {
      <div class="install-prompt-backdrop">
        <div class="install-prompt">
          <div class="prompt-content">
            <div class="app-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div class="prompt-text">
              <h3>Instalar Aplicación</h3>
              <p>Instala la app para una mejor experiencia</p>
            </div>
          </div>
          <div class="prompt-actions">
            <button class="btn-cancel" (click)="hidePrompt()">Ahora no</button>
            <button class="btn-install" (click)="installPwa()">Instalar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }

    .install-prompt-backdrop {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px;
      padding-bottom: env(safe-area-inset-bottom, 16px);
      background: linear-gradient(to top, rgba(0,0,0,0.1), transparent);
      z-index: 99999;
      display: flex;
      justify-content: center;
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .install-prompt {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 16px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
    }

    .prompt-content {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .app-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #4f46e5, #818cf8);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .prompt-text h3 { margin: 0 0 2px 0; font-size: 16px; font-weight: 700; color: #0f172a; }
    .prompt-text p { margin: 0; font-size: 13px; color: #64748b; }

    .prompt-actions {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 10px;
    }

    button {
      border: none;
      padding: 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.1s;
    }

    button:active { transform: scale(0.97); }

    .btn-cancel { background: transparent; color: #64748b; }
    .btn-cancel:hover { background: #f1f5f9; color: #475569; }

    .btn-install { background: #000; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .btn-install:hover { background: #1e293b; }

    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class App implements AfterViewInit {
  deferredPrompt: any;
  showInstallPromotion = signal(false);
  title = 'ECOMSERV';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.showInstallPromotion.set(true);
      });
      window.addEventListener('appinstalled', () => {
        this.showInstallPromotion.set(false);
        this.deferredPrompt = null;
      });
    }
  }

  hidePrompt() { this.showInstallPromotion.set(false); }

  async installPwa() {
    this.hidePrompt();
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
  }
}
