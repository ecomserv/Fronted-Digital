import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Auth
  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { username, password });
  }

  // Profile
  updateProfile(name: string, username?: string): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/auth/profile`, { name, username: username || name }, {
      headers: this.getHeaders()
    });
  }

  // Quotes
  generateQuote(quoteData: CreateQuoteRequest): Observable<Blob> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.apiUrl}/quotes/generate`, quoteData, {
      headers,
      responseType: 'blob'
    });
  }

  previewQuote(quoteData: CreateQuoteRequest): Observable<Blob> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.apiUrl}/quotes/preview`, quoteData, {
      headers,
      responseType: 'blob'
    });
  }

  getNextDocumentNumber(): Observable<{ documentNumber: string }> {
    return this.http.get<{ documentNumber: string }>(`${this.apiUrl}/quotes/next-number`, {
      headers: this.getHeaders()
    });
  }

  downloadQuote(documentNumber: string): Observable<Blob> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(`${this.apiUrl}/quotes/${documentNumber}/pdf`, {
      headers,
      responseType: 'blob'
    });
  }

  getQuoteData(documentNumber: string): Observable<CreateQuoteRequest> {
    return this.http.get<CreateQuoteRequest>(`${this.apiUrl}/quotes/${documentNumber}/data`, {
      headers: this.getHeaders()
    });
  }

  deleteQuote(documentNumber: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/quotes/${documentNumber}`, {
      headers: this.getHeaders()
    });
  }

  listQuotesWithSummary(): Observable<QuoteSummary[]> {
    return this.http.get<QuoteSummary[]>(`${this.apiUrl}/quotes/summary`, {
      headers: this.getHeaders()
    });
  }

  // Email
  sendQuoteEmail(request: SendEmailRequest): Observable<{ success: boolean; message: string }> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/quotes/send-email`, request, {
      headers
    });
  }

  // Stats
  getQuoteStats(from?: string, to?: string): Observable<QuoteStats> {
    let params = '';
    if (from && to) {
      params = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    }
    return this.http.get<QuoteStats>(`${this.apiUrl}/quotes/stats${params}`, {
      headers: this.getHeaders()
    });
  }

  // Clients
  searchClients(search?: string): Observable<ClientDTO[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<ClientDTO[]>(`${this.apiUrl}/clients${params}`, {
      headers: this.getHeaders()
    });
  }

  getClient(id: number): Observable<ClientDTO> {
    return this.http.get<ClientDTO>(`${this.apiUrl}/clients/${id}`, {
      headers: this.getHeaders()
    });
  }

  createClient(client: ClientDTO): Observable<ClientDTO> {
    return this.http.post<ClientDTO>(`${this.apiUrl}/clients`, client, {
      headers: this.getHeaders()
    });
  }

  updateClient(id: number, client: ClientDTO): Observable<ClientDTO> {
    return this.http.put<ClientDTO>(`${this.apiUrl}/clients/${id}`, client, {
      headers: this.getHeaders()
    });
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clients/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Products
  searchProducts(search?: string): Observable<ProductDTO[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<ProductDTO[]>(`${this.apiUrl}/products${params}`, {
      headers: this.getHeaders()
    });
  }

  // ==================== REPORTS (Informes Técnicos) ====================

  generateReport(reportData: CreateReportRequest2): Observable<Blob> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.apiUrl}/reports/generate`, reportData, {
      headers,
      responseType: 'blob'
    });
  }

  previewReport(reportData: CreateReportRequest2): Observable<Blob> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.apiUrl}/reports/preview`, reportData, {
      headers,
      responseType: 'blob'
    });
  }

  getNextReportNumber(): Observable<{ documentNumber: string }> {
    return this.http.get<{ documentNumber: string }>(`${this.apiUrl}/reports/next-number`, {
      headers: this.getHeaders()
    });
  }

  downloadReport(documentNumber: string): Observable<Blob> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(`${this.apiUrl}/reports/${documentNumber}/pdf`, {
      headers,
      responseType: 'blob'
    });
  }

  getReportData(documentNumber: string): Observable<CreateReportRequest2> {
    return this.http.get<CreateReportRequest2>(`${this.apiUrl}/reports/${documentNumber}/data`, {
      headers: this.getHeaders()
    });
  }

  deleteReport(documentNumber: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reports/${documentNumber}`, {
      headers: this.getHeaders()
    });
  }

  listReportsWithSummary(): Observable<ReportSummary[]> {
    return this.http.get<ReportSummary[]>(`${this.apiUrl}/reports/summary`, {
      headers: this.getHeaders()
    });
  }

  sendReportEmail(request: SendReportEmailRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/reports/send-email`, request, {
      headers: this.getHeaders()
    });
  }
}

// Interfaces
export interface AuthResponse {
  token: string;
  username: string;
  name: string;
  role: string;
}

export interface CreateQuoteRequest {
  documentNumber?: string;
  documentDate?: string;
  validUntil?: string;
  currency: 'PEN' | 'USD';
  clientName: string;
  clientRuc?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientReference?: string;
  clientMobile?: string;
  vendedor?: string;
  atte?: string;
  items: QuoteItemDTO[];
  paymentCondition?: string;
  validityDays?: number;
  deliveryTime?: string;
  warranty?: string;
  notes?: string;
}

export interface QuoteItemDTO {
  code?: string;
  description: string;
  unitMeasure?: string;
  quantity: number;
  unitPrice: number;
}

export interface ItemDetail {
  description: string;
  quantity: number;
  subtotal: number;
}

export interface QuoteSummary {
  documentNumber: string;
  clientName: string;
  currency: 'PEN' | 'USD';
  total: number;
  itemCount: number;
  firstItemDescription: string | null;
  createdAt: string;
}

export interface SendEmailRequest {
  toEmail: string;
  ccEmail?: string;
  documentNumber: string;
  clientName?: string;
  attachPdf?: boolean;
}

export interface ClientDTO {
  id?: number;
  name: string;
  ruc?: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
}

export interface ProductDTO {
  id?: number;
  code?: string;
  description: string;
  unitMeasure?: string;
  referencePrice?: number;
}

export interface QuoteStats {
  quotesThisMonth: number;
  quotesLastMonth: number;
  totalPEN: number;
  totalUSD: number;
  totalQuotes: number;
  topClients: ClientStat[];
  monthlyTrend: MonthlyData[];
  previousPeriodPEN: number;
  previousPeriodUSD: number;
  previousPeriodQuotes: number;
  recentQuotes: QuoteSummary[];
}

export interface ClientStat {
  name: string;
  count: number;
}

export interface MonthlyData {
  key: string;
  count: number;
  totalUSD: number;
  totalPEN: number;
}

// ==================== REPORT INTERFACES ====================

export interface CreateReportRequest2 {
  documentNumber?: string;
  documentDate?: string;
  tipoHardware?: string;
  tipoServicio?: string;
  marca?: string;
  modelo?: string;
  serialNumber?: string;
  realizadoPor?: string;
  empresa?: string;
  area?: string;
  sede?: string;
  numeroOrden?: string;
  clientId?: number;
  problemaReportado?: string;
  pruebasRealizadas?: string[];
  conclusiones?: string[];
  recomendaciones?: string[];
  observaciones?: string;
}

export interface ReportSummary {
  documentNumber: string;
  empresa: string;
  tipoServicio: string;
  marca: string;
  modelo: string;
  problemaReportado: string;
  realizadoPor: string;
  createdAt: string;
  fileSize: number;
}

export interface SendReportEmailRequest {
  toEmail: string;
  documentNumber: string;
  empresa?: string;
  attachPdf?: boolean;
}
