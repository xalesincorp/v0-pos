import { Transaction } from '@/lib/db';
import { settingsService } from '@/lib/services/settingsService';

// Interface for ESC/POS printer commands
interface EscPosCommand {
  command: string;
  data?: any;
}

// Receipt data structure
interface ReceiptData {
  businessName?: string;
 businessAddress?: string;
  businessPhone?: string;
  transactionNumber: string;
 transactionDate: string;
  cashierName?: string;
  customerName?: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount?: {
    type: 'percent' | 'nominal';
    value: number;
    amount: number;
  };
  tax?: {
    enabled: boolean;
    rate: number;
    amount: number;
  };
  total: number;
  payments: Array<{
    method: string;
    amount: number;
  }>;
  change: number;
 customMessage?: string;
  showBarcode?: boolean;
}

class PrintingService {
  /**
   * Generate ESC/POS commands for a receipt
   */
 generateReceiptCommands(receiptData: ReceiptData, settings: any): EscPosCommand[] {
    const commands: EscPosCommand[] = [];

    // Initialize printer
    commands.push({ command: 'INIT' });

    // Business info (if enabled in settings)
    if (settings.showLogo) {
      commands.push({ command: 'LOGO' });
    }

    if (settings.showBusinessName && receiptData.businessName) {
      commands.push({ command: 'TEXT', data: { text: receiptData.businessName, bold: true, align: 'center' } });
    }

    if (settings.showAddress && receiptData.businessAddress) {
      commands.push({ command: 'TEXT', data: { text: receiptData.businessAddress, align: 'center' } });
    }

    if (settings.showPhone && receiptData.businessPhone) {
      commands.push({ command: 'TEXT', data: { text: `Telp: ${receiptData.businessPhone}`, align: 'center' } });
    }

    // Add spacing
    commands.push({ command: 'SPACING', data: { lines: 1 } });

    // Transaction header
    commands.push({ command: 'TEXT', data: { text: `No. Transaksi: ${receiptData.transactionNumber}`, align: 'left' } });
    commands.push({ command: 'TEXT', data: { text: `Tanggal: ${receiptData.transactionDate}`, align: 'left' } });

    if (settings.showCashierName) {
      commands.push({ command: 'TEXT', data: { text: `Kasir: ${receiptData.cashierName || 'N/A'}`, align: 'left' } });
    }

    if (receiptData.customerName) {
      commands.push({ command: 'TEXT', data: { text: `Pelanggan: ${receiptData.customerName}`, align: 'left' } });
    }

    // Add spacing
    commands.push({ command: 'SPACING', data: { lines: 1 } });

    // Items header (if enabled)
    if (settings.showItemList) {
      commands.push({ command: 'TEXT', data: { text: 'Item', align: 'left', bold: true } });
      commands.push({ command: 'LINE' }); // Draw line
      
      // Add items
      for (const item of receiptData.items) {
        // Item name and quantity
        commands.push({ command: 'TEXT', data: { text: `${item.name} (${item.qty}x)`, align: 'left' } });
        // Item price
        commands.push({ command: 'TEXT', data: { text: `Rp ${item.subtotal.toLocaleString('id-ID')}`, align: 'right' } });
      }
      
      commands.push({ command: 'LINE' }); // Draw line
    }

    // Subtotal (if enabled)
    if (settings.showSubtotal) {
      commands.push({ command: 'TEXT', data: { text: `Subtotal: Rp ${receiptData.subtotal.toLocaleString('id-ID')}`, align: 'right' } });
    }

    // Discount (if enabled and exists)
    if (settings.showDiscount && receiptData.discount) {
      const discountText = receiptData.discount.type === 'percent' 
        ? `Diskon (${receiptData.discount.value}%):` 
        : 'Diskon:';
      commands.push({ command: 'TEXT', data: { text: `${discountText} -Rp ${receiptData.discount.amount.toLocaleString('id-ID')}`, align: 'right' } });
    }

    // Tax (if enabled and exists)
    if (settings.showTax && receiptData.tax && receiptData.tax.enabled) {
      commands.push({ command: 'TEXT', data: { text: `Pajak (${receiptData.tax.rate}%): Rp ${receiptData.tax.amount.toLocaleString('id-ID')}`, align: 'right' } });
    }

    // Total (if enabled)
    if (settings.showTotal) {
      commands.push({ command: 'TEXT', data: { text: `TOTAL: Rp ${receiptData.total.toLocaleString('id-ID')}`, align: 'right', bold: true } });
    }

    // Add spacing
    commands.push({ command: 'SPACING', data: { lines: 1 } });

    // Payment info (if enabled)
    if (settings.showPaymentMethod) {
      for (const payment of receiptData.payments) {
        commands.push({ command: 'TEXT', data: { text: `${payment.method}: Rp ${payment.amount.toLocaleString('id-ID')}`, align: 'right' } });
      }
    }

    // Change (if enabled)
    if (settings.showChange && receiptData.change > 0) {
      commands.push({ command: 'TEXT', data: { text: `Kembalian: Rp ${receiptData.change.toLocaleString('id-ID')}`, align: 'right' } });
    }

    // Add spacing
    commands.push({ command: 'SPACING', data: { lines: 1 } });

    // Custom message (if enabled)
    if (settings.customMessage) {
      commands.push({ command: 'TEXT', data: { text: settings.customMessage, align: 'center', bold: true } });
    }

    // Barcode/QR (if enabled)
    if (settings.showBarcode) {
      commands.push({ command: 'BARCODE', data: { text: receiptData.transactionNumber } });
    }

    // Cut paper
    commands.push({ command: 'CUT' });

    return commands;
  }

  /**
   * Print a transaction receipt
   */
  async printTransactionReceipt(transaction: Transaction): Promise<void> {
    try {
      // Get receipt settings from the new settings service
      const receiptSettings = await settingsService.getSettings('receipt');

      if (!receiptSettings) {
        throw new Error('Receipt settings not found');
      }

      // Format transaction data for receipt
      const receiptData: ReceiptData = {
        transactionNumber: transaction.transactionNumber,
        transactionDate: new Date(transaction.createdAt).toLocaleString('id-ID'),
        cashierName: transaction.createdBy, // This would be the cashier's name in a real implementation
        items: transaction.items.map(item => ({
          name: item.name,
          qty: item.qty,
          price: item.price,
          subtotal: item.subtotal
        })),
        subtotal: transaction.subtotal,
        discount: transaction.discount,
        tax: transaction.tax,
        total: transaction.total,
        payments: transaction.payments.map(payment => ({
          method: payment.method,
          amount: payment.amount
        })),
        change: transaction.change,
        customMessage: receiptSettings.customMessage,
        showBarcode: receiptSettings.showBarcode,
      };

      // Generate ESC/POS commands
      const commands = this.generateReceiptCommands(receiptData, receiptSettings);

      // Send commands to printer (this is a simplified implementation)
      await this.sendToPrinter(commands);
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw error;
    }
  }

  /**
   * Send commands to printer (simplified implementation)
   */
  async sendToPrinter(commands: EscPosCommand[]): Promise<void> {
    // In a real implementation, this would communicate with the actual printer
    // For now, we'll just log the commands
    console.log('Sending commands to printer:', commands);

    // Simulate printer operation
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Receipt printed successfully');
        resolve();
      }, 1000);
    });
  }

  /**
   * Check if printer is available
   */
  async isPrinterAvailable(): Promise<boolean> {
    // In a real implementation, this would check actual printer connection
    // For now, return true to simulate availability
    return true;
  }

  /**
   * Get available printers
   */
 async getAvailablePrinters(): Promise<string[]> {
    // In a real implementation, this would enumerate available printers
    // For now, return a mock list
    return ['Default Printer', 'Kitchen Printer', 'Main Receipt Printer'];
  }

  /**
   * Print test page
   */
  async printTestPage(): Promise<void> {
    try {
      const testCommands: EscPosCommand[] = [
        { command: 'INIT' },
        { command: 'TEXT', data: { text: 'TEST RECEIPT', bold: true, align: 'center' } },
        { command: 'LINE' },
        { command: 'TEXT', data: { text: 'This is a test print', align: 'center' } },
        { command: 'TEXT', data: { text: new Date().toLocaleString(), align: 'center' } },
        { command: 'LINE' },
        { command: 'CUT' }
      ];

      await this.sendToPrinter(testCommands);
    } catch (error) {
      console.error('Error printing test page:', error);
      throw error;
    }
  }
}

export const printingService = new PrintingService();