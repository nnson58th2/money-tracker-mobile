// Re-export formatting functions for backwards compatibility
export { formatAmount, parseAmount } from './formatting';

export interface QRParams {
    accountNumber: string;
    bankCode: string;
    amount?: number;
    description?: string;
}

/**
 * Generate SePay QR image URL for bank transfer
 * API: https://qr.sepay.vn/img?acc={account}&bank={bank}&amount={amount}&des={description}&template=compact
 *
 * Templates:
 * - compact: QR with logos
 * - print: Full transaction information
 */
export function generateQRUrl(params: QRParams): string {
    const template = 'compact';

    // Build SePay URL with query parameters
    const queryParams: string[] = [
        `acc=${params.accountNumber}`,
        `bank=${params.bankCode}`,
        `template=${template}`
    ];

    if (params.amount && params.amount > 0) {
        queryParams.push(`amount=${params.amount}`);
    }

    if (params.description && params.description.trim()) {
        queryParams.push(`des=${encodeURIComponent(params.description.trim())}`);
    }

    const url = `https://qr.sepay.vn/img?${queryParams.join('&')}`;
    return url;
}
