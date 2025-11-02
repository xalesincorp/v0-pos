import { Transaction } from '@/lib/db';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Define interfaces for report data
interface SalesReportItem {
  id: string;
 productName: string;
  category: string;
  quantitySold: number;
  revenue: number;
  avgPrice: number;
}

interface SalesReportSummary {
  totalQuantity: number;
  totalRevenue: number;
  topProduct: string | null;
}

interface TransactionSummary {
  totalTransactions: number;
  totalRevenue: number;
  paidCount: number;
  unpaidCount: number;
}

interface CloseCashierSummary {
  openingBalance: number;
  totalCash: number;
  totalNonCash: number;
  totalSales: number;
  expectedCash: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  gender: 'male' | 'female' | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface CashierShift {
  id: string;
  openedBy: string;
  closedBy: string | null;
  openingBalance: number;
  closingBalance: number | null;
  actualCash: number | null;
  variance: number | null;
  totalTransactions: number;
  totalSales: number;
  totalCash: number;
  totalNonCash: number;
  openedAt: Date;
  closedAt: Date | null;
  status: 'open' | 'closed';
}

interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  includeHeaders?: boolean;
  fileName?: string;
  title?: string;
  dateRange?: { start: Date; end: Date };
}

interface ExportData {
  headers: string[];
  data: any[][];
  title?: string;
}

class ExportService {
  /**
   * Export sales report to Excel
   */
  static async exportSalesReportToExcel(
    salesItems: SalesReportItem[],
    summary: SalesReportSummary,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const exportData = this.formatSalesReportData(salesItems, summary, startDate, endDate);
    await this.exportToExcel(exportData, {
      fileName: `sales-report-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.xlsx`,
      title: `Sales Report (${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')})`
    });
  }

  /**
   * Export sales report to PDF
   */
  static async exportSalesReportToPDF(
    salesItems: SalesReportItem[],
    summary: SalesReportSummary,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const exportData = this.formatSalesReportData(salesItems, summary, startDate, endDate);
    await this.exportToPDF(exportData, {
      fileName: `sales-report-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.pdf`,
      title: `Sales Report (${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')})`
    });
  }

  /**
   * Format sales report data for export
   */
 private static formatSalesReportData(
    salesItems: SalesReportItem[],
    summary: SalesReportSummary,
    startDate: Date,
    endDate: Date
 ): ExportData {
    const headers = [
      'Product Name',
      'Category',
      'Quantity Sold',
      'Average Price',
      'Revenue'
    ];

    const data = salesItems.map(item => [
      item.productName,
      item.category,
      item.quantitySold,
      `Rp ${item.avgPrice.toLocaleString('id-ID')}`,
      `Rp ${item.revenue.toLocaleString('id-ID')}`
    ]);

    // Add summary row at the top
    const summaryHeaders = ['Summary', '', '', '', ''];
    const summaryData = [
      ['Total Items Sold', '', summary.totalQuantity, '', `Rp ${summary.totalRevenue.toLocaleString('id-ID')}`],
      ['Top Product', summary.topProduct || 'N/A', '', '', ''],
      ['', '', '', '', ''] // Empty row for spacing
    ];

    return {
      headers,
      data: [...summaryData, ...data],
      title: `Sales Report (${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')})`
    };
  }

  /**
   * Export customer list to Excel
   */
  static async exportCustomerListToExcel(customers: Customer[]): Promise<void> {
    const exportData = this.formatCustomerListData(customers);
    await this.exportToExcel(exportData, {
      fileName: `customer-list-${new Date().toISOString().split('T')[0]}.xlsx`,
      title: 'Customer List'
    });
  }

  /**
   * Export customer list to PDF
   */
  static async exportCustomerListToPDF(customers: Customer[]): Promise<void> {
    const exportData = this.formatCustomerListData(customers);
    await this.exportToPDF(exportData, {
      fileName: `customer-list-${new Date().toISOString().split('T')[0]}.pdf`,
      title: 'Customer List'
    });
 }

  /**
   * Format customer list data for export
   */
  private static formatCustomerListData(customers: Customer[]): ExportData {
    const headers = [
      'Name',
      'Phone',
      'Gender',
      'Created At'
    ];

    const data = customers.map(customer => [
      customer.name,
      customer.phone || 'N/A',
      customer.gender || 'Not specified',
      new Date(customer.createdAt).toLocaleDateString('id-ID')
    ]);

    return {
      headers,
      data,
      title: 'Customer List'
    };
  }

  /**
   * Export transaction report to Excel
   */
  static async exportTransactionReportToExcel(
    transactions: Transaction[],
    summary: TransactionSummary,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const exportData = this.formatTransactionReportData(transactions, summary, startDate, endDate);
    await this.exportToExcel(exportData, {
      fileName: `transaction-report-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.xlsx`,
      title: `Transaction Report (${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')})`
    });
  }

  /**
   * Export transaction report to PDF
   */
  static async exportTransactionReportToPDF(
    transactions: Transaction[],
    summary: TransactionSummary,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const exportData = this.formatTransactionReportData(transactions, summary, startDate, endDate);
    await this.exportToPDF(exportData, {
      fileName: `transaction-report-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.pdf`,
      title: `Transaction Report (${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')})`
    });
  }

  /**
   * Format transaction report data for export
   */
  private static formatTransactionReportData(
    transactions: Transaction[],
    summary: TransactionSummary,
    startDate: Date,
    endDate: Date
  ): ExportData {
    const headers = [
      'Transaction #',
      'Date',
      'Customer',
      'Items',
      'Total',
      'Payment Method',
      'Status'
    ];

    const data = transactions.map(transaction => [
      transaction.transactionNumber,
      new Date(transaction.createdAt).toLocaleString('id-ID'),
      transaction.customerId || 'Walk-in',
      transaction.items.length,
      `Rp ${transaction.total.toLocaleString('id-ID')}`,
      transaction.payments.map(p => p.method).join(', '),
      transaction.status
    ]);

    // Add summary row at the top
    const summaryHeaders = ['Summary', '', '', '', '', ''];
    const summaryData = [
      ['Total Transactions', '', summary.totalTransactions, '', `Rp ${summary.totalRevenue.toLocaleString('id-ID')}`, '', ''],
      ['Paid', '', summary.paidCount, '', '', '', ''],
      ['Unpaid', '', summary.unpaidCount, '', '', '', ''],
      ['', '', '', '', '', ''] // Empty row for spacing
    ];

    return {
      headers,
      data: [...summaryData, ...data],
      title: `Transaction Report (${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')})`
    };
  }

  /**
   * Export close cashier report to Excel
   */
  static async exportCloseCashierReportToExcel(
    shiftData: CashierShift,
    summary: CloseCashierSummary,
    actualCash: number
  ): Promise<void> {
    const exportData = this.formatCloseCashierReportData(shiftData, summary, actualCash);
    await this.exportToExcel(exportData, {
      fileName: `close-cashier-report-${new Date().toISOString().split('T')[0]}.xlsx`,
      title: 'Close Cashier Report'
    });
  }

  /**
   * Export close cashier report to PDF
   */
  static async exportCloseCashierReportToPDF(
    shiftData: CashierShift,
    summary: CloseCashierSummary,
    actualCash: number
  ): Promise<void> {
    const exportData = this.formatCloseCashierReportData(shiftData, summary, actualCash);
    await this.exportToPDF(exportData, {
      fileName: `close-cashier-report-${new Date().toISOString().split('T')[0]}.pdf`,
      title: 'Close Cashier Report'
    });
  }

 /**
   * Format close cashier report data for export
   */
  private static formatCloseCashierReportData(
    shiftData: CashierShift,
    summary: CloseCashierSummary,
    actualCash: number
  ): ExportData {
    const expectedCash = summary.openingBalance + summary.totalCash;
    const variance = actualCash - expectedCash;

    const headers = [
      'Report Item',
      'Amount',
      'Notes'
    ];

    const data = [
      ['Opening Balance', `Rp ${summary.openingBalance.toLocaleString('id-ID')}`, ''],
      ['Total Cash Sales', `Rp ${summary.totalCash.toLocaleString('id-ID')}`, ''],
      ['Total Non-Cash', `Rp ${summary.totalNonCash.toLocaleString('id-ID')}`, ''],
      ['Total Sales', `Rp ${summary.totalSales.toLocaleString('id-ID')}`, ''],
      ['Expected Cash', `Rp ${expectedCash.toLocaleString('id-ID')}`, ''],
      ['Actual Cash', `Rp ${actualCash.toLocaleString('id-ID')}`, ''],
      ['Variance', `Rp ${variance.toLocaleString('id-ID')}`, variance >= 0 ? 'Surplus' : 'Shortage'],
      ['Cashier', shiftData.openedBy, ''],
      ['Date', new Date(shiftData.openedAt).toLocaleDateString('id-ID'), '']
    ];

    return {
      headers,
      data,
      title: 'Close Cashier Report'
    };
  }

  /**
   * Export to Excel format
   */
  private static async exportToExcel(exportData: ExportData, options: { fileName?: string; title?: string }): Promise<void> {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Create worksheet with data
      const wsData = [exportData.headers, ...exportData.data];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Add title row if provided
      if (exportData.title) {
        const titleRow = [exportData.title];
        XLSX.utils.sheet_add_aoa(ws, [titleRow], { origin: 'A1' });
        
        // Move existing data down by one row
        const range = XLSX.utils.decode_range(ws['!ref'] || '');
        const originalRef = ws['!ref'];
        if (originalRef) {
          const newRef = XLSX.utils.encode_range(
            { s: { r: range.s.r + 1, c: range.s.c }, e: { r: range.e.r + 1, c: range.e.c } }
          );
          ws['!ref'] = newRef;
        }
      }
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      
      // Write the file
      XLSX.writeFile(wb, options.fileName || 'report.xlsx');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  /**
   * Export to PDF format
   */
  private static async exportToPDF(exportData: ExportData, options: { fileName?: string; title?: string }): Promise<void> {
    try {
      const doc = new jsPDF();
      
      // Add title
      if (exportData.title) {
        doc.setFontSize(18);
        doc.text(exportData.title, 14, 20);
      }
      
      // Add subtitle with current date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, 14, 30);
      
      // Add table
      (doc as any).autoTable({
        head: [exportData.headers],
        body: exportData.data,
        startY: exportData.title ? 35 : 20,
        styles: {
          fontSize: 8,
        },
        headStyles: {
          fillColor: [22, 163, 74], // green-60
          textColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251] // gray-50
        }
      });
      
      // Save the PDF
      doc.save(options.fileName || 'report.pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  /**
   * Export transaction data
   */
  static async exportTransactions(
    transactions: Transaction[],
    options: ExportOptions
  ): Promise<void> {
    const exportData = this.formatTransactionData(transactions, options);
    
    switch (options.format) {
      case 'excel':
        await this.exportToExcel(exportData, options);
        break;
      case 'pdf':
        await this.exportToPDF(exportData, options);
        break;
      case 'csv':
        await this.exportToCSV(exportData, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Format transaction data for export
   */
  private static formatTransactionData(transactions: Transaction[], options: ExportOptions): ExportData {
    const headers = [
      'Transaction Number',
      'Date',
      'Customer',
      'Items',
      'Subtotal',
      'Discount',
      'Tax',
      'Total',
      'Payment Method',
      'Change',
      'Cashier'
    ];

    const data = transactions.map(transaction => [
      transaction.transactionNumber,
      new Date(transaction.createdAt).toLocaleString('id-ID'),
      transaction.customerId || 'Walk-in',
      transaction.items.map(item => `${item.name} (${item.qty}x)`).join(', '),
      `Rp ${transaction.subtotal.toLocaleString('id-ID')}`,
      `Rp ${transaction.discount.amount.toLocaleString('id-ID')}`,
      `Rp ${transaction.tax.amount.toLocaleString('id-ID')}`,
      `Rp ${transaction.total.toLocaleString('id-ID')}`,
      transaction.payments.map(p => `${p.method}: Rp ${p.amount.toLocaleString('id-ID')}`).join(', '),
      `Rp ${transaction.change.toLocaleString('id-ID')}`,
      transaction.createdBy
    ]);

    return {
      headers,
      data,
      title: options.title || 'Transaction Report'
    };
  }

  /**
   * Export to CSV format
   */
  private static async exportToCSV(exportData: ExportData, options: { fileName?: string; title?: string }): Promise<void> {
    try {
      // Create CSV content
      let csvContent = '';
      
      // Add title if provided
      if (exportData.title) {
        csvContent += `"${exportData.title}"\n`;
      }
      
      // Add headers
      csvContent += exportData.headers.map(h => `"${h}"`).join(',') + '\n';
      
      // Add data rows
      for (const row of exportData.data) {
        csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
      }
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = options.fileName || 'export.csv';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  /**
   * Export data with custom structure
   */
  static async exportCustomData(
    headers: string[],
    data: any[][],
    options: ExportOptions & { title?: string }
  ): Promise<void> {
    const exportData: ExportData = {
      headers,
      data,
      title: options.title
    };

    switch (options.format) {
      case 'excel':
        await this.exportToExcel(exportData, options);
        break;
      case 'pdf':
        await this.exportToPDF(exportData, options);
        break;
      case 'csv':
        await this.exportToCSV(exportData, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }
}

export { ExportService };