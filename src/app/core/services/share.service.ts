import { Injectable } from '@angular/core';
import { ApiService, SendEmailRequest } from './api.service';
import { Observable } from 'rxjs';

export interface ShareOptions {
    phoneNumber?: string;
    email?: string;
    subject?: string;
    message: string;
    pdfUrl?: string;
    clientName?: string;
    documentType?: 'cotizacion' | 'factura' | 'informe';
    documentNumber?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ShareService {

    constructor(private apiService: ApiService) { }

    shareViaWhatsApp(options: ShareOptions): void {
        const { phoneNumber, message, pdfUrl, clientName, documentType, documentNumber } = options;

        let fullMessage = `*ECOMSERV - Documento Comercial*\n\n`;
        fullMessage += `Hola${clientName ? ` ${clientName}` : ''},\n\n`;
        fullMessage += `Le enviamos su ${documentType === 'factura' ? 'factura' : documentType === 'informe' ? 'informe técnico' : 'cotización'}`;
        fullMessage += documentNumber ? ` N° ${documentNumber}` : '';
        fullMessage += `.\n\n`;
        fullMessage += message;

        if (pdfUrl) {
            fullMessage += `\n\nLink del documento: ${pdfUrl}`;
        }

        const encodedMessage = encodeURIComponent(fullMessage);
        const cleanPhone = phoneNumber?.replace(/\D/g, '') || '';

        const whatsappUrl = cleanPhone
            ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
            : `https://wa.me/?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    }

    openMailClient(options: ShareOptions): void {
        const { email, subject, message, documentType, documentNumber, clientName } = options;

        const emailSubject = subject ||
            `${documentType === 'factura' ? 'Factura' : 'Cotización'}${documentNumber ? ` N° ${documentNumber}` : ''} - ECOMSERV`;

        let emailBody = `Estimado(a)${clientName ? ` ${clientName}` : ''},\n\n`;
        emailBody += `Adjunto encontrará su ${documentType === 'factura' ? 'factura' : 'cotización'}.\n\n`;
        emailBody += message;
        emailBody += `\n\nAtentamente,\nECOMSERV`;

        const mailtoUrl = `mailto:${email || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

        window.location.href = mailtoUrl;
    }

    sendEmail(request: SendEmailRequest & { documentType?: string }): Observable<{ success: boolean; message: string }> {
        if (request.documentType === 'informe') {
            return this.apiService.sendReportEmail({
                toEmail: request.toEmail,
                documentNumber: request.documentNumber,
                empresa: request.clientName,
                attachPdf: request.attachPdf
            });
        }
        return this.apiService.sendQuoteEmail(request);
    }

    async copyToClipboard(text: string): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Error copying to clipboard:', err);
            return false;
        }
    }
    async shareFile(blob: Blob, fileName: string, title: string, text: string): Promise<boolean> {
        if (!navigator.share) {
            console.warn('Web Share API not supported');
            return false;
        }

        const file = new File([blob], fileName, { type: 'application/pdf' });
        const data = {
            files: [file],
            title: title,
            text: text
        };

        if (navigator.canShare && navigator.canShare(data)) {
            try {
                await navigator.share(data);
                return true;
            } catch (err) {
                console.error('Error sharing file:', err);
                return false;
            }
        } else {
            console.warn('Sharing files not supported');
            return false;
        }
    }
}
