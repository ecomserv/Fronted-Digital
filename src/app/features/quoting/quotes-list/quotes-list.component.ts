import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService, QuoteSummary } from '../../../core/services/api.service';

type ViewMode = 'list' | 'grid' | 'cards';

@Component({
  selector: 'app-quotes-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="quotes-list-container">
      <!-- Header -->
      <header class="header">
        <div class="header-content">
          <div class="header-left">
            <a routerLink="/dashboard" class="back-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Volver
            </a>
            <h1>Cotizaciones Guardadas</h1>
          </div>
          <div class="header-right">
            <!-- View Mode Selector -->
            <div class="view-selector">
              <button 
                class="view-btn" 
                [class.active]="viewMode() === 'list'"
                (click)="viewMode.set('list')"
                title="Vista de lista">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
              <button 
                class="view-btn" 
                [class.active]="viewMode() === 'grid'"
                (click)="viewMode.set('grid')"
                title="Vista de cuadrícula">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button 
                class="view-btn" 
                [class.active]="viewMode() === 'cards'"
                (click)="viewMode.set('cards')"
                title="Vista de tarjetas grandes">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </button>
            </div>
            <a routerLink="/cotizacion" class="new-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nueva
            </a>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="main-content">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando cotizaciones...</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <p>{{ error() }}</p>
            <button class="retry-btn" (click)="loadQuotes()">Reintentar</button>
          </div>
        } @else if (quotes().length === 0) {
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <h3>No hay cotizaciones</h3>
            <p>Aun no has creado ninguna cotización.</p>
            <a routerLink="/cotizacion" class="create-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Crear Cotización
            </a>
          </div>
        } @else {
          <!-- List View -->
          @if (viewMode() === 'list') {
            <div class="quotes-list">
              @for (quote of quotes(); track quote.documentNumber) {
                <div class="quote-row" (click)="editQuote(quote)">
                  <div class="quote-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div class="quote-main">
                    <span class="quote-number">{{ quote.documentNumber }}</span>
                    <span class="quote-client">{{ quote.clientName || 'Sin cliente' }}</span>
                  </div>
                  <div class="quote-amount">
                    <span class="amount">{{ formatCurrency(quote.total, quote.currency) }}</span>
                    <span class="items">{{ quote.itemCount }} item{{ quote.itemCount !== 1 ? 's' : '' }}</span>
                  </div>
                  <div class="quote-date">{{ formatDate(quote.createdAt) }}</div>
                  <div class="quote-actions" (click)="$event.stopPropagation()">
                    <button class="action-btn edit" (click)="editQuote(quote)" title="Editar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button class="action-btn download" (click)="downloadQuote(quote)" title="Descargar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                    <button class="action-btn delete" (click)="confirmDelete(quote)" title="Eliminar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Grid View -->
          @if (viewMode() === 'grid') {
            <div class="quotes-grid">
              @for (quote of quotes(); track quote.documentNumber) {
                <div class="quote-grid-card" (click)="editQuote(quote)">
                  <div class="grid-card-header">
                    <span class="doc-number">{{ quote.documentNumber }}</span>
                    <div class="grid-actions" (click)="$event.stopPropagation()">
                      <button class="mini-btn edit" (click)="editQuote(quote)" title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button class="mini-btn" (click)="downloadQuote(quote)" title="Descargar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                      <button class="mini-btn danger" (click)="confirmDelete(quote)" title="Eliminar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="grid-card-body">
                    <p class="client-name">{{ quote.clientName || 'Sin cliente' }}</p>
                    <p class="total">{{ formatCurrency(quote.total, quote.currency) }}</p>
                  </div>
                  <div class="grid-card-footer">
                    <span>{{ quote.itemCount }} items</span>
                    <span>{{ formatShortDate(quote.createdAt) }}</span>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Cards View (Document Preview) -->
          @if (viewMode() === 'cards') {
            <div class="quotes-cards">
              @for (quote of quotes(); track quote.documentNumber) {
                <div class="document-preview" (click)="editQuote(quote)">
                  <!-- Document Paper -->
                  <div class="paper">
                    <!-- Document Header (like the PDF) -->
                    <div class="doc-header">
                      <div class="doc-logo">
                        <img src="/logo-ecomserv.png" alt="ECOMSERV" />
                        <span>ECOMSERV</span>
                      </div>
                      <div class="doc-title">
                        <span class="title-label">COTIZACIÓN</span>
                        <span class="title-number">{{ quote.documentNumber }}</span>
                      </div>
                    </div>

                    <!-- Client Section -->
                    <div class="doc-client">
                      <div class="client-row">
                        <span class="label">FECHA</span>
                        <span class="value">: {{ formatDate(quote.createdAt) }}</span>
                      </div>
                      <div class="client-row">
                        <span class="label">SEÑOR</span>
                        <span class="value">: {{ quote.clientName || 'VENTA CONTADO' }}</span>
                      </div>
                    </div>

                    <!-- Items Table Preview -->
                    <div class="doc-table">
                      <div class="table-header">
                        <span>ITM</span>
                        <span>DESCRIPCION</span>
                        <span>CANT.</span>
                        <span>TOTAL</span>
                      </div>
                      <div class="table-body">
                        <div class="table-row summary">
                          <span>1</span>
                          <span class="desc">{{ quote.firstItemDescription || 'Sin descripción' }}</span>
                          <span></span>
                          <span></span>
                        </div>
                        @if (quote.itemCount > 1) {
                          <div class="table-row more">
                            <span></span>
                            <span class="desc">+ {{ quote.itemCount - 1 }} producto(s) más</span>
                            <span></span>
                            <span></span>
                          </div>
                        }
                      </div>
                    </div>

                    <!-- Totals Section -->
                    <div class="doc-totals">
                      <div class="total-row">
                        <span class="total-label">TOTAL {{ quote.currency === 'USD' ? 'DOLARES' : 'SOLES' }}</span>
                        <span class="total-value">{{ formatCurrency(quote.total, quote.currency) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Card Actions Overlay -->
                  <div class="card-overlay" (click)="$event.stopPropagation()">
                    <div class="overlay-actions">
                      <button class="overlay-btn primary" (click)="editQuote(quote)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Editar
                      </button>
                      <button class="overlay-btn" (click)="downloadQuote(quote)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        PDF
                      </button>
                      <button class="overlay-btn danger" (click)="confirmDelete(quote)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        }
      </main>

      <!-- Delete Confirmation Modal -->
      @if (quoteToDelete()) {
        <div class="modal-overlay" (click)="cancelDelete()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3>Confirmar Eliminación</h3>
            <p>¿Estás seguro que deseas eliminar la cotización <strong>{{ quoteToDelete()?.documentNumber }}</strong>?</p>
            <p class="warning">Esta acción no se puede deshacer.</p>
            <div class="modal-actions">
              <button class="cancel-btn" (click)="cancelDelete()">Cancelar</button>
              <button class="confirm-delete-btn" (click)="deleteQuote()" [disabled]="isDeleting()">
                @if (isDeleting()) {
                  <span class="spinner-small"></span>
                  Eliminando...
                } @else {
                  Eliminar
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(226, 232, 240, 0.8);
      padding: 16px 24px;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #64748b;
      text-decoration: none;
      font-weight: 500;
      padding: 8px 12px;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .back-btn:hover {
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
    }

    h1 {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    /* View Selector */
    .view-selector {
      display: flex;
      background: #f1f5f9;
      border-radius: 10px;
      padding: 4px;
      gap: 2px;
    }

    .view-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      border-radius: 8px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .view-btn:hover {
      color: #3b82f6;
    }

    .view-btn.active {
      background: white;
      color: #3b82f6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .new-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      text-decoration: none;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }

    .new-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .main-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    /* Loading, Error, Empty States */
    .loading-state, .error-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
    }

    .loading-state { color: #64748b; }
    .error-state { color: #ef4444; }
    .empty-state { color: #94a3b8; }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .retry-btn, .create-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 16px;
    }

    .retry-btn:hover, .create-btn:hover {
      background: #2563eb;
      transform: translateY(-2px);
    }

    .empty-state h3 {
      margin: 24px 0 8px;
      color: #475569;
      font-size: 20px;
    }

    .empty-state p { margin: 0; color: #64748b; }

    /* ==================== LIST VIEW ==================== */
    .quotes-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .quote-row {
      display: grid;
      grid-template-columns: 48px 2fr 1fr 120px auto;
      align-items: center;
      gap: 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .quote-row:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transform: translateX(4px);
    }

    .quote-icon {
      width: 48px;
      height: 48px;
      background: #eff6ff;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #3b82f6;
    }

    .quote-main {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .quote-number {
      font-weight: 600;
      color: #0f172a;
    }

    .quote-client {
      font-size: 14px;
      color: #64748b;
    }

    .quote-amount {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .amount {
      font-weight: 700;
      color: #0f172a;
      font-size: 15px;
    }

    .items {
      font-size: 12px;
      color: #94a3b8;
    }

    .quote-date {
      font-size: 13px;
      color: #64748b;
      text-align: right;
    }

    .quote-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      gap: 6px;
    }

    .action-btn.download {
      background: #eff6ff;
      color: #3b82f6;
    }

    .action-btn.download:hover {
      background: #3b82f6;
      color: white;
    }

    .action-btn.edit {
      background: #f0fdf4;
      color: #16a34a;
    }

    .action-btn.edit:hover {
      background: #16a34a;
      color: white;
    }

    .action-btn.delete {
      background: #fef2f2;
      color: #ef4444;
    }

    .action-btn.delete:hover {
      background: #ef4444;
      color: white;
    }

    /* ==================== GRID VIEW ==================== */
    .quotes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .quote-grid-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .quote-grid-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
      transform: translateY(-4px);
    }

    .grid-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .doc-number {
      font-weight: 700;
      color: #3b82f6;
      font-size: 15px;
    }

    .grid-actions {
      display: flex;
      gap: 4px;
    }

    .mini-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: #f1f5f9;
      border-radius: 6px;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .mini-btn:hover {
      background: #3b82f6;
      color: white;
    }

    .mini-btn.danger:hover {
      background: #ef4444;
    }

    .mini-btn.edit {
      background: #ecfdf5;
      color: #059669;
    }

    .mini-btn.edit:hover {
      background: #059669;
      color: white;
    }

    .grid-card-body {
      margin-bottom: 16px;
    }

    .client-name {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .total {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .grid-card-footer {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #94a3b8;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
    }

    /* ==================== CARDS VIEW (Document Preview) ==================== */
    .quotes-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 28px;
    }

    .document-preview {
      position: relative;
      cursor: pointer;
    }

    .paper {
      background: white;
      border-radius: 8px;
      box-shadow: 
        0 1px 3px rgba(0, 0, 0, 0.08),
        0 4px 12px rgba(0, 0, 0, 0.06),
        0 0 0 1px rgba(0, 0, 0, 0.04);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .document-preview:hover .paper {
      box-shadow: 
        0 4px 12px rgba(59, 130, 246, 0.15),
        0 12px 28px rgba(59, 130, 246, 0.12),
        0 0 0 2px rgba(59, 130, 246, 0.2);
      transform: translateY(-4px);
    }

    /* Document Header - like the PDF */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 3px solid #1e3a8a;
      background: linear-gradient(180deg, #fafbfc, #f8f9fa);
    }

    .doc-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .doc-logo img {
      height: 32px;
      width: auto;
    }

    .doc-logo span {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }

    .doc-title {
      text-align: right;
    }

    .title-label {
      display: block;
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .title-number {
      display: block;
      font-size: 16px;
      font-weight: 700;
      color: #1e3a8a;
      background: #e0e7ff;
      padding: 4px 10px;
      border-radius: 4px;
      margin-top: 4px;
    }

    /* Client Section */
    .doc-client {
      padding: 14px 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .client-row {
      display: flex;
      font-size: 11px;
      line-height: 1.6;
    }

    .client-row .label {
      width: 50px;
      font-weight: 700;
      color: #1e3a8a;
      flex-shrink: 0;
    }

    .client-row .value {
      color: #374151;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Items Table */
    .doc-table {
      padding: 0;
    }

    .table-header {
      display: grid;
      grid-template-columns: 30px 1fr 40px 60px;
      background: #1e3a8a;
      color: white;
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 8px 12px;
    }

    .table-body {
      padding: 8px 12px;
    }

    .table-row {
      display: grid;
      grid-template-columns: 30px 1fr 40px 60px;
      font-size: 9px;
      color: #6b7280;
      padding: 4px 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .table-row .desc {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .table-row.more {
      color: #9ca3af;
      font-style: italic;
    }

    /* Totals Section */
    .doc-totals {
      background: #1e3a8a;
      padding: 12px 20px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .total-row .total-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 11px;
      font-weight: 600;
    }

    .total-row .total-value {
      color: white;
      font-size: 18px;
      font-weight: 700;
    }

    /* Card Overlay with Actions */
    .card-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(255,255,255,0.95) 60%, transparent);
      padding: 40px 16px 16px;
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    .document-preview:hover .card-overlay {
      opacity: 1;
    }

    .overlay-actions {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    .overlay-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      background: white;
      color: #374151;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.2s;
    }

    .overlay-btn:hover {
      background: #f1f5f9;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .overlay-btn.primary {
      background: #3b82f6;
      color: white;
    }

    .overlay-btn.primary:hover {
      background: #2563eb;
    }

    .overlay-btn.danger:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    /* ==================== MODAL ==================== */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal {
      background: white;
      border-radius: 20px;
      padding: 32px;
      max-width: 400px;
      width: 100%;
      text-align: center;
    }

    .modal-icon {
      color: #f59e0b;
      margin-bottom: 16px;
    }

    .modal h3 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px;
    }

    .modal p {
      color: #64748b;
      margin: 0 0 8px;
      font-size: 15px;
    }

    .modal .warning {
      color: #ef4444;
      font-size: 13px;
      margin-bottom: 24px;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
    }

    .cancel-btn {
      flex: 1;
      padding: 12px;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 10px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .cancel-btn:hover {
      background: #f8fafc;
    }

    .confirm-delete-btn {
      flex: 1;
      padding: 12px;
      border: none;
      background: #ef4444;
      border-radius: 10px;
      font-weight: 600;
      color: white;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .confirm-delete-btn:hover:not(:disabled) {
      background: #dc2626;
    }

    .confirm-delete-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* ==================== RESPONSIVE ==================== */
    @media (max-width: 1024px) {
      .quotes-cards {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      }
    }

    @media (max-width: 640px) {
      .quotes-cards {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .doc-header {
        padding: 12px 16px;
      }

      .doc-logo img {
        height: 24px;
      }

      .doc-logo span {
        font-size: 13px;
      }

      .title-number {
        font-size: 14px;
        padding: 3px 8px;
      }

      .doc-client {
        padding: 10px 16px;
      }

      .table-header {
        grid-template-columns: 25px 1fr 35px 50px;
        padding: 6px 10px;
        font-size: 7px;
      }

      .table-body {
        padding: 6px 10px;
      }

      .table-row {
        grid-template-columns: 25px 1fr 35px 50px;
        font-size: 8px;
      }

      .doc-totals {
        padding: 10px 16px;
      }

      .total-row .total-value {
        font-size: 16px;
      }

      .overlay-btn {
        padding: 8px 12px;
        font-size: 12px;
      }

      .card-overlay {
        padding: 30px 12px 12px;
      }

      /* Siempre mostrar overlay en móvil (sin necesidad de hover) */
      .card-overlay {
        opacity: 1;
        background: linear-gradient(to top, rgba(255,255,255,0.98) 60%, transparent);
      }
    }

    @media (max-width: 768px) {
      .header-content {
        flex-wrap: wrap;
        gap: 16px;
      }

      .header-left {
        width: 100%;
        justify-content: space-between;
      }

      h1 {
        font-size: 18px;
      }

      .quote-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .quote-row > * {
        justify-self: start;
      }

      .quote-amount {
        align-items: flex-start;
      }

      .quote-actions {
        width: 100%;
        justify-content: flex-end;
        padding-top: 12px;
        border-top: 1px solid #f1f5f9;
      }

      .quotes-grid {
        grid-template-columns: 1fr;
      }

      .preview-stats {
        grid-template-columns: 1fr 1fr;
      }

      .preview-stats .total-stat {
        grid-column: span 2;
      }
    }
  `]
})
export class QuotesListComponent implements OnInit {
  quotes = signal<QuoteSummary[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  quoteToDelete = signal<QuoteSummary | null>(null);
  isDeleting = signal(false);
  viewMode = signal<ViewMode>('cards');

  constructor(private apiService: ApiService, private router: Router) { }

  ngOnInit() {
    // Load saved view preference
    const savedView = localStorage.getItem('quotes_view_mode') as ViewMode;
    if (savedView && ['list', 'grid', 'cards'].includes(savedView)) {
      this.viewMode.set(savedView);
    }

    this.loadQuotes();
  }

  loadQuotes() {
    this.isLoading.set(true);
    this.error.set(null);

    this.apiService.listQuotesWithSummary().subscribe({
      next: (quotes) => {
        this.quotes.set(quotes);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading quotes:', err);
        this.error.set('No se pudieron cargar las cotizaciones. Verifica tu conexión.');
        this.isLoading.set(false);
      }
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short'
    });
  }

  formatCurrency(amount: number, currency: string): string {
    const symbol = currency === 'USD' ? 'US$ ' : 'S/ ';
    return symbol + amount.toFixed(2);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  formatNumber(amount: number): string {
    return amount.toFixed(2);
  }

  downloadQuote(quote: QuoteSummary) {
    this.apiService.downloadQuote(quote.documentNumber).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = quote.documentNumber + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading quote:', err);
        alert('Error al descargar la cotización');
      }
    });
  }

  editQuote(quote: QuoteSummary) {
    // Save view preference
    localStorage.setItem('quotes_view_mode', this.viewMode());
    this.router.navigate(['/cotizacion'], { queryParams: { edit: quote.documentNumber } });
  }

  confirmDelete(quote: QuoteSummary) {
    this.quoteToDelete.set(quote);
  }

  cancelDelete() {
    this.quoteToDelete.set(null);
  }

  deleteQuote() {
    const quote = this.quoteToDelete();
    if (!quote) return;

    this.isDeleting.set(true);

    this.apiService.deleteQuote(quote.documentNumber).subscribe({
      next: () => {
        this.quotes.update(quotes =>
          quotes.filter(q => q.documentNumber !== quote.documentNumber)
        );
        this.quoteToDelete.set(null);
        this.isDeleting.set(false);
      },
      error: (err) => {
        console.error('Error deleting quote:', err);
        alert('Error al eliminar la cotización');
        this.isDeleting.set(false);
      }
    });
  }
}
