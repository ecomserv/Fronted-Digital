import { Component, input, output, signal, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShareService, ShareOptions } from '../../../core/services/share.service';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div
        class="modal-overlay"
        (click)="onOverlayClick($event)"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        #modalOverlay>
        <div class="modal-content share-modal" role="document">
          <!-- Header -->
          <header class="modal-header">
            <div class="modal-title-section">
              <h2 id="share-modal-title" class="modal-title">Compartir Documento</h2>
              <p class="modal-subtitle">{{ documentInfo() }}</p>
            </div>
            <button
              type="button"
              class="close-btn"
              (click)="close()"
              aria-label="Cerrar ventana"
              #closeButton>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </header>

          <!-- Share Options -->
          <div class="share-options" role="list">
            <!-- WhatsApp Option -->
            <button
              type="button"
              class="share-option"
              (click)="shareWhatsApp()"
              role="listitem"
              aria-label="Compartir por WhatsApp">
              <div class="option-icon whatsapp-icon" aria-hidden="true">
                <i class="pi pi-whatsapp"></i>
              </div>
              <div class="option-content">
                <span class="option-title">WhatsApp</span>
                <span class="option-desc">Enviar mensaje directo al cliente</span>
              </div>
              <svg class="option-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            <!-- Email Option -->
            <button
              type="button"
              class="share-option"
              (click)="shareEmail()"
              role="listitem"
              aria-label="Compartir por correo electrónico">
              <div class="option-icon email-icon" aria-hidden="true">
                <i class="pi pi-envelope"></i>
              </div>
              <div class="option-content">
                <span class="option-title">Correo Electrónico</span>
                <span class="option-desc">Abrir cliente de correo</span>
              </div>
              <svg class="option-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            <!-- Copy Link Option -->
            <button
              type="button"
              class="share-option"
              [class.copied]="copied()"
              (click)="copyLink()"
              role="listitem"
              [attr.aria-label]="copied() ? 'Enlace copiado' : 'Copiar enlace al portapapeles'">
              <div class="option-icon copy-icon" aria-hidden="true">
                <i class="pi" [class.pi-copy]="!copied()" [class.pi-check]="copied()"></i>
              </div>
              <div class="option-content">
                <span class="option-title">{{ copied() ? 'Enlace Copiado' : 'Copiar Enlace' }}</span>
                <span class="option-desc">{{ copied() ? 'Listo para pegar' : 'Copiar al portapapeles' }}</span>
              </div>
              @if (!copied()) {
                <svg class="option-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              } @else {
                <svg class="option-check" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              }
            </button>
          </div>

          <!-- Footer -->
          <footer class="modal-footer">
            <button
              type="button"
              class="btn btn-outline btn-lg full-width"
              (click)="close()">
              Cancelar
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ============================================
       MODAL OVERLAY
       ============================================ */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: var(--spacing-lg);
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* ============================================
       MODAL CONTENT - Blanco y limpio
       ============================================ */
    .share-modal {
      max-width: 480px;
      width: 100%;
      border-radius: var(--radius-xl);
      background: white;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      animation: slideUp 0.3s ease;
      overflow: hidden;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* ============================================
       HEADER
       ============================================ */
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--spacing-xl);
      border-bottom: 1px solid var(--ecom-gray-200);
    }

    .modal-title-section {
      flex: 1;
    }

    .modal-title {
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--ecom-gray-900);
      margin: 0 0 var(--spacing-xs);
    }

    .modal-subtitle {
      font-size: var(--text-base);
      color: var(--ecom-gray-600);
      margin: 0;
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: var(--touch-target-min);
      min-height: var(--touch-target-min);
      margin: calc(var(--spacing-sm) * -1);
      background: none;
      border: none;
      color: var(--ecom-gray-500);
      cursor: pointer;
      border-radius: var(--radius-md);
      transition: all 0.15s ease;
    }

    .close-btn:hover {
      background: var(--ecom-gray-100);
      color: var(--ecom-gray-900);
    }

    .close-btn:focus-visible {
      box-shadow: var(--focus-ring);
    }

    /* ============================================
       SHARE OPTIONS - Botones grandes
       ============================================ */
    .share-options {
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .share-option {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      min-height: 80px;
      padding: var(--spacing-lg);
      border: 2px solid var(--ecom-gray-200);
      border-radius: var(--radius-lg);
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
      width: 100%;
    }

    .share-option:hover {
      background: var(--ecom-gray-50);
      border-color: var(--ecom-gray-300);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .share-option:focus-visible {
      box-shadow: var(--focus-ring);
      border-color: var(--ecom-primary-500);
    }

    .share-option:active {
      transform: translateY(0);
    }

    .share-option.copied {
      background: var(--ecom-success-50);
      border-color: var(--ecom-success-500);
    }

    /* ============================================
       OPTION ICONS - Grandes y claros
       ============================================ */
    .option-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .option-icon i {
      font-size: 1.75rem;
    }

    .whatsapp-icon {
      background: #dcfce7;
      color: #16a34a;
    }

    .email-icon {
      background: var(--ecom-gray-100);
      color: var(--ecom-gray-700);
    }

    .copy-icon {
      background: var(--ecom-gray-100);
      color: var(--ecom-gray-700);
    }

    .copied .copy-icon {
      background: var(--ecom-success-100);
      color: var(--ecom-success-700);
    }

    /* ============================================
       OPTION CONTENT
       ============================================ */
    .option-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .option-title {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--ecom-gray-900);
    }

    .option-desc {
      font-size: var(--text-sm);
      color: var(--ecom-gray-600);
    }

    .option-arrow,
    .option-check {
      color: var(--ecom-gray-400);
      flex-shrink: 0;
    }

    .option-check {
      color: var(--ecom-success-600);
    }

    /* ============================================
       FOOTER
       ============================================ */
    .modal-footer {
      padding: var(--spacing-lg);
      padding-top: 0;
    }

    .full-width {
      width: 100%;
      justify-content: center;
    }

    /* ============================================
       BUTTON STYLES (inherited from global)
       ============================================ */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      min-height: var(--touch-target-min);
      padding: var(--spacing-sm) var(--spacing-xl);
      font-size: var(--text-base);
      font-weight: 600;
      border-radius: var(--radius-md);
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn:focus-visible {
      box-shadow: var(--focus-ring);
    }

    .btn-lg {
      min-height: 56px;
      padding: var(--spacing-md) var(--spacing-xl);
      font-size: var(--text-lg);
    }

    .btn-outline {
      background: white;
      color: var(--ecom-gray-800);
      border-color: var(--ecom-gray-300);
    }

    .btn-outline:hover {
      background: var(--ecom-gray-100);
      border-color: var(--ecom-gray-400);
    }

    /* ============================================
       RESPONSIVE - MOBILE
       ============================================ */
    @media (max-width: 768px) {
      .modal-overlay {
        padding: var(--spacing-md);
        align-items: flex-end;
      }

      .share-modal {
        border-radius: var(--radius-xl) var(--radius-xl) 0 0;
        max-height: 90vh;
        overflow-y: auto;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(100%);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .modal-header {
        padding: var(--spacing-lg);
      }

      .modal-title {
        font-size: var(--text-lg);
      }

      .share-options {
        padding: var(--spacing-md);
      }

      .share-option {
        padding: var(--spacing-md);
        min-height: 72px;
      }

      .option-icon {
        width: 48px;
        height: 48px;
      }

      .option-icon i {
        font-size: 1.5rem;
      }

      .option-title {
        font-size: var(--text-base);
      }

      .modal-footer {
        padding: var(--spacing-md);
        padding-bottom: calc(var(--spacing-lg) + env(safe-area-inset-bottom, 0px));
      }
    }
  `]
})
export class ShareModalComponent implements OnChanges, AfterViewInit {
  @ViewChild('closeButton') closeButton!: ElementRef<HTMLButtonElement>;
  @ViewChild('modalOverlay') modalOverlay!: ElementRef<HTMLDivElement>;

  isOpen = input<boolean>(false);
  documentNumber = input<string>('');
  clientName = input<string>('');
  clientPhone = input<string>('');
  clientEmail = input<string>('');
  pdfUrl = input<string>('');
  message = input<string>('Adjunto documento PDF.');
  documentType = input<'cotizacion' | 'factura'>('cotizacion');

  closed = output<void>();
  copied = signal(false);

  private previousActiveElement: HTMLElement | null = null;

  constructor(private shareService: ShareService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen()) {
        // Store the currently focused element
        this.previousActiveElement = document.activeElement as HTMLElement;
        // Focus the close button when modal opens
        setTimeout(() => {
          this.closeButton?.nativeElement?.focus();
        }, 100);
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
      } else {
        // Restore body scroll
        document.body.style.overflow = '';
        // Return focus to previous element
        if (this.previousActiveElement) {
          this.previousActiveElement.focus();
        }
      }
    }
  }

  ngAfterViewInit(): void {
    // Initial focus if modal is already open
    if (this.isOpen()) {
      setTimeout(() => {
        this.closeButton?.nativeElement?.focus();
      }, 100);
    }
  }

  documentInfo(): string {
    const type = this.documentType() === 'factura' ? 'Factura' : 'Cotización';
    return this.documentNumber() ? `${type} N° ${this.documentNumber()}` : type;
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  close(): void {
    document.body.style.overflow = '';
    this.closed.emit();
  }

  shareWhatsApp(): void {
    const options: ShareOptions = {
      phoneNumber: this.clientPhone(),
      message: this.message(),
      pdfUrl: this.pdfUrl(),
      clientName: this.clientName(),
      documentType: this.documentType(),
      documentNumber: this.documentNumber()
    };

    this.shareService.shareViaWhatsApp(options);
    this.close();
  }

  shareEmail(): void {
    const options: ShareOptions = {
      email: this.clientEmail(),
      message: this.message(),
      clientName: this.clientName(),
      documentType: this.documentType(),
      documentNumber: this.documentNumber()
    };

    this.shareService.shareViaEmail(options);
    this.close();
  }

  async copyLink(): Promise<void> {
    // For now, copy the document info since we don't have a real URL
    const textToCopy = this.pdfUrl() || `Cotización ${this.documentNumber()} - ECOMSERV`;
    const success = await this.shareService.copyToClipboard(textToCopy);
    if (success) {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }
}
