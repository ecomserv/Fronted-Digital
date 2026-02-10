import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService, QuoteStats, QuoteSummary } from '../../core/services/api.service';

type DateRange = 'hoy' | '7d' | '30d' | '90d' | '6m' | '1y';

@Component({
   selector: 'app-dashboard',
   standalone: true,
   imports: [CommonModule, RouterLink],
   template: `
    <div class="dash">
      <!-- Welcome Section -->
      <section class="welcome" aria-label="Bienvenida">
        <div class="welcome-content">
          <div class="welcome-text">
            <div class="greeting-row">
              <h1>{{ greeting() }}, {{ firstName() }}</h1>
              <button class="edit-name-btn" (click)="editName()" title="Cambiar nombre">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
            </div>
            <p class="welcome-date">{{ todayFormatted() }}</p>
            @if (!loading() && stats()) {
              <p class="welcome-insight">{{ smartInsight() }}</p>
            }
          </div>
          <div class="quick-actions">
            <!-- Cotizaciones -->
            <div class="qa-group">
              <span class="qa-group-label">Cotizaciones</span>
              <div class="qa-group-btns">
                <a routerLink="/cotizacion" class="qa-btn primary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Nueva
                </a>
                <a routerLink="/cotizaciones" class="qa-btn secondary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  Guardadas
                </a>
              </div>
            </div>
            <!-- Informes -->
            <div class="qa-group">
              <span class="qa-group-label">Informes</span>
              <div class="qa-group-btns">
                <a routerLink="/informe" class="qa-btn accent">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Nuevo
                </a>
                <a routerLink="/informes" class="qa-btn secondary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  Guardados
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- KPI Section with Date Range Filter -->
      <section class="kpi-section" aria-label="Indicadores clave">
        <div class="section-header">
          <h2>Resumen</h2>
          <div class="date-chips" role="radiogroup" aria-label="Rango de fechas">
            @for (r of dateRanges; track r.value) {
              <button
                class="chip"
                [class.active]="selectedRange() === r.value"
                (click)="changeRange(r.value)"
                [attr.aria-pressed]="selectedRange() === r.value"
                role="radio">
                {{ r.label }}
              </button>
            }
          </div>
        </div>

        @if (loading()) {
          <div class="kpi-grid">
            @for (i of [1,2,3,4]; track i) {
              <div class="kpi-card"><div class="skeleton-pulse"></div></div>
            }
          </div>
        } @else if (stats()) {
          <div class="kpi-grid">
            <!-- Total Cotizaciones -->
            <div class="kpi-card">
              <div class="kpi-top">
                <div class="kpi-icon-wrap blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <span class="kpi-label">Total Cotizaciones
                  @if (totalQuotesTrend() !== 0) {
                    <span class="kpi-trend" [class.up]="totalQuotesTrend() > 0" [class.down]="totalQuotesTrend() < 0">
                      {{ totalQuotesTrend() > 0 ? '+' : '' }}{{ totalQuotesTrend() }}%
                    </span>
                  }
                </span>
              </div>
              <div class="kpi-bottom">
                <span class="kpi-value">{{ stats()!.totalQuotes }}</span>
                <svg class="sparkline" viewBox="0 0 60 24" preserveAspectRatio="none">
                  <polyline [attr.points]="sparklineQuotes()" fill="none" stroke="var(--accent-blue)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <!-- Este Mes -->
            <div class="kpi-card">
              <div class="kpi-top">
                <div class="kpi-icon-wrap green">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                </div>
                <span class="kpi-label">Este Mes
                  @if (monthTrend() !== 0) {
                    <span class="kpi-trend" [class.up]="monthTrend() > 0" [class.down]="monthTrend() < 0">
                      {{ monthTrend() > 0 ? '+' : '' }}{{ monthTrend() }}%
                    </span>
                  }
                </span>
              </div>
              <div class="kpi-bottom">
                <span class="kpi-value">{{ stats()!.quotesThisMonth }}</span>
              </div>
            </div>
            <!-- Total Soles -->
            <div class="kpi-card">
              <div class="kpi-top">
                <div class="kpi-icon-wrap amber">S/</div>
                <span class="kpi-label">Total Soles
                  @if (penTrend() !== 0) {
                    <span class="kpi-trend" [class.up]="penTrend() > 0" [class.down]="penTrend() < 0">
                      {{ penTrend() > 0 ? '+' : '' }}{{ penTrend() }}%
                    </span>
                  }
                </span>
              </div>
              <div class="kpi-bottom">
                <span class="kpi-value">{{ formatAmount(stats()!.totalPEN) }}</span>
                <svg class="sparkline" viewBox="0 0 60 24" preserveAspectRatio="none">
                  <polyline [attr.points]="sparklinePEN()" fill="none" stroke="var(--accent-amber)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <!-- Top Clientes -->
            <div class="kpi-card kpi-card-clients">
              <div class="kpi-top">
                <div class="kpi-icon-wrap purple">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <span class="kpi-label">Top Clientes</span>
              </div>
              @if (stats()!.topClients.length > 0) {
                <ul class="kpi-clients-list">
                  @for (c of stats()!.topClients.slice(0, 3); track c.name) {
                    <li>
                      <div class="kpi-cl-avatar" [style.background]="getClientColor(c.name)">
                        {{ getInitial(c.name) }}
                      </div>
                      <div class="kpi-cl-info">
                        <span class="kpi-cl-name">{{ c.name }}</span>
                        <span class="kpi-cl-count">{{ c.count }} cotizaciones</span>
                      </div>
                    </li>
                  }
                </ul>
              } @else {
                <span class="kpi-value" style="font-size:14px;color:var(--text-muted)">Sin datos</span>
              }
            </div>
          </div>
        }
      </section>

      <!-- Chart Section (full width) -->
      @if (!loading() && stats() && stats()!.monthlyTrend.length > 0) {
        <section class="chart-section" aria-label="Gráfico">
          <div class="insight-card">
            <h3>Cotizaciones por Mes</h3>
            <div class="bar-chart">
              @for (m of stats()!.monthlyTrend; track m.key) {
                <div class="bar-col">
                  <div class="bar" [style.height]="getBarHeight(m.count) + '%'">
                    <span class="bar-val">{{ m.count }}</span>
                  </div>
                  <span class="bar-label">{{ getMonthLabel(+m.key.split('-')[1]) }}</span>
                </div>
              }
            </div>
          </div>
        </section>
      }

      <!-- Recent Activity -->
      @if (!loading() && stats() && stats()!.recentQuotes && stats()!.recentQuotes.length > 0) {
        <section class="recent-section" aria-label="Actividad reciente">
          <div class="section-header">
            <h2>Actividad Reciente</h2>
            <a routerLink="/cotizaciones" class="view-all-link">Ver todas →</a>
          </div>
          <div class="recent-list">
            @for (q of stats()!.recentQuotes; track q.documentNumber) {
              <a class="recent-item" [routerLink]="['/cotizaciones']">
                <div class="recent-left">
                  <div class="recent-avatar" [style.background]="getClientColor(q.clientName)">
                    {{ getInitial(q.clientName) }}
                  </div>
                  <div class="recent-info">
                    <span class="recent-doc">{{ q.documentNumber }}</span>
                    <span class="recent-client">{{ q.clientName || 'Sin cliente' }}</span>
                  </div>
                </div>
                <div class="recent-right">
                  <span class="recent-amount">
                    {{ q.currency === 'USD' ? '$' : 'S/' }} {{ formatAmountFull(q.total) }}
                  </span>
                  <span class="recent-date">{{ timeAgo(q.createdAt) }}</span>
                </div>
              </a>
            }
          </div>
        </section>
      }
    </div>
  `,
   styles: [`
    :host {
      display: block;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .dash {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 24px 48px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    /* ======================== WELCOME ======================== */
    .welcome-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      flex-wrap: wrap;
    }

    .greeting-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .welcome-text h1 {
      font-size: 28px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.5px;
    }

    .edit-name-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      border-radius: 8px;
      color: var(--text-muted);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.5;
    }

    .edit-name-btn:hover {
      opacity: 1;
      background: var(--surface-hover);
      color: var(--accent-blue);
    }

    .welcome-date {
      color: var(--text-muted);
      font-size: 14px;
      margin: 4px 0 0;
    }

    .welcome-insight {
      color: var(--text-secondary);
      font-size: 14px;
      margin: 8px 0 0;
      font-weight: 500;
    }

    .quick-actions {
      display: flex;
      gap: 16px;
      flex-shrink: 0;
    }

    .qa-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .qa-group-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .qa-group-btns {
      display: flex;
      gap: 8px;
    }

    .qa-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 11px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .qa-btn.primary {
      background: var(--ecom-blue-500);
      color: white;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }

    .qa-btn.primary:hover {
      background: var(--ecom-blue-600, #2563eb);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      transform: translateY(-1px);
    }

    .qa-btn.accent {
      background: var(--accent-green, #10b981);
      color: white;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    }

    .qa-btn.accent:hover {
      background: #059669;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      transform: translateY(-1px);
    }

    .qa-btn.secondary {
      background: var(--surface-card);
      color: var(--text-secondary);
      border: 1px solid var(--border-default);
    }

    .qa-btn.secondary:hover {
      border-color: var(--border-strong);
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    /* ======================== KPI SECTION ======================== */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
    }

    .section-header h2 {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .date-chips {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .date-chips::-webkit-scrollbar { display: none; }

    .chip {
      padding: 6px 14px;
      border-radius: 99px;
      border: 1px solid var(--border-default);
      background: var(--surface-card);
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      min-height: 36px;
    }

    .chip:hover:not(.active) {
      border-color: var(--border-strong);
      background: var(--surface-hover);
    }

    .chip.active {
      background: var(--ecom-blue-500);
      color: white;
      border-color: var(--ecom-blue-500);
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .kpi-card {
      background: var(--surface-card);
      border-radius: 14px;
      padding: 20px;
      border: 1px solid var(--border-default);
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: all 0.2s ease;
    }

    .kpi-card:hover {
      border-color: var(--border-strong);
      box-shadow: var(--shadow-card);
    }

    .kpi-top {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .kpi-bottom {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 8px;
    }

    .kpi-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 800;
      flex-shrink: 0;
    }

    .kpi-icon-wrap.blue { background: var(--accent-blue-subtle); color: var(--accent-blue); }
    .kpi-icon-wrap.green { background: var(--accent-green-subtle); color: var(--accent-green); }
    .kpi-icon-wrap.amber { background: var(--accent-amber-subtle); color: var(--accent-amber); }
    .kpi-icon-wrap.purple { background: var(--accent-purple-subtle); color: var(--accent-purple); }

    .kpi-label {
      font-size: 13px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .kpi-value {
      font-size: 28px;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1;
    }

    .kpi-trend {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 99px;
    }

    .kpi-trend.up { background: var(--accent-green-subtle); color: var(--kpi-trend-up); }
    .kpi-trend.down { background: var(--accent-red-subtle); color: var(--kpi-trend-down); }

    .sparkline {
      width: 60px;
      height: 24px;
      flex-shrink: 0;
      opacity: 0.8;
    }

    /* Top Clients inside KPI card */
    .kpi-clients-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .kpi-clients-list li {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .kpi-cl-avatar {
      width: 26px;
      height: 26px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 11px;
      color: white;
      flex-shrink: 0;
    }

    .kpi-cl-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .kpi-cl-name {
      font-weight: 600;
      font-size: 12px;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .kpi-cl-count {
      font-size: 11px;
      color: var(--text-muted);
    }

    .skeleton-pulse {
      width: 100%;
      height: 88px;
      border-radius: 10px;
      background: linear-gradient(90deg, var(--surface-hover) 25%, var(--border-subtle) 50%, var(--surface-hover) 75%);
      background-size: 200% 100%;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* ======================== CHART SECTION ======================== */
    .insight-card {
      background: var(--surface-card);
      border-radius: 14px;
      padding: 24px;
      border: 1px solid var(--border-default);
      transition: all 0.3s ease;
    }

    .insight-card h3 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 20px;
    }

    .bar-chart { display: flex; align-items: flex-end; gap: 10px; height: 170px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; justify-content: flex-end; }
    .bar {
      width: 100%;
      background: linear-gradient(180deg, var(--accent-blue), var(--ecom-blue-700));
      border-radius: 6px 6px 0 0;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      min-height: 6px;
      transition: height 0.5s ease;
    }
    .bar-val { font-size: 11px; font-weight: 700; color: white; padding-top: 4px; }
    .bar-label { font-size: 11px; color: var(--text-muted); margin-top: 6px; font-weight: 500; }

    /* ======================== RECENT ACTIVITY ======================== */
    .view-all-link {
      font-size: 13px;
      font-weight: 600;
      color: var(--accent-blue);
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .view-all-link:hover { opacity: 0.8; }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      background: var(--surface-card);
      border-radius: 14px;
      border: 1px solid var(--border-default);
      overflow: hidden;
    }

    .recent-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      transition: background 0.15s ease;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
    }

    .recent-item:hover { background: var(--surface-hover); }

    .recent-item + .recent-item {
      border-top: 1px solid var(--border-subtle, var(--border-default));
    }

    .recent-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .recent-avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      color: white;
      flex-shrink: 0;
    }

    .recent-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .recent-doc {
      font-weight: 700;
      font-size: 13px;
      color: var(--text-primary);
    }

    .recent-client {
      font-size: 12px;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .recent-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      flex-shrink: 0;
    }

    .recent-amount {
      font-weight: 700;
      font-size: 14px;
      color: var(--text-primary);
    }

    .recent-date {
      font-size: 12px;
      color: var(--text-muted);
    }

    /* ======================== RESPONSIVE ======================== */
    @media (max-width: 1024px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .dash { padding: 20px 16px 48px; gap: 20px; }
      .welcome-text h1 { font-size: 22px; }
      .welcome-content { flex-direction: column; }
      .quick-actions { width: 100%; flex-direction: column; }
      .qa-group-btns { flex: 1; }
      .qa-btn { flex: 1; justify-content: center; padding: 12px 14px; }
      .kpi-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .kpi-value { font-size: 22px; }
      .kpi-card { padding: 16px; }
      .recent-item { padding: 12px 16px; }
    }

    @media (max-width: 400px) {
      .kpi-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
   stats = signal<QuoteStats | null>(null);
   loading = signal(true);
   selectedRange = signal<DateRange>('30d');

   authService = inject(AuthService);
   private apiService = inject(ApiService);

   dateRanges: { value: DateRange; label: string }[] = [
     { value: 'hoy', label: 'Hoy' },
     { value: '7d', label: '7 días' },
     { value: '30d', label: '30 días' },
     { value: '90d', label: '90 días' },
     { value: '6m', label: '6 meses' },
     { value: '1y', label: '1 año' },
   ];

   private clientColors = [
     '#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444','#6366f1','#14b8a6'
   ];

   ngOnInit(): void {
     this.loadStats();
   }

   changeRange(range: DateRange): void {
     this.selectedRange.set(range);
     this.loadStats();
   }

   private loadStats(): void {
     this.loading.set(true);
     const { from, to } = this.getDateRange(this.selectedRange());
     this.apiService.getQuoteStats(from, to).subscribe({
       next: data => { this.stats.set(data); this.loading.set(false); },
       error: () => this.loading.set(false)
     });
   }

   private getDateRange(range: DateRange): { from: string; to: string } {
     const to = new Date();
     const from = new Date();
     switch (range) {
       case 'hoy': from.setHours(0, 0, 0, 0); break;
       case '7d': from.setDate(from.getDate() - 7); break;
       case '30d': from.setDate(from.getDate() - 30); break;
       case '90d': from.setDate(from.getDate() - 90); break;
       case '6m': from.setMonth(from.getMonth() - 6); break;
       case '1y': from.setFullYear(from.getFullYear() - 1); break;
     }
     return {
       from: from.toISOString().split('T')[0],
       to: to.toISOString().split('T')[0]
     };
   }

   greeting(): string {
     const h = new Date().getHours();
     if (h < 12) return 'Buenos días';
     if (h < 18) return 'Buenas tardes';
     return 'Buenas noches';
   }

   firstName(): string {
     const user = this.authService.currentUser();
     const name = user?.username || user?.name || 'Usuario';
     return name.split(' ')[0];
   }

   todayFormatted(): string {
     return new Date().toLocaleDateString('es-PE', {
       weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
     });
   }

   editName(): void {
     const user = this.authService.currentUser();
     const current = user?.username || user?.name || '';
     const newName = prompt('Ingresa tu nombre:', current);
     if (newName && newName.trim() && newName.trim() !== current) {
       this.authService.updateName(newName.trim(), newName.trim()).subscribe();
     }
   }

   smartInsight(): string {
     const s = this.stats();
     if (!s) return '';
     const trend = this.monthTrend();
     if (s.quotesThisMonth === 0) {
       return 'Aún no tienes cotizaciones este mes — ¡crea la primera!';
     }
     if (trend > 0) {
       return `Tu mes va ${trend}% mejor que el anterior — ¡sigue así!`;
     }
     if (trend < 0) {
       return `Llevas ${s.quotesThisMonth} cotizaciones este mes, ${Math.abs(trend)}% menos que el anterior.`;
     }
     return `Llevas ${s.quotesThisMonth} cotizaciones este mes, igual que el anterior.`;
   }

   monthTrend(): number {
     const s = this.stats();
     if (!s || s.quotesLastMonth === 0) return 0;
     return Math.round(((s.quotesThisMonth - s.quotesLastMonth) / s.quotesLastMonth) * 100);
   }

   totalQuotesTrend(): number {
     const s = this.stats();
     if (!s || !s.previousPeriodQuotes || s.previousPeriodQuotes === 0) return 0;
     return Math.round(((s.totalQuotes - s.previousPeriodQuotes) / s.previousPeriodQuotes) * 100);
   }

   penTrend(): number {
     const s = this.stats();
     if (!s || !s.previousPeriodPEN || s.previousPeriodPEN === 0) return 0;
     return Math.round(((s.totalPEN - s.previousPeriodPEN) / s.previousPeriodPEN) * 100);
   }

   formatAmount(val: number): string {
     if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
     if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
     return val.toFixed(0);
   }

   formatAmountFull(val: number): string {
     return val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
   }

   getBarHeight(count: number): number {
     const s = this.stats();
     if (!s) return 0;
     const max = Math.max(...s.monthlyTrend.map(m => m.count), 1);
     return Math.max((count / max) * 100, 5);
   }

   getMonthLabel(month: number): string {
     return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][month - 1] || '';
   }

   // Sparkline helpers
   private buildSparkline(values: number[]): string {
     if (!values.length) return '';
     const max = Math.max(...values, 1);
     const step = 60 / Math.max(values.length - 1, 1);
     return values.map((v, i) => `${i * step},${24 - (v / max) * 20 - 2}`).join(' ');
   }

   sparklineQuotes(): string {
     const s = this.stats();
     if (!s) return '';
     return this.buildSparkline(s.monthlyTrend.map(m => m.count));
   }

   sparklinePEN(): string {
     const s = this.stats();
     if (!s) return '';
     return this.buildSparkline(s.monthlyTrend.map(m => m.totalPEN));
   }

   // Client avatar helpers
   getInitial(name: string): string {
     return (name || '?').charAt(0).toUpperCase();
   }

   getClientColor(name: string): string {
     let hash = 0;
     for (let i = 0; i < (name || '').length; i++) {
       hash = name.charCodeAt(i) + ((hash << 5) - hash);
     }
     return this.clientColors[Math.abs(hash) % this.clientColors.length];
   }

   // Time ago helper
   timeAgo(dateStr: string): string {
     if (!dateStr) return '';
     const date = new Date(dateStr);
     const now = new Date();
     const diffMs = now.getTime() - date.getTime();
     const diffMin = Math.floor(diffMs / 60000);
     const diffHr = Math.floor(diffMs / 3600000);
     const diffDays = Math.floor(diffMs / 86400000);
     if (diffMin < 1) return 'ahora';
     if (diffMin < 60) return `hace ${diffMin} min`;
     if (diffHr < 24) return `hace ${diffHr}h`;
     if (diffDays === 1) return 'ayer';
     if (diffDays < 7) return `hace ${diffDays} días`;
     if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} sem`;
     return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
   }
}
