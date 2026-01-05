import { Injectable } from '@angular/core';

export interface ShareOptions {
    phoneNumber?: string;
    email?: string;
    subject?: string;
    message: string;
    pdfUrl?: string;
    clientName?: string;
    documentType?: 'cotizacion' | 'factura';
    documentNumber?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ShareService {

    shareViaWhatsApp(options: ShareOptions): void {
        const { phoneNumber, message, pdfUrl, clientName, documentType, documentNumber } = options;

        let fullMessage = `*ECOMSERV - Documento Comercial*\n\n`;
        fullMessage += `Hola${clientName ? ` ${clientName}` : ''},\n\n`;
        fullMessage += `Le enviamos su ${documentType === 'factura' ? 'factura' : 'cotización'}`;
        fullMessage += documentNumber ? ` N° ${documentNumber}` : '';
        fullMessage += `.\n\nt`;
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

    shareViaEmail(options: ShareOptions): void {
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

    async copyToClipboard(text: string): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Error copying to clipboard:', err);
            return false;
        }
    }
}
