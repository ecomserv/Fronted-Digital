import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="login-card">
        <div class="glass-effect"></div>
        <div class="content">
          <div class="logo-area">
            <div class="logo-circle">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1>ECOMSERV</h1>
            <p>Portal de Cotizaciones</p>
          </div>

          <div class="form-area">
            @if (authService.error()) {
              <div class="error-message">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {{ authService.error() }}
              </div>
            }

            <div class="input-group">
              <label>Usuario</label>
              <input
                type="text"
                [(ngModel)]="username"
                placeholder="Ingrese su usuario"
                [disabled]="authService.isLoading()">
              <span class="icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
            </div>

            <div class="input-group">
              <label>Contraseña</label>
              <input
                type="password"
                [(ngModel)]="password"
                placeholder="Ingrese su contraseña"
                [disabled]="authService.isLoading()"
                (keyup.enter)="onLogin()">
              <span class="icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
            </div>

            <button
              class="login-btn"
              (click)="onLogin()"
              [disabled]="authService.isLoading() || !username || !password">
              @if (authService.isLoading()) {
                <span class="spinner"></span>
                <span>Ingresando...</span>
              } @else {
                <span>Ingresar al Sistema</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      height: 100dvh;
      min-height: -webkit-fill-available; /* iOS Safari safe area */
      width: 100%;
      overflow: hidden;
    }

    .login-container {
      position: relative;
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .background-shapes {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 0;
    }

    .shape {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.6;
      animation: float 20s infinite ease-in-out;
    }

    .shape-1 {
      top: -10%;
      left: -10%;
      width: 500px;
      height: 500px;
      background: #3b82f6;
      animation-delay: 0s;
    }

    .shape-2 {
      bottom: -10%;
      right: -10%;
      width: 400px;
      height: 400px;
      background: #8b5cf6;
      animation-delay: -5s;
    }

    .shape-3 {
      top: 40%;
      right: 20%;
      width: 300px;
      height: 300px;
      background: #06b6d4;
      animation-delay: -10s;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(30px, -50px) rotate(10deg); }
      66% { transform: translate(-20px, 20px) rotate(-5deg); }
    }

    .login-card {
      position: relative;
      width: 100%;
      max-width: 420px;
      margin: 20px;
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      z-index: 10;
      overflow: hidden;
    }

    .glass-effect {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      z-index: -1;
    }

    .content {
      padding: 48px 40px;
      z-index: 1;
    }

    .logo-area {
      text-align: center;
      margin-bottom: 40px;
    }

    .logo-circle {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      color: white;
      box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5);
    }

    h1 {
      font-size: 28px;
      font-weight: 800;
      color: white;
      margin: 0 0 8px;
      letter-spacing: -0.5px;
    }

    p {
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
      font-size: 15px;
    }

    .form-area {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
      color: #fca5a5;
      font-size: 14px;
    }

    .input-group {
      position: relative;
    }

    .input-group label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 8px;
    }

    .input-group input {
      width: 100%;
      padding: 12px 16px;
      padding-right: 44px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: white;
      font-size: 15px;
      transition: all 0.2s ease;
      outline: none;
      box-sizing: border-box;
    }

    .input-group input:focus {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(59, 130, 246, 0.5);
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .input-group input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .input-group .icon {
      position: absolute;
      right: 14px;
      bottom: 12px;
      color: rgba(255, 255, 255, 0.4);
      pointer-events: none;
    }

    .login-btn {
      margin-top: 10px;
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.2s ease;
      box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4);
    }

    .login-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.5);
    }

    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .login-btn svg {
      transition: transform 0.2s ease;
    }

    .login-btn:hover:not(:disabled) svg {
      transform: translateX(4px);
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 480px) {
      .login-card {
        margin: 10px;
        max-width: 100%;
      }

      .content {
        padding: 32px 24px;
      }
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';

  constructor(public authService: AuthService) { }

  onLogin() {
    if (!this.username || !this.password) return;
    this.authService.login(this.username, this.password).subscribe();
  }
}
