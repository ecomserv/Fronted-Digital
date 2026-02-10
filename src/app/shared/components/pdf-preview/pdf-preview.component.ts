import { Component, input, output, signal, computed, OnInit, ElementRef, ViewChild, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PdfService, QuoteData, ReportData } from '../../../core/services/pdf.service';

@Component({
  selector: 'app-pdf-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="preview-container">
      <!-- Header -->
      <header class="preview-header">
        <div class="header-left">
          <div class="icon-wrapper">
            <i class="pi pi-file-pdf"></i>
          </div>
          <span class="header-title">Vista Previa</span>
        </div>
      </header>

      <!-- Content -->
      <div class="preview-body" #scrollContainer>
        @if (quoteData() || reportData()) {
          @if (isMobile()) {
            <!-- MOBILE: Thumbnail View -->
            <div class="mobile-view">
              <!-- Mini PDF Thumbnail -->
              <div class="pdf-thumbnail" (click)="openFullscreen()">
                <div class="thumbnail-content" [innerHTML]="sanitizedHtml()"></div>
                <div class="thumbnail-overlay">
                  <div class="overlay-icon">
                    <i class="pi pi-search-plus"></i>
                  </div>
                  <span>Tocar para ampliar</span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="action-buttons">
                <button class="action-btn primary" (click)="onDownload.emit()">
                  <i class="pi pi-download"></i>
                  <span>Guardar PDF</span>
                </button>
                <button class="action-btn secondary" (click)="onShare.emit()">
                  <i class="pi pi-share-alt"></i>
                  <span>Compartir</span>
                </button>
              </div>
            </div>
          } @else {
            <!-- DESKTOP: Full PDF Preview -->
            <div class="doc-wrapper" [style.transform]="'scale(' + docScale() + ')'">
              <div class="doc-paper" [innerHTML]="sanitizedHtml()"></div>
            </div>
          }
        } @else {
          <div class="empty-msg">
            <i class="pi pi-file"></i>
            <p>Sin datos</p>
          </div>
        }
      </div>
    </div>

    <!-- Fullscreen Modal -->
    @if (isFullscreenOpen()) {
      <div class="fullscreen-modal" (click)="closeFullscreen()">
        <div class="modal-header">
          <span class="modal-title">{{ quoteData()?.documentNumber || reportData()?.documentNumber || 'Documento' }}</span>
          <div class="modal-controls">
            <button class="control-btn" (click)="zoomOut($event)" title="Alejar">
              <i class="pi pi-minus"></i>
            </button>
            <span class="zoom-level">{{ zoomPercent() }}%</span>
            <button class="control-btn" (click)="zoomIn($event)" title="Acercar">
              <i class="pi pi-plus"></i>
            </button>
            <button class="control-btn" (click)="resetZoom($event)" title="Restablecer">
              <i class="pi pi-refresh"></i>
            </button>
            <button class="control-btn close-btn" (click)="closeFullscreen()" title="Cerrar">
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>
        <div class="modal-body" (click)="$event.stopPropagation()">
          <div class="modal-doc" [style.transform]="'scale(' + modalScale() + ')'">
            <div class="doc-paper" [innerHTML]="sanitizedHtml()"></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .preview-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--text-muted);
      border-radius: 12px;
      overflow: hidden;
    }

    /* ===== HEADER ===== */
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--surface-card);
      border-bottom: 1px solid var(--border-default);
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .icon-wrapper {
      width: 32px;
      height: 32px;
      background: var(--accent-blue-subtle);
      color: var(--accent-blue);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-title {
      font-weight: 600;
      font-size: 15px;
      color: var(--text-primary);
    }

    /* ===== BODY ===== */
    .preview-body {
      flex: 1;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    /* ===== DESKTOP: DOCUMENT ===== */
    .doc-wrapper {
      background: white;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      border-radius: 4px;
      overflow: hidden;
      transform-origin: top center;
      flex-shrink: 0;
    }

    .doc-paper {
      width: 794px;
      min-height: 1123px;
      background: white;
    }

    /* ===== MOBILE VIEW ===== */
    .mobile-view {
      width: 100%;
      max-width: 360px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* PDF Thumbnail */
    .pdf-thumbnail {
      position: relative;
      width: 100%;
      height: 420px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .pdf-thumbnail:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.2);
    }

    .pdf-thumbnail:active {
      transform: scale(0.98);
    }

    .thumbnail-content {
      width: 794px;
      min-height: 1123px;
      transform: scale(0.42);
      transform-origin: top left;
      pointer-events: none;
    }

    .thumbnail-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      padding: 20px;
      gap: 8px;
      color: white;
      opacity: 1;
      transition: opacity 0.2s;
    }

    .overlay-icon {
      width: 48px;
      height: 48px;
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(8px);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .thumbnail-overlay span {
      font-size: 14px;
      font-weight: 500;
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .action-btn i {
      font-size: 18px;
    }

    .action-btn.primary {
      background: linear-gradient(135deg, var(--ecom-blue-800, #1e40af), var(--ecom-blue-500, #3b82f6));
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
    }

    .action-btn.primary:active {
      transform: scale(0.96);
    }

    .action-btn.secondary {
      background: var(--surface-card);
      color: var(--text-primary);
      border: 2px solid var(--border-default);
    }

    .action-btn.secondary:active {
      background: var(--surface-hover);
    }

    /* ===== FULLSCREEN MODAL ===== */
    .fullscreen-modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.95);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
      flex-shrink: 0;
    }

    .modal-title {
      color: white;
      font-weight: 600;
      font-size: 16px;
    }

    .modal-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .control-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: rgba(255,255,255,0.15);
      color: white;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: background 0.2s;
    }

    .control-btn:hover {
      background: rgba(255,255,255,0.25);
    }

    .control-btn:active {
      background: rgba(255,255,255,0.35);
    }

    .control-btn.close-btn {
      background: rgba(239, 68, 68, 0.8);
      margin-left: 8px;
    }

    .control-btn.close-btn:hover {
      background: rgba(239, 68, 68, 1);
    }

    .zoom-level {
      color: white;
      font-size: 14px;
      font-weight: 600;
      min-width: 50px;
      text-align: center;
    }

    .modal-body {
      flex: 1;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
      padding: 16px;
    }

    .modal-doc {
      background: white;
      box-shadow: 0 0 60px rgba(0,0,0,0.5);
      border-radius: 4px;
      overflow: hidden;
      transform-origin: top left;
      flex-shrink: 0;
    }

    /* ===== EMPTY ===== */
    .empty-msg {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--text-muted);
      padding: 60px;
      text-align: center;
    }

    .empty-msg i { font-size: 3rem; }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 1024px) {
      .preview-container {
        border-radius: 0;
        background: var(--surface-hover);
      }

      .preview-header {
        padding: 10px 12px;
      }

      .preview-body {
        padding: 16px;
        align-items: flex-start;
      }
    }

    @media (max-width: 400px) {
      .pdf-thumbnail {
        height: 360px;
      }

      .thumbnail-content {
        transform: scale(0.36);
      }

      .action-btn {
        padding: 12px 16px;
        font-size: 14px;
      }
    }
  `]
})
export class PdfPreviewComponent implements OnInit {
  quoteData = input<QuoteData | null>(null);
  reportData = input<ReportData | null>(null);
  onDownload = output<void>();
  onShare = output<void>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  containerWidth = signal(600);
  isMobile = signal(false);
  isFullscreenOpen = signal(false);

  // Zoom state for fullscreen
  modalScale = signal(0.9);
  translateX = signal(0);
  translateY = signal(0);

  // Touch gesture state
  private lastTouchDistance = 0;
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private lastTranslate = { x: 0, y: 0 };

  // Desktop scale calculation
  docScale = computed(() => {
    const container = this.containerWidth();
    const docWidth = 794;
    const padding = 40;
    const available = Math.max(container - padding, 300);
    const scale = available / docWidth;
    return Math.min(Math.max(scale, 0.3), 1.0);
  });

  zoomPercent = computed(() => Math.round(this.modalScale() * 100));

  sanitizedHtml = computed<SafeHtml>(() => {
    const quote = this.quoteData();
    const report = this.reportData();
    if (report) {
      return this.sanitizer.bypassSecurityTrustHtml(this.pdfService.generateReportPdfHtml(report));
    }
    if (quote) {
      return this.sanitizer.bypassSecurityTrustHtml(this.pdfService.generatePdfHtml(quote));
    }
    return '';
  });

  constructor(
    private pdfService: PdfService,
    private sanitizer: DomSanitizer
  ) {
    effect(() => {
      if (this.quoteData() || this.reportData()) {
        setTimeout(() => this.measure(), 100);
      }
    });
  }

  ngOnInit(): void {
    this.checkMobile();
    setTimeout(() => this.measure(), 50);
  }

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
    this.measure();
  }

  openFullscreen() {
    this.modalScale.set(0.9);
    this.isFullscreenOpen.set(true);
    this.isFullscreenOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeFullscreen() {
    this.isFullscreenOpen.set(false);
    document.body.style.overflow = '';
  }

  zoomIn(event: Event) {
    event.stopPropagation();
    const newScale = Math.min(this.modalScale() + 0.1, 2.5);
    this.modalScale.set(newScale);
  }

  zoomOut(event: Event) {
    event.stopPropagation();
    const newScale = Math.max(this.modalScale() - 0.1, 0.2);
    this.modalScale.set(newScale);
  }

  resetZoom(event: Event) {
    event.stopPropagation();
    this.modalScale.set(0.9);
    this.translateX.set(0);
    this.translateY.set(0);
  }

  getModalTransform(): string {
    return `translate(${this.translateX()}px, ${this.translateY()}px) scale(${this.modalScale()})`;
  }

  // Touch handlers for fullscreen modal
  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.lastTouchDistance = this.getDistance(touch1, touch2);
    } else if (event.touches.length === 1) {
      this.isDragging = true;
      const touch = event.touches[0];
      this.dragStart = { x: touch.clientX, y: touch.clientY };
      this.lastTranslate = { x: this.translateX(), y: this.translateY() };
    }
  }

  onTouchMove(event: TouchEvent) {
    event.preventDefault();

    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = this.getDistance(touch1, touch2);

      if (this.lastTouchDistance > 0) {
        const scaleDelta = currentDistance / this.lastTouchDistance;
        const newScale = Math.min(Math.max(this.modalScale() * scaleDelta, 0.2), 2.5);
        this.modalScale.set(newScale);
      }

      this.lastTouchDistance = currentDistance;
    } else if (event.touches.length === 1 && this.isDragging) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.dragStart.x;
      const deltaY = touch.clientY - this.dragStart.y;

      this.translateX.set(this.lastTranslate.x + deltaX);
      this.translateY.set(this.lastTranslate.y + deltaY);
    }
  }

  onTouchEnd() {
    this.isDragging = false;
    this.lastTouchDistance = 0;
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private checkMobile() {
    this.isMobile.set(window.innerWidth <= 768);
  }

  private measure() {
    const el = this.scrollContainer?.nativeElement;
    if (el && el.clientWidth > 0) {
      this.containerWidth.set(el.clientWidth);
    }
  }
}
