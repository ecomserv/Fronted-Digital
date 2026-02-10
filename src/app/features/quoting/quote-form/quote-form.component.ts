import { Component, signal, computed, OnInit, OnDestroy, HostListener, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap } from 'rxjs/operators';
import { PdfService, QuoteData, DocumentItem } from '../../../core/services/pdf.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService, CreateQuoteRequest, ClientDTO, ProductDTO } from '../../../core/services/api.service';
import { ShareModalComponent } from '../../../shared/components/share-modal/share-modal.component';
import { PdfPreviewComponent } from '../../../shared/components/pdf-preview/pdf-preview.component';
import { ToolbarService } from '../../../core/services/toolbar.service';

@Component({
  selector: 'app-quote-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ShareModalComponent, PdfPreviewComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- Skip Link for Accessibility -->
    <a href="#main-form" class="skip-link">Saltar al formulario</a>

    <div class="quote-page">
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
                      class="form-input"
                      formControlName="documentNumber"
                      placeholder="CES-XXXXX"
                      aria-describedby="documentNumber-hint">
                    <span id="documentNumber-hint" class="form-hint">Editable: Dejar en CES-XXXXX para automático</span>
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
                  <div class="autocomplete-wrapper">
                    <input
                      id="clientName"
                      class="form-input"
                      [class.error]="isFieldInvalid('clientName')"
                      formControlName="clientName"
                      placeholder="Nombre del cliente o empresa"
                      autocomplete="off"
                      aria-required="true"
                      [attr.aria-invalid]="isFieldInvalid('clientName')"
                      aria-describedby="clientName-error"
                      (input)="onClientSearch($event)"
                      (blur)="hideClientSuggestions()">
                    @if (clientSuggestions().length > 0 && showClientSuggestions()) {
                      <ul class="autocomplete-dropdown" role="listbox" aria-label="Sugerencias de clientes">
                        @for (client of clientSuggestions(); track client.id) {
                          <li class="autocomplete-item" role="option"
                              (mousedown)="selectClient(client)">
                            <span class="autocomplete-name">{{ client.name }}</span>
                            @if (client.ruc) {
                              <span class="autocomplete-detail">RUC: {{ client.ruc }}</span>
                            }
                          </li>
                        }
                      </ul>
                    }
                  </div>
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
                    <label class="form-label" for="clientMobile">
                      Móvil
                    </label>
                    <input
                      id="clientMobile"
                      class="form-input"
                      formControlName="clientMobile"
                      placeholder="999 888 777"
                      type="tel"
                      autocomplete="tel">
                  </div>
                </div>

                <div class="form-row">
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
                          <div class="autocomplete-wrapper">
                            <input
                              [id]="'codigo-' + i"
                              class="form-input"
                              formControlName="codigo"
                              placeholder="SKU-001"
                              autocomplete="off"
                              (input)="onProductSearch($event, i)"
                              (blur)="hideProductSuggestions()">
                            @if (activeProductIndex() === i && productSuggestions().length > 0 && showProductSuggestions()) {
                              <ul class="autocomplete-dropdown" role="listbox" aria-label="Sugerencias de productos">
                                @for (product of productSuggestions(); track product.id) {
                                  <li class="autocomplete-item" role="option"
                                      (mousedown)="selectProduct(product, i)">
                                    <span class="autocomplete-name">{{ product.code }}</span>
                                    <span class="autocomplete-detail">{{ product.description }}</span>
                                  </li>
                                }
                              </ul>
                            }
                          </div>
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
                          <label class="form-label" [for]="'priceInput-' + i">
                            Precio Unitario
                            <div class="segmented-control">
                              <button 
                                type="button" 
                                class="segment-btn" 
                                [class.active]="!item.get('includesIgv')?.value" 
                                (click)="setIgvMode(i, false)"
                                title="El precio ingresado es sin IGV">
                                Base
                              </button>
                              <button 
                                type="button" 
                                class="segment-btn" 
                                [class.active]="item.get('includesIgv')?.value" 
                                (click)="setIgvMode(i, true)"
                                title="El precio ingresado ya incluye IGV">
                                Final (+IGV)
                              </button>
                            </div>
                          </label>
                          <input
                            [id]="'priceInput-' + i"
                            class="form-input"
                            formControlName="priceInput"
                            type="number"
                            inputmode="decimal"
                            min="0"
                            step="1"
                            (input)="updateItemSubtotal(i)">
                          <!-- Hidden unitPrice control for internal calculation -->
                          <input type="hidden" formControlName="unitPrice">
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

          </section>

          <!-- Preview Section -->
          <section
            class="preview-section"
            [class.hidden-mobile]="!showPreview()"
            aria-label="Vista previa del documento">
            <app-pdf-preview 
              [quoteData]="currentQuoteData()" 
              (onDownload)="downloadPdf()"
              (onShare)="openShareModal()" />
          </section>
        </div>
      </main>

      <!-- Share Modal -->
      <app-share-modal
        [isOpen]="isShareModalOpen()"
        [documentNumber]="quoteForm.get('documentNumber')?.value"
        [clientName]="quoteForm.get('clientName')?.value"
        [clientPhone]="quoteForm.get('clientMobile')?.value"
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

      <!-- Download Success Modal -->
      @if (showDownloadModal()) {
        <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="download-title">
          <div class="download-modal" (click)="$event.stopPropagation()">
            <div class="download-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 id="download-title">¡Cotización Guardada!</h3>
            <p>La cotización <strong>{{ savedDocumentNumber() }}</strong> se ha guardado correctamente.</p>
            <p class="download-question">¿Deseas descargar el PDF ahora?</p>
            <div class="download-actions">
              <button type="button" class="btn btn-outline btn-lg" (click)="closeDownloadModal(false)">
                No, volver al Dashboard
              </button>
              <button type="button" class="btn btn-primary btn-lg" (click)="closeDownloadModal(true)">
                <i class="pi pi-download" aria-hidden="true"></i>
                <span>Sí, descargar PDF</span>
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
      display: block;
    }

    /* ============================================
       PAGE LAYOUT
       ============================================ */
    .quote-page {
      min-height: 100vh;
      min-height: 100dvh;
      background: var(--surface-bg);
    }

    /* ============================================
       MAIN CONTENT
       ============================================ */
    .main-content {
      padding: var(--spacing-xl) var(--spacing-lg);
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
      background: var(--surface-card);
      border: 2px solid var(--border-default);
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
      color: var(--text-primary);
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
      color: var(--text-primary);
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
      color: var(--text-primary);
      background: var(--surface-input);
      border: 2px solid var(--border-input);
      border-radius: var(--radius-md);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-input::placeholder {
      color: var(--text-muted);
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
      color: var(--text-inverted);
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
      background: var(--surface-card);
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
      color: var(--text-secondary);
      font-weight: 500;
    }

    .total-value {
      font-size: var(--text-lg);
      color: var(--text-primary);
      font-weight: 600;
    }

    .total-row.grand-total {
      background: var(--ecom-primary-800);
      color: var(--text-inverted);
      margin: var(--spacing-md) calc(var(--spacing-xl) * -1) calc(var(--spacing-xl) * -1);
      padding: var(--spacing-lg) var(--spacing-xl);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      border-bottom: none;
    }

    .grand-total .total-label {
      font-size: var(--text-lg);
      color: var(--text-inverted);
      font-weight: 700;
    }

    .grand-total .total-value {
      font-size: var(--text-2xl);
      color: var(--text-inverted);
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
      color: var(--text-inverted);
      border-color: var(--ecom-primary-800);
    }

    .btn-primary:hover {
      background: var(--ecom-primary-700);
      border-color: var(--ecom-primary-700);
    }

    .btn-outline {
      background: var(--surface-card);
      color: var(--text-primary);
      border-color: var(--border-default);
    }

    .btn-outline:hover {
      background: var(--surface-hover);
      border-color: var(--border-strong);
    }

    .btn-danger {
      background: var(--ecom-error-600);
      color: var(--text-inverted);
      border-color: var(--ecom-error-600);
    }

    .btn-danger:hover {
      background: var(--ecom-error-700);
      border-color: var(--ecom-error-700);
    }

    /* ============================================
       PREVIEW SECTION
       ============================================ */
    .preview-section {
      background: var(--surface-card);
      border: 2px solid var(--border-default);
      border-radius: var(--radius-lg);
      overflow: hidden;
      position: sticky;
      top: calc(56px + var(--spacing-xl));
      max-height: calc(100vh - 56px - var(--spacing-xl) * 2);
      box-shadow: var(--shadow-md);
    }

    /* ============================================
       CONFIRMATION DIALOG
       ============================================ */
    .confirm-dialog {
      background: var(--surface-card);
      border-radius: var(--radius-xl);
      padding: var(--spacing-xl);
      max-width: 400px;
      width: 90%;
      text-align: center;
    }

    .confirm-dialog h3 {
      font-size: var(--text-xl);
      color: var(--text-primary);
      margin-bottom: var(--spacing-md);
    }

    .confirm-dialog p {
      font-size: var(--text-base);
      color: var(--text-secondary);
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
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      background: var(--ecom-gray-900);
      color: var(--text-inverted);
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
        transform: translateX(-50%) translateY(-20px);
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
      color: var(--text-inverted);
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-md);
      z-index: 9999;
      font-weight: 600;
      text-decoration: none;
    }

    .skip-link:focus {
      top: var(--spacing-md);
    }

    /* ============================================
       AUTOCOMPLETE DROPDOWN
       ============================================ */
    .autocomplete-wrapper {
      position: relative;
      width: 100%;
    }

    .autocomplete-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--surface-card);
      border: 2px solid var(--border-default);
      border-top: none;
      border-radius: 0 0 var(--radius-md) var(--radius-md);
      max-height: 200px;
      overflow-y: auto;
      z-index: 500;
      list-style: none;
      margin: 0;
      padding: 0;
      box-shadow: var(--shadow-md);
    }

    .autocomplete-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: var(--spacing-sm) var(--spacing-md);
      cursor: pointer;
      border-bottom: 1px solid var(--border-subtle);
      transition: background 0.15s ease;
    }

    .autocomplete-item:last-child {
      border-bottom: none;
    }

    .autocomplete-item:hover {
      background: var(--surface-hover);
    }

    .autocomplete-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: var(--text-base);
    }

    .autocomplete-detail {
      font-size: var(--text-sm);
      color: var(--text-muted);
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
       PREVIEW SECTION
       ============================================ */
    .preview-section {
      height: calc(100vh - 56px - 60px);
      min-height: 400px;
      position: sticky;
      top: calc(56px + 20px);
    }

    /* ============================================
       RESPONSIVE DESIGN
       ============================================ */
    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      /* On mobile: show form OR preview, not both - CENTERED */
      .form-section {
        display: block;
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
        padding: 0;
      }

      .form-section .quote-form {
        width: 100%;
        max-width: 100%;
      }

      .form-section .form-card {
        margin-left: 0;
        margin-right: 0;
        border-radius: var(--radius-md);
      }

      .preview-section {
        display: block;
        position: relative;
        top: 0;
        width: 100%;
        height: auto;
        min-height: 0;
        border-radius: 0;
        border: none;
      }

      .form-section.hidden-mobile {
        display: none;
      }

      .preview-section.hidden-mobile {
        display: none;
      }
    }

    /* Segmented Control - Modern Pill Style - GLOBAL */
    .form-group label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .segmented-control {
      display: inline-flex;
      background-color: var(--surface-hover);
      padding: 3px;
      border-radius: 9999px;
      border: 1px solid var(--border-default);
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .segment-btn {
      border: none;
      background: transparent;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .segment-btn:hover {
      color: var(--text-secondary);
      background-color: var(--surface-card);
    }

    .segment-btn.active {
      background-color: var(--surface-card);
      color: var(--text-primary);
      box-shadow: var(--shadow-card);
      border: 1px solid var(--border-subtle);
    }

    /* ============================================
       RESPONSIVE - MOBILE
       ============================================ */
    @media (max-width: 768px) {
      .main-content {
        padding: var(--spacing-md);
        width: 100%;
        box-sizing: border-box;
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

      .toast {
        top: 72px;
        left: var(--spacing-md);
        right: var(--spacing-md);
        transform: none;
      }

      @keyframes toastSlideUp {
        from {
          opacity: 0;
          transform: translateY(-20px);
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
       MODAL STYLES
       ============================================ */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: var(--overlay-bg);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .confirm-dialog,
    .download-modal {
      background: var(--surface-card);
      border-radius: 20px;
      padding: 32px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: var(--shadow-card);
    }

    .confirm-dialog h3,
    .download-modal h3 {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 12px;
    }

    .confirm-dialog p,
    .download-modal p {
      color: var(--text-secondary);
      font-size: 15px;
      margin: 0 0 8px;
    }

    .confirm-actions,
    .download-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 24px;
    }

    .confirm-actions button,
    .download-actions button {
      flex: 1 1 100%;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (min-width: 400px) {
      .confirm-actions button,
      .download-actions button {
        flex: 1 1 auto;
      }
    }

    .download-icon {
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      color: var(--text-inverted);
    }

    .download-question {
      font-weight: 600;
      color: var(--text-primary) !important;
      margin-top: 16px !important;
    }

    /* ============================================
       PRINT STYLES
       ============================================ */
      /* ============================================
       RESPONSIVE - GRID & VISIBILITY
       ============================================ */
    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
        gap: var(--spacing-lg);
      }

      .preview-section.hidden-mobile {
        display: none !important;
      }

      .form-section.hidden-mobile {
        display: none !important;
      }
      
      /* Make sure preview section takes full width/height when visible */
      .content-grid.preview-active {
        /* On mobile, if preview is active, form is hidden, so preview takes 1fr */
      }
      
      .preview-section {
        min-height: auto;
      }
    }

    /* Print styles */
    @media print {
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
  private toolbarService = inject(ToolbarService);
  quoteForm: FormGroup;

  // Controls visibility on mobile (false = form, true = preview)
  showPreview = signal(false);

  // Used for any desktop-specific conditional classes (currently just returns true for desktop layout)
  isDesktopPreviewVisible = computed(() => true);

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
  private formChangeSubject = new Subject<void>();
  private formSubscription: any;

  isSaving = signal(false);

  // Editing mode (set from query param)
  editingDocNumber = signal('');

  // Download modal
  showDownloadModal = signal(false);
  savedDocumentNumber = signal('');
  private savedPdfBlob: Blob | null = null;

  // Autocomplete
  clientSuggestions = signal<ClientDTO[]>([]);
  showClientSuggestions = signal(false);
  productSuggestions = signal<ProductDTO[]>([]);
  showProductSuggestions = signal(false);
  activeProductIndex = signal(-1);
  private clientSearchSubject = new Subject<string>();
  private productSearchSubject = new Subject<{ term: string; index: number }>();

  constructor(
    private fb: FormBuilder,
    private pdfService: PdfService,
    private authService: AuthService,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const initialData = this.pdfService.createNewQuote();

    this.quoteForm = this.fb.group({
      documentNumber: [initialData.documentNumber],
      currency: [initialData.currency],
      status: [initialData.status],
      clientName: ['', Validators.required],
      clientRuc: [''],

      clientMobile: [''],
      clientReference: [''],
      clientAddress: [''],
      clientEmail: ['', Validators.email],
      atte: [''],
      items: this.fb.array([]),
      notes: [''],
      termsAndConditions: [initialData.termsAndConditions]
    });

    // Don't add empty item here - will be added in ngOnInit for new quotes only
  }

  ngOnInit(): void {
    // Register contextual toolbar actions in AppShell
    this.toolbarService.setPageTitle(
      this.editingDocNumber() ? 'Editar Cotización' : 'Nueva Cotización'
    );
    this.toolbarService.setActions([
      {
        id: 'save-pdf',
        icon: 'pi-download',
        label: 'Guardar PDF',
        callback: () => this.downloadPdf(),
        disabled: this.isSaving,
        loading: this.isSaving,
      },
      {
        id: 'toggle-preview',
        icon: 'pi-eye',
        label: 'Vista Previa',
        callback: () => this.togglePreview(),
        active: this.showPreview,
      },
      {
        id: 'share',
        icon: 'pi-share-alt',
        label: 'Compartir',
        callback: () => this.openShareModal(),
      },
      {
        id: 'reset',
        icon: 'pi-refresh',
        label: 'Limpiar',
        callback: () => this.confirmReset(),
      },
    ]);

    // Subscribe to form changes to trigger preview updates (debounced to avoid scroll jitter on mobile)
    this.quoteForm.valueChanges.subscribe(() => this.formChangeSubject.next());
    this.formSubscription = this.formChangeSubject.pipe(
      debounceTime(400)
    ).subscribe(() => {
      this.formVersion.update(v => v + 1);
    });

    // Autocomplete: client search
    this.clientSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length < 2) {
          return of([]);
        }
        return this.apiService.searchClients(term).pipe(catchError(() => of([])));
      })
    ).subscribe(clients => {
      this.clientSuggestions.set(clients);
      this.showClientSuggestions.set(clients.length > 0);
    });

    // Autocomplete: product search
    this.productSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => a.term === b.term && a.index === b.index),
      switchMap(({ term, index }) => {
        if (!term || term.length < 2) {
          return of({ products: [] as ProductDTO[], index });
        }
        return this.apiService.searchProducts(term).pipe(
          catchError(() => of([])),
          switchMap(products => of({ products: products as ProductDTO[], index }))
        );
      })
    ).subscribe(({ products, index }) => {
      this.productSuggestions.set(products);
      this.activeProductIndex.set(index);
      this.showProductSuggestions.set(products.length > 0);
    });

    // Check for edit mode
    this.route.queryParams.subscribe(params => {
      if (params['edit']) {
        const docNumber = params['edit'];
        this.editingDocNumber.set(docNumber);
        this.loadQuoteData(docNumber);
      } else {
        // New quote - start fresh with one empty item
        this.addItem();

        // Fetch next document number
        this.apiService.getNextDocumentNumber().subscribe({
          next: (res) => {
            this.quoteForm.patchValue({ documentNumber: res.documentNumber });
          },
          error: (err) => console.error('Error fetching next document number', err)
        });
        // Clear any saved draft
        try {
          localStorage.removeItem('ecomserv_quote_draft');
        } catch (e) { }
      }
    });
  }

  ngOnDestroy(): void {
    this.toolbarService.clear();
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

  togglePreview(): void {
    this.showPreview.update(v => !v);
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

          clientMobile: data.clientMobile || '',
          clientReference: data.clientReference || '',
          clientAddress: data.clientAddress || '',
          clientEmail: data.clientEmail || '',
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

      clientEmail: formValue.clientEmail,
      clientReference: formValue.clientReference,
      clientMobile: formValue.clientMobile,
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
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      // New fields for IGV toggle logic
      priceInput: [0, [Validators.required, Validators.min(0)]],
      includesIgv: [false]
    });

    // Subscribe to price changes
    const priceInputControl = itemGroup.get('priceInput');
    const includesIgvControl = itemGroup.get('includesIgv');
    const unitPriceControl = itemGroup.get('unitPrice');

    const updateUnitPrice = () => {
      const price = priceInputControl?.value || 0;
      const includesIgv = includesIgvControl?.value;

      // If price includes IGV, calculate net price (Price / 1.18)
      // Otherwise logic is net price = input price
      const netPrice = includesIgv ? (price / 1.18) : price;

      // Update unitPrice without emitting event to avoid loops if needed
      unitPriceControl?.setValue(Number(netPrice.toFixed(4)), { emitEvent: false });

      // Since we modified unitPrice manually, we need to manually trigger subtotal update
      // Finding the index of this new control might be tricky here, 
      // but updateItemSubtotal handles the calculation based on unitPrice.
      // We will trigger it from the template (input) event.
    };

    priceInputControl?.valueChanges.subscribe(updateUnitPrice);
    includesIgvControl?.valueChanges.subscribe(updateUnitPrice);

    this.itemsArray.push(itemGroup);
    this.showToast('Item agregado', 'success');
  }

  loadQuoteData(documentNumber: string) {
    this.apiService.getQuoteData(documentNumber).subscribe({
      next: (data) => {
        // Populate form
        this.quoteForm.patchValue({
          documentNumber: documentNumber, // Keep existing number
          currency: data.currency,
          clientName: data.clientName,
          clientRuc: data.clientRuc,
          clientAddress: data.clientAddress,

          clientEmail: data.clientEmail,
          clientReference: data.clientReference,
          clientMobile: data.clientMobile || '',
          atte: data.atte,
          notes: data.notes,
          validityDays: data.validityDays,
          deliveryTime: data.deliveryTime,
          warranty: data.warranty,
          paymentCondition: data.paymentCondition
        });

        // Clear existing items and add loaded items
        this.itemsArray.clear();

        if (data.items && data.items.length > 0) {
          data.items.forEach(item => {
            // Use the stored unitPrice as the base price
            const storedPrice = item.unitPrice || 0;

            const itemGroup = this.fb.group({
              codigo: [item.code || ''],
              unidadMedida: [item.unitMeasure || 'UND'],
              description: [item.description || '', Validators.required],
              quantity: [item.quantity || 1, [Validators.required, Validators.min(1)]],
              unitPrice: [storedPrice, [Validators.required, Validators.min(0)]],
              priceInput: [storedPrice, [Validators.required, Validators.min(0)]],
              includesIgv: [false]
            });

            // Re-attach listeners for price updates
            const priceInputControl = itemGroup.get('priceInput');
            const includesIgvControl = itemGroup.get('includesIgv');
            const unitPriceControl = itemGroup.get('unitPrice');

            const updateUnitPrice = () => {
              const price = priceInputControl?.value || 0;
              const includesIgv = includesIgvControl?.value;
              const netPrice = includesIgv ? (price / 1.18) : price;
              unitPriceControl?.setValue(Number(netPrice.toFixed(4)), { emitEvent: false });
            };

            priceInputControl?.valueChanges.subscribe(updateUnitPrice);
            includesIgvControl?.valueChanges.subscribe(updateUnitPrice);

            this.itemsArray.push(itemGroup);
          });
        } else {
          // If no items, add one empty item
          this.addItem();
        }

        // Force form update and trigger reactivity
        this.quoteForm.updateValueAndValidity();
        this.formVersion.update(v => v + 1);

        this.showToast('Datos de cotización cargados', 'success');
      },
      error: (err) => {
        console.error('Error loading quote data', err);
        this.showToast('Error al cargar datos de cotización', 'error');
      }
    });
  }

  setIgvMode(index: number, includesIgv: boolean): void {
    const item = this.itemsArray.at(index);
    if (item) {
      item.patchValue({ includesIgv: includesIgv });
      // Trigger update manually if needed, though valueChanges should handle it
    }
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
    // We use the calculated unitPrice (net) for subtotal
    return this.pdfService.calculateItemSubtotal(
      item.value.quantity || 0,
      item.value.unitPrice || 0
    );
  }

  updateItemSubtotal(index: number): void {
    const item = this.itemsArray.at(index);
    if (!item) return;

    // If this was triggered by unitPrice input (legacy), sync back to priceInput
    // BUT we are moving to use priceInput as the source of truth.
    // The valueChanges subscriptions added in addItem handle the unitPrice calculation.

    this.itemsArray.at(index)?.updateValueAndValidity();
    this.saveData();
  }

  formatCurrency(amount: number): string {
    const currency = this.quoteForm?.get('currency')?.value || 'PEN';
    return this.pdfService.formatCurrency(amount, currency);
  }

  goBack(): void {
    if (this.quoteForm.dirty) {
      this.confirmDialogTitle.set('¿Salir sin guardar?');
      this.confirmDialogMessage.set('Si sale ahora, perderá los cambios no guardados.');
      this.confirmDialogAction.set('Salir');
      this.confirmCallback = () => this.router.navigate(['/dashboard']);
      this.showConfirmDialog.set(true);
    } else {
      this.router.navigate(['/dashboard']);
    }
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

    // Auto-save before sharing to ensure PDF exists on backend
    this.isSaving.set(true);
    const quoteData = this.buildQuoteRequest();

    this.apiService.generateQuote(quoteData).subscribe({
      next: (blob) => {
        this.isSaving.set(false);
        this.showToast('Cotización guardada y lista para compartir', 'success');
        this.isShareModalOpen.set(true);

        // If it was a new quote, we might need to update the form's dirty state
        this.quoteForm.markAsPristine();
      },
      error: (err) => {
        console.error('Error auto-saving quote before share', err);
        this.isSaving.set(false);
        this.showToast('Error al preparar la cotización para compartir', 'error');
      }
    });
  }

  downloadPdf(): void {
    // Mark all fields as touched to show validation
    this.quoteForm.markAllAsTouched();
    this.itemsArray.controls.forEach(control => {
      (control as FormGroup).markAllAsTouched();
    });

    if (this.quoteForm.invalid) {
      this.showToast('Por favor complete los campos obligatorios', 'error');
      return;
    }

    this.isSaving.set(true);
    const request = this.buildQuoteRequest();

    this.apiService.generateQuote(request).subscribe({
      next: (blob) => {
        this.isSaving.set(false);

        // Store the blob for potential download
        this.savedPdfBlob = blob;
        this.savedDocumentNumber.set(request.documentNumber || 'Cotización');

        // Mark form as saved (not dirty)
        this.quoteForm.markAsPristine();

        // Show download modal
        this.showDownloadModal.set(true);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Error generating quote:', err);
        this.showToast('Error al generar la cotización. Intente de nuevo.', 'error');
      }
    });
  }

  closeDownloadModal(download: boolean): void {
    if (download && this.savedPdfBlob) {
      const url = window.URL.createObjectURL(this.savedPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.savedDocumentNumber()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      this.showToast('PDF descargado exitosamente', 'success');
    }

    this.showDownloadModal.set(false);
    this.savedPdfBlob = null;

    // Navigate to dashboard after saving
    this.router.navigate(['/dashboard']);
  }

  previewPdf(): void {
    if (this.quoteForm.invalid) {
      this.showToast('Por favor complete los campos obligatorios', 'error');
      return;
    }

    const request = this.buildQuoteRequest();

    this.apiService.previewQuote(request).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: (err) => {
        console.error('Error previewing quote:', err);
        this.showToast('Error al generar vista previa', 'error');
      }
    });
  }

  private buildQuoteRequest(): CreateQuoteRequest {
    const formValue = this.quoteForm.value;
    return {
      documentNumber: formValue.documentNumber,
      currency: formValue.currency,
      clientName: formValue.clientName,
      clientRuc: formValue.clientRuc || undefined,
      clientAddress: formValue.clientAddress || undefined,

      clientEmail: formValue.clientEmail || undefined,
      clientReference: formValue.clientReference || undefined,
      clientMobile: formValue.clientMobile || undefined,
      atte: formValue.atte || undefined,
      items: this.itemsArray.controls.map(control => ({
        code: control.value.codigo || undefined,
        description: control.value.description,
        unitMeasure: control.value.unidadMedida || 'UND',
        quantity: control.value.quantity || 1,
        unitPrice: control.value.unitPrice || 0
      })),
      notes: formValue.notes || undefined
    };
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

      clientMobile: '',
      clientReference: '',
      clientAddress: '',
      clientEmail: '',
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

  // Autocomplete: client search handler
  onClientSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.clientSearchSubject.next(value);
  }

  selectClient(client: ClientDTO): void {
    this.quoteForm.patchValue({
      clientName: client.name,
      clientRuc: client.ruc || '',
      clientAddress: client.address || '',
      clientMobile: client.phone || '',
      clientEmail: client.email || '',
      atte: client.contactPerson || ''
    });
    this.showClientSuggestions.set(false);
    this.clientSuggestions.set([]);
    this.showToast('Cliente seleccionado', 'success');
  }

  hideClientSuggestions(): void {
    setTimeout(() => {
      this.showClientSuggestions.set(false);
    }, 200);
  }

  // Autocomplete: product search handler
  onProductSearch(event: Event, index: number): void {
    const value = (event.target as HTMLInputElement).value;
    this.productSearchSubject.next({ term: value, index });
  }

  selectProduct(product: ProductDTO, index: number): void {
    const item = this.itemsArray.at(index);
    if (item) {
      item.patchValue({
        codigo: product.code,
        description: product.description,
        unidadMedida: product.unitMeasure || 'UND',
        priceInput: product.referencePrice || 0,
        includesIgv: false
      });
    }
    this.showProductSuggestions.set(false);
    this.productSuggestions.set([]);
    this.showToast('Producto seleccionado', 'success');
  }

  hideProductSuggestions(): void {
    setTimeout(() => {
      this.showProductSuggestions.set(false);
    }, 200);
  }
}
