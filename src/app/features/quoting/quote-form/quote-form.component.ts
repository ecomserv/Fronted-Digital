import { Component, signal, computed, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { PdfService, QuoteData, DocumentItem } from '../../../core/services/pdf.service';
import { ShareModalComponent } from '../../../shared/components/share-modal/share-modal.component';
import { PdfPreviewComponent } from '../../../shared/components/pdf-preview/pdf-preview.component';

@Component({
  selector: 'app-quote-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ShareModalComponent, PdfPreviewComponent],
  template: `
    <!-- Skip Link for Accessibility -->
    <a href="#main-form" class="skip-link">Saltar al formulario</a>

    <div class="quote-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="brand">
            <img src="/logo-ecomserv.png" alt="ECOMSERV Logo" class="brand-logo" />
            <span class="brand-name">ECOMSERV</span>
          </div>
          <div class="header-actions">
            <button
              type="button"
              class="header-btn"
              (click)="downloadPdf()"
              aria-label="Descargar documento en PDF">
              <i class="pi pi-download" aria-hidden="true"></i>
              <span>Descargar PDF</span>
            </button>
            <button
              type="button"
              class="header-btn"
              [class.active]="showPreview()"
              (click)="showPreview.set(!showPreview())"
              [attr.aria-pressed]="showPreview()"
              aria-label="Alternar vista previa">
              <i class="pi" [class.pi-eye]="!showPreview()" [class.pi-pencil]="showPreview()" aria-hidden="true"></i>
              <span>{{ showPreview() ? 'Editar' : 'Vista Previa' }}</span>
            </button>
          </div>
        </div>
      </header>

      <main class="main-content" id="main-form">
        <div class="content-grid" [class.preview-active]="showPreview()">
          <!-- Form Section -->
          <section class="form-section" [class.hidden-mobile]="showPreview()" aria-label="Formulario de cotización">
            <form [formGroup]="quoteForm" class="quote-form">

              <!-- Document Info Card -->
              <article class="form-card">
                <header class="card-header">
                  <h2>Datos del Documento</h2>
                </header>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="documentNumber">
                      Número de Documento
                    </label>
                    <input
                      id="documentNumber"
                      class="form-input readonly"
                      formControlName="documentNumber"
                      readonly
                      aria-describedby="documentNumber-hint">
                    <span id="documentNumber-hint" class="form-hint">Generado automáticamente</span>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="currency">
                      Moneda
                    </label>
                    <select
                      id="currency"
                      class="form-input form-select"
                      formControlName="currency">
                      <option value="PEN">Soles (S/)</option>
                      <option value="USD">Dólares ($)</option>
                    </select>
                  </div>
                </div>
              </article>

              <!-- Client Info Card -->
              <article class="form-card">
                <header class="card-header">
                  <h2>Datos del Cliente</h2>
                </header>

                <div class="form-group full-width">
                  <label class="form-label" for="clientName">
                    Razón Social / Nombre del Cliente
                    <span class="required" aria-label="campo obligatorio">*</span>
                  </label>
                  <input
                    id="clientName"
                    class="form-input"
                    [class.error]="isFieldInvalid('clientName')"
                    formControlName="clientName"
                    placeholder="Nombre del cliente o empresa"
                    autocomplete="organization"
                    aria-required="true"
                    [attr.aria-invalid]="isFieldInvalid('clientName')"
                    aria-describedby="clientName-error">
                  @if (isFieldInvalid('clientName')) {
                    <span id="clientName-error" class="form-error" role="alert">
                      <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                      Por favor ingrese el nombre del cliente
                    </span>
                  }
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="clientRuc">
                      RUC
                    </label>
                    <input
                      id="clientRuc"
                      class="form-input"
                      formControlName="clientRuc"
                      placeholder="20XXXXXXXXX"
                      maxlength="11"
                      inputmode="numeric"
                      autocomplete="off"
                      aria-describedby="clientRuc-hint">
                    <span id="clientRuc-hint" class="form-hint">11 dígitos</span>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="clientPhone">
                      Teléfono
                    </label>
                    <input
                      id="clientPhone"
                      class="form-input"
                      formControlName="clientPhone"
                      placeholder="01 234 5678"
                      type="tel"
                      autocomplete="tel">
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="clientMovil">
                      Celular
                    </label>
                    <input
                      id="clientMovil"
                      class="form-input"
                      formControlName="clientMovil"
                      placeholder="999 888 777"
                      type="tel"
                      autocomplete="tel">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="clientEmail">
                      Correo Electrónico
                    </label>
                    <input
                      id="clientEmail"
                      class="form-input"
                      [class.error]="isFieldInvalid('clientEmail')"
                      formControlName="clientEmail"
                      placeholder="correo&#64;empresa.com"
                      type="email"
                      autocomplete="email"
                      [attr.aria-invalid]="isFieldInvalid('clientEmail')">
                    @if (isFieldInvalid('clientEmail')) {
                      <span class="form-error" role="alert">
                        <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                        Ingrese un correo válido
                      </span>
                    }
                  </div>
                </div>

                <div class="form-group full-width">
                  <label class="form-label" for="clientAddress">
                    Dirección
                  </label>
                  <input
                    id="clientAddress"
                    class="form-input"
                    formControlName="clientAddress"
                    placeholder="Dirección fiscal completa"
                    autocomplete="street-address">
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="clientReference">
                      Referencia
                    </label>
                    <input
                      id="clientReference"
                      class="form-input"
                      formControlName="clientReference"
                      placeholder="Punto de referencia">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="atte">
                      Atención
                    </label>
                    <input
                      id="atte"
                      class="form-input"
                      formControlName="atte"
                      placeholder="Persona de contacto"
                      autocomplete="name">
                  </div>
                </div>

                <div class="form-group full-width">
                  <label class="form-label" for="vendedor">
                    Vendedor
                  </label>
                  <input
                    id="vendedor"
                    class="form-input"
                    formControlName="vendedor"
                    placeholder="Nombre del vendedor">
                </div>
              </article>

              <!-- Items Card -->
              <article class="form-card">
                <header class="card-header">
                  <h2>Productos / Servicios</h2>
                  <button
                    type="button"
                    class="btn btn-primary"
                    (click)="addItem()"
                    aria-label="Agregar nuevo producto o servicio">
                    <i class="pi pi-plus" aria-hidden="true"></i>
                    <span>Agregar Item</span>
                  </button>
                </header>

                <div class="items-list" formArrayName="items" role="list">
                  @for (item of itemsArray.controls; track $index; let i = $index) {
                    <article class="item-card" [formGroupName]="i" role="listitem">
                      <header class="item-header">
                        <span class="item-number" aria-label="Item número {{ i + 1 }}">{{ i + 1 }}</span>
                        <button
                          type="button"
                          class="btn-delete"
                          (click)="confirmRemoveItem(i)"
                          [disabled]="itemsArray.length === 1"
                          [attr.aria-label]="'Eliminar item ' + (i + 1)"
                          title="Eliminar este item">
                          <i class="pi pi-trash" aria-hidden="true"></i>
                          <span>Eliminar</span>
                        </button>
                      </header>

                      <div class="form-row">
                        <div class="form-group">
                          <label class="form-label" [for]="'codigo-' + i">Código</label>
                          <input
                            [id]="'codigo-' + i"
                            class="form-input"
                            formControlName="codigo"
                            placeholder="SKU-001">
                        </div>
                        <div class="form-group">
                          <label class="form-label" [for]="'unidadMedida-' + i">Unidad de Medida</label>
                          <select [id]="'unidadMedida-' + i" class="form-input form-select" formControlName="unidadMedida">
                            <option value="UND">Unidad (UND)</option>
                            <option value="KG">Kilogramo (KG)</option>
                            <option value="M">Metro (M)</option>
                            <option value="PZA">Pieza (PZA)</option>
                            <option value="SRV">Servicio (SRV)</option>
                          </select>
                        </div>
                      </div>

                      <div class="form-group full-width">
                        <label class="form-label" [for]="'description-' + i">
                          Descripción
                          <span class="required" aria-label="campo obligatorio">*</span>
                        </label>
                        <textarea
                          [id]="'description-' + i"
                          class="form-input form-textarea"
                          [class.error]="isItemFieldInvalid(i, 'description')"
                          formControlName="description"
                          rows="3"
                          placeholder="Descripción detallada del producto o servicio"
                          aria-required="true"
                          [attr.aria-invalid]="isItemFieldInvalid(i, 'description')"></textarea>
                        @if (isItemFieldInvalid(i, 'description')) {
                          <span class="form-error" role="alert">
                            <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                            La descripción es obligatoria
                          </span>
                        }
                      </div>

                      <div class="item-values">
                        <div class="form-group">
                          <label class="form-label" [for]="'quantity-' + i">Cantidad</label>
                          <input
                            [id]="'quantity-' + i"
                            class="form-input"
                            formControlName="quantity"
                            type="number"
                            inputmode="decimal"
                            min="1"
                            step="1"
                            (input)="updateItemSubtotal(i)">
                        </div>
                        <div class="form-group">
                          <label class="form-label" [for]="'unitPrice-' + i">Precio Unitario</label>
                          <input
                            [id]="'unitPrice-' + i"
                            class="form-input"
                            formControlName="unitPrice"
                            type="number"
                            inputmode="decimal"
                            min="0"
                            step="0.01"
                            (input)="updateItemSubtotal(i)">
                        </div>
                        <div class="form-group">
                          <label class="form-label" [for]="'subtotal-' + i">Subtotal</label>
                          <input
                            [id]="'subtotal-' + i"
                            class="form-input readonly subtotal-display"
                            [value]="formatCurrency(getItemSubtotal(i))"
                            readonly
                            aria-live="polite">
                        </div>
                      </div>
                    </article>
                  }
                </div>
              </article>

              <!-- Totals Card -->
              <article class="form-card totals-card" aria-label="Resumen de totales">
                <div class="totals-grid">
                  <div class="total-row">
                    <span class="total-label">Subtotal (sin IGV)</span>
                    <span class="total-value" aria-live="polite">{{ formatCurrency(totals().subtotal) }}</span>
                  </div>
                  <div class="total-row">
                    <span class="total-label">IGV (18%)</span>
                    <span class="total-value" aria-live="polite">{{ formatCurrency(totals().igv) }}</span>
                  </div>
                  <div class="total-row grand-total">
                    <span class="total-label">TOTAL A PAGAR</span>
                    <span class="total-value" aria-live="polite">{{ formatCurrency(totals().total) }}</span>
                  </div>
                </div>
              </article>

              <!-- Notes Card -->
              <article class="form-card">
                <header class="card-header">
                  <h2>Observaciones</h2>
                </header>
                <div class="form-group full-width">
                  <label class="form-label sr-only" for="notes">Observaciones adicionales</label>
                  <textarea
                    id="notes"
                    class="form-input form-textarea"
                    formControlName="notes"
                    rows="3"
                    placeholder="Escriba aquí cualquier nota o condición adicional para el cliente..."></textarea>
                </div>
              </article>
            </form>

            <!-- Actions -->
            <div class="form-actions">
              <button
                type="button"
                class="btn btn-outline btn-lg"
                (click)="confirmReset()"
                aria-label="Limpiar todos los campos del formulario">
                <i class="pi pi-refresh" aria-hidden="true"></i>
                <span>Limpiar Todo</span>
              </button>
              <button
                type="button"
                class="btn btn-primary btn-lg"
                (click)="openShareModal()"
                aria-label="Compartir cotización por WhatsApp o correo">
                <i class="pi pi-share-alt" aria-hidden="true"></i>
                <span>Compartir</span>
              </button>
            </div>
          </section>

          <!-- Preview Section -->
          <section
            class="preview-section"
            [class.hidden-mobile]="!showPreview()"
            aria-label="Vista previa del documento">
            <app-pdf-preview [quoteData]="currentQuoteData()" />
          </section>
        </div>
      </main>

      <!-- Share Modal -->
      <app-share-modal
        [isOpen]="isShareModalOpen()"
        [documentNumber]="quoteForm.get('documentNumber')?.value"
        [clientName]="quoteForm.get('clientName')?.value"
        [clientPhone]="quoteForm.get('clientPhone')?.value"
        [clientEmail]="quoteForm.get('clientEmail')?.value"
        [documentType]="'cotizacion'"
        (closed)="isShareModalOpen.set(false)"
      />

      <!-- Confirmation Dialog -->
      @if (showConfirmDialog()) {
        <div class="modal-overlay" (click)="cancelConfirm()" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div class="confirm-dialog" (click)="$event.stopPropagation()">
            <h3 id="confirm-title">{{ confirmDialogTitle() }}</h3>
            <p>{{ confirmDialogMessage() }}</p>
            <div class="confirm-actions">
              <button type="button" class="btn btn-outline btn-lg" (click)="cancelConfirm()">
                Cancelar
              </button>
              <button type="button" class="btn btn-danger btn-lg" (click)="executeConfirm()">
                {{ confirmDialogAction() }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Toast Notification -->
      @if (toastMessage()) {
        <div class="toast" [class.toast-success]="toastType() === 'success'" [class.toast-error]="toastType() === 'error'" role="alert" aria-live="assertive">
          <i class="pi" [class.pi-check-circle]="toastType() === 'success'" [class.pi-exclamation-circle]="toastType() === 'error'" aria-hidden="true"></i>
          {{ toastMessage() }}
        </div>
      }
    </div>
  `,
  styles: [`
    /* ============================================
       VARIABLES LOCALES
       ============================================ */
    :host {
      --header-height: 72px;
      --footer-height: 100px;
      display: block;
    }

    /* ============================================
       PAGE LAYOUT
       ============================================ */
    .quote-page {
      min-height: 100vh;
      min-height: 100dvh;
      background: var(--ecom-gray-100);
    }

    /* ============================================
       HEADER - Grande y accesible
       ============================================ */
    .page-header {
      background: white;
      border-bottom: 2px solid var(--ecom-gray-200);
      height: var(--header-height);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: var(--shadow-sm);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      padding: 0 var(--spacing-lg);
      max-width: 1600px;
      margin: 0 auto;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .brand-logo {
      height: 40px;
      width: auto;
    }

    .brand-name {
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--ecom-primary-800);
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-md);
    }

    .header-btn {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      min-height: var(--touch-target-min);
      padding: var(--spacing-sm) var(--spacing-lg);
      border: 2px solid var(--ecom-gray-300);
      border-radius: var(--radius-md);
      background: white;
      color: var(--ecom-gray-800);
      font-size: var(--text-base);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .header-btn:hover {
      background: var(--ecom-gray-100);
      border-color: var(--ecom-gray-400);
    }

    .header-btn:focus-visible {
      box-shadow: var(--focus-ring);
    }

    .header-btn.active {
      background: var(--ecom-primary-800);
      border-color: var(--ecom-primary-800);
      color: white;
    }

    .header-btn i {
      font-size: 1.25rem;
    }

    /* ============================================
       MAIN CONTENT
       ============================================ */
    .main-content {
      padding: var(--spacing-xl) var(--spacing-lg);
      padding-bottom: calc(var(--footer-height) + var(--spacing-xl));
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-xl);
      max-width: 1600px;
      margin: 0 auto;
    }

    /* ============================================
       FORM CARDS - Espaciosos y claros
       ============================================ */
    .form-card {
      background: white;
      border: 2px solid var(--ecom-gray-200);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      margin-bottom: var(--spacing-lg);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
      padding-bottom: var(--spacing-md);
      border-bottom: 2px solid var(--ecom-gray-200);
    }

    .card-header h2 {
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--ecom-gray-900);
      margin: 0;
    }

    /* ============================================
       FORM ELEMENTS - Grandes y legibles
       ============================================ */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .form-group.full-width {
      grid-column: 1 / -1;
      margin-bottom: var(--spacing-lg);
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--ecom-gray-800);
    }

    .required {
      color: var(--ecom-error-600);
      font-weight: 700;
      font-size: var(--text-lg);
    }

    .form-input {
      width: 100%;
      min-height: var(--touch-target-min);
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: var(--text-base);
      font-family: inherit;
      color: var(--ecom-gray-900);
      background: white;
      border: 2px solid var(--ecom-gray-300);
      border-radius: var(--radius-md);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-input::placeholder {
      color: var(--ecom-gray-500);
    }

    .form-input:hover {
      border-color: var(--ecom-gray-400);
    }

    .form-input:focus {
      outline: none;
      border-color: var(--ecom-primary-500);
      box-shadow: var(--focus-ring);
    }

    .form-input.error {
      border-color: var(--ecom-error-500);
      background-color: var(--ecom-error-50);
    }

    .form-input.error:focus {
      box-shadow: var(--focus-ring-error);
    }

    .form-input.readonly {
      background: var(--ecom-gray-100);
      color: var(--ecom-gray-700);
      font-weight: 600;
    }

    .form-textarea {
      min-height: 100px;
      resize: vertical;
    }

    .form-select {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23525252' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 48px;
    }

    .form-error {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: var(--text-sm);
      color: var(--ecom-error-700);
      font-weight: 600;
      margin-top: var(--spacing-xs);
    }

    .form-error i {
      font-size: 1rem;
    }

    .form-hint {
      font-size: var(--text-sm);
      color: var(--ecom-gray-600);
    }

    /* ============================================
       ITEMS LIST
       ============================================ */
    .items-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .item-card {
      background: var(--ecom-gray-50);
      border: 2px solid var(--ecom-gray-200);
      border-radius: var(--radius-md);
      padding: var(--spacing-lg);
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
    }

    .item-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: var(--ecom-primary-800);
      color: white;
      border-radius: var(--radius-md);
      font-size: var(--text-lg);
      font-weight: 700;
    }

    .btn-delete {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      min-height: var(--touch-target-min);
      padding: var(--spacing-sm) var(--spacing-md);
      background: white;
      border: 2px solid var(--ecom-error-300);
      border-radius: var(--radius-md);
      color: var(--ecom-error-700);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-delete:hover:not(:disabled) {
      background: var(--ecom-error-50);
      border-color: var(--ecom-error-500);
    }

    .btn-delete:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .btn-delete i {
      font-size: 1.125rem;
    }

    .item-values {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: var(--spacing-md);
    }

    .subtotal-display {
      background: var(--ecom-success-50) !important;
      color: var(--ecom-success-700) !important;
      font-weight: 700 !important;
      text-align: right;
    }

    /* ============================================
       TOTALS CARD
       ============================================ */
    .totals-card {
      background: var(--ecom-gray-50);
      border: 2px solid var(--ecom-gray-300);
    }

    .totals-grid {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md) 0;
      border-bottom: 1px solid var(--ecom-gray-300);
    }

    .total-row:last-child {
      border-bottom: none;
    }

    .total-label {
      font-size: var(--text-base);
      color: var(--ecom-gray-700);
      font-weight: 500;
    }

    .total-value {
      font-size: var(--text-lg);
      color: var(--ecom-gray-900);
      font-weight: 600;
    }

    .total-row.grand-total {
      background: var(--ecom-primary-800);
      color: white;
      margin: var(--spacing-md) calc(var(--spacing-xl) * -1) calc(var(--spacing-xl) * -1);
      padding: var(--spacing-lg) var(--spacing-xl);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      border-bottom: none;
    }

    .grand-total .total-label {
      font-size: var(--text-lg);
      color: white;
      font-weight: 700;
    }

    .grand-total .total-value {
      font-size: var(--text-2xl);
      color: white;
      font-weight: 700;
    }

    /* ============================================
       BUTTONS
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

    .btn i {
      font-size: 1.25rem;
    }

    .btn-lg {
      min-height: 56px;
      padding: var(--spacing-md) var(--spacing-xl);
      font-size: var(--text-lg);
    }

    .btn-primary {
      background: var(--ecom-primary-800);
      color: white;
      border-color: var(--ecom-primary-800);
    }

    .btn-primary:hover {
      background: var(--ecom-primary-700);
      border-color: var(--ecom-primary-700);
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

    .btn-danger {
      background: var(--ecom-error-600);
      color: white;
      border-color: var(--ecom-error-600);
    }

    .btn-danger:hover {
      background: var(--ecom-error-700);
      border-color: var(--ecom-error-700);
    }

    /* ============================================
       FORM ACTIONS - Fixed bottom en móvil
       ============================================ */
    .form-actions {
      display: flex;
      gap: var(--spacing-lg);
      padding: var(--spacing-lg) 0;
      margin-top: var(--spacing-lg);
    }

    .form-actions .btn {
      flex: 1;
    }

    /* ============================================
       PREVIEW SECTION
       ============================================ */
    .preview-section {
      background: white;
      border: 2px solid var(--ecom-gray-200);
      border-radius: var(--radius-lg);
      overflow: hidden;
      position: sticky;
      top: calc(var(--header-height) + var(--spacing-xl));
      max-height: calc(100vh - var(--header-height) - var(--spacing-xl) * 2);
      box-shadow: var(--shadow-md);
    }

    /* ============================================
       CONFIRMATION DIALOG
       ============================================ */
    .confirm-dialog {
      background: white;
      border-radius: var(--radius-xl);
      padding: var(--spacing-xl);
      max-width: 400px;
      width: 90%;
      text-align: center;
    }

    .confirm-dialog h3 {
      font-size: var(--text-xl);
      color: var(--ecom-gray-900);
      margin-bottom: var(--spacing-md);
    }

    .confirm-dialog p {
      font-size: var(--text-base);
      color: var(--ecom-gray-600);
      margin-bottom: var(--spacing-xl);
      line-height: 1.6;
    }

    .confirm-actions {
      display: flex;
      gap: var(--spacing-md);
    }

    .confirm-actions .btn {
      flex: 1;
    }

    /* ============================================
       TOAST NOTIFICATION
       ============================================ */
    .toast {
      position: fixed;
      bottom: calc(var(--footer-height) + var(--spacing-lg));
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      background: var(--ecom-gray-900);
      color: white;
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--radius-lg);
      font-size: var(--text-base);
      font-weight: 600;
      box-shadow: var(--shadow-xl);
      z-index: 2000;
      animation: toastSlideUp 0.3s ease;
    }

    .toast i {
      font-size: 1.25rem;
    }

    .toast-success {
      background: var(--ecom-success-600);
    }

    .toast-error {
      background: var(--ecom-error-600);
    }

    @keyframes toastSlideUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }

    /* ============================================
       SKIP LINK
       ============================================ */
    .skip-link {
      position: absolute;
      top: -100%;
      left: var(--spacing-md);
      background: var(--ecom-primary-800);
      color: white;
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-md);
      z-index: 9999;
      font-weight: 600;
      text-decoration: none;
    }

    .skip-link:focus {
      top: var(--spacing-md);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* ============================================
       RESPONSIVE - TABLET
       ============================================ */
    @media (max-width: 1200px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .preview-section {
        position: fixed;
        inset: var(--header-height) 0 0 0;
        border-radius: 0;
        max-height: none;
        z-index: 50;
        border: none;
      }

      .hidden-mobile {
        display: none !important;
      }
    }

    /* ============================================
       RESPONSIVE - MOBILE
       ============================================ */
    @media (max-width: 768px) {
      .header-content {
        padding: 0 var(--spacing-md);
      }

      .brand-logo {
        height: 32px;
      }

      .brand-name {
        font-size: var(--text-lg);
      }

      .header-btn span {
        display: none;
      }

      .header-btn {
        padding: var(--spacing-sm);
        min-width: var(--touch-target-min);
      }

      .main-content {
        padding: var(--spacing-lg) var(--spacing-md);
        padding-bottom: calc(var(--footer-height) + var(--spacing-lg));
      }

      .form-card {
        padding: var(--spacing-lg);
        margin-bottom: var(--spacing-md);
      }

      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-md);
      }

      .card-header h2 {
        font-size: var(--text-lg);
      }

      .card-header .btn {
        width: 100%;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
      }

      .item-values {
        grid-template-columns: 1fr 1fr;
      }

      .item-values > .form-group:last-child {
        grid-column: span 2;
      }

      .item-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-md);
      }

      .btn-delete {
        width: 100%;
        justify-content: center;
      }

      .form-actions {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        padding: var(--spacing-md);
        border-top: 2px solid var(--ecom-gray-200);
        z-index: 40;
        margin: 0;
        gap: var(--spacing-md);
        box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
      }

      .toast {
        bottom: calc(var(--footer-height) + var(--spacing-md));
        left: var(--spacing-md);
        right: var(--spacing-md);
        transform: none;
      }

      @keyframes toastSlideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .grand-total .total-value {
        font-size: var(--text-xl);
      }
    }

    /* ============================================
       PRINT STYLES
       ============================================ */
    @media print {
      .page-header,
      .form-actions,
      .preview-section {
        display: none !important;
      }

      .main-content {
        padding: 0;
      }

      .form-card {
        break-inside: avoid;
        border: 1px solid #ccc;
        box-shadow: none;
      }
    }
  `]
})
export class QuoteFormComponent implements OnInit, OnDestroy {
  quoteForm: FormGroup;
  showPreview = signal(false);
  isShareModalOpen = signal(false);

  // Toast notifications
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');
  private toastTimeout: any;

  // Confirmation dialog
  showConfirmDialog = signal(false);
  confirmDialogTitle = signal('');
  confirmDialogMessage = signal('');
  confirmDialogAction = signal('');
  private confirmCallback: (() => void) | null = null;

  // Signal to trigger reactivity on form changes
  private formVersion = signal(0);
  private formSubscription: any;

  constructor(
    private fb: FormBuilder,
    private pdfService: PdfService
  ) {
    const initialData = this.pdfService.createNewQuote();

    this.quoteForm = this.fb.group({
      documentNumber: [initialData.documentNumber],
      currency: [initialData.currency],
      status: [initialData.status],
      clientName: ['', Validators.required],
      clientRuc: [''],
      clientPhone: [''],
      clientMovil: [''],
      clientReference: [''],
      clientAddress: [''],
      clientEmail: ['', Validators.email],
      vendedor: [''],
      atte: [''],
      items: this.fb.array([]),
      notes: [''],
      termsAndConditions: [initialData.termsAndConditions]
    });

    this.addItem();
  }

  ngOnInit(): void {
    // Subscribe to form changes to trigger preview updates
    this.formSubscription = this.quoteForm.valueChanges.subscribe(() => {
      this.formVersion.update(v => v + 1);
    });

    // Load saved data from localStorage if exists
    this.loadSavedData();
  }

  ngOnDestroy(): void {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  // Keyboard shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    // Escape to close modals
    if (event.key === 'Escape') {
      if (this.showConfirmDialog()) {
        this.cancelConfirm();
      } else if (this.isShareModalOpen()) {
        this.isShareModalOpen.set(false);
      } else if (this.showPreview()) {
        this.showPreview.set(false);
      }
    }
  }

  // Save data to localStorage periodically
  private saveData(): void {
    try {
      localStorage.setItem('ecomserv_quote_draft', JSON.stringify(this.quoteForm.value));
    } catch (e) {
      console.warn('Could not save to localStorage');
    }
  }

  private loadSavedData(): void {
    try {
      const saved = localStorage.getItem('ecomserv_quote_draft');
      if (saved) {
        const data = JSON.parse(saved);
        // Don't restore items, just basic fields
        this.quoteForm.patchValue({
          clientName: data.clientName || '',
          clientRuc: data.clientRuc || '',
          clientPhone: data.clientPhone || '',
          clientMovil: data.clientMovil || '',
          clientReference: data.clientReference || '',
          clientAddress: data.clientAddress || '',
          clientEmail: data.clientEmail || '',
          vendedor: data.vendedor || '',
          atte: data.atte || '',
          notes: data.notes || ''
        });
      }
    } catch (e) {
      console.warn('Could not load from localStorage');
    }
  }

  get itemsArray(): FormArray {
    return this.quoteForm.get('items') as FormArray;
  }

  // Validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.quoteForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  isItemFieldInvalid(itemIndex: number, fieldName: string): boolean {
    const item = this.itemsArray.at(itemIndex);
    if (!item) return false;
    const field = item.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  totals = computed(() => {
    this.formVersion();
    const items = this.getItemsData();
    return this.pdfService.calculateTotals(items);
  });

  currentQuoteData = computed((): QuoteData | null => {
    this.formVersion();
    if (!this.quoteForm) return null;

    const formValue = this.quoteForm.value;
    const items = this.getItemsData();
    const totals = this.pdfService.calculateTotals(items);

    return {
      ...this.pdfService.defaultCompanyInfo,
      documentNumber: formValue.documentNumber,
      documentDate: new Date(),
      validUntil: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: formValue.status,
      currency: formValue.currency,
      clientName: formValue.clientName,
      clientRuc: formValue.clientRuc,
      clientAddress: formValue.clientAddress,
      clientPhone: formValue.clientPhone,
      clientEmail: formValue.clientEmail,
      clientReference: formValue.clientReference,
      clientMovil: formValue.clientMovil,
      vendedor: formValue.vendedor,
      atte: formValue.atte,
      items,
      ...totals,
      notes: formValue.notes,
      termsAndConditions: formValue.termsAndConditions
    };
  });

  getItemsData(): DocumentItem[] {
    return this.itemsArray.controls.map((control, index) => {
      const value = control.value;
      const subtotal = this.pdfService.calculateItemSubtotal(value.quantity || 0, value.unitPrice || 0);
      return {
        id: `item-${index}`,
        codigo: value.codigo || '',
        description: value.description || '',
        unidadMedida: value.unidadMedida || 'UND',
        quantity: value.quantity || 0,
        unitPrice: value.unitPrice || 0,
        subtotal
      };
    });
  }

  addItem(): void {
    const itemGroup = this.fb.group({
      codigo: [''],
      unidadMedida: ['UND'],
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]]
    });

    this.itemsArray.push(itemGroup);
    this.showToast('Item agregado', 'success');
  }

  confirmRemoveItem(index: number): void {
    if (this.itemsArray.length === 1) return;

    this.confirmDialogTitle.set('Eliminar Item');
    this.confirmDialogMessage.set(`¿Está seguro de eliminar el item ${index + 1}? Esta acción no se puede deshacer.`);
    this.confirmDialogAction.set('Eliminar');
    this.confirmCallback = () => this.removeItem(index);
    this.showConfirmDialog.set(true);
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
      this.showToast('Item eliminado', 'success');
    }
  }

  getItemSubtotal(index: number): number {
    const item = this.itemsArray.at(index);
    if (!item) return 0;
    return this.pdfService.calculateItemSubtotal(
      item.value.quantity || 0,
      item.value.unitPrice || 0
    );
  }

  updateItemSubtotal(index: number): void {
    this.itemsArray.at(index)?.updateValueAndValidity();
    this.saveData();
  }

  formatCurrency(amount: number): string {
    const currency = this.quoteForm?.get('currency')?.value || 'PEN';
    return this.pdfService.formatCurrency(amount, currency);
  }

  openShareModal(): void {
    // Mark all fields as touched to show validation
    this.quoteForm.markAllAsTouched();
    this.itemsArray.controls.forEach(control => {
      (control as FormGroup).markAllAsTouched();
    });

    if (this.quoteForm.invalid) {
      this.showToast('Por favor complete los campos obligatorios', 'error');
      return;
    }

    this.isShareModalOpen.set(true);
  }

  downloadPdf(): void {
    const quoteData = this.currentQuoteData();
    if (!quoteData) return;

    const htmlContent = this.pdfService.generatePdfHtml(quoteData);

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          URL.revokeObjectURL(url);
        }, 500);
      };
    }

    this.showToast('Documento listo para imprimir', 'success');
  }

  confirmReset(): void {
    this.confirmDialogTitle.set('Limpiar Formulario');
    this.confirmDialogMessage.set('¿Está seguro de limpiar todos los campos? Se perderán todos los datos ingresados.');
    this.confirmDialogAction.set('Limpiar Todo');
    this.confirmCallback = () => this.resetForm();
    this.showConfirmDialog.set(true);
  }

  resetForm(): void {
    const newData = this.pdfService.createNewQuote();
    this.quoteForm.patchValue({
      documentNumber: newData.documentNumber,
      status: 'draft',
      clientName: '',
      clientRuc: '',
      clientPhone: '',
      clientMovil: '',
      clientReference: '',
      clientAddress: '',
      clientEmail: '',
      vendedor: '',
      atte: '',
      notes: ''
    });

    this.itemsArray.clear();
    this.addItem();

    // Clear localStorage
    try {
      localStorage.removeItem('ecomserv_quote_draft');
    } catch (e) { }

    this.showToast('Formulario limpiado', 'success');
  }

  // Confirmation dialog handlers
  executeConfirm(): void {
    if (this.confirmCallback) {
      this.confirmCallback();
    }
    this.showConfirmDialog.set(false);
    this.confirmCallback = null;
  }

  cancelConfirm(): void {
    this.showConfirmDialog.set(false);
    this.confirmCallback = null;
  }

  // Toast notification
  showToast(message: string, type: 'success' | 'error'): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastMessage.set(message);
    this.toastType.set(type);

    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set('');
    }, 3000);
  }
}
