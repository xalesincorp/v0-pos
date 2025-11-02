import { db, Transaction, Customer, Product } from '../db';
import { CustomerService } from './customerService';
import { TransactionService } from './transactionService';
import { CashierShiftService } from './cashierShiftService';

export class ReportService {
  // Get transaction report data
  static async getTransactionReport(
    dateFrom: Date, 
    dateTo: Date, 
    status?: 'paid' | 'unpaid' | 'saved',
    customerId?: string
  ): Promise<{
    transactions: Transaction[];
    summary: {
      totalTransactions: number;
      totalRevenue: number;
      paidCount: number;
      unpaidCount: number;
    };
  }> {
    try {
      // Get transactions within date range
      let transactions = await db.transactions
        .filter(tx => {
          const txDate = new Date(tx.createdAt);
          const isWithinDateRange = txDate >= dateFrom && txDate <= dateTo;
          
          let statusMatch = true;
          if (status) {
            statusMatch = tx.status === status;
          }
          
          let customerMatch = true;
          if (customerId) {
            customerMatch = tx.customerId === customerId;
          }
          
          return isWithinDateRange && statusMatch && customerMatch;
        })
        .toArray();

      // Calculate summary
      const totalTransactions = transactions.length;
      const totalRevenue = transactions.reduce((sum, tx) => sum + tx.total, 0);
      const paidCount = transactions.filter(tx => tx.status === 'paid').length;
      const unpaidCount = transactions.filter(tx => tx.status === 'unpaid').length;

      return {
        transactions,
        summary: {
          totalTransactions,
          totalRevenue,
          paidCount,
          unpaidCount
        }
      };
    } catch (error) {
      throw new Error(`Failed to get transaction report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get sales report data
 static async getSalesReport(
    dateFrom: Date,
    dateTo: Date,
    productId?: string
  ): Promise<{
    salesItems: Array<{
      id: string;
      productName: string;
      category: string;
      quantitySold: number;
      revenue: number;
      avgPrice: number;
    }>;
    summary: {
      totalQuantity: number;
      totalRevenue: number;
      topProduct: string | null;
    };
  }> {
    try {
      // Get paid transactions within date range
      const transactions = await db.transactions
        .filter(tx => {
          const txDate = new Date(tx.createdAt);
          return txDate >= dateFrom && txDate <= dateTo && tx.status === 'paid';
        })
        .toArray();

      // Aggregate sales by product
      const salesMap = new Map<string, {
        productName: string;
        category: string;
        quantitySold: number;
        revenue: number;
        transactions: number;
      }>();

      for (const transaction of transactions) {
        for (const item of transaction.items) {
          if (productId && item.productId !== productId) continue;

          const existing = salesMap.get(item.productId);
          const product = await db.products.get(item.productId);
          
          if (existing) {
            existing.quantitySold += item.qty;
            existing.revenue += item.subtotal;
            existing.transactions += 1;
          } else {
            salesMap.set(item.productId, {
              productName: product?.name || 'Unknown Product',
              category: product?.categoryId || 'Uncategorized',
              quantitySold: item.qty,
              revenue: item.subtotal,
              transactions: 1
            });
          }
        }
      }

      // Convert to array and calculate avg price
      const salesItems = Array.from(salesMap.entries()).map(([productId, data]) => ({
        id: productId,
        productName: data.productName,
        category: data.category,
        quantitySold: data.quantitySold,
        revenue: data.revenue,
        avgPrice: data.quantitySold > 0 ? data.revenue / data.quantitySold : 0
      }));

      // Calculate summary
      const totalQuantity = salesItems.reduce((sum, item) => sum + item.quantitySold, 0);
      const totalRevenue = salesItems.reduce((sum, item) => sum + item.revenue, 0);
      const topProduct = salesItems.length > 0
        ? salesItems.reduce((max, item) => (item.revenue > max.revenue ? item : max)).productName
        : null;

      return {
        salesItems,
        summary: {
          totalQuantity,
          totalRevenue,
          topProduct
        }
      };
    } catch (error) {
      throw new Error(`Failed to get sales report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get close cashier report data
  static async getCloseCashierReport(
    shiftId: string
  ): Promise<{
    shift: any; // CashierShift type
    summary: {
      openingBalance: number;
      totalCash: number;
      totalNonCash: number;
      totalSales: number;
      expectedCash: number;
    };
  }> {
    try {
      const shiftReport = await CashierShiftService.getShiftReport(shiftId);
      
      if (!shiftReport) {
        throw new Error('Shift not found');
      }

      const { shift, stats } = shiftReport;

      return {
        shift,
        summary: {
          openingBalance: shift.openingBalance,
          totalCash: stats.totalCash,
          totalNonCash: stats.totalNonCash,
          totalSales: stats.totalSales,
          expectedCash: shift.openingBalance + stats.totalCash
        }
      };
    } catch (error) {
      throw new Error(`Failed to get close cashier report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get customer transaction history
  static async getCustomerTransactionHistory(
    customerId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<Transaction[]> {
    try {
      let transactions = await db.transactions
        .filter(tx => tx.customerId === customerId)
        .toArray();

      // Apply date filters if provided
      if (dateFrom) {
        transactions = transactions.filter(tx => new Date(tx.createdAt) >= dateFrom);
      }
      if (dateTo) {
        transactions = transactions.filter(tx => new Date(tx.createdAt) <= dateTo);
      }

      // Sort by date descending
      return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      throw new Error(`Failed to get customer transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get customer statistics
 static async getCustomerStats(
    customerId: string
  ): Promise<{
    totalTransactions: number;
    totalSpent: number;
    lastTransaction: Date | null;
    avgTransactionValue: number;
  }> {
    try {
      const stats = await CustomerService.getCustomerStats(customerId);
      
      const transactions = await db.transactions
        .filter(tx => tx.customerId === customerId && tx.status === 'paid')
        .toArray();
      
      const avgTransactionValue = transactions.length > 0 
        ? stats.totalSpent / transactions.length 
        : 0;

      return {
        totalTransactions: stats.totalTransactions,
        totalSpent: stats.totalSpent,
        lastTransaction: stats.lastTransaction,
        avgTransactionValue
      };
    } catch (error) {
      throw new Error(`Failed to get customer stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get daily sales summary
  static async getDailySalesSummary(
    dateFrom: Date,
    dateTo: Date
  ): Promise<Array<{
    date: string;
    totalSales: number;
    transactionCount: number;
  }>> {
    try {
      const transactions = await db.transactions
        .filter(tx => {
          const txDate = new Date(tx.createdAt);
          return txDate >= dateFrom && txDate <= dateTo && tx.status === 'paid';
        })
        .toArray();

      // Group by date
      const dailySales = new Map<string, {
        totalSales: number;
        transactionCount: number;
      }>();

      for (const transaction of transactions) {
        const dateKey = new Date(transaction.createdAt).toISOString().split('T')[0];
        const existing = dailySales.get(dateKey);
        
        if (existing) {
          existing.totalSales += transaction.total;
          existing.transactionCount += 1;
        } else {
          dailySales.set(dateKey, {
            totalSales: transaction.total,
            transactionCount: 1
          });
        }
      }

      // Convert to array and sort by date
      return Array.from(dailySales.entries())
        .map(([date, data]) => ({
          date,
          totalSales: data.totalSales,
          transactionCount: data.transactionCount
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      throw new Error(`Failed to get daily sales summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}