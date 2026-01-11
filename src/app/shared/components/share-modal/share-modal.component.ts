import { Component, input, output, signal, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShareService, ShareOptions } from '../../../core/services/share.service';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)" role="dialog" aria-modal="true">
        <div class="modal-sheet" role="document" #modalSheet>
          <!-- Drag Handle (Mobile) -->
          <div class="drag-handle"></div>

          <!-- Header -->
          <header class="sheet-header">
            <div class="header-content">
              <div class="header-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </div>
              <div class="header-text">
                <h2 class="sheet-title">Compartir</h2>
                <p class="sheet-subtitle">{{ documentInfo() }}</p>
              </div>
            </div>
            <button type="button" class="close-btn" (click)="close()" aria-label="Cerrar" #closeBtn>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </header>

          <!-- Content -->
          <div class="sheet-content">
            @if (!emailMode()) {
              <!-- Share Options Grid -->
              <div class="share-grid">
                <!-- WhatsApp -->
                <button type="button" class="share-item" (click)="shareWhatsApp()">
                  <div class="item-icon whatsapp">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <span class="item-label">WhatsApp</span>
                </button>

                <!-- Email -->
                <button type="button" class="share-item" (click)="toggleEmailMode()">
                  <div class="item-icon email">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <span class="item-label">Correo</span>
                </button>
              </div>

              <!-- Quick Info -->
              <div class="quick-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>El PDF se adjuntará automáticamente</span>
              </div>
            } @else {
              <!-- Email Form -->
              <div class="email-form">
                @if (!emailSent()) {
                  <div class="form-header">
                    <button type="button" class="back-btn" (click)="toggleEmailMode()">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"/>
                      </svg>
                    </button>
                    <h3>Enviar por correo</h3>
                  </div>

                  <div class="form-field">
                    <label for="email-input">Correo del destinatario</label>
                    <div class="input-wrapper" [class.focused]="emailFocused()" [class.error]="emailTo && !isValidEmail()">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <input
                        id="email-input"
                        type="email"
                        [(ngModel)]="emailTo"
                        placeholder="ejemplo@correo.com"
                        [disabled]="isSending()"
                        (focus)="emailFocused.set(true)"
                        (blur)="emailFocused.set(false)"
                        autocomplete="email">
                    </div>
                    @if (emailTo && !isValidEmail()) {
                      <span class="error-text">Ingrese un correo válido</span>
                    }
                  </div>

                  <button
                    type="button"
                    class="send-btn"
                    (click)="sendEmail()"
                    [disabled]="isSending() || !isValidEmail()">
                    @if (isSending()) {
                      <span class="spinner"></span>
                      <span>Enviando...</span>
                    } @else {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      <span>Enviar Correo</span>
                    }
                  </button>
                } @else {
                  <!-- Success State -->
                  <div class="success-state">
                    <div class="success-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <h3 class="success-title">¡Correo enviado!</h3>
                    <p class="success-text">El correo fue enviado correctamente a:</p>
                    <p class="success-email">{{ emailTo }}</p>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Footer -->
          <footer class="sheet-footer">
            <button type="button" class="cancel-btn" (click)="close()">
              Cerrar
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ============================================
       BACKDROP
       ============================================ */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* ============================================
       MODAL SHEET (Bottom Sheet Style)
       ============================================ */
    .modal-sheet {
      width: 100%;
      max-width: 480px;
      max-height: 85vh;
      background: #ffffff;
      border-radius: 24px 24px 0 0;
      overflow: hidden;
      animation: slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
      display: flex;
      flex-direction: column;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    /* Drag Handle */
    .drag-handle {
      width: 36px;
      height: 5px;
      background: #e2e8f0;
      border-radius: 3px;
      margin: 12px auto 0;
      flex-shrink: 0;
    }

    /* ============================================
       HEADER
       ============================================ */
    .sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 20px 16px;
      flex-shrink: 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #4f46e5;
    }

    .header-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .sheet-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
    }

    .sheet-subtitle {
      margin: 0;
      font-size: 14px;
      color: #64748b;
    }

    .close-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: #f1f5f9;
      border-radius: 12px;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .close-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    .close-btn:active {
      transform: scale(0.95);
    }

    /* ============================================
       CONTENT
       ============================================ */
    .sheet-content {
      padding: 0 20px 20px;
      flex: 1;
      overflow-y: auto;
    }

    /* ============================================
       SHARE GRID
       ============================================ */
    .share-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .share-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 20px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .share-item:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
    }

    .share-item:active {
      transform: scale(0.98);
      border-color: #94a3b8;
    }

    .item-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .item-icon.whatsapp {
      background: #dcfce7;
      color: #16a34a;
    }

    .item-icon.email {
      background: #e0e7ff;
      color: #4f46e5;
    }

    .item-label {
      font-size: 14px;
      font-weight: 600;
      color: #334155;
    }

    /* ============================================
       QUICK INFO
       ============================================ */
    .quick-info {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      background: #f0fdf4;
      border-radius: 12px;
      color: #15803d;
      font-size: 13px;
    }

    .quick-info svg {
      flex-shrink: 0;
    }

    /* ============================================
       EMAIL FORM
       ============================================ */
    .email-form {
      animation: fadeIn 0.2s ease;
    }

    .form-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .form-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
    }

    .back-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: #f1f5f9;
      border-radius: 10px;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .back-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    .form-field {
      margin-bottom: 20px;
    }

    .form-field label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #334155;
      margin-bottom: 8px;
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 16px;
      height: 52px;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      background: #ffffff;
      transition: all 0.2s ease;
    }

    .input-wrapper svg {
      color: #94a3b8;
      flex-shrink: 0;
    }

    .input-wrapper.focused {
      border-color: #4f46e5;
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
    }

    .input-wrapper.focused svg {
      color: #4f46e5;
    }

    .input-wrapper.error {
      border-color: #ef4444;
    }

    .input-wrapper.error svg {
      color: #ef4444;
    }

    .input-wrapper input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 16px;
      color: #0f172a;
      background: transparent;
    }

    .input-wrapper input::placeholder {
      color: #94a3b8;
    }

    .input-wrapper input:disabled {
      color: #94a3b8;
    }

    .error-text {
      display: block;
      font-size: 12px;
      color: #ef4444;
      margin-top: 6px;
      padding-left: 4px;
    }

    .send-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      height: 54px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      color: #ffffff;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .send-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
    }

    .send-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .send-btn:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ============================================
       SUCCESS STATE
       ============================================ */
    .success-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 20px 0;
      animation: fadeIn 0.3s ease;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin-bottom: 20px;
      animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes scaleIn {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .success-icon svg {
      animation: checkDraw 0.5s ease 0.2s both;
    }

    @keyframes checkDraw {
      0% {
        stroke-dasharray: 100;
        stroke-dashoffset: 100;
      }
      100% {
        stroke-dasharray: 100;
        stroke-dashoffset: 0;
      }
    }

    .success-title {
      margin: 0 0 8px 0;
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
    }

    .success-text {
      margin: 0;
      font-size: 14px;
      color: #64748b;
    }

    .success-email {
      margin: 4px 0 0 0;
      font-size: 15px;
      font-weight: 600;
      color: #22c55e;
    }

    /* ============================================
       FOOTER
       ============================================ */
    .sheet-footer {
      padding: 16px 20px;
      padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      border-top: 1px solid #f1f5f9;
      flex-shrink: 0;
    }

    .cancel-btn {
      width: 100%;
      height: 50px;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      background: #ffffff;
      color: #475569;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .cancel-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .cancel-btn:active {
      transform: scale(0.98);
    }

    /* ============================================
       DESKTOP STYLES
       ============================================ */
    @media (min-width: 768px) {
      .modal-backdrop {
        align-items: center;
      }

      .modal-sheet {
        border-radius: 24px;
        max-height: 90vh;
      }

      .drag-handle {
        display: none;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    }
  `]
})
export class ShareModalComponent implements OnChanges, AfterViewInit {
  @ViewChild('closeBtn') closeBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild('modalSheet') modalSheet!: ElementRef<HTMLDivElement>;

  isOpen = input<boolean>(false);
  documentNumber = input<string>('');
  clientName = input<string>('');
  clientPhone = input<string>('');
  clientEmail = input<string>('');
  pdfUrl = input<string>('');
  pdfBlob = input<Blob | null>(null);
  message = input<string>('Adjunto documento PDF.');
  documentType = input<'cotizacion' | 'factura'>('cotizacion');

  closed = output<void>();

  emailMode = signal(false);
  emailSent = signal(false);
  emailFocused = signal(false);
  emailTo = '';
  isSending = signal(false);

  private previousActiveElement: HTMLElement | null = null;

  constructor(private shareService: ShareService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clientEmail'] && this.clientEmail()) {
      this.emailTo = this.clientEmail();
    }

    if (changes['isOpen']) {
      if (this.isOpen()) {
        this.emailMode.set(false);
        this.emailSent.set(false);
        this.isSending.set(false);
        this.emailTo = this.clientEmail() || '';
        this.previousActiveElement = document.activeElement as HTMLElement;

        setTimeout(() => {
          this.closeBtn?.nativeElement?.focus();
        }, 100);

        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
        if (this.previousActiveElement) {
          this.previousActiveElement.focus();
        }
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.isOpen()) {
      setTimeout(() => {
        this.closeBtn?.nativeElement?.focus();
      }, 100);
    }
  }

  documentInfo(): string {
    const type = this.documentType() === 'factura' ? 'Factura' : 'Cotización';
    return this.documentNumber() ? `${type} N° ${this.documentNumber()}` : type;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }

  close(): void {
    document.body.style.overflow = '';
    this.closed.emit();
  }

  async shareWhatsApp() {
    this.close();

    // Build the formatted message
    let fullMessage = `*ECOMSERV - Cotización*\n\n`;
    fullMessage += `Hola${this.clientName() ? ` ${this.clientName()}` : ''},\n\n`;
    fullMessage += `Le enviamos su cotización`;
    fullMessage += this.documentNumber() ? ` N° ${this.documentNumber()}` : '';
    fullMessage += `.\n\n`;
    fullMessage += this.message();
    fullMessage += `\n\n_El documento PDF se encuentra adjunto._`;

    // Try native share with blob first (works on iOS/mobile)
    const blob = this.pdfBlob();
    if (blob && typeof navigator.share === 'function') {
      try {
        const fileName = `Cotizacion-${this.documentNumber() || 'documento'}.pdf`;
        const file = new File([blob], fileName, { type: 'application/pdf' });

        const shareData = {
          files: [file],
          title: `Cotización ${this.documentNumber()}`,
          text: fullMessage
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      } catch (e) {
        console.warn('Native share failed, falling back to WhatsApp link', e);
      }
    }

    const options: ShareOptions = {
      phoneNumber: this.clientPhone(),
      message: this.message(),
      pdfUrl: this.pdfUrl(),
      clientName: this.clientName(),
      documentType: this.documentType(),
      documentNumber: this.documentNumber()
    };

    this.shareService.shareViaWhatsApp(options);
  }

  toggleEmailMode(): void {
    this.emailMode.update(v => !v);
  }

  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.emailTo);
  }

  sendEmail(): void {
    if (!this.isValidEmail() || this.isSending()) return;

    this.isSending.set(true);

    const request = {
      toEmail: this.emailTo,
      documentNumber: this.documentNumber(),
      clientName: this.clientName(),
      attachPdf: true
    };

    this.shareService.sendEmail(request).subscribe({
      next: () => {
        this.isSending.set(false);
        this.emailSent.set(true);
      },
      error: (err) => {
        console.error('Email error:', err);
        this.isSending.set(false);
        alert('Error al enviar el correo. Por favor intente nuevamente.');
      }
    });
  }
}
