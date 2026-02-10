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

export interface ReportData {
  documentNumber: string;
  documentDate: Date;
  tipoHardware: string;
  tipoServicio: string;
  marca: string;
  modelo: string;
  serialNumber: string;
  realizadoPor: string;
  empresa: string;
  area: string;
  sede: string;
  numeroOrden: string;
  problemaReportado: string;
  pruebasRealizadas: string[];
  conclusiones: string[];
  recomendaciones: string[];
  observaciones: string;
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

  clientEmail: string;
  clientReference?: string;
  clientMobile?: string;
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

  // Base URL for resolving image paths in blob URL iframes
  private get baseUrl(): string {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }

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
        }
      },
      error: () => {
        // Fallback silencioso al valor por defecto
      }
    });
  }

  calculateItemSubtotal(quantity: number, unitPrice: number): number {
    return Math.round(quantity * unitPrice * 10000) / 10000;
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
    return 'CES-XXXXX';
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

      clientEmail: '',
      clientReference: '',
      clientMobile: '',
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
        <td style="padding: 10px 8px; font-size: 11px;">${(item.description || '').replace(/\n/g, '<br/>')}</td>
        <td style="text-align: center;">${item.unidadMedida || 'UND'}</td>
        <td style="text-align: center;">${this.formatNumber(item.quantity)}</td>
        <td style="text-align: right;">${this.formatNumber(item.unitPrice)}</td>
        <td style="text-align: right; font-weight: 500;">${this.formatNumber(item.subtotal)}</td>
      </tr>
    `).join('');

    // Calcular valores
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

    let igvUSD, totalUSD;
    let totalPEN;

    if (isUSD) {
      // Data is already in USD
      igvUSD = igv;
      totalUSD = data.total;

      // Convert to PEN
      totalPEN = data.total * rate;
    } else {
      // Data is in PEN
      // Calculate USD equivalents for the Top Section
      igvUSD = igv / rate;
      totalUSD = data.total / rate;

      // Bottom section is the original PEN values
      totalPEN = data.total;
    }

    // Totals in USD (Top Section)
    const igvStr = `${symbolUSD} ${this.formatNumber(igvUSD)}`;
    const totalOriginalStr = `${symbolUSD} ${this.formatNumber(totalUSD)}`;

    // Total in Soles (Bottom Section)
    const totalPENStr = `${symbolPEN} ${this.formatNumber(totalPEN)}`;

    // Subtotal e IGV formateados para mostrar
    const subtotalPEN = isUSD ? data.subtotal * rate : data.subtotal;
    const igvPEN = isUSD ? igv * rate : igv;
    const subtotalFormattedStr = `${symbolPEN} ${this.formatNumber(subtotalPEN)}`;
    const igvFormattedStr = `${symbolPEN} ${this.formatNumber(igvPEN)}`;

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
          .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 3px solid #1e3a8a;
            margin-bottom: 15px;
          }

          .header-table td {
             vertical-align: top;
             padding-bottom: 15px;
          }

          .logo-section img {
            max-width: 280px;
            height: auto;
          }

          .company-info {
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

          .client-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }

          .client-table td {
            vertical-align: top;
            padding: 2px 0;
          }

          .client-label {
            width: 90px;
            font-weight: bold;
            color: #1e3a8a;
            display: inline-block;
          }

          .client-value {
             /* just text */
          }

          .intro-text {
            margin: 15px 0;
            font-size: 12px;
          }

          /* ===== ITEMS TABLE ===== */
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
            border-bottom: 2px solid #1e3a8a;
          }

          .items-table tbody td {
            font-size: 11px;
            color: #000;
            padding: 8px 6px;
            border: none;
          }

          /* ===== TOTALS ===== */
          .totals-section {
            width: 100%;
            margin-top: 0;
            border: 2px solid #1e3a8a; 
            border-top: none;
          }

          .totals-table {
            width: 100%;
            border-collapse: collapse;
          }

          .totals-table td {
            padding: 8px 12px;
            font-size: 12px;
          }

          .totals-label {
            font-weight: bold;
            color: #1e3a8a;
            text-align: right;
          }

          .totals-value {
            font-weight: bold;
            text-align: right;
            width: 120px;
          }
          
          .totals-row-bg {
             background-color: #ffffff;
          }

          .totals-soles-bg {
            background: #1e3a8a;
            color: white;
          }
          
          .totals-soles-bg .totals-label, 
          .totals-soles-bg .totals-value {
             color: white;
             font-size: 13px;
          }

          /* ===== CONDITIONS ===== */
          .conditions-container {
             border: 2px solid #1e3a8a;
             margin-top: 8px;
          }

          .conditions-header-table {
            width: 100%;
            background: #ffffff;
            border-bottom: 1px solid #1e3a8a;
            border-collapse: collapse;
          }
          
          .conditions-header-table td {
             padding: 12px 15px;
             font-size: 13px;
             vertical-align: middle;
          }

          .condition-label-big {
            font-weight: bold;
            color: #1e3a8a;
          }
          .condition-value-big {
            color: #c00;
            font-weight: bold;
          }
          
          .condition-total-big {
            font-weight: bold;
            color: #c00;
            font-size: 14px;
            text-align: right;
          }

          .conditions-body-table {
            width: 100%;
            border-collapse: collapse;
            background: #ffffff;
          }

          .conditions-body-table td {
            padding: 4px 10px;
            font-size: 12px;
            vertical-align: top;
          }

          .condition-row-label {
            width: 130px;
            font-weight: bold;
            color: #1e3a8a;
          }

          /* ===== PAYMENT & SIGNATURE ===== */
          .payment-signature-table {
             width: 100%;
             margin-top: 15px;
             border-collapse: collapse;
          }
          
          .payment-signature-table td {
             vertical-align: top;
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
          
          .signature-img {
              max-width: 180px;
              max-height: 100px;

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
            text-align: center;
          }

          .footer-brands {
            max-width: 100%;
            max-height: 80px;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <!-- HEADER -->
          <table class="header-table">
            <tr>
              <td class="logo-section" style="width: 250px;">
                <img src="${this.baseUrl}/logo-ecomserv.png" alt="ECOMSERV">
              </td>
              <td class="company-info">
                 <div class="quote-title">COTIZACIÓN: <span class="quote-number">${data.documentNumber}</span></div>
                 <div class="company-details">
                   <div class="ruc">RUC: ${data.companyRuc}</div>
                   <div>${data.companyAddress}</div>
                   <div>Telf: ${data.companyPhone}</div>
                 </div>
              </td>
            </tr>
          </table>

          <!-- CLIENT INFO -->
          <div class="client-section">
            <table class="client-table">
              <tr>
                <td style="width: 50%;">
                   <table style="width: 100%;">
                     <tr>
                        <td class="client-label">FECHA</td>
                        <td class="client-value">: ${formatDate(data.documentDate)}</td>
                     </tr>
                     <tr>
                        <td class="client-label">SEÑOR</td>
                        <td class="client-value">: ${data.clientName || 'VENTA CONTADO'}</td>
                     </tr>
                     <tr>
                        <td class="client-label">DIRECCION</td>
                        <td class="client-value">: ${data.clientAddress || ''}</td>
                     </tr>
                     <tr>
                        <td class="client-label">TELEFONO</td>
                        <td class="client-value">: ${data.clientMobile || ''}</td>
                     </tr>
                     <tr>
                        <td class="client-label">ATTE</td>
                        <td class="client-value">: ${data.atte || ''}</td>
                     </tr>
                   </table>
                </td>
                <td style="width: 50%;">
                   <table style="width: 100%;">
                      <tr>
                        <td class="client-label">REFERENCIA</td>
                        <td class="client-value">: ${data.clientReference || ''}</td>
                      </tr>
                      <tr>
                        <td class="client-label">RUC</td>
                        <td class="client-value">: ${data.clientRuc || ''}</td>
                      </tr>
                   </table>
                </td>
              </tr>
            </table>

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
             <table class="totals-table">
                <!-- Subtotal -->
                <tr class="totals-row-bg">
                   <td colspan="3"></td>
                   <td class="totals-label">Subtotal</td>
                   <td class="totals-value">${subtotalFormattedStr}</td>
                </tr>
                <!-- IGV -->
                <tr class="totals-row-bg">
                   <td colspan="3"></td>
                   <td class="totals-label">IGV (18%)</td>
                   <td class="totals-value">${igvFormattedStr}</td>
                </tr>
                <!-- Total -->
                <tr class="totals-soles-bg">
                   <td style="text-align: right;">EN:</td>
                   <td colspan="2" style="text-align: right; width: auto; font-weight: bold;">SOLES</td>
                   <td class="totals-label" style="width: 100px;">TOTAL:</td>
                   <td class="totals-value">${totalPENStr}</td>
                </tr>
             </table>
          </div>

          <!-- CONDITIONS -->
          <div class="conditions-container">
             <table class="conditions-body-table">
                <tr><td style="height: 5px;"></td><td style="height: 5px;"></td></tr>
                <tr>
                   <td class="condition-row-label">Garantías</td>
                   <td>: 3 meses por servicio</td>
                </tr>
                <tr>
                   <td class="condition-row-label">Plazo de entrega</td>
                   <td>: 01 día contado a partir de la aprobación de la cotización y/o recepción de la orden de compra.</td>
                </tr>
                <tr>
                   <td class="condition-row-label">Forma de pago</td>
                   <td>: Contado contra entrega</td>
                </tr>
                <tr>
                   <td class="condition-row-label">Tipo de moneda</td>
                   <td>: ${isUSD ? 'Los precios son expresados en Dólares Americanos' : 'Todos los precios son expresados en Soles'}</td>
                </tr>
                <tr>
                   <td class="condition-row-label">Impuestos</td>
                   <td>: LOS PRECIOS UNITARIOS Y EL TOTAL INCLUYEN el Impuesto General a las Ventas (18%).</td>
                </tr>
                <tr>
                   <td class="condition-row-label">Validez de la oferta</td>
                   <td>: 04 días sujeto a variación sin previo aviso.</td>
                </tr>
                 ${data.notes ? `
                <tr>
                   <td class="condition-row-label">Observación</td>
                   <td>: ${data.notes}</td>
                </tr>
                 ` : ''}
                 <tr><td style="height: 5px;"></td><td style="height: 5px;"></td></tr>
             </table>
             
             <!-- PAYMENT & SIGNATURE (Inside conditions border or just below? 
                  Previous CSS had it inside a container with border? 
                  Looking at previous CSS "payment-container" was inside "conditions-body".
                  So I should probably keep it inside the conditions structure or just append it below but inside the main container if I want the border.
                  Wait, "conditions-section" had the border. "payment-container" was INSIDE "conditions-body".
                  I'll put it inside the conditions-container but maybe as a separate table or row.
                  Let's just put it as a new table inside the container but after the conditions-body-table.
                  Actually, the user wants "payment/signature" layout. 
                  Let's add it to the bottom of the conditions container or just inside the main page container?
                  Original: inside "conditions-body".
                  Okay, I'll add a row to "conditions-body-table" or just make a new table inside the border.
                  I'll use a new table inside the conditions container to separate logic easier.
             -->
             <table class="payment-signature-table" style="background: #ffffff; padding: 10px;">
                <tr>
                   <td style="padding: 10px;">
                     <div class="bcp-title">NÚMERO DE CUENTA SOLES BCP</div>
                     <div class="bcp-details">
                       <strong>${this.bankInfo.titular}</strong><br>
                       RUC: ${this.bankInfo.ruc}<br>
                       Número cuenta BCP: ${this.bankInfo.cuentaSoles}<br>
                       Código interbancario CCI: ${this.bankInfo.cciSoles}
                     </div>
                   </td>
                   <td style="text-align: center; vertical-align: bottom; padding: 10px;">
                     <img src="${this.baseUrl}/firma_digital.png" class="signature-img" alt="Firma">
                   </td>
                </tr>
             </table>
          </div>

          <!-- FAREWELL -->
          <div class="farewell">
            Sin otro particular, quedamos de ustedes.
          </div>

          <!-- FOOTER -->
          <div class="footer">
            <img class="footer-brands" src="${this.baseUrl}/footer-brands.png" alt="Marcas asociadas">
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ==================== REPORT (Informe Técnico) HTML ====================

  createNewReport(): ReportData {
    return {
      documentNumber: 'IT-XXXXX',
      documentDate: new Date(),
      tipoHardware: '',
      tipoServicio: '',
      marca: '',
      modelo: '',
      serialNumber: '',
      realizadoPor: '',
      empresa: '',
      area: '',
      sede: '',
      numeroOrden: '',
      problemaReportado: '',
      pruebasRealizadas: [''],
      conclusiones: [''],
      recomendaciones: [''],
      observaciones: ''
    };
  }

  generateReportPdfHtml(data: ReportData): string {
    const formatDate = (date: Date) => {
      const d = new Date(date);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const pruebasHtml = (data.pruebasRealizadas || []).filter(p => p.trim()).map(p =>
      `<li>${p}</li>`
    ).join('');

    const conclusionesHtml = (data.conclusiones || []).filter(c => c.trim()).map(c =>
      `<li>${c}</li>`
    ).join('');

    const recomendacionesHtml = (data.recomendaciones || []).filter(r => r.trim()).map(r =>
      `<li>${r}</li>`
    ).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Informe Técnico ${data.documentNumber} - ECOMSERV</title>
        <style>
          @media print {
            @page { margin: 3mm; size: A4; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #000;
            line-height: 1.2; background: #fff; padding: 12px; margin: 0;
          }
          .page-container { width: 100%; max-width: 210mm; margin: 0 auto; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
          .header-table td { vertical-align: middle; padding: 0; }
          .header-top-bar { background: #1e3a8a; height: 3px; width: 100%; margin-bottom: 4px; border-radius: 2px; }
          .logo-cell { width: 170px; text-align: left; padding-right: 8px; }
          .logo-img { width: 160px; height: auto; display: block; }
          .center-cell { text-align: center; vertical-align: middle; }
          .brands-cell { width: 260px; text-align: right; padding-left: 8px; }
          .brands-header-img { width: 250px; height: auto; display: block; margin-left: auto; }
          .company-subinfo { font-size: 8px; color: #333; margin-top: 1px; }
          .date-section { text-align: right; font-size: 10px; margin-bottom: 4px; }
          .report-title { text-align: center; font-size: 16px; font-weight: bold; text-decoration: underline; margin: 4px 0 3px; }
          .report-number { text-align: center; font-size: 11px; font-weight: bold; color: #1e3a8a; background: #e8f0fe; padding: 2px 10px; display: inline-block; }
          .title-center { text-align: center; margin-bottom: 6px; }
          .section-header { font-size: 11px; font-weight: bold; margin: 5px 0 3px; }
          .section-number { display: inline-block; width: 26px; font-weight: bold; }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; border: 1px solid #000; table-layout: fixed; }
          .data-table td { border: 1px solid #000; padding: 2px 5px; font-size: 10px; vertical-align: top; word-break: break-word; overflow-wrap: break-word; }
          .data-label { font-weight: bold; font-size: 9px; color: #333; width: 18%; background: #f5f5f5; }
          .data-value { font-weight: bold; font-size: 10px; width: 32%; }
          .diag-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; border: 1px solid #000; table-layout: fixed; }
          .diag-table td { border: 1px solid #000; padding: 2px 5px; font-size: 10px; vertical-align: top; word-break: break-word; overflow-wrap: break-word; }
          .diag-label { font-weight: bold; font-size: 9px; background: #f5f5f5; width: 30%; }
          .diag-sublabel { font-weight: bold; font-size: 9px; background: #f5f5f5; }
          .bullet-list { margin: 2px 0; padding-left: 16px; }
          .bullet-list li { margin-bottom: 1px; font-size: 10px; line-height: 1.3; }
          .results-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; border: 1px solid #000; table-layout: fixed; }
          .results-table td { border: 1px solid #000; padding: 2px 5px; font-size: 10px; vertical-align: top; word-break: break-word; overflow-wrap: break-word; }
          .results-label { font-weight: bold; font-size: 9px; background: #f5f5f5; width: 15%; }
          .results-sublabel { font-weight: bold; font-size: 9px; width: 20%; }
          .obs-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; border: 1px solid #000; table-layout: fixed; }
          .obs-table td { border: 1px solid #000; padding: 2px 5px; font-size: 10px; vertical-align: top; word-break: break-word; overflow-wrap: break-word; }
          .obs-label { font-weight: bold; font-size: 9px; background: #f5f5f5; width: 15%; }
          .obs-sublabel { font-weight: bold; font-size: 9px; width: 20%; }
          .signature-section { margin-top: 10px; text-align: center; }
          .signature-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
          .signature-table td { padding: 2px; text-align: center; vertical-align: bottom; }
          .signature-name { font-weight: bold; font-size: 11px; margin-top: 2px; }
          .signature-line { border-bottom: 1px solid #000; width: 180px; margin: 0 auto; height: 25px; }
          .signature-role { font-size: 10px; font-weight: bold; margin-top: 2px; border-top: 1px solid #000; display: inline-block; padding-top: 2px; min-width: 140px; }
          .signature-img { max-width: 120px; max-height: 45px; }
        </style>
      </head>
      <body>
        <div class="page-container">
          <!-- HEADER -->
          <div class="header-top-bar"></div>
          <table class="header-table">
            <tr>
              <td class="logo-cell">
                <img src="${this.baseUrl}/logo-ecomserv.png" alt="ECOMSERV" class="logo-img" />
                <div class="company-subinfo">
                  <div>${this.defaultCompanyInfo.companyAddress}</div>
                  <div>${this.defaultCompanyInfo.companyPhone} . ${this.defaultCompanyInfo.companyEmail}</div>
                </div>
              </td>
              <td class="center-cell">
              </td>
              <td class="brands-cell">
                <img src="${this.baseUrl}/footer-brands.png" class="brands-header-img" alt="Marcas" />
              </td>
            </tr>
          </table>
          <div style="border-bottom: 1px solid #cbd5e1; margin: 3px 0 4px;"></div>

          <div class="date-section"><strong>Fecha: </strong>${formatDate(data.documentDate)}</div>

          <div class="report-title">INFORME TECNICO</div>
          <div class="title-center"><span class="report-number">${data.documentNumber}</span></div>

          <!-- I. DATOS GENERALES -->
          <div class="section-header"><span class="section-number">I.</span> Datos Generales</div>
          <table class="data-table">
            <tr>
              <td class="data-label">I.1. Tipo Hardware</td>
              <td class="data-value">${data.tipoHardware || ''}</td>
              <td class="data-label">I.7. EMPRESA</td>
              <td class="data-value">${data.empresa || ''}</td>
            </tr>
            <tr>
              <td class="data-label">I.2. Tipo de Servicio</td>
              <td class="data-value">${data.tipoServicio || ''}</td>
              <td class="data-label">I.8. Área</td>
              <td class="data-value">${data.area || ''}</td>
            </tr>
            <tr>
              <td class="data-label">I.3. Marca</td>
              <td class="data-value">${data.marca || ''}</td>
              <td class="data-label">I.9. Sede</td>
              <td class="data-value">${data.sede || ''}</td>
            </tr>
            <tr>
              <td class="data-label">I.4. Modelo</td>
              <td class="data-value">${data.modelo || ''}</td>
              <td class="data-label">I.10. N° de Orden</td>
              <td class="data-value">${data.numeroOrden || ''}</td>
            </tr>
            <tr>
              <td class="data-label">I.5. S/N</td>
              <td class="data-value" colspan="3">${data.serialNumber || ''}</td>
            </tr>
            <tr>
              <td class="data-label">I.6. Realizado por</td>
              <td class="data-value" colspan="3">${data.realizadoPor || ''}</td>
            </tr>
          </table>

          <!-- II. DIAGNOSTICO -->
          <div class="section-header"><span class="section-number">II.</span> Diagnostico</div>
          <table class="diag-table">
            <tr>
              <td class="diag-label">II.1. Problema Reportado</td>
              <td class="data-value">${data.problemaReportado || ''}</td>
            </tr>
            <tr><td class="diag-sublabel" colspan="2">II.2. Pruebas Realizadas</td></tr>
            <tr><td colspan="2"><ul class="bullet-list">${pruebasHtml || '<li></li>'}</ul></td></tr>
          </table>

          <!-- III. RESULTADOS -->
          <div class="section-header"><span class="section-number">III.</span> Resultados</div>
          <table class="results-table">
            <tr><td class="results-label" rowspan="2">III.1.</td><td class="results-sublabel">Conclusiones</td></tr>
            <tr><td><ul class="bullet-list">${conclusionesHtml || '<li></li>'}</ul></td></tr>
            <tr><td class="results-label" rowspan="2">III.2.</td><td class="results-sublabel">Recomendaciones</td></tr>
            <tr><td><ul class="bullet-list">${recomendacionesHtml || '<li></li>'}</ul></td></tr>
          </table>

          <!-- IV. OBSERVACIONES -->
          <div class="section-header"><span class="section-number">IV.</span> Observaciones</div>
          <table class="obs-table">
            <tr><td class="obs-label">IV.1.</td><td class="obs-sublabel">Otros</td></tr>
            <tr><td colspan="2" style="min-height: 40px; padding: 8px;">${data.observaciones || ''}</td></tr>
          </table>

          <!-- SIGNATURES -->
          <div class="signature-section">
            <table class="signature-table">
              <tr>
                <td style="width: 50%;">
                  <div class="signature-name">EDWIN CASTILLO FERNANDEZ</div>
                  <div class="signature-role">VoBo Técnico</div>
                </td>
                <td style="width: 50%; text-align: center;">
                  <div style="text-align: center;">
                    <img src="${this.baseUrl}/firma_informe.png" class="signature-img" alt="Firma">
                  </div>
                  <div class="signature-role">VoBo Supervisor</div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
