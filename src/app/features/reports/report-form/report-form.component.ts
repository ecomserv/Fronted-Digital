import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of, Subscription } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { PdfService, ReportData } from '../../../core/services/pdf.service';
import { ApiService, ClientDTO, CreateReportRequest2 } from '../../../core/services/api.service';
import { PdfPreviewComponent } from '../../../shared/components/pdf-preview/pdf-preview.component';
import { ShareModalComponent } from '../../../shared/components/share-modal/share-modal.component';
import { ToolbarService } from '../../../core/services/toolbar.service';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PdfPreviewComponent, ShareModalComponent],
  template: `
    <div class="report-page">
      <main class="main-content">
        <div class="content-grid" [class.preview-active]="showPreview()">
          <!-- Form Section -->
          <section class="form-section" [class.hidden-mobile]="showPreview()" aria-label="Formulario de informe técnico">
            <form [formGroup]="reportForm" class="report-form">

              <!-- Document Info -->
              <article class="form-card">
                <header class="card-header"><h2>Datos del Documento</h2></header>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="documentNumber">Número de Documento</label>
                    <input id="documentNumber" class="form-input" formControlName="documentNumber" placeholder="IT-XXXXX">
                    <span class="form-hint">Dejar IT-XXXXX para automático</span>
                  </div>
                </div>
              </article>

              <!-- I. Datos Generales -->
              <article class="form-card">
                <header class="card-header"><h2>I. Datos Generales</h2></header>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Tipo Hardware</label>
                    <input class="form-input" formControlName="tipoHardware" placeholder="Ej: IMPRESORA INYECCION">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Tipo de Servicio</label>
                    <input class="form-input" formControlName="tipoServicio" placeholder="Ej: REPARACION">
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Marca</label>
                    <input class="form-input" formControlName="marca" placeholder="Ej: EPSON">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Modelo</label>
                    <input class="form-input" formControlName="modelo" placeholder="Ej: L395">
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">N° de Serie (S/N)</label>
                    <input class="form-input" formControlName="serialNumber" placeholder="Ej: X2P6305314">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Realizado por</label>
                    <input class="form-input" formControlName="realizadoPor" placeholder="Nombre del técnico">
                  </div>
                </div>

                <!-- Empresa (con autocompletar) -->
                <div class="form-group full-width">
                  <label class="form-label">Empresa</label>
                  <div class="autocomplete-wrapper">
                    <input class="form-input" formControlName="empresa" placeholder="Nombre empresa o cliente"
                      autocomplete="off" (input)="onClientSearch($event)" (blur)="hideClientSuggestions()">
                    @if (clientSuggestions().length > 0 && showClientSuggestions()) {
                      <ul class="autocomplete-dropdown" role="listbox">
                        @for (client of clientSuggestions(); track client.id) {
                          <li class="autocomplete-item" (mousedown)="selectClient(client)">
                            <span class="autocomplete-name">{{ client.name }}</span>
                            @if (client.ruc) { <span class="autocomplete-detail">RUC: {{ client.ruc }}</span> }
                          </li>
                        }
                      </ul>
                    }
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Área</label>
                    <input class="form-input" formControlName="area" placeholder="Ej: SISTEMAS">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Sede</label>
                    <input class="form-input" formControlName="sede" placeholder="Ej: LOCAL SJL">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">N° de Orden</label>
                  <input class="form-input" formControlName="numeroOrden" placeholder="Número de orden (opcional)">
                </div>
              </article>

              <!-- II. Diagnóstico -->
              <article class="form-card">
                <header class="card-header"><h2>II. Diagnóstico</h2></header>

                <div class="form-group full-width">
                  <label class="form-label">Problema Reportado</label>
                  <input class="form-input" formControlName="problemaReportado" placeholder="Ej: EMITE ERROR EN EL PANEL DE CONTROL">
                </div>

                <div class="form-group full-width">
                  <label class="form-label">Pruebas Realizadas</label>
                  <div formArrayName="pruebasRealizadas" class="bullet-array">
                    @for (ctrl of pruebasArray.controls; track $index; let i = $index) {
                      <div class="bullet-row">
                        <span class="bullet-marker">-</span>
                        <input class="form-input bullet-input" [formControlName]="i"
                          placeholder="Descripción de la prueba" (input)="updatePreview()">
                        <button type="button" class="btn-remove" (click)="removePrueba(i)" [disabled]="pruebasArray.length <= 1">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    }
                    <button type="button" class="btn-add" (click)="addPrueba()">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Agregar prueba
                    </button>
                  </div>
                </div>
              </article>

              <!-- III. Resultados -->
              <article class="form-card">
                <header class="card-header"><h2>III. Resultados</h2></header>

                <div class="form-group full-width">
                  <label class="form-label">Conclusiones</label>
                  <div formArrayName="conclusiones" class="bullet-array">
                    @for (ctrl of conclusionesArray.controls; track $index; let i = $index) {
                      <div class="bullet-row">
                        <span class="bullet-marker">-</span>
                        <input class="form-input bullet-input" [formControlName]="i"
                          placeholder="Conclusión" (input)="updatePreview()">
                        <button type="button" class="btn-remove" (click)="removeConclusion(i)" [disabled]="conclusionesArray.length <= 1">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    }
                    <button type="button" class="btn-add" (click)="addConclusion()">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Agregar conclusión
                    </button>
                  </div>
                </div>

                <div class="form-group full-width">
                  <label class="form-label">Recomendaciones</label>
                  <div formArrayName="recomendaciones" class="bullet-array">
                    @for (ctrl of recomendacionesArray.controls; track $index; let i = $index) {
                      <div class="bullet-row">
                        <span class="bullet-marker">-</span>
                        <input class="form-input bullet-input" [formControlName]="i"
                          placeholder="Recomendación" (input)="updatePreview()">
                        <button type="button" class="btn-remove" (click)="removeRecomendacion(i)" [disabled]="recomendacionesArray.length <= 1">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    }
                    <button type="button" class="btn-add" (click)="addRecomendacion()">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Agregar recomendación
                    </button>
                  </div>
                </div>
              </article>

              <!-- IV. Observaciones -->
              <article class="form-card">
                <header class="card-header"><h2>IV. Observaciones</h2></header>
                <div class="form-group full-width">
                  <label class="form-label">Otros</label>
                  <textarea class="form-input form-textarea" formControlName="observaciones" rows="3"
                    placeholder="Observaciones adicionales..." (input)="updatePreview()"></textarea>
                </div>
              </article>

            </form>
          </section>

          <!-- Preview Section -->
          <section class="preview-section" [class.hidden-mobile]="!showPreview()" aria-label="Vista previa del informe">
            <app-pdf-preview
              [reportData]="previewData()"
              (onDownload)="saveReport()"
              (onShare)="saveReport()" />
          </section>
        </div>
      </main>

      <!-- Download Success Modal -->
      @if (showDownloadModal()) {
        <div class="modal-overlay" role="dialog" aria-modal="true">
          <div class="download-modal" (click)="$event.stopPropagation()">
            <div class="download-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3>¡Informe Guardado!</h3>
            <p>El informe <strong>{{ savedDocNumber() }}</strong> se ha guardado correctamente.</p>
            <p class="download-question">¿Deseas descargar el PDF ahora?</p>
            <div class="download-actions">
              <button type="button" class="btn-modal-secondary" (click)="closeDownloadModal(false)">
                Cerrar
              </button>
              <button type="button" class="btn-modal-primary" (click)="closeDownloadModal(true)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Sí, descargar PDF
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Share Modal -->
      <app-share-modal
        [isOpen]="isShareModalOpen()"
        [documentNumber]="reportForm.get('documentNumber')?.value || ''"
        [clientName]="reportForm.get('empresa')?.value || ''"
        [documentType]="'informe'"
        (closed)="isShareModalOpen.set(false)" />
    </div>
  `,
  styles: [`
    :host { display: block; }
    .report-page { min-height: 100%; }
    .main-content { max-width: 1800px; margin: 0 auto; padding: 16px; }
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .content-grid.preview-active { grid-template-columns: 1fr 1fr; }
    .form-section { display: flex; flex-direction: column; gap: 0; }
    .preview-section {
      background: var(--surface-card); border: 2px solid var(--border-default); border-radius: 16px;
      overflow: hidden; position: sticky; top: 80px; max-height: calc(100vh - 100px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .report-form { display: flex; flex-direction: column; gap: 16px; }
    .form-card { background: var(--surface-card); border: 1px solid var(--border-default); border-radius: 16px; padding: 20px; }
    .card-header { margin-bottom: 16px; }
    .card-header h2 { font-size: 16px; font-weight: 700; color: var(--text-primary); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
    .form-input {
      padding: 10px 14px; border: 1px solid var(--border-default); border-radius: 10px;
      font-size: 14px; background: var(--surface-bg); color: var(--text-primary);
      transition: border-color 0.2s, box-shadow 0.2s; outline: none; width: 100%;
    }
    .form-input:focus { border-color: var(--accent-blue); box-shadow: 0 0 0 3px var(--accent-blue-subtle); }
    .form-input::placeholder { color: var(--text-muted); }
    .form-textarea { resize: vertical; min-height: 60px; font-family: inherit; }
    .form-hint { font-size: 11px; color: var(--text-muted); }

    /* Autocomplete */
    .autocomplete-wrapper { position: relative; }
    .autocomplete-dropdown {
      position: absolute; top: 100%; left: 0; right: 0; z-index: 50;
      background: var(--surface-card); border: 1px solid var(--border-default);
      border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      max-height: 200px; overflow-y: auto; list-style: none; padding: 4px;
    }
    .autocomplete-item {
      display: flex; flex-direction: column; gap: 2px; padding: 10px 12px;
      cursor: pointer; border-radius: 8px; transition: background 0.15s;
    }
    .autocomplete-item:hover { background: var(--surface-hover); }
    .autocomplete-name { font-weight: 600; font-size: 14px; color: var(--text-primary); }
    .autocomplete-detail { font-size: 12px; color: var(--text-muted); }

    /* Bullet arrays */
    .bullet-array { display: flex; flex-direction: column; gap: 8px; }
    .bullet-row { display: flex; align-items: center; gap: 8px; }
    .bullet-marker { color: var(--text-muted); font-weight: bold; font-size: 16px; flex-shrink: 0; width: 16px; text-align: center; }
    .bullet-input { flex: 1; }
    .btn-remove {
      width: 32px; height: 32px; border: none; background: var(--accent-red-subtle);
      color: var(--accent-red); border-radius: 8px; cursor: pointer; display: flex;
      align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;
    }
    .btn-remove:hover { background: var(--accent-red); color: white; }
    .btn-remove:disabled { opacity: 0.3; cursor: not-allowed; }
    .btn-add {
      display: flex; align-items: center; gap: 6px; padding: 8px 14px;
      border: 1px dashed var(--border-default); border-radius: 8px; background: transparent;
      color: var(--accent-blue); font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; align-self: flex-start;
    }
    .btn-add:hover { background: var(--accent-blue-subtle); border-color: var(--accent-blue); }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
    }
    .download-modal {
      background: var(--surface-card); border-radius: 20px; padding: 32px;
      max-width: 420px; width: 100%; text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: scaleIn 0.25s ease;
    }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    .download-icon {
      width: 72px; height: 72px; background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px; color: white;
    }
    .download-modal h3 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0 0 12px; }
    .download-modal p { color: var(--text-secondary); font-size: 15px; margin: 0 0 8px; }
    .download-question { font-weight: 600; color: var(--text-primary) !important; margin-top: 16px !important; }
    .download-actions { display: flex; gap: 12px; margin-top: 24px; }
    .btn-modal-secondary {
      flex: 1; padding: 12px; border: 1px solid var(--border-default); background: var(--surface-bg);
      border-radius: 10px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
    }
    .btn-modal-secondary:hover { background: var(--border-default); }
    .btn-modal-primary {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 12px; border: none; background: #3b82f6; border-radius: 10px;
      font-weight: 600; color: white; cursor: pointer; transition: all 0.2s;
    }
    .btn-modal-primary:hover { background: #2563eb; }

    /* Responsive */
    @media (max-width: 1024px) {
      .content-grid { grid-template-columns: 1fr; }
      .content-grid.preview-active { grid-template-columns: 1fr; }
      .form-section { display: block; width: 100%; }
      .preview-section {
        position: relative; top: 0; max-height: none; min-height: 500px;
        border-radius: 0; border: none;
      }
      .form-section.hidden-mobile { display: none !important; }
      .preview-section.hidden-mobile { display: none !important; }
    }
    @media (max-width: 640px) {
      .main-content { padding: 8px; }
      .form-row { grid-template-columns: 1fr; }
      .form-card { padding: 16px; border-radius: 12px; }
    }
  `]
})
export class ReportFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pdfService = inject(PdfService);
  private apiService = inject(ApiService);
  private toolbarService = inject(ToolbarService);

  reportForm!: FormGroup;
  showPreview = signal(false);
  isSaving = signal(false);
  isEditMode = signal(false);
  isShareModalOpen = signal(false);
  showDownloadModal = signal(false);
  savedDocNumber = signal('');
  savedBlob = signal<Blob | null>(null);

  private formSub?: Subscription;

  // Client autocomplete
  clientSuggestions = signal<ClientDTO[]>([]);
  showClientSuggestions = signal(false);
  private clientSearch$ = new Subject<string>();

  // Preview data as writable signal updated on form changes
  previewData = signal<ReportData>(this.pdfService.createNewReport());

  get pruebasArray(): FormArray { return this.reportForm.get('pruebasRealizadas') as FormArray; }
  get conclusionesArray(): FormArray { return this.reportForm.get('conclusiones') as FormArray; }
  get recomendacionesArray(): FormArray { return this.reportForm.get('recomendaciones') as FormArray; }

  ngOnInit() {
    this.initForm();
    this.setupClientSearch();

    // Check edit mode
    const editDoc = this.route.snapshot.queryParamMap.get('edit');
    if (editDoc) {
      this.isEditMode.set(true);
      this.loadReportData(editDoc);
    } else {
      this.apiService.getNextReportNumber().subscribe({
        next: (res) => this.reportForm.patchValue({ documentNumber: res.documentNumber }),
        error: () => {}
      });
    }

    // Register toolbar
    this.toolbarService.setPageTitle(this.isEditMode() ? 'Editar Informe' : 'Nuevo Informe');
    this.toolbarService.setActions([
      {
        id: 'toggle-preview',
        icon: 'pi-eye',
        label: 'Preview',
        callback: () => this.showPreview.update(v => !v),
        active: this.showPreview,
      },
      {
        id: 'share',
        icon: 'pi-share-alt',
        label: 'Compartir',
        callback: () => this.openShareModal(),
      },
      {
        id: 'save-report',
        icon: 'pi-save',
        label: 'Guardar',
        callback: () => this.saveReport(),
        loading: this.isSaving,
      }
    ]);
  }

  ngOnDestroy() {
    this.toolbarService.clear();
    this.formSub?.unsubscribe();
  }

  private initForm() {
    this.reportForm = this.fb.group({
      documentNumber: ['IT-XXXXX'],
      tipoHardware: [''],
      tipoServicio: [''],
      marca: [''],
      modelo: [''],
      serialNumber: [''],
      realizadoPor: [''],
      empresa: [''],
      area: [''],
      sede: [''],
      numeroOrden: [''],
      problemaReportado: [''],
      pruebasRealizadas: this.fb.array([this.fb.control('')]),
      conclusiones: this.fb.array([this.fb.control('')]),
      recomendaciones: this.fb.array([this.fb.control('')]),
      observaciones: ['']
    });

    // Auto-update preview on any form change
    this.formSub?.unsubscribe();
    this.formSub = this.reportForm.valueChanges.pipe(debounceTime(150)).subscribe(() => this.updatePreview());
    this.updatePreview();
  }

  private setupClientSearch() {
    this.clientSearch$.pipe(
      debounceTime(300),
      switchMap(term => term.length >= 2
        ? this.apiService.searchClients(term).pipe(catchError(() => of([])))
        : of([])
      )
    ).subscribe(clients => {
      this.clientSuggestions.set(clients);
      this.showClientSuggestions.set(clients.length > 0);
    });
  }

  onClientSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.clientSearch$.next(value);
  }

  hideClientSuggestions() {
    setTimeout(() => this.showClientSuggestions.set(false), 200);
  }

  selectClient(client: ClientDTO) {
    this.reportForm.patchValue({ empresa: client.name });
    this.showClientSuggestions.set(false);
  }

  // FormArray methods
  addPrueba() { this.pruebasArray.push(this.fb.control('')); }
  removePrueba(i: number) { if (this.pruebasArray.length > 1) this.pruebasArray.removeAt(i); }
  addConclusion() { this.conclusionesArray.push(this.fb.control('')); }
  removeConclusion(i: number) { if (this.conclusionesArray.length > 1) this.conclusionesArray.removeAt(i); }
  addRecomendacion() { this.recomendacionesArray.push(this.fb.control('')); }
  removeRecomendacion(i: number) { if (this.recomendacionesArray.length > 1) this.recomendacionesArray.removeAt(i); }

  updatePreview() {
    if (!this.reportForm) return;
    const v = this.reportForm.getRawValue();
    this.previewData.set({
      documentNumber: v.documentNumber || 'IT-XXXXX',
      documentDate: new Date(),
      tipoHardware: v.tipoHardware || '',
      tipoServicio: v.tipoServicio || '',
      marca: v.marca || '',
      modelo: v.modelo || '',
      serialNumber: v.serialNumber || '',
      realizadoPor: v.realizadoPor || '',
      empresa: v.empresa || '',
      area: v.area || '',
      sede: v.sede || '',
      numeroOrden: v.numeroOrden || '',
      problemaReportado: v.problemaReportado || '',
      pruebasRealizadas: v.pruebasRealizadas || [''],
      conclusiones: v.conclusiones || [''],
      recomendaciones: v.recomendaciones || [''],
      observaciones: v.observaciones || ''
    });
  }

  saveReport() {
    if (this.isSaving()) return;
    this.isSaving.set(true);

    const v = this.reportForm.getRawValue();
    const request: CreateReportRequest2 = {
      documentNumber: v.documentNumber,
      documentDate: new Date().toISOString().split('T')[0],
      tipoHardware: v.tipoHardware,
      tipoServicio: v.tipoServicio,
      marca: v.marca,
      modelo: v.modelo,
      serialNumber: v.serialNumber,
      realizadoPor: v.realizadoPor,
      empresa: v.empresa,
      area: v.area,
      sede: v.sede,
      numeroOrden: v.numeroOrden,
      problemaReportado: v.problemaReportado,
      pruebasRealizadas: (v.pruebasRealizadas || []).filter((p: string) => p.trim()),
      conclusiones: (v.conclusiones || []).filter((c: string) => c.trim()),
      recomendaciones: (v.recomendaciones || []).filter((r: string) => r.trim()),
      observaciones: v.observaciones
    };

    this.apiService.generateReport(request).subscribe({
      next: (blob) => {
        // Extract document number from content-disposition if available
        this.savedBlob.set(blob);
        this.savedDocNumber.set(v.documentNumber || 'Informe');
        this.isSaving.set(false);
        this.showDownloadModal.set(true);
      },
      error: (err) => {
        console.error('Error saving report:', err);
        this.isSaving.set(false);
      }
    });
  }

  closeDownloadModal(download: boolean) {
    if (download) {
      const blob = this.savedBlob();
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.savedDocNumber() + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    }
    this.showDownloadModal.set(false);
    this.savedBlob.set(null);
  }

  openShareModal() {
    // Auto-save before sharing
    if (this.isSaving()) return;
    this.isSaving.set(true);

    const v = this.reportForm.getRawValue();
    const request: CreateReportRequest2 = {
      documentNumber: v.documentNumber,
      documentDate: new Date().toISOString().split('T')[0],
      tipoHardware: v.tipoHardware,
      tipoServicio: v.tipoServicio,
      marca: v.marca,
      modelo: v.modelo,
      serialNumber: v.serialNumber,
      realizadoPor: v.realizadoPor,
      empresa: v.empresa,
      area: v.area,
      sede: v.sede,
      numeroOrden: v.numeroOrden,
      problemaReportado: v.problemaReportado,
      pruebasRealizadas: (v.pruebasRealizadas || []).filter((p: string) => p.trim()),
      conclusiones: (v.conclusiones || []).filter((c: string) => c.trim()),
      recomendaciones: (v.recomendaciones || []).filter((r: string) => r.trim()),
      observaciones: v.observaciones
    };

    this.apiService.generateReport(request).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isShareModalOpen.set(true);
      },
      error: (err) => {
        console.error('Error saving before share:', err);
        this.isSaving.set(false);
      }
    });
  }

  private loadReportData(docNumber: string) {
    this.apiService.getReportData(docNumber).subscribe({
      next: (data) => {
        this.reportForm.patchValue({
          documentNumber: data.documentNumber || docNumber,
          tipoHardware: data.tipoHardware || '',
          tipoServicio: data.tipoServicio || '',
          marca: data.marca || '',
          modelo: data.modelo || '',
          serialNumber: data.serialNumber || '',
          realizadoPor: data.realizadoPor || '',
          empresa: data.empresa || '',
          area: data.area || '',
          sede: data.sede || '',
          numeroOrden: data.numeroOrden || '',
          problemaReportado: data.problemaReportado || '',
          observaciones: data.observaciones || ''
        });

        // Populate FormArrays
        this.pruebasArray.clear();
        (data.pruebasRealizadas || ['']).forEach(p => this.pruebasArray.push(this.fb.control(p)));
        if (this.pruebasArray.length === 0) this.pruebasArray.push(this.fb.control(''));

        this.conclusionesArray.clear();
        (data.conclusiones || ['']).forEach(c => this.conclusionesArray.push(this.fb.control(c)));
        if (this.conclusionesArray.length === 0) this.conclusionesArray.push(this.fb.control(''));

        this.recomendacionesArray.clear();
        (data.recomendaciones || ['']).forEach(r => this.recomendacionesArray.push(this.fb.control(r)));
        if (this.recomendacionesArray.length === 0) this.recomendacionesArray.push(this.fb.control(''));
      },
      error: (err) => {
        console.error('Error loading report:', err);
      }
    });
  }
}
