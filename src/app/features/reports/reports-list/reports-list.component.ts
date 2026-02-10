import { Component, OnInit, OnDestroy, signal, computed, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService, ReportSummary } from '../../../core/services/api.service';
import { ToolbarService } from '../../../core/services/toolbar.service';

type ViewMode = 'list' | 'grid' | 'cards';

@Component({
  selector: 'app-reports-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="reports-list-container">
      <!-- Toolbar -->
      <div class="list-toolbar">
        <p class="subtitle">{{ filteredReports().length }} informe{{ filteredReports().length !== 1 ? 's' : '' }}</p>
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

      <!-- Search Bar -->
      <div class="search-bar">
        <div class="search-input-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" class="search-input" placeholder="Buscar por número, empresa, marca..." [ngModel]="searchTerm()" (ngModelChange)="onSearchChange($event)">
        </div>
      </div>

      <!-- Content -->
      <main class="main-content">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando informes...</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <p>{{ error() }}</p>
            <button class="retry-btn" (click)="loadReports()">Reintentar</button>
          </div>
        } @else if (reports().length === 0) {
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3>No hay informes</h3>
            <p>Aún no has creado ningún informe técnico.</p>
            <a routerLink="/informe" class="create-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Crear Informe
            </a>
          </div>
        } @else {
          <!-- List View -->
          @if (viewMode() === 'list') {
            <div class="reports-list">
              @for (report of filteredReports(); track report.documentNumber) {
                <div class="report-row" (click)="editReport(report)">
                  <div class="report-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                  <div class="report-main">
                    <span class="report-number">{{ report.documentNumber }}</span>
                    <span class="report-empresa">{{ report.empresa || 'Sin empresa' }}</span>
                  </div>
                  <div class="report-details">
                    <span class="detail-primary">{{ report.marca }} {{ report.modelo }}</span>
                    <span class="detail-secondary">{{ report.tipoServicio }}</span>
                  </div>
                  <div class="report-date">{{ formatDate(report.createdAt) }}</div>
                  <div class="report-actions" (click)="$event.stopPropagation()">
                    <button class="action-btn edit" (click)="editReport(report)" title="Editar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="action-btn download" (click)="downloadReport(report)" title="Descargar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                    <button class="action-btn delete" (click)="confirmDelete(report)" title="Eliminar">
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
            <div class="reports-grid">
              @for (report of filteredReports(); track report.documentNumber) {
                <div class="report-grid-card" (click)="editReport(report)">
                  <div class="grid-card-header">
                    <span class="doc-number">{{ report.documentNumber }}</span>
                    <div class="grid-actions" (click)="$event.stopPropagation()">
                      <button class="mini-btn edit" (click)="editReport(report)" title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button class="mini-btn" (click)="downloadReport(report)" title="Descargar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                      <button class="mini-btn danger" (click)="confirmDelete(report)" title="Eliminar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="grid-card-body">
                    <p class="empresa-name">{{ report.empresa || 'Sin empresa' }}</p>
                    <p class="equipo">{{ report.marca }} {{ report.modelo }}</p>
                    <div class="badge-row">
                      <span class="badge badge-service">{{ report.tipoServicio || 'N/A' }}</span>
                    </div>
                  </div>
                  <div class="grid-card-footer">
                    <span>{{ report.realizadoPor || 'Sin técnico' }}</span>
                    <span>{{ formatShortDate(report.createdAt) }}</span>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Cards View (Document Preview) -->
          @if (viewMode() === 'cards') {
            <div class="reports-cards">
              @for (report of filteredReports(); track report.documentNumber) {
                <div class="document-preview" (click)="editReport(report)">
                  <div class="paper">
                    <div class="doc-header-bar">
                      <div class="doc-logo">
                        <img src="/logo-ecomserv.png" alt="ECOMSERV" />
                        <span>ECOMSERV</span>
                      </div>
                      <div class="doc-title">
                        <span class="title-label">INFORME TÉCNICO</span>
                        <span class="title-number">{{ report.documentNumber }}</span>
                      </div>
                    </div>
                    <div class="doc-datos">
                      <div class="dato-row">
                        <span class="dato-label">EMPRESA</span>
                        <span class="dato-value">: {{ report.empresa || '-' }}</span>
                      </div>
                      <div class="dato-row">
                        <span class="dato-label">EQUIPO</span>
                        <span class="dato-value">: {{ report.marca }} {{ report.modelo }}</span>
                      </div>
                      <div class="dato-row">
                        <span class="dato-label">SERVICIO</span>
                        <span class="dato-value">: {{ report.tipoServicio || '-' }}</span>
                      </div>
                    </div>
                    <div class="doc-problema">
                      <div class="problema-title">PROBLEMA REPORTADO</div>
                      <div class="problema-text">{{ report.problemaReportado || 'Sin descripción' }}</div>
                    </div>
                    <div class="doc-footer-bar">
                      <span class="tecnico">{{ report.realizadoPor || 'Sin técnico' }}</span>
                      <span class="fecha">{{ formatShortDate(report.createdAt) }}</span>
                    </div>
                  </div>
                  <div class="card-overlay" (click)="$event.stopPropagation()">
                    <div class="overlay-actions">
                      <button class="overlay-btn primary" (click)="editReport(report)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Editar
                      </button>
                      <button class="overlay-btn" (click)="downloadReport(report)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        PDF
                      </button>
                      <button class="overlay-btn danger" (click)="confirmDelete(report)">
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
      @if (reportToDelete()) {
        <div class="modal-overlay" (click)="cancelDelete()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3>Confirmar Eliminación</h3>
            <p>¿Estás seguro que deseas eliminar el informe <strong>{{ reportToDelete()?.documentNumber }}</strong>?</p>
            <p class="warning">Esta acción no se puede deshacer.</p>
            <div class="modal-actions">
              <button class="cancel-btn" (click)="cancelDelete()">Cancelar</button>
              <button class="confirm-delete-btn" (click)="deleteReport()" [disabled]="isDeleting()">
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
    :host { display: block; font-family: 'Inter', system-ui, -apple-system, sans-serif; }

    .list-toolbar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px 0; max-width: 1400px; margin: 0 auto; gap: 16px;
    }
    .subtitle { color: var(--text-muted); font-size: 14px; margin: 0; }

    .view-selector { display: flex; background: var(--surface-hover); border-radius: 10px; padding: 4px; gap: 2px; }
    .view-btn {
      display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;
      border: none; background: transparent; border-radius: 8px; color: var(--text-muted);
      cursor: pointer; transition: all 0.2s;
    }
    .view-btn:hover { color: var(--accent-blue); }
    .view-btn.active { background: var(--surface-card); color: var(--accent-blue); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

    .search-bar { max-width: 1400px; margin: 0 auto; padding: 16px 24px 0; display: flex; gap: 16px; align-items: center; }
    .search-input-wrap {
      flex: 1; display: flex; align-items: center; gap: 10px;
      background: var(--surface-card); border: 1px solid var(--border-default); border-radius: 10px; padding: 10px 16px;
    }
    .search-input-wrap svg { color: var(--text-muted); flex-shrink: 0; }
    .search-input { border: none; outline: none; font-size: 15px; width: 100%; background: transparent; color: var(--text-primary); }
    .search-input::placeholder { color: var(--text-muted); }

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
    .reports-list { display: flex; flex-direction: column; gap: 8px; }
    .report-row {
      display: grid; grid-template-columns: 48px 2fr 1.5fr 120px auto; align-items: center; gap: 16px;
      background: var(--surface-card); border: 1px solid var(--border-default); border-radius: 12px;
      padding: 16px 20px; cursor: pointer; transition: all 0.2s;
    }
    .report-row:hover { border-color: var(--border-strong); box-shadow: var(--shadow-card); transform: translateX(4px); }
    .report-icon { width: 48px; height: 48px; background: var(--accent-amber-subtle, #FFF8E1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--accent-amber, #F59E0B); }
    .report-main { display: flex; flex-direction: column; gap: 4px; }
    .report-number { font-weight: 600; color: var(--text-primary); }
    .report-empresa { font-size: 14px; color: var(--text-secondary); }
    .report-details { display: flex; flex-direction: column; gap: 2px; }
    .detail-primary { font-weight: 600; font-size: 14px; color: var(--text-primary); }
    .detail-secondary { font-size: 12px; color: var(--text-muted); }
    .report-date { font-size: 13px; color: var(--text-secondary); text-align: right; }
    .report-actions { display: flex; gap: 8px; }
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
    .reports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .report-grid-card {
      background: var(--surface-card); border: 1px solid var(--border-default); border-radius: 16px;
      padding: 20px; cursor: pointer; transition: all 0.2s;
    }
    .report-grid-card:hover { border-color: var(--accent-amber, #F59E0B); box-shadow: 0 8px 24px rgba(245,158,11,0.15); transform: translateY(-4px); }
    .grid-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .doc-number { font-weight: 700; color: var(--accent-amber, #D97706); font-size: 15px; }
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
    .empresa-name { font-weight: 600; font-size: 15px; color: var(--text-primary); margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .equipo { font-size: 14px; color: var(--text-secondary); margin: 0 0 8px; }
    .badge-row { display: flex; gap: 6px; flex-wrap: wrap; }
    .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .badge-service { background: var(--accent-blue-subtle); color: var(--accent-blue); }
    .grid-card-footer { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); padding-top: 12px; border-top: 1px solid var(--border-subtle); }

    /* ==================== CARDS VIEW ==================== */
    .reports-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 28px; }
    .document-preview { position: relative; cursor: pointer; }
    .paper {
      background: var(--surface-card); border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06), 0 0 0 1px var(--border-default);
      overflow: hidden; transition: all 0.3s ease;
    }
    .document-preview:hover .paper {
      box-shadow: 0 4px 12px rgba(245,158,11,0.15), 0 12px 28px rgba(245,158,11,0.12), 0 0 0 2px rgba(245,158,11,0.3);
      transform: translateY(-4px);
    }
    .doc-header-bar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; border-bottom: 3px solid #1e3a8a; background: var(--surface-elevated);
    }
    .doc-logo { display: flex; align-items: center; gap: 10px; }
    .doc-logo img { height: 32px; width: auto; }
    .doc-logo span { font-size: 15px; font-weight: 700; color: var(--text-primary); }
    .doc-title { text-align: right; }
    .title-label { display: block; font-size: 10px; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
    .title-number { display: block; font-size: 16px; font-weight: 700; color: #92400E; background: #FEF3C7; padding: 4px 10px; border-radius: 4px; margin-top: 4px; }
    .doc-datos { padding: 12px 20px; border-bottom: 1px solid var(--border-default); }
    .dato-row { display: flex; font-size: 11px; line-height: 1.6; }
    .dato-row .dato-label { width: 60px; font-weight: 700; color: #1e3a8a; flex-shrink: 0; }
    .dato-row .dato-value { color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .doc-problema { padding: 12px 20px; }
    .problema-title { font-size: 9px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; margin-bottom: 4px; }
    .problema-text { font-size: 10px; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .doc-footer-bar { display: flex; justify-content: space-between; padding: 10px 20px; background: #92400E; color: white; font-size: 10px; }
    .tecnico { font-weight: 600; }
    .fecha { opacity: 0.8; }
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
      border-radius: 10px; font-weight: 600; color: var(--text-secondary); cursor: pointer;
    }
    .cancel-btn:hover { background: var(--surface-hover); }
    .confirm-delete-btn {
      flex: 1; padding: 12px; border: none; background: var(--accent-red); border-radius: 10px;
      font-weight: 600; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .confirm-delete-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .spinner-small { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }

    /* Toast */
    .toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: var(--text-primary); color: var(--text-inverted); padding: 14px 28px;
      border-radius: 12px; font-weight: 600; font-size: 15px; z-index: 2000;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2); animation: toastIn 0.3s ease;
    }
    .toast-error { background: var(--accent-red); color: white; }
    @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(16px); } }

    /* Responsive */
    @media (max-width: 768px) {
      .list-toolbar { padding: 16px 16px 0; }
      .search-bar { padding: 16px 16px 0; }
      .main-content { padding: 16px; }
      .report-row { grid-template-columns: 1fr; gap: 12px; }
      .report-row > * { justify-self: start; }
      .report-actions { width: 100%; justify-content: flex-end; padding-top: 12px; border-top: 1px solid var(--border-subtle); }
      .reports-grid { grid-template-columns: 1fr; }
      .reports-cards { grid-template-columns: 1fr; gap: 16px; }
      .card-overlay { opacity: 1; }
    }
  `]
})
export class ReportsListComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  private toolbarService = inject(ToolbarService);
  private apiService = inject(ApiService);
  private router = inject(Router);

  reports = signal<ReportSummary[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  reportToDelete = signal<ReportSummary | null>(null);
  isDeleting = signal(false);
  viewMode = signal<ViewMode>('cards');

  searchTerm = signal('');
  private searchSubject = new Subject<string>();

  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');
  private toastTimeout: any;

  filteredReports = computed(() => {
    let list = this.reports();
    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      list = list.filter(r =>
        r.documentNumber.toLowerCase().includes(term) ||
        (r.empresa || '').toLowerCase().includes(term) ||
        (r.marca || '').toLowerCase().includes(term) ||
        (r.modelo || '').toLowerCase().includes(term) ||
        (r.realizadoPor || '').toLowerCase().includes(term)
      );
    }
    return list;
  });

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(term => this.searchTerm.set(term));
  }

  ngOnInit() {
    this.toolbarService.setPageTitle('Informes Técnicos');
    this.toolbarService.setActions([
      {
        id: 'new-report',
        icon: 'pi-plus',
        label: 'Nuevo',
        callback: () => this.router.navigate(['/informe']),
      },
    ]);

    const savedView = localStorage.getItem('reports_view_mode') as ViewMode;
    if (savedView && ['list', 'grid', 'cards'].includes(savedView)) {
      this.viewMode.set(savedView);
    }

    this.loadReports();
  }

  ngOnDestroy() {
    this.toolbarService.clear();
  }

  loadReports() {
    this.isLoading.set(true);
    this.error.set(null);

    this.apiService.listReportsWithSummary().subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading reports:', err);
        this.error.set('No se pudieron cargar los informes. Verifica tu conexión.');
        this.isLoading.set(false);
      }
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }

  editReport(report: ReportSummary) {
    localStorage.setItem('reports_view_mode', this.viewMode());
    this.router.navigate(['/informe'], { queryParams: { edit: report.documentNumber } });
  }

  downloadReport(report: ReportSummary) {
    this.apiService.downloadReport(report.documentNumber).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = report.documentNumber + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.showToast('Error al descargar el informe', 'error')
    });
  }

  confirmDelete(report: ReportSummary) { this.reportToDelete.set(report); }
  cancelDelete() { this.reportToDelete.set(null); }

  deleteReport() {
    const report = this.reportToDelete();
    if (!report) return;
    this.isDeleting.set(true);

    this.apiService.deleteReport(report.documentNumber).subscribe({
      next: () => {
        this.reports.update(list => list.filter(r => r.documentNumber !== report.documentNumber));
        this.reportToDelete.set(null);
        this.isDeleting.set(false);
        this.showToast('Informe eliminado', 'success');
      },
      error: () => {
        this.showToast('Error al eliminar el informe', 'error');
        this.isDeleting.set(false);
      }
    });
  }

  onSearchChange(term: string) { this.searchSubject.next(term); }

  private showToast(message: string, type: 'success' | 'error') {
    this.toastMessage.set(message);
    this.toastType.set(type);
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toastMessage.set(''), 3000);
  }
}
