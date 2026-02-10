import { Component, OnInit, OnDestroy, signal, computed, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService, QuoteSummary, ReportSummary } from '../../../core/services/api.service';
import { ToolbarService } from '../../../core/services/toolbar.service';

type ViewMode = 'list' | 'grid' | 'cards';
type DocFilter = 'ALL' | 'COT' | 'INF';

@Component({
  selector: 'app-quotes-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="quotes-list-container">
      <!-- Search & Filter Bar -->
      <div class="list-toolbar">
        <p class="subtitle">{{ filteredQuotes().length }} documento{{ filteredQuotes().length !== 1 ? 's' : '' }}</p>
        <div class="view-selector">
            <button class="view-btn" [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')" title="Lista">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            <button class="view-btn" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')" title="Grid">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button class="view-btn" [class.active]="viewMode() === 'cards'" (click)="viewMode.set('cards')" title="Tarjetas">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </button>
          </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="search-bar">
        <div class="search-input-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" class="search-input" placeholder="Buscar por número, cliente..." [ngModel]="searchTerm()" (ngModelChange)="onSearchChange($event)">
        </div>
        <div class="filter-chips">
          <button class="chip" [class.active]="docFilter() === 'ALL'" (click)="docFilter.set('ALL')">Todos</button>
          <button class="chip" [class.active]="docFilter() === 'COT'" (click)="docFilter.set('COT')">Cotizaciones</button>
          <button class="chip" [class.active]="docFilter() === 'INF'" (click)="docFilter.set('INF')">Informes</button>
        </div>
      </div>

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
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <p>{{ error() }}</p>
            <button class="retry-btn" (click)="loadQuotes()">Reintentar</button>
          </div>
        } @else if (quotes().length === 0 && reports().length === 0) {
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <h3>No hay documentos</h3>
            <p>Aún no has creado ninguna cotización o informe.</p>
            <a routerLink="/cotizacion" class="create-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Crear Cotización
            </a>
          </div>
        } @else {
          <!-- List View -->
          @if (viewMode() === 'list') {
            <div class="quotes-list">
              @for (quote of filteredQuotes(); track quote.documentNumber) {
                <div class="quote-row" (click)="editItem(quote)">
                  <div class="quote-icon" [class.report-icon-alt]="quote._type === 'report'">
                    @if (quote._type === 'report') {
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    } @else {
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    }
                  </div>
                  <div class="quote-main">
                    <span class="quote-number">{{ quote.documentNumber }}</span>
                    <span class="quote-client">{{ quote.clientName || 'Sin cliente' }}</span>
                  </div>
                  <div class="quote-amount">
                    @if (quote._type === 'quote') {
                      <span class="amount">{{ formatCurrency(quote.total, quote.currency) }}</span>
                      <span class="items">{{ quote.itemCount }} item{{ quote.itemCount !== 1 ? 's' : '' }}</span>
                    } @else {
                      <span class="badge-type informe">Informe</span>
                    }
                  </div>
                  <div class="quote-date">{{ formatDate(quote.createdAt) }}</div>
                  <div class="quote-actions" (click)="$event.stopPropagation()">
                    <button class="action-btn edit" (click)="editItem(quote)" title="Editar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="action-btn download" (click)="downloadItem(quote)" title="Descargar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                    <button class="action-btn delete" (click)="confirmDeleteItem(quote)" title="Eliminar">
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
              @for (quote of filteredQuotes(); track quote.documentNumber) {
                <div class="quote-grid-card" [class.report-card]="quote._type === 'report'" (click)="editItem(quote)">
                  <div class="grid-card-header">
                    <span class="doc-number">{{ quote.documentNumber }}</span>
                    <div class="grid-actions" (click)="$event.stopPropagation()">
                      <button class="mini-btn edit" (click)="editItem(quote)" title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button class="mini-btn" (click)="downloadItem(quote)" title="Descargar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                      <button class="mini-btn danger" (click)="confirmDeleteItem(quote)" title="Eliminar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="grid-card-body">
                    <p class="client-name">{{ quote.clientName || 'Sin cliente' }}</p>
                    @if (quote._type === 'quote') {
                      <p class="total">{{ formatCurrency(quote.total, quote.currency) }}</p>
                    } @else {
                      <p class="total report-label">Informe Técnico</p>
                    }
                  </div>
                  <div class="grid-card-footer">
                    @if (quote._type === 'quote') {
                      <span>{{ quote.itemCount }} items</span>
                    } @else {
                      <span class="badge-type informe">Informe</span>
                    }
                    <span>{{ formatShortDate(quote.createdAt) }}</span>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Cards View (Document Preview) -->
          @if (viewMode() === 'cards') {
            <div class="quotes-cards">
              @for (quote of filteredQuotes(); track quote.documentNumber) {
                <div class="document-preview" (click)="editItem(quote)">
                  <div class="paper">
                    <div class="doc-header">
                      <div class="doc-logo">
                        <img src="/logo-ecomserv.png" alt="ECOMSERV" />
                        <span>ECOMSERV</span>
                      </div>
                      <div class="doc-title">
                        <span class="title-label">{{ quote._type === 'report' ? 'INFORME TÉCNICO' : 'COTIZACIÓN' }}</span>
                        <span class="title-number">{{ quote.documentNumber }}</span>
                      </div>
                    </div>
                    <div class="doc-client">
                      <div class="client-row">
                        <span class="label">FECHA</span>
                        <span class="value">: {{ formatDate(quote.createdAt) }}</span>
                      </div>
                      <div class="client-row">
                        <span class="label">{{ quote._type === 'report' ? 'EMPRESA' : 'SEÑOR' }}</span>
                        <span class="value">: {{ quote.clientName || 'VENTA CONTADO' }}</span>
                      </div>
                    </div>
                    @if (quote._type === 'quote') {
                      <div class="doc-table">
                        <div class="table-header">
                          <span>ITEMS</span><span>DESCRIPCIÓN</span><span>CANT.</span><span>TOTAL</span>
                        </div>
                        <div class="table-body">
                          @if (quote.firstItemDescription) {
                            <div class="table-row">
                              <span>{{ quote.itemCount }}</span>
                              <span class="desc">{{ quote.firstItemDescription }}</span>
                              <span></span>
                              <span>{{ formatCurrency(quote.total, quote.currency) }}</span>
                            </div>
                          } @else {
                            <div class="table-row empty">
                              <span></span><span class="desc">Sin items</span><span></span><span></span>
                            </div>
                          }
                        </div>
                      </div>
                      <div class="doc-totals">
                        <div class="total-row">
                          <span class="total-label">TOTAL {{ quote.currency === 'USD' ? 'DOLARES' : 'SOLES' }}</span>
                          <span class="total-value">{{ formatCurrency(quote.total, quote.currency) }}</span>
                        </div>
                      </div>
                    } @else {
                      <div class="doc-report-info">
                        <div class="report-info-row"><span class="label">TIPO</span><span class="value">: Informe Técnico</span></div>
                      </div>
                    }
                  </div>
                  <div class="card-overlay" (click)="$event.stopPropagation()">
                    <div class="overlay-actions">
                      <button class="overlay-btn primary" (click)="editItem(quote)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Editar
                      </button>
                      <button class="overlay-btn" (click)="downloadItem(quote)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        PDF
                      </button>
                      <button class="overlay-btn danger" (click)="confirmDeleteItem(quote)">
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
      @if (quoteToDelete() || reportToDelete()) {
        <div class="modal-overlay" (click)="cancelDelete()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3>Confirmar Eliminación</h3>
            <p>¿Estás seguro que deseas eliminar {{ reportToDelete() ? 'el informe' : 'la cotización' }} <strong>{{ (quoteToDelete() || reportToDelete())?.documentNumber }}</strong>?</p>
            <p class="warning">Esta acción no se puede deshacer.</p>
            <div class="modal-actions">
              <button class="cancel-btn" (click)="cancelDelete()">Cancelar</button>
              <button class="confirm-delete-btn" (click)="deleteItem()" [disabled]="isDeleting()">
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

      <!-- Toast -->
      @if (toastMessage()) {
        <div class="toast" [class.toast-error]="toastType() === 'error'" role="alert">{{ toastMessage() }}</div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    /* List Toolbar */
    .list-toolbar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px 0; max-width: 1400px; margin: 0 auto; gap: 16px;
    }
    .subtitle { color: var(--text-muted); font-size: 14px; margin: 0; }

    /* View Selector */
    .view-selector { display: flex; background: var(--surface-hover); border-radius: 10px; padding: 4px; gap: 2px; }
    .view-btn {
      display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;
      border: none; background: transparent; border-radius: 8px; color: var(--text-muted);
      cursor: pointer; transition: all 0.2s;
    }
    .view-btn:hover { color: var(--accent-blue); }
    .view-btn.active { background: var(--surface-card); color: var(--accent-blue); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

    /* Search Bar */
    .search-bar { max-width: 1400px; margin: 0 auto; padding: 16px 24px 0; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .search-input-wrap {
      flex: 1; min-width: 200px; display: flex; align-items: center; gap: 10px;
      background: var(--surface-card); border: 1px solid var(--border-default); border-radius: 10px; padding: 10px 16px;
    }
    .search-input-wrap svg { color: var(--text-muted); flex-shrink: 0; }
    .search-input { border: none; outline: none; font-size: 15px; width: 100%; background: transparent; color: var(--text-primary); }
    .search-input::placeholder { color: var(--text-muted); }
    .filter-chips { display: flex; gap: 8px; }
    .chip {
      padding: 8px 18px; border-radius: 99px; border: 1px solid var(--border-default);
      background: var(--surface-card); font-size: 13px; font-weight: 600; color: var(--text-secondary);
      cursor: pointer; transition: all 0.2s; min-height: 44px;
    }
    .chip.active { background: var(--accent-blue); color: white; border-color: var(--accent-blue); }
    .chip:hover:not(.active) { border-color: var(--border-strong); }

    /* Toast */
    .toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: var(--text-primary); color: var(--text-inverted); padding: 14px 28px;
      border-radius: 12px; font-weight: 600; font-size: 15px; z-index: 2000;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2); animation: toastIn 0.3s ease;
    }
    .toast-error { background: var(--accent-red); color: white; }
    @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(16px); } }

    .main-content { max-width: 1400px; margin: 0 auto; padding: 24px; }

    /* States */
    .loading-state, .error-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; }
    .loading-state { color: var(--text-secondary); }
    .error-state { color: var(--accent-red); }
    .empty-state { color: var(--text-muted); }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border-default); border-top-color: var(--accent-blue); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .retry-btn, .create-btn {
      display: flex; align-items: center; gap: 8px;
      background: var(--accent-blue); color: white; text-decoration: none;
      padding: 14px 28px; border: none; border-radius: 12px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; margin-top: 16px;
    }
    .retry-btn:hover, .create-btn:hover { opacity: 0.9; transform: translateY(-2px); }
    .empty-state h3 { margin: 24px 0 8px; color: var(--text-primary); font-size: 20px; }
    .empty-state p { margin: 0; color: var(--text-secondary); }

    /* ==================== LIST VIEW ==================== */
    .quotes-list { display: flex; flex-direction: column; gap: 8px; }
    .quote-row {
      display: grid; grid-template-columns: 48px 2fr 1fr 120px auto; align-items: center; gap: 16px;
      background: var(--surface-card); border: 1px solid var(--border-default); border-radius: 12px;
      padding: 16px 20px; cursor: pointer; transition: all 0.2s;
    }
    .quote-row:hover { border-color: var(--border-strong); box-shadow: var(--shadow-card); transform: translateX(4px); }
    .quote-icon { width: 48px; height: 48px; background: var(--accent-blue-subtle); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--accent-blue); }
    .quote-main { display: flex; flex-direction: column; gap: 4px; }
    .quote-number { font-weight: 600; color: var(--text-primary); }
    .quote-client { font-size: 14px; color: var(--text-secondary); }
    .quote-amount { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .amount { font-weight: 700; color: var(--text-primary); font-size: 15px; }
    .items { font-size: 12px; color: var(--text-muted); }
    .badge-type { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-type.informe { background: var(--accent-orange-subtle, #fff3e0); color: var(--accent-orange, #e65100); }
    .report-icon-alt { background: var(--accent-orange-subtle, #fff3e0) !important; color: var(--accent-orange, #e65100) !important; }
    .report-card { border-left: 3px solid var(--accent-orange, #e65100); }
    .report-label { font-size: 16px !important; color: var(--accent-orange, #e65100) !important; font-weight: 600 !important; }
    .doc-report-info { padding: 20px; }
    .report-info-row { display: flex; font-size: 11px; line-height: 1.8; }
    .report-info-row .label { font-weight: 700; color: var(--text-muted); width: 80px; }
    .report-info-row .value { color: var(--text-primary); }
    .quote-date { font-size: 13px; color: var(--text-secondary); text-align: right; }
    .quote-actions { display: flex; gap: 8px; }
    .action-btn {
      width: 36px; height: 36px; border: none; border-radius: 8px; display: flex;
      align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
    }
    .action-btn.download { background: var(--accent-blue-subtle); color: var(--accent-blue); }
    .action-btn.download:hover { background: var(--accent-blue); color: white; }
    .action-btn.edit { background: var(--accent-green-subtle); color: var(--accent-green); }
    .action-btn.edit:hover { background: var(--accent-green); color: white; }
    .action-btn.delete { background: var(--accent-red-subtle); color: var(--accent-red); }
    .action-btn.delete:hover { background: var(--accent-red); color: white; }

    /* ==================== GRID VIEW ==================== */
    .quotes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .quote-grid-card {
      background: var(--surface-card); border: 1px solid var(--border-default); border-radius: 16px;
      padding: 20px; cursor: pointer; transition: all 0.2s;
    }
    .quote-grid-card:hover { border-color: var(--accent-blue); box-shadow: 0 8px 24px rgba(59,130,246,0.15); transform: translateY(-4px); }
    .grid-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .doc-number { font-weight: 700; color: var(--accent-blue); font-size: 15px; }
    .grid-actions { display: flex; gap: 4px; }
    .mini-btn {
      width: 28px; height: 28px; border: none; background: var(--surface-hover); border-radius: 6px;
      color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    }
    .mini-btn:hover { background: var(--accent-blue); color: white; }
    .mini-btn.danger:hover { background: var(--accent-red); }
    .mini-btn.edit { background: var(--accent-green-subtle); color: var(--accent-green); }
    .mini-btn.edit:hover { background: var(--accent-green); color: white; }
    .grid-card-body { margin-bottom: 16px; }
    .client-name { font-size: 14px; color: var(--text-secondary); margin: 0 0 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .total { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .grid-card-footer { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); padding-top: 12px; border-top: 1px solid var(--border-subtle); }

    /* ==================== CARDS VIEW ==================== */
    .quotes-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 28px; }
    .document-preview { position: relative; cursor: pointer; }
    .paper {
      background: var(--surface-card); border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06), 0 0 0 1px var(--border-default);
      overflow: hidden; transition: all 0.3s ease;
    }
    .document-preview:hover .paper {
      box-shadow: 0 4px 12px rgba(59,130,246,0.15), 0 12px 28px rgba(59,130,246,0.12), 0 0 0 2px rgba(59,130,246,0.2);
      transform: translateY(-4px);
    }
    .doc-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; border-bottom: 3px solid #1e3a8a; background: var(--surface-elevated);
    }
    .doc-logo { display: flex; align-items: center; gap: 10px; }
    .doc-logo img { height: 32px; width: auto; }
    .doc-logo span { font-size: 15px; font-weight: 700; color: var(--text-primary); }
    .doc-title { text-align: right; }
    .title-label { display: block; font-size: 10px; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
    .title-number { display: block; font-size: 16px; font-weight: 700; color: #1e3a8a; background: var(--accent-blue-subtle); padding: 4px 10px; border-radius: 4px; margin-top: 4px; }
    .doc-client { padding: 14px 20px; border-bottom: 1px solid var(--border-default); }
    .client-row { display: flex; font-size: 11px; line-height: 1.6; }
    .client-row .label { width: 50px; font-weight: 700; color: #1e3a8a; flex-shrink: 0; }
    .client-row .value { color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .doc-table { padding: 0; }
    .table-header { display: grid; grid-template-columns: 30px 1fr 40px 60px; background: #1e3a8a; color: white; font-size: 8px; font-weight: 600; text-transform: uppercase; padding: 8px 12px; }
    .table-body { padding: 8px 12px; }
    .table-row { display: grid; grid-template-columns: 30px 1fr 40px 60px; font-size: 9px; color: var(--text-muted); padding: 4px 0; border-bottom: 1px solid var(--border-subtle); }
    .table-row:last-child { border-bottom: none; }
    .table-row .desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .table-row.more { color: var(--text-muted); font-style: italic; }
    .doc-totals { background: #1e3a8a; padding: 12px 20px; }
    .total-row { display: flex; justify-content: space-between; align-items: center; }
    .total-row .total-label { color: rgba(255,255,255,0.8); font-size: 11px; font-weight: 600; }
    .total-row .total-value { color: white; font-size: 18px; font-weight: 700; }
    .card-overlay {
      position: absolute; bottom: 0; left: 0; right: 0;
      background: linear-gradient(to top, var(--surface-card) 60%, transparent);
      padding: 40px 16px 16px; opacity: 0; transition: opacity 0.25s ease;
    }
    .document-preview:hover .card-overlay { opacity: 1; }
    .overlay-actions { display: flex; gap: 8px; justify-content: center; }
    .overlay-btn {
      display: flex; align-items: center; gap: 6px; padding: 10px 16px; border: none;
      border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;
      background: var(--surface-card); color: var(--text-primary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.2s;
    }
    .overlay-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .overlay-btn.primary { background: var(--accent-blue); color: white; }
    .overlay-btn.primary:hover { opacity: 0.9; }
    .overlay-btn.danger:hover { background: var(--accent-red-subtle); color: var(--accent-red); }

    /* ==================== MODAL ==================== */
    .modal-overlay {
      position: fixed; inset: 0; background: var(--overlay-bg); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
    }
    .modal {
      background: var(--surface-card); border: 1px solid var(--border-default);
      border-radius: 20px; padding: 32px; max-width: 400px; width: 100%; text-align: center;
    }
    .modal-icon { color: var(--accent-amber); margin-bottom: 16px; }
    .modal h3 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0 0 12px; }
    .modal p { color: var(--text-secondary); margin: 0 0 8px; font-size: 15px; }
    .modal .warning { color: var(--accent-red); font-size: 13px; margin-bottom: 24px; }
    .modal-actions { display: flex; gap: 12px; }
    .cancel-btn {
      flex: 1; padding: 12px; border: 1px solid var(--border-default); background: var(--surface-card);
      border-radius: 10px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
    }
    .cancel-btn:hover { background: var(--surface-hover); }
    .confirm-delete-btn {
      flex: 1; padding: 12px; border: none; background: var(--accent-red); border-radius: 10px;
      font-weight: 600; color: white; cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .confirm-delete-btn:hover:not(:disabled) { opacity: 0.9; }
    .confirm-delete-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .spinner-small { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }

    /* ==================== RESPONSIVE ==================== */
    @media (max-width: 1024px) { .quotes-cards { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); } }
    @media (max-width: 640px) {
      .quotes-cards { grid-template-columns: 1fr; gap: 16px; }
      .doc-header { padding: 12px 16px; }
      .doc-logo img { height: 24px; }
      .doc-logo span { font-size: 13px; }
      .title-number { font-size: 14px; padding: 3px 8px; }
      .doc-client { padding: 10px 16px; }
      .table-header { grid-template-columns: 25px 1fr 35px 50px; padding: 6px 10px; font-size: 7px; }
      .table-body { padding: 6px 10px; }
      .table-row { grid-template-columns: 25px 1fr 35px 50px; font-size: 8px; }
      .doc-totals { padding: 10px 16px; }
      .total-row .total-value { font-size: 16px; }
      .overlay-btn { padding: 8px 12px; font-size: 12px; }
      .card-overlay { padding: 30px 12px 12px; opacity: 1; background: linear-gradient(to top, var(--surface-card) 60%, transparent); }
    }
    @media (max-width: 768px) {
      .list-toolbar { padding: 16px 16px 0; }
      .search-bar { padding: 16px 16px 0; }
      .main-content { padding: 16px; }
      .quote-row { grid-template-columns: 1fr; gap: 12px; }
      .quote-row > * { justify-self: start; }
      .quote-amount { align-items: flex-start; }
      .quote-actions { width: 100%; justify-content: flex-end; padding-top: 12px; border-top: 1px solid var(--border-subtle); }
      .quotes-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class QuotesListComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  private toolbarService = inject(ToolbarService);
  quotes = signal<QuoteSummary[]>([]);
  reports = signal<ReportSummary[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  quoteToDelete = signal<QuoteSummary | null>(null);
  reportToDelete = signal<ReportSummary | null>(null);
  isDeleting = signal(false);
  viewMode = signal<ViewMode>('cards');

  // Search & filter
  searchTerm = signal('');
  docFilter = signal<DocFilter>('ALL');
  private searchSubject = new Subject<string>();

  // Toast
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');
  private toastTimeout: any;

  filteredQuotes = computed(() => {
    const filter = this.docFilter();
    const term = this.searchTerm().toLowerCase().trim();

    // Build unified list
    let items: Array<QuoteSummary & { _type: 'quote' | 'report'; _sortDate: string }> = [];

    if (filter === 'ALL' || filter === 'COT') {
      items.push(...this.quotes().map(q => ({
        ...q, _type: 'quote' as const, _sortDate: q.createdAt
      })));
    }
    if (filter === 'ALL' || filter === 'INF') {
      items.push(...this.reports().map(r => ({
        documentNumber: r.documentNumber,
        clientName: r.empresa || '',
        total: 0, currency: 'PEN',
        itemCount: 0, createdAt: r.createdAt,
        firstItemDescription: null,
        _type: 'report' as const,
        _sortDate: r.createdAt,
        _report: r
      } as any)));
    }

    if (term) {
      items = items.filter(q =>
        q.documentNumber.toLowerCase().includes(term) ||
        (q.clientName || '').toLowerCase().includes(term)
      );
    }

    // Sort by date descending
    items.sort((a, b) => new Date(b._sortDate).getTime() - new Date(a._sortDate).getTime());
    return items;
  });

  constructor(private apiService: ApiService, private router: Router) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(term => this.searchTerm.set(term));
  }

  ngOnInit() {
    // Register toolbar actions
    this.toolbarService.setPageTitle('Documentos Guardados');
    this.toolbarService.setActions([
      {
        id: 'new-quote',
        icon: 'pi-plus',
        label: 'Nueva',
        callback: () => this.router.navigate(['/cotizacion']),
      },
    ]);

    // Load saved view preference
    const savedView = localStorage.getItem('quotes_view_mode') as ViewMode;
    if (savedView && ['list', 'grid', 'cards'].includes(savedView)) {
      this.viewMode.set(savedView);
    }

    this.loadQuotes();
  }

  ngOnDestroy() {
    this.toolbarService.clear();
  }

  loadQuotes() {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      quotes: this.apiService.listQuotesWithSummary(),
      reports: this.apiService.listReportsWithSummary()
    }).subscribe({
      next: ({ quotes, reports }) => {
        this.quotes.set(quotes);
        this.reports.set(reports);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading documents:', err);
        this.error.set('No se pudieron cargar los documentos. Verifica tu conexión.');
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
        this.showToast('Error al descargar la cotización', 'error');
      }
    });
  }

  downloadReport(docNumber: string) {
    this.apiService.downloadReport(docNumber).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = docNumber + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading report:', err);
        this.showToast('Error al descargar el informe', 'error');
      }
    });
  }

  editItem(item: any) {
    localStorage.setItem('quotes_view_mode', this.viewMode());
    if (item._type === 'report') {
      this.router.navigate(['/informe'], { queryParams: { edit: item.documentNumber } });
    } else {
      this.router.navigate(['/cotizacion'], { queryParams: { edit: item.documentNumber } });
    }
  }

  downloadItem(item: any) {
    if (item._type === 'report') {
      this.downloadReport(item.documentNumber);
    } else {
      this.downloadQuote(item);
    }
  }

  confirmDeleteItem(item: any) {
    if (item._type === 'report') {
      this.reportToDelete.set(item._report || item);
    } else {
      this.quoteToDelete.set(item);
    }
  }

  cancelDelete() {
    this.quoteToDelete.set(null);
    this.reportToDelete.set(null);
  }

  deleteItem() {
    const quote = this.quoteToDelete();
    const report = this.reportToDelete();

    if (report) {
      this.isDeleting.set(true);
      this.apiService.deleteReport(report.documentNumber).subscribe({
        next: () => {
          this.reports.update(list => list.filter(r => r.documentNumber !== report.documentNumber));
          this.reportToDelete.set(null);
          this.isDeleting.set(false);
        },
        error: (err) => {
          console.error('Error deleting report:', err);
          this.showToast('Error al eliminar el informe', 'error');
          this.isDeleting.set(false);
        }
      });
    } else if (quote) {
      this.isDeleting.set(true);
      this.apiService.deleteQuote(quote.documentNumber).subscribe({
        next: () => {
          this.quotes.update(quotes => quotes.filter(q => q.documentNumber !== quote.documentNumber));
          this.quoteToDelete.set(null);
          this.isDeleting.set(false);
        },
        error: (err) => {
          console.error('Error deleting quote:', err);
          this.showToast('Error al eliminar la cotización', 'error');
          this.isDeleting.set(false);
        }
      });
    }
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toastMessage.set(''), 3000);
  }
}
