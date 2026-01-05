import { Component, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PdfService, QuoteData } from '../../../core/services/pdf.service';

@Component({
  selector: 'app-pdf-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="preview-container">
      <!-- Preview Header - Minimalista blanco -->
      <div class="preview-header">
        <div class="preview-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span>Vista Previa del Documento</span>
        </div>
        <div class="preview-actions" role="group" aria-label="Controles de vista previa">
          <button
            type="button"
            class="preview-btn"
            [class.active]="!isMobileView()"
            (click)="isMobileView.set(false)"
            title="Vista de escritorio"
            [attr.aria-pressed]="!isMobileView()"
            aria-label="Vista de escritorio">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </button>
          <button
            type="button"
            class="preview-btn"
            [class.active]="isMobileView()"
            (click)="isMobileView.set(true)"
            title="Vista móvil"
            [attr.aria-pressed]="isMobileView()"
            aria-label="Vista móvil">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          </button>
          <div class="divider" aria-hidden="true"></div>
          <button
            type="button"
            class="preview-btn"
            (click)="zoomOut()"
            title="Alejar vista"
            [disabled]="zoom() <= 0.5"
            aria-label="Alejar vista">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <span class="zoom-display" aria-live="polite">{{ zoomPercent() }}%</span>
          <button
            type="button"
            class="preview-btn"
            (click)="zoomIn()"
            title="Acercar vista"
            [disabled]="zoom() >= 1.5"
            aria-label="Acercar vista">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Preview Content -->
      <div class="preview-scroll">
        @if (quoteData()) {
          <div
            class="pdf-wrapper"
            [class.mobile-view]="isMobileView()"
            [style.transform]="'scale(' + zoom() + ')'"
            [style.transform-origin]="'top center'">
            <div class="pdf-content" [innerHTML]="sanitizedHtml()"></div>
          </div>
        } @else {
          <div class="empty-state">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <h3>Sin datos para mostrar</h3>
            <p>Complete el formulario para ver la vista previa del documento.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    /* ============================================
       CONTAINER - Blanco y limpio
       ============================================ */
    .preview-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 600px;
      background: #ffffff;
      border-radius: var(--radius-lg);
      overflow: hidden;
      position: relative;
    }

    /* ============================================
       HEADER - Minimalista blanco
       ============================================ */
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md) var(--spacing-lg);
      background: #ffffff;
      border-bottom: 1px solid var(--ecom-gray-200);
      flex-shrink: 0;
    }

    .preview-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-weight: 600;
      font-size: var(--text-base);
      color: var(--ecom-gray-800);
    }

    .preview-title svg {
      color: var(--ecom-gray-600);
    }

    /* ============================================
       ACTIONS - Botones claros
       ============================================ */
    .preview-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      background: var(--ecom-gray-100);
      padding: var(--spacing-xs);
      border-radius: var(--radius-md);
    }

    .divider {
      width: 1px;
      height: 24px;
      background: var(--ecom-gray-300);
      margin: 0 var(--spacing-xs);
    }

    .preview-btn {
      min-width: var(--touch-target-min);
      min-height: var(--touch-target-min);
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ecom-gray-600);
      transition: all 0.15s ease;
    }

    .preview-btn:hover:not(:disabled) {
      background: var(--ecom-gray-200);
      color: var(--ecom-gray-900);
    }

    .preview-btn:focus-visible {
      box-shadow: var(--focus-ring);
    }

    .preview-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .preview-btn.active {
      background: var(--ecom-gray-800);
      color: white;
    }

    .zoom-display {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--ecom-gray-700);
      min-width: 48px;
      text-align: center;
    }

    /* ============================================
       SCROLL AREA - Fondo BLANCO PURO
       ============================================ */
    .preview-scroll {
      flex: 1;
      overflow: auto;
      background: #ffffff;
      padding: var(--spacing-lg);
    }

    /* ============================================
       PDF WRAPPER
       ============================================ */
    .pdf-wrapper {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      transition: transform 0.2s ease;
    }

    .pdf-wrapper.mobile-view {
      max-width: 375px;
    }

    .pdf-content {
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border-radius: var(--radius-sm);
    }

    /* ============================================
       EMPTY STATE - Limpio y claro
       ============================================ */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      text-align: center;
      padding: var(--spacing-2xl) var(--spacing-xl);
      background: #ffffff;
      border-radius: var(--radius-lg);
    }

    .empty-state svg {
      stroke: var(--ecom-gray-300);
      margin-bottom: var(--spacing-lg);
    }

    .empty-state h3 {
      margin: 0 0 var(--spacing-sm);
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--ecom-gray-700);
    }

    .empty-state p {
      margin: 0;
      font-size: var(--text-base);
      color: var(--ecom-gray-500);
      max-width: 280px;
      line-height: 1.6;
    }

    /* ============================================
       RESPONSIVE - MOBILE
       ============================================ */
    @media (max-width: 1200px) {
      .preview-container {
        border-radius: 0;
        min-height: 100%;
      }

      .preview-header {
        padding: var(--spacing-sm) var(--spacing-md);
      }

      .preview-title span {
        display: none;
      }

      .preview-scroll {
        padding: var(--spacing-md);
      }
    }

    @media (max-width: 768px) {
      .preview-actions {
        padding: 4px;
        gap: 4px;
      }

      .preview-btn {
        min-width: 40px;
        min-height: 40px;
      }

      .preview-btn svg {
        width: 18px;
        height: 18px;
      }

      .divider {
        height: 20px;
        margin: 0 4px;
      }

      .zoom-display {
        font-size: 0.875rem;
        min-width: 40px;
      }
    }
  `]
})
export class PdfPreviewComponent {
  quoteData = input<QuoteData | null>(null);

  isMobileView = signal(false);
  zoom = signal(1);

  zoomPercent = computed(() => Math.round(this.zoom() * 100));

  sanitizedHtml = computed<SafeHtml>(() => {
    const data = this.quoteData();
    if (!data) return '';

    const html = this.pdfService.generatePdfHtml(data);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  constructor(
    private pdfService: PdfService,
    private sanitizer: DomSanitizer
  ) { }

  zoomIn(): void {
    if (this.zoom() < 1.5) {
      this.zoom.update(z => Math.round((z + 0.1) * 10) / 10);
    }
  }

  zoomOut(): void {
    if (this.zoom() > 0.5) {
      this.zoom.update(z => Math.round((z - 0.1) * 10) / 10);
    }
  }
}
