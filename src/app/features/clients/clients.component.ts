import { Component, OnInit, OnDestroy, signal, computed, effect, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService, ClientDTO } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToolbarService } from '../../core/services/toolbar.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-layout">
      <main class="container main-content">
        <!-- Subtitle -->
        <div class="list-toolbar">
          <p class="subtitle">{{ filteredClients().length }} cliente{{ filteredClients().length !== 1 ? 's' : '' }} registrado{{ filteredClients().length !== 1 ? 's' : '' }}</p>
        </div>

        <!-- Search -->
        <div class="search-bar">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, RUC, contacto..."
            [ngModel]="searchTerm()"
            (ngModelChange)="onSearch($event)"
            class="search-input"
            autocomplete="off"
          />
          @if (searchTerm()) {
            <button class="clear-search" (click)="onSearch('')" title="Limpiar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          }
        </div>

        <!-- Loading Skeleton -->
        @if (loading()) {
          <div class="skeleton-grid">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="skeleton-card">
                <div class="sk-line sk-name"></div>
                <div class="sk-line sk-ruc"></div>
                <div class="sk-line sk-detail"></div>
                <div class="sk-line sk-detail short"></div>
              </div>
            }
          </div>
        }

        <!-- Empty State -->
        @if (!loading() && filteredClients().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            @if (searchTerm()) {
              <h3>Sin resultados</h3>
              <p>No se encontraron clientes para "{{ searchTerm() }}"</p>
            } @else {
              <h3>No hay clientes registrados</h3>
              <p>Agrega tu primer cliente para comenzar</p>
              <button class="btn-primary" (click)="openModal()">Agregar Cliente</button>
            }
          </div>
        }

        <!-- Client Cards Grid -->
        @if (!loading() && filteredClients().length > 0) {
          <div class="clients-grid">
            @for (client of filteredClients(); track client.id) {
              <div class="client-card">
                <div class="card-header">
                  <div class="avatar">{{ getInitials(client.name) }}</div>
                  <div class="card-name-wrap">
                    <h3 class="client-name">{{ client.name }}</h3>
                    @if (client.ruc) {
                      <span class="ruc-badge">RUC {{ client.ruc }}</span>
                    }
                  </div>
                </div>

                <div class="card-details">
                  @if (client.contactPerson) {
                    <div class="detail-row">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span>{{ client.contactPerson }}</span>
                    </div>
                  }
                  @if (client.phone) {
                    <div class="detail-row">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <span>{{ client.phone }}</span>
                    </div>
                  }
                  @if (client.email) {
                    <div class="detail-row">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <span>{{ client.email }}</span>
                    </div>
                  }
                  @if (client.address) {
                    <div class="detail-row">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span class="address-text">{{ client.address }}</span>
                    </div>
                  }
                </div>

                <div class="card-actions">
                  <button class="action-btn edit" (click)="openModal(client)" title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Editar
                  </button>
                  <button class="action-btn delete" (click)="confirmDelete(client)" title="Eliminar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </main>

      <!-- Modal Create/Edit -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingClient() ? 'Editar Cliente' : 'Nuevo Cliente' }}</h2>
              <button class="modal-close" (click)="closeModal()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form (ngSubmit)="saveClient()" class="modal-form">
              <div class="form-row">
                <div class="form-group full">
                  <label for="name">Razón Social / Nombre <span class="required">*</span></label>
                  <input id="name" type="text" [(ngModel)]="formData.name" name="name" required autocomplete="organization"
                         placeholder="Ej: EMPRESA SAC" />
                </div>
              </div>

              <div class="form-row two-cols">
                <div class="form-group">
                  <label for="ruc">RUC</label>
                  <input id="ruc" type="text" [(ngModel)]="formData.ruc" name="ruc" maxlength="11" autocomplete="off"
                         placeholder="20XXXXXXXXX" />
                </div>
                <div class="form-group">
                  <label for="contactPerson">Persona de contacto</label>
                  <input id="contactPerson" type="text" [(ngModel)]="formData.contactPerson" name="contactPerson" autocomplete="name"
                         placeholder="Nombre del contacto" />
                </div>
              </div>

              <div class="form-row two-cols">
                <div class="form-group">
                  <label for="phone">Teléfono</label>
                  <input id="phone" type="tel" [(ngModel)]="formData.phone" name="phone" autocomplete="tel"
                         placeholder="+51 999 999 999" />
                </div>
                <div class="form-group">
                  <label for="email">Email</label>
                  <input id="email" type="email" [(ngModel)]="formData.email" name="email" autocomplete="email"
                         placeholder="contacto@empresa.com" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group full">
                  <label for="address">Dirección</label>
                  <input id="address" type="text" [(ngModel)]="formData.address" name="address" autocomplete="street-address"
                         placeholder="Av. Industrial 123, Lima" />
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-cancel" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="saving() || !formData.name?.trim()">
                  @if (saving()) {
                    <span class="spinner"></span>
                  }
                  {{ editingClient() ? 'Guardar Cambios' : 'Crear Cliente' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirm -->
      @if (showDeleteConfirm()) {
        <div class="modal-overlay" (click)="showDeleteConfirm.set(false)">
          <div class="modal modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Eliminar Cliente</h2>
            </div>
            <p class="confirm-text">¿Está seguro que desea eliminar a <strong>{{ deletingClient()?.name }}</strong>?</p>
            <div class="modal-actions">
              <button class="btn-cancel" (click)="showDeleteConfirm.set(false)">Cancelar</button>
              <button class="btn-danger" (click)="doDelete()" [disabled]="saving()">
                @if (saving()) {
                  <span class="spinner"></span>
                }
                Eliminar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Toast -->
      @if (toast()) {
        <div class="toast" [class]="'toast ' + toast()!.type">
          {{ toast()!.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 24px; }

    /* Main */
    .main-content { padding-top: 24px; padding-bottom: 48px; }

    /* List Toolbar */
    .list-toolbar {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px; gap: 16px;
    }
    .subtitle { color: var(--text-muted); font-size: 14px; margin: 0; }

    /* Buttons */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, var(--ecom-blue-500), var(--ecom-blue-700)); color: white;
      border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600;
      font-size: 14px; cursor: pointer; transition: all 0.2s; min-height: 44px;
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,130,246,0.35); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-cancel {
      background: var(--surface-hover); color: var(--text-secondary); border: none; padding: 12px 24px;
      border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; min-height: 44px;
    }
    .btn-cancel:hover { background: var(--border-default); }
    .btn-danger {
      background: var(--accent-red); color: white; border: none; padding: 12px 24px;
      border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; min-height: 44px;
      display: inline-flex; align-items: center; gap: 8px;
    }
    .btn-danger:hover:not(:disabled) { opacity: 0.9; }
    .btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Search */
    .search-bar { position: relative; margin-bottom: 24px; }
    .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
    .search-input {
      width: 100%; padding: 14px 44px 14px 48px; border: 1px solid var(--border-default);
      border-radius: 14px; font-size: 15px; background: var(--surface-card); color: var(--text-primary); transition: all 0.2s;
      box-sizing: border-box;
    }
    .search-input:focus { outline: none; border-color: var(--ecom-blue-500); box-shadow: 0 0 0 3px var(--accent-blue-subtle); }
    .search-input::placeholder { color: var(--text-muted); }
    .clear-search {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: var(--surface-hover); border: none; width: 28px; height: 28px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; color: var(--text-muted); cursor: pointer;
    }
    .clear-search:hover { background: var(--border-default); color: var(--text-secondary); }

    /* Skeleton */
    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .skeleton-card { background: var(--surface-card); border-radius: 16px; padding: 24px; border: 1px solid var(--border-default); }
    .sk-line {
      height: 14px; border-radius: 6px;
      background: linear-gradient(90deg, var(--surface-hover) 25%, var(--border-subtle) 50%, var(--surface-hover) 75%);
      background-size: 200% 100%; animation: shimmer 1.5s infinite; margin-bottom: 12px;
    }
    .sk-name { width: 60%; height: 18px; }
    .sk-ruc { width: 40%; }
    .sk-detail { width: 80%; }
    .sk-detail.short { width: 50%; margin-bottom: 0; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* Empty State */
    .empty-state { text-align: center; padding: 64px 24px; }
    .empty-icon { color: var(--text-muted); margin-bottom: 16px; }
    .empty-state h3 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px; }
    .empty-state p { color: var(--text-muted); margin: 0 0 24px; font-size: 15px; }

    /* Clients Grid */
    .clients-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .client-card {
      background: var(--surface-card); border-radius: 16px; padding: 24px; border: 1px solid var(--border-default);
      transition: all 0.2s;
    }
    .client-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-card); }

    .card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
    .avatar {
      width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, var(--accent-purple), var(--ecom-purple-500));
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 15px; flex-shrink: 0;
    }
    .card-name-wrap { min-width: 0; }
    .client-name {
      font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ruc-badge {
      font-size: 12px; color: var(--text-secondary); background: var(--surface-hover); padding: 2px 8px;
      border-radius: 6px; font-weight: 500; display: inline-block; margin-top: 4px;
    }

    .card-details { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .detail-row { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: var(--text-secondary); }
    .detail-row svg { flex-shrink: 0; margin-top: 1px; }
    .address-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .card-actions { display: flex; gap: 8px; border-top: 1px solid var(--border-subtle); padding-top: 16px; }
    .action-btn {
      display: inline-flex; align-items: center; gap: 6px; border: none;
      padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; min-height: 44px;
    }
    .action-btn.edit { background: var(--accent-blue-subtle); color: var(--accent-blue); }
    .action-btn.edit:hover { opacity: 0.8; }
    .action-btn.delete { background: var(--accent-red-subtle); color: var(--accent-red); }
    .action-btn.delete:hover { opacity: 0.8; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: var(--overlay-bg); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;
    }
    .modal {
      background: var(--surface-card); border: 1px solid var(--border-default);
      border-radius: 20px; width: 100%; max-width: 560px;
      max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }
    .modal.modal-sm { max-width: 420px; }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center; padding: 24px 24px 0;
    }
    .modal-header h2 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .modal-close {
      width: 36px; height: 36px; border-radius: 10px; border: none; background: var(--surface-hover);
      display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary);
    }
    .modal-close:hover { background: var(--border-default); }
    .confirm-text { padding: 16px 24px; color: var(--text-secondary); font-size: 15px; line-height: 1.6; margin: 0; }

    /* Form */
    .modal-form { padding: 24px; }
    .form-row { margin-bottom: 16px; }
    .form-row.two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-group.full { grid-column: 1 / -1; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
    .required { color: var(--accent-red); }
    .form-group input {
      width: 100%; padding: 12px 14px; border: 1px solid var(--border-input); border-radius: 10px;
      font-size: 14px; transition: all 0.2s; box-sizing: border-box;
      background: var(--surface-input); color: var(--text-primary);
    }
    .form-group input:focus { outline: none; border-color: var(--ecom-blue-500); box-shadow: 0 0 0 3px var(--accent-blue-subtle); }
    .form-group input::placeholder { color: var(--text-muted); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; padding: 0 24px 24px; }
    .modal-form .modal-actions { padding: 8px 0 0; }

    /* Spinner */
    .spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Toast */
    .toast {
      position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
      padding: 14px 24px; border-radius: 12px; font-size: 14px; font-weight: 600;
      z-index: 2000; animation: toastIn 0.3s ease;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15);
    }
    .toast.success { background: var(--accent-green); color: white; }
    .toast.error { background: var(--accent-red); color: white; }
    @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } }

    /* Responsive */
    @media (max-width: 640px) {
      .container { padding: 0 16px; }
      .clients-grid, .skeleton-grid { grid-template-columns: 1fr; }
      .form-row.two-cols { grid-template-columns: 1fr; }
    }
  `]
})
export class ClientsComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  private toolbarService = inject(ToolbarService);

  // State
  clients = signal<ClientDTO[]>([]);
  loading = signal(true);
  saving = signal(false);
  searchTerm = signal('');
  showModal = signal(false);
  editingClient = signal<ClientDTO | null>(null);
  showDeleteConfirm = signal(false);
  deletingClient = signal<ClientDTO | null>(null);
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  formData: ClientDTO = this.emptyForm();

  // Debounced search
  private searchSubject = new Subject<string>();

  filteredClients = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.clients();
    return this.clients().filter(c =>
      c.name?.toLowerCase().includes(term) ||
      c.ruc?.toLowerCase().includes(term) ||
      c.contactPerson?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phone?.includes(term)
    );
  });

  ngOnInit() {
    // Register toolbar actions
    this.toolbarService.setPageTitle('Clientes');
    this.toolbarService.setActions([
      {
        id: 'new-client',
        icon: 'pi-plus',
        label: 'Nuevo Cliente',
        callback: () => this.openModal(),
      },
    ]);

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(term => this.searchTerm.set(term));

    this.loadClients();
  }

  onSearch(value: string) {
    // Update immediately for clear button, debounce for API
    this.searchTerm.set(value);
    this.searchSubject.next(value);
  }

  ngOnDestroy() {
    this.toolbarService.clear();
  }

  loadClients() {
    this.loading.set(true);
    this.api.searchClients().subscribe({
      next: (data) => {
        this.clients.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.showToast('Error al cargar clientes', 'error');
        this.loading.set(false);
      }
    });
  }

  openModal(client?: ClientDTO) {
    if (client) {
      this.editingClient.set(client);
      this.formData = { ...client };
    } else {
      this.editingClient.set(null);
      this.formData = this.emptyForm();
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingClient.set(null);
    this.formData = this.emptyForm();
  }

  saveClient() {
    if (!this.formData.name?.trim()) return;
    this.saving.set(true);

    const obs = this.editingClient()
      ? this.api.updateClient(this.editingClient()!.id!, this.formData)
      : this.api.createClient(this.formData);

    obs.subscribe({
      next: () => {
        this.showToast(
          this.editingClient() ? 'Cliente actualizado' : 'Cliente creado',
          'success'
        );
        this.closeModal();
        this.loadClients();
        this.saving.set(false);
      },
      error: () => {
        this.showToast('Error al guardar cliente', 'error');
        this.saving.set(false);
      }
    });
  }

  confirmDelete(client: ClientDTO) {
    this.deletingClient.set(client);
    this.showDeleteConfirm.set(true);
  }

  doDelete() {
    const client = this.deletingClient();
    if (!client?.id) return;
    this.saving.set(true);
    this.api.deleteClient(client.id).subscribe({
      next: () => {
        this.showToast('Cliente eliminado', 'success');
        this.showDeleteConfirm.set(false);
        this.loadClients();
        this.saving.set(false);
      },
      error: () => {
        this.showToast('Error al eliminar cliente', 'error');
        this.saving.set(false);
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  private emptyForm(): ClientDTO {
    return { name: '', ruc: '', address: '', phone: '', email: '', contactPerson: '' };
  }

  private showToast(message: string, type: 'success' | 'error') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }
}
