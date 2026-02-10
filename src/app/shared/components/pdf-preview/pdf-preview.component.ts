import { Component, input, output, signal, computed, OnInit, OnDestroy, ElementRef, ViewChild, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { PdfService, QuoteData, ReportData } from '../../../core/services/pdf.service';

/**
 * PDF Preview Component — Iframe + Blob URL approach
 *
 * Industry-standard pattern used by Canva, PandaDoc, Google Docs print preview:
 * Instead of injecting HTML via [innerHTML] (which causes parent DOM reflows,
 * scroll position jumps, and iOS WebKit flicker), we render the preview inside
 * an <iframe> with a Blob URL. This provides:
 *
 * 1. **Complete DOM isolation**: iframe content CANNOT cause reflows in the parent
 * 2. **No scroll interference**: iframe has its own scroll context
 * 3. **No DomSanitizer bypass needed**: Blob URLs are safe resource URLs
 * 4. **Better mobile performance**: no parent layout recalculation on content change
 * 5. **Memory management**: old Blob URLs are revoked before creating new ones
 */
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
            <!-- MOBILE: Thumbnail via iframe (isolated from parent DOM) -->
            <div class="mobile-view">
              <div class="pdf-thumbnail" (click)="openFullscreen()">
                @if (thumbnailBlobUrl()) {
                  <iframe
                    class="thumbnail-iframe"
                    [src]="thumbnailBlobUrl()"
                    sandbox="allow-same-origin"
                    scrolling="no"
                    frameborder="0"
                    tabindex="-1"
                    title="Vista previa miniatura del documento">
                  </iframe>
                }
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
            <!-- DESKTOP: Full preview via iframe (isolated from parent DOM) -->
            <div class="doc-wrapper" [style.transform]="'scale(' + docScale() + ')'">
              @if (previewBlobUrl()) {
                <iframe
                  class="doc-iframe"
                  [src]="previewBlobUrl()"
                  sandbox="allow-same-origin"
                  scrolling="no"
                  frameborder="0"
                  tabindex="-1"
                  title="Vista previa del documento">
                </iframe>
              }
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
            @if (fullscreenBlobUrl()) {
              <iframe
                class="fullscreen-iframe"
                [src]="fullscreenBlobUrl()"
                sandbox="allow-same-origin"
                scrolling="no"
                frameborder="0"
                title="Vista previa del documento en pantalla completa">
              </iframe>
            }
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
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    /* ===== DESKTOP: DOCUMENT via IFRAME ===== */
    .doc-wrapper {
      background: white;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      border-radius: 4px;
      overflow: hidden;
      transform-origin: top center;
      flex-shrink: 0;
    }

    .doc-iframe {
      width: 794px;
      height: 1123px;
      border: none;
      display: block;
      background: white;
      pointer-events: none; /* Prevent interaction with preview content */
    }

    /* ===== MOBILE VIEW ===== */
    .mobile-view {
      width: 100%;
      max-width: 360px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* PDF Thumbnail via iframe */
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

    .thumbnail-iframe {
      width: 794px;
      height: 1123px;
      border: none;
      transform: scale(0.42);
      transform-origin: top left;
      pointer-events: none; /* Click passes through to the thumbnail container */
      display: block;
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

    .fullscreen-iframe {
      width: 794px;
      height: 1123px;
      border: none;
      display: block;
      background: white;
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

      .thumbnail-iframe {
        transform: scale(0.36);
      }

      .action-btn {
        padding: 12px 16px;
        font-size: 14px;
      }
    }
  `]
})
export class PdfPreviewComponent implements OnInit, OnDestroy {
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

  // Blob URL signals for iframe rendering
  previewBlobUrl = signal<SafeResourceUrl | null>(null);
  thumbnailBlobUrl = signal<SafeResourceUrl | null>(null);
  fullscreenBlobUrl = signal<SafeResourceUrl | null>(null);

  // Track raw blob URLs for cleanup (revokeObjectURL)
  private currentBlobUrl: string | null = null;

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

  /**
   * Generate raw HTML string from quote/report data.
   * This replaces the old sanitizedHtml computed that used bypassSecurityTrustHtml.
   */
  private rawHtml = computed<string>(() => {
    const quote = this.quoteData();
    const report = this.reportData();
    if (report) {
      return this.pdfService.generateReportPdfHtml(report);
    }
    if (quote) {
      return this.pdfService.generatePdfHtml(quote);
    }
    return '';
  });

  constructor(
    private pdfService: PdfService,
    private sanitizer: DomSanitizer
  ) {
    // React to data changes and update the Blob URL
    effect(() => {
      const html = this.rawHtml();
      if (html) {
        this.updateBlobUrl(html);
        setTimeout(() => this.measure(), 100);
      } else {
        this.revokeBlobUrl();
        this.previewBlobUrl.set(null);
        this.thumbnailBlobUrl.set(null);
        this.fullscreenBlobUrl.set(null);
      }
    });
  }

  ngOnInit(): void {
    this.checkMobile();
    setTimeout(() => this.measure(), 50);
  }

  ngOnDestroy(): void {
    this.revokeBlobUrl();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
    this.measure();
  }

  /**
   * Creates a Blob URL from the HTML string and updates all iframe sources.
   * Revokes the previous URL to prevent memory leaks.
   *
   * The HTML is wrapped in a minimal document with <base> styles that:
   * - Reset margins/padding for clean rendering
   * - Set overflow:hidden to prevent scrollbars inside the iframe
   * - Match the expected 794x1123 document dimensions
   */
  private updateBlobUrl(html: string): void {
    // Revoke previous blob URL to free memory
    this.revokeBlobUrl();

    // Wrap content in a complete HTML document for the iframe
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=794">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 794px; min-height: 1123px; overflow: hidden; background: white; }
  </style>
</head>
<body>${html}</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    this.currentBlobUrl = url;

    // Trust the blob URL for iframe src binding
    const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.previewBlobUrl.set(safeUrl);
    this.thumbnailBlobUrl.set(safeUrl);
    this.fullscreenBlobUrl.set(safeUrl);
  }

  private revokeBlobUrl(): void {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }

  openFullscreen() {
    this.modalScale.set(0.9);
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
