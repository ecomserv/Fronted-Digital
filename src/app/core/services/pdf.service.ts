import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface DocumentItem {
  id: string;
  codigo?: string;
  description: string;
  unidadMedida?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface QuoteData {
  companyName: string;
  companyRuc: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWeb?: string;

  documentNumber: string;
  documentDate: Date;
  validUntil: Date;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  currency: 'PEN' | 'USD';

  clientName: string;
  clientRuc: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  clientReference?: string;
  clientMovil?: string;
  vendedor?: string;
  atte?: string;

  items: DocumentItem[];

  subtotal: number;
  igv: number;
  total: number;

  notes: string;
  termsAndConditions: string;

  // Condiciones comerciales
  condicionPago?: string;
  validezDias?: number;
  plazoEntrega?: string;
  garantia?: string;
}

export const IGV_RATE = 0.18;

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  exchangeRate = 3.37; // Default fallback

  readonly defaultCompanyInfo = {
    companyName: 'ECOMSERV',
    companyRuc: '20602689809',
    companyAddress: 'Urb. Faucett Mz E Lte 8 - Callao',
    companyPhone: '945464470',
    companyEmail: 'epacomser@hotmail.com',
    companyWeb: 'www.ecomserv.com'
  };

  // Información bancaria BCP
  readonly bankInfo = {
    titular: 'ECOMSERV SAC',
    ruc: '20602689809',
    cuentaSoles: '1912486011021',
    cciSoles: '002-19100248601102152'
  };

  constructor(private http: HttpClient) {
    this.fetchExchangeRate();
  }

  fetchExchangeRate() {
    this.http.get<any>('https://api.exchangerate-api.com/v4/latest/USD').subscribe({
      next: (data) => {
        if (data && data.rates && data.rates.PEN) {
          this.exchangeRate = data.rates.PEN;
          console.log('Tipo de cambio actualizado:', this.exchangeRate);
        }
      },
      error: (err) => {
        console.error('Error al obtener tipo de cambio, usando valor por defecto:', err);
      }
    });
  }

  calculateItemSubtotal(quantity: number, unitPrice: number): number {
    return Math.round(quantity * unitPrice * 100) / 100;
  }

  calculateTotals(items: DocumentItem[]): { subtotal: number; igv: number; total: number } {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const igv = Math.round(subtotal * IGV_RATE * 100) / 100;
    const total = Math.round((subtotal + igv) * 100) / 100;
    return { subtotal, igv, total };
  }

  formatCurrency(amount: number, currency: 'PEN' | 'USD' = 'PEN'): string {
    const symbol = currency === 'PEN' ? 'S/.' : 'US$';
    return `${symbol} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatNumber(amount: number): string {
    return amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  generateDocumentNumber(): string {
    const random = String(Math.floor(Math.random() * 10000)).padStart(5, '0');
    return `CES-${random}`;
  }

  createNewQuote(): QuoteData {
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + 4);

    return {
      ...this.defaultCompanyInfo,
      documentNumber: this.generateDocumentNumber(),
      documentDate: now,
      validUntil,
      status: 'draft',
      currency: 'PEN',
      clientName: '',
      clientRuc: '',
      clientAddress: '',
      clientPhone: '',
      clientEmail: '',
      clientReference: '',
      clientMovil: '',
      vendedor: '',
      atte: '',
      items: [],
      subtotal: 0,
      igv: 0,
      total: 0,
      notes: '',
      termsAndConditions: '',
      condicionPago: 'CONTADO',
      validezDias: 4,
      plazoEntrega: 'SEGUN STOCK INMEDIATO',
      garantia: '12 MESES'
    };
  }

  generatePdfHtml(data: QuoteData): string {
    // Generar filas de items
    const itemsHtml = data.items.map((item, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td style="text-align: center;">${item.codigo || ''}</td>
        <td style="padding: 10px 8px; font-size: 11px;">${item.description}</td>
        <td style="text-align: center;">${item.unidadMedida || 'UND'}</td>
        <td style="text-align: center;">${this.formatNumber(item.quantity)}</td>
        <td style="text-align: right;">${this.formatNumber(item.unitPrice)}</td>
        <td style="text-align: right; font-weight: 500;">${this.formatNumber(item.subtotal)}</td>
      </tr>
    `).join('');

    // Calcular valores
    const valorVenta = data.subtotal;
    const igv = data.igv;


    // Formatear fecha
    const formatDate = (date: Date) => {
      const d = new Date(date);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    // Logic for currency display
    // Current strategy: Top section shows USD, Bottom section shows PEN
    // tailored to resolve "redundant values" and "should be converted" feedback.

    const isUSD = data.currency === 'USD';
    const rate = this.exchangeRate > 0 ? this.exchangeRate : 3.37;
    const symbolUSD = 'US$';
    const symbolPEN = 'S/.';

    let valorVentaUSD, igvUSD, totalUSD;
    let totalPEN;

    if (isUSD) {
      // Data is already in USD
      valorVentaUSD = valorVenta;
      igvUSD = igv;
      totalUSD = data.total;

      // Convert to PEN
      totalPEN = data.total * rate;
    } else {
      // Data is in PEN
      // Calculate USD equivalents for the Top Section
      valorVentaUSD = valorVenta / rate;
      igvUSD = igv / rate;
      totalUSD = data.total / rate;

      // Bottom section is the original PEN values
      totalPEN = data.total;
    }

    // Totals in USD (Top Section)
    const valorVentaStr = `${symbolUSD} ${this.formatNumber(valorVentaUSD)}`;
    const igvStr = `${symbolUSD} ${this.formatNumber(igvUSD)}`;
    const totalOriginalStr = `${symbolUSD} ${this.formatNumber(totalUSD)}`;

    // Total in Soles (Bottom Section)
    const totalPENStr = `${symbolPEN} ${this.formatNumber(totalPEN)}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Cotización ${data.documentNumber} - ECOMSERV</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Arial:wght@400;700&display=swap');

          @media print {
            @page {
              margin: 8mm;
              size: A4;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          html, body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            color: #000;
            line-height: 1.4;
            background: #ffffff !important;
            background-color: #ffffff !important;
            padding: 20px;
            margin: 0;
          }

          .page-container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            background: #ffffff;
          }

          /* ===== HEADER ===== */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 15px 0;
            border-bottom: 3px solid #1e3a8a;
            margin-bottom: 15px;
          }

          .logo-section {
            flex: 0 0 220px;
          }

          .logo-section img {
            max-width: 200px;
            height: auto;
          }

          .company-info {
            flex: 1;
            text-align: right;
            padding-left: 20px;
          }

          .quote-title {
            font-size: 22px;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 8px;
          }

          .quote-number {
            font-size: 16px;
            font-weight: bold;
            color: #1e3a8a;
            background: #e8f0fe;
            padding: 4px 12px;
            display: inline-block;
            margin-bottom: 10px;
          }

          .company-details {
            font-size: 11px;
            color: #333;
            line-height: 1.5;
          }

          .company-details .ruc {
            font-size: 13px;
            font-weight: bold;
            color: #c00;
          }

          /* ===== CLIENT INFO ===== */
          .client-section {
            margin-bottom: 15px;
            font-size: 12px;
          }

          .client-row {
            display: flex;
            margin-bottom: 2px;
          }

          .client-label {
            width: 100px;
            font-weight: bold;
            color: #1e3a8a;
          }

          .client-value {
            flex: 1;
          }

          .client-grid {
            display: flex;
            gap: 20px;
          }

          .client-grid .left {
            flex: 1;
          }

          .client-grid .right {
            flex: 1;
          }

          .intro-text {
            margin: 15px 0;
            font-size: 12px;
          }

          /* ===== TABLE ===== */
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
          }

          .items-table thead th {
            background: #1e3a8a;
            color: white;
            padding: 10px 6px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
          }

          .items-table tbody td {
            font-size: 11px;
            color: #000;
            padding: 8px 6px; /* Added padding for better spacing */
          }

          /* Removed borders as requested */
          .items-table thead th,
          .items-table tbody td {
            border: none;
          }
           
           /* Keep subtle bottom border for header separator */
           .items-table thead th {
               border-bottom: 2px solid #1e3a8a; 
           }


          /* ===== TOTALS ===== */
          .totals-section {
            margin-top: 0;
            border: 2px solid #1e3a8a; 
            border-top: none;
          }

          .totals-row {
            display: flex;
            justify-content: flex-end;
            background: #ffffff;
            padding: 10px 12px;
            font-size: 12px;
          }

          .totals-row .item {
            margin-left: 30px;
            display: flex; /* alignment fix */
            width: 180px; /* Fixed width for alignment */
            justify-content: space-between;
          }

          .totals-row .label {
            font-weight: bold;
            color: #1e3a8a;
          }

          .totals-row .value {
            margin-left: 10px;
            font-weight: bold;
            text-align: right;
          }

          .totals-soles {
            display: flex;
            justify-content: flex-end;
            background: #1e3a8a;
            color: white;
            padding: 10px 12px;
            font-size: 13px;
            font-weight: bold;
          }

          .totals-soles .item {
            margin-left: 30px;
            display: flex;
            width: 180px;
            justify-content: space-between;
          }

          /* ===== CONDITIONS ===== */
          .conditions-section {
            margin-top: 15px;
            border: 2px solid #1e3a8a;
          }

          .conditions-header {
            background: #FFFF00;
            padding: 12px 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            border-bottom: 2px solid #1e3a8a;
          }

          .conditions-header .condition-item {
            display: flex;
            align-items: center;
          }

          .conditions-header .condition-label {
            font-weight: bold;
            color: #1e3a8a;
            margin-right: 5px;
          }

          .conditions-header .condition-value {
            color: #c00;
            font-weight: bold;
          }

          .conditions-header .total-soles {
            font-weight: bold;
            color: #c00;
            font-size: 14px;
          }

          .conditions-body {
            padding: 8px 10px;
            background: #ffffff;
          }

          .conditions-row {
            display: flex;
            margin-bottom: 5px;
            font-size: 12px;
          }

          .conditions-row .label {
            width: 130px;
            font-weight: bold;
            color: #1e3a8a;
          }

          .conditions-row .value {
            flex: 1;
          }

          /* ===== PAYMENT METHODS & SIGNATURE ===== */
          .payment-container {
             display: flex;
             justify-content: space-between;
             align-items: flex-start;
             margin-top: 15px;
             padding-top: 10px;
          }

          .bcp-info {
            flex: 1;
          }

          .bcp-title {
            font-weight: bold;
            color: #1e3a8a;
            font-size: 13px;
            margin-bottom: 10px;
            padding-bottom: 8px;
          }

          .bcp-details {
            font-size: 12px;
            line-height: 1.6;
            color: #333;
          }
          
          .signature-section {
             flex: 0 0 200px;
             text-align: center;
             display: flex;
             flex-direction: column;
             align-items: center;
             justify-content: flex-end;
          }
          
          .signature-img {
              max-width: 180px;
              max-height: 100px;
              object-fit: contain;
          }

          /* ===== FAREWELL ===== */
          .farewell {
            margin: 20px 0;
            font-size: 12px;
            color: #333;
          }

          /* ===== FOOTER ===== */
          .footer {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px solid #1e3a8a;
          }

          .footer-brands {
            width: 100%;
            max-height: 50px;
            object-fit: contain;
          }

          /* Print optimizations */
          @media print {
            .page-container {
              padding: 0;
            }

            .conditions-section,
            .items-table {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <!-- HEADER -->
          <div class="header">
            <div class="logo-section">
              <img src="/assets/logo.png" alt="ECOMSERV" style="display:none;" onerror="this.src='/logo-ecomserv.png'"> <!-- Fallback/Adjust based on actual asset location if known, usually assets are relative -->
               <img src="/logo-ecomserv.png" alt="ECOMSERV">
            </div>
            <div class="company-info">
              <div class="quote-title">COTIZACIÓN: <span class="quote-number">${data.documentNumber}</span></div>
              <div class="company-details">
                <div class="ruc">RUC: ${data.companyRuc}</div>
                <div>${data.companyAddress}</div>
                <div>Telf: ${data.companyPhone}</div>

              </div>
            </div>
          </div>

          <!-- CLIENT INFO -->
          <div class="client-section">
            <div class="client-grid">
              <div class="left">
                <div class="client-row">
                  <span class="client-label">FECHA</span>
                  <span class="client-value">: ${formatDate(data.documentDate)}</span>
                </div>
                <div class="client-row">
                  <span class="client-label">SEÑOR</span>
                  <span class="client-value">: ${data.clientName || 'VENTA CONTADO'}</span>
                </div>
                <div class="client-row">
                  <span class="client-label">DIRECCION</span>
                  <span class="client-value">: ${data.clientAddress || ''}</span>
                </div>
                <div class="client-row">
                  <span class="client-label">TELEFONO</span>
                  <span class="client-value">: ${data.clientPhone || ''}</span>
                </div>
                <div class="client-row">
                  <span class="client-label">ATTE</span>
                  <span class="client-value">: ${data.atte || ''}</span>
                </div>

              </div>
              <div class="right">
                <div class="client-row">
                  <span class="client-label">REFERENCIA</span>
                  <span class="client-value">: ${data.clientReference || ''}</span>
                </div>
                <div class="client-row">
                  <span class="client-label">MOVIL</span>
                  <span class="client-value">: ${data.clientMovil || ''}</span>
                </div>
              </div>
            </div>

            <div class="intro-text">
              <strong>Estimados señores:</strong><br>
              Por medio de la presente nos es grato cotizarles lo siguiente:
            </div>
          </div>

          <!-- ITEMS TABLE -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 30px;">ITM</th>
                <th style="width: 100px;">CODIGO</th>
                <th>DESCRIPCION</th>
                <th style="width: 50px;">U.M.</th>
                <th style="width: 60px;">CANT.</th>
                <th style="width: 80px;">P.UNIT.</th>
                <th style="width: 80px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- TOTALS -->
          <div class="totals-section">
            <div class="totals-row">
              <div class="item">
                <span class="label">VALOR VENTA:</span>
                <span class="value">${valorVentaStr}</span>
              </div>
              <div class="item">
                <span class="label">IGV:</span>
                <span class="value">${igvStr}</span>
              </div>
              <div class="item">
                <span class="label">TOTAL:</span>
                <span class="value">${totalOriginalStr}</span>
              </div>
            </div>
            <div class="totals-soles">
              <div class="item">
                <span>EN:</span>
                <span style="text-align: right;">SOLES</span>
              </div>
              <div class="item">
                <span>TOTAL:</span>
                <span style="text-align: right;">${totalPENStr}</span>
              </div>
            </div>
          </div>

          <!-- CONDITIONS -->
          <div class="conditions-section">
            <div class="conditions-header">
              <div class="condition-item">
                <span class="condition-label">CONDICION DE PAGO :</span>
                <span class="condition-value">${data.condicionPago || 'CONTADO'}</span>
              </div>
              <div class="condition-item total-soles">
                TOTAL: ${totalPENStr}
              </div>
            </div>
            <div class="conditions-body">
              <div class="conditions-row">
                <span class="label">Garantías</span>
                <span class="value">: 3 meses por servicio</span>
              </div>
              <div class="conditions-row">
                <span class="label">Plazo de entrega</span>
                <span class="value">: 01 día contado a partir de la aprobación de la cotización y/o recepción de la orden de compra.</span>
              </div>
              <div class="conditions-row">
                <span class="label">Forma de pago</span>
                <span class="value">: Contado contra entrega</span>
              </div>
              <div class="conditions-row">
                <span class="label">Tipo de moneda</span>
                <span class="value">: ${isUSD ? 'Los precios son expresados en Dólares Americanos' : 'Todos los precios son expresados en Soles'}</span>
              </div>
              <div class="conditions-row">
                <span class="label">Impuestos</span>
                <span class="value">: LOS PRECIOS UNITARIOS Y EL TOTAL INCLUYEN el Impuesto General a las Ventas (18%).</span>
              </div>
              <div class="conditions-row">
                <span class="label">Validez de la oferta</span>
                <span class="value">: 04 días sujeto a variación sin previo aviso.</span>
              </div>
              ${data.notes ? `
              <div class="conditions-row">
                <span class="label">Observación</span>
                <span class="value">: ${data.notes}</span>
              </div>
              ` : ''}

              <!-- PAYMENT METHODS & SIGNATURE -->
               <div class="payment-container">
                  <div class="bcp-info">
                    <div class="bcp-title">NÚMERO DE CUENTA SOLES BCP</div>
                    <div class="bcp-details">
                      <strong>${this.bankInfo.titular}</strong><br>
                      RUC: ${this.bankInfo.ruc}<br>
                      Número cuenta BCP: ${this.bankInfo.cuentaSoles}<br>
                      Código interbancario CCI: ${this.bankInfo.cciSoles}
                    </div>
                  </div>
                  
                  <div class="signature-section">
                    <img src="/firma_digital.png" class="signature-img" alt="Firma">
                    <div style="font-size: 10px; margin-top: 5px; font-weight: bold;">VENTAS</div>
                  </div>
               </div>

            </div>
          </div>

          <!-- FAREWELL -->
          <div class="farewell">
            Sin otro particular, quedamos de ustedes.
          </div>

          <!-- FOOTER -->
          <div class="footer">
            <img class="footer-brands" src="/footer-brands.png" alt="Marcas asociadas">
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
