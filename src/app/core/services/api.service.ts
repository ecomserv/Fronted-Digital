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
  createdAt: string;
}

export interface SendEmailRequest {
  toEmail: string;
  documentNumber: string;
  clientName?: string;
  attachPdf?: boolean;
}
