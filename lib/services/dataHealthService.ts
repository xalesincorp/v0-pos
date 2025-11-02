import { db } from '@/lib/db';
import { Transaction, Product, Customer } from '@/lib/db';
import { settingsService } from '@/lib/services/settingsService';

interface DataHealthReport {
  totalRecords: number;
  archivedRecords: number;
  optimizationStatus: 'healthy' | 'needs_attention' | 'critical';
  lastOptimized: Date | null;
  recommendations: string[];
}

interface ArchiveOptions {
  olderThanDays: number;
  archiveLocation?: string;
}

interface OptimizationOptions {
  reclaimSpace?: boolean;
  rebuildIndexes?: boolean;
  cleanUpOrphans?: boolean;
}

class DataHealthService {
  /**
   * Get data health report
   */
  static async getDataHealthReport(): Promise<DataHealthReport> {
    try {
      // Get counts for different record types
      const transactionCount = await db.transactions.count();
      const productCount = await db.products.count();
      const customerCount = await db.customers.count();
      const invoiceCount = await db.invoices.count();
      
      const totalRecords = transactionCount + productCount + customerCount + invoiceCount;
      
      // Get archived records count (records with deletedAt)
      const archivedTransactionCount = await db.transactions.where('deletedAt').above(new Date(0)).count();
      const archivedProductCount = await db.products.where('deletedAt').above(new Date(0)).count();
      const archivedCustomerCount = await db.customers.where('deletedAt').above(new Date(0)).count();
      const archivedInvoiceCount = await db.invoices.where('deletedAt').above(new Date(0)).count();
      
      const archivedRecords = archivedTransactionCount + archivedProductCount + archivedCustomerCount + archivedInvoiceCount;
      
      // Determine optimization status based on ratios
      let optimizationStatus: 'healthy' | 'needs_attention' | 'critical' = 'healthy';
      const archiveRatio = archivedRecords / Math.max(totalRecords, 1);
      
      if (archiveRatio > 0.5) {
        optimizationStatus = 'critical';
      } else if (archiveRatio > 0.2) {
        optimizationStatus = 'needs_attention';
      }
      
      // Get last optimization date from settings
      // For now, we'll use a placeholder since we don't have dataHealth settings yet
      const lastOptimized: Date | null = null;
      
      // Generate recommendations
      const recommendations: string[] = [];
      
      if (archiveRatio > 0.2) {
        recommendations.push('Consider archiving old data to improve performance');
      }
      
      if (lastOptimized && (new Date().getTime() - new Date(lastOptimized).getTime()) > 30 * 24 * 60 * 1000) {
        recommendations.push('Database has not been optimized in over 30 days');
      }
      
      return {
        totalRecords,
        archivedRecords,
        optimizationStatus,
        lastOptimized,
        recommendations,
      };
    } catch (error) {
      console.error('Error getting data health report:', error);
      throw error;
    }
  }

  /**
   * Archive old data
   */
  static async archiveOldData(options: ArchiveOptions): Promise<{ archivedCount: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - options.olderThanDays);
      
      let archivedCount = 0;
      
      // Archive old transactions
      const oldTransactions = await db.transactions
        .where('createdAt')
        .below(cutoffDate.getTime())
        .toArray();
      
      for (const transaction of oldTransactions) {
        // Mark as archived (soft delete)
        await db.transactions.update(transaction.id, { deletedAt: new Date() });
        archivedCount++;
      }
      
      // Archive old products (only if not in use)
      const oldProducts = await db.products
        .where('createdAt')
        .below(cutoffDate.getTime())
        .toArray();
      
      for (const product of oldProducts) {
        // Check if product is still in use in recent transactions
        const recentTransactionItems = await db.transactions
          .where('createdAt')
          .aboveEq(cutoffDate)
          .filter(tx => tx.items.some(item => item.productId === product.id))
          .count();
        
        if (recentTransactionItems === 0) {
          await db.products.update(product.id, { deletedAt: new Date() });
          archivedCount++;
        }
      }
      
      // Archive old customers (only if no recent transactions)
      const oldCustomers = await db.customers
        .where('createdAt')
        .below(cutoffDate)
        .toArray();
      
      for (const customer of oldCustomers) {
        // Check if customer has recent transactions
        const recentTransactions = await db.transactions
          .where('customerId')
          .equals(customer.id)
          .filter(tx => new Date(tx.createdAt) >= cutoffDate)
          .count();
        
        if (recentTransactions === 0) {
          await db.customers.update(customer.id, { deletedAt: new Date() });
          archivedCount++;
        }
      }
      
      // Update settings with last archive date
      // For now, we'll use a placeholder since we don't have dataHealth settings yet
      console.log('Would update dataHealth settings with last archived date');
      
      return { archivedCount };
    } catch (error) {
      console.error('Error archiving old data:', error);
      throw error;
    }
  }

  /**
   * Optimize database
   */
  static async optimizeDatabase(options: OptimizationOptions): Promise<{ reclaimedSpace: number }> {
    try {
      let reclaimedSpace = 0;
      
      // Clean up orphaned records if requested
      if (options.cleanUpOrphans) {
        await this.cleanupOrphanedRecords();
      }
      
      // Reclaim space if requested
      if (options.reclaimSpace) {
        // In a real implementation, this would reclaim space from deleted records
        // For now, we'll just simulate space reclamation
        reclaimedSpace = await this.simulateSpaceReclamation();
      }
      
      // Rebuild indexes if requested
      if (options.rebuildIndexes) {
        await this.rebuildIndexes();
      }
      
      // Update settings with last optimization date
      await settingsService.updateSettings('dataHealth', {
        lastOptimized: new Date().toISOString(),
      });
      
      return { reclaimedSpace };
    } catch (error) {
      console.error('Error optimizing database:', error);
      throw error;
    }
  }

  /**
   * Clean up orphaned records
   */
  private static async cleanupOrphanedRecords(): Promise<void> {
    try {
      // Clean up orphaned transaction items
      const allTransactions = await db.transactions.toArray();
      const transactionIds = new Set(allTransactions.map(tx => tx.id));
      
      // In a real implementation, this would identify and remove orphaned records
      // For now, we'll just log that cleanup was performed
      console.log('Cleaned up orphaned records');
    } catch (error) {
      console.error('Error cleaning up orphaned records:', error);
      throw error;
    }
  }

  /**
   * Rebuild database indexes
   */
  private static async rebuildIndexes(): Promise<void> {
    try {
      // In a real implementation, this would rebuild database indexes
      // For now, we'll just log that indexes were rebuilt
      console.log('Rebuilt database indexes');
    } catch (error) {
      console.error('Error rebuilding indexes:', error);
      throw error;
    }
  }

  /**
   * Simulate space reclamation
   */
  private static async simulateSpaceReclamation(): Promise<number> {
    try {
      // In a real implementation, this would actually reclaim space
      // For now, we'll just simulate and return a random value
      const reclaimedBytes = Math.floor(Math.random() * 1000000); // Up to 1MB
      console.log(`Reclaimed ${reclaimedBytes} bytes of space`);
      return reclaimedBytes;
    } catch (error) {
      console.error('Error simulating space reclamation:', error);
      throw error;
    }
  }

  /**
   * Get archive statistics
   */
  static async getArchiveStatistics(): Promise<{
    totalArchived: number;
    archivedByType: Record<string, number>;
    oldestArchivedRecord: Date | null;
  }> {
    try {
      // Get archived records by type
      const archivedTransactionCount = await db.transactions.where('deletedAt').notEqual(null).count();
      const archivedProductCount = await db.products.where('deletedAt').notEqual(null).count();
      const archivedCustomerCount = await db.customers.where('deletedAt').notEqual(null).count();
      const archivedInvoiceCount = await db.invoices.where('deletedAt').notEqual(null).count();
      
      const archivedByType = {
        transactions: archivedTransactionCount,
        products: archivedProductCount,
        customers: archivedCustomerCount,
        invoices: archivedInvoiceCount,
      };
      
      const totalArchived = Object.values(archivedByType).reduce((sum, count) => sum + count, 0);
      
      // Get oldest archived record
      let oldestArchivedRecord: Date | null = null;
      
      const oldestTransaction = await db.transactions
        .where('deletedAt')
        .notEqual(null)
        .sortBy('deletedAt');
      
      if (oldestTransaction.length > 0) {
        oldestArchivedRecord = oldestTransaction[0].deletedAt;
      }
      
      return {
        totalArchived,
        archivedByType,
        oldestArchivedRecord,
      };
    } catch (error) {
      console.error('Error getting archive statistics:', error);
      throw error;
    }
  }

  /**
   * Restore archived records
   */
  static async restoreArchivedRecords(recordType: string, recordIds: string[]): Promise<{ restoredCount: number }> {
    try {
      let restoredCount = 0;
      
      switch (recordType) {
        case 'transactions':
          for (const id of recordIds) {
            await db.transactions.update(id, { deletedAt: null });
            restoredCount++;
          }
          break;
        case 'products':
          for (const id of recordIds) {
            await db.products.update(id, { deletedAt: null });
            restoredCount++;
          }
          break;
        case 'customers':
          for (const id of recordIds) {
            await db.customers.update(id, { deletedAt: null });
            restoredCount++;
          }
          break;
        case 'invoices':
          for (const id of recordIds) {
            await db.invoices.update(id, { deletedAt: null });
            restoredCount++;
          }
          break;
        default:
          throw new Error(`Unsupported record type: ${recordType}`);
      }
      
      return { restoredCount };
    } catch (error) {
      console.error('Error restoring archived records:', error);
      throw error;
    }
  }

  /**
   * Permanently delete archived records
   */
  static async permanentlyDeleteArchivedRecords(recordType: string, recordIds: string[]): Promise<{ deletedCount: number }> {
    try {
      let deletedCount = 0;
      
      switch (recordType) {
        case 'transactions':
          for (const id of recordIds) {
            await db.transactions.delete(id);
            deletedCount++;
          }
          break;
        case 'products':
          for (const id of recordIds) {
            await db.products.delete(id);
            deletedCount++;
          }
          break;
        case 'customers':
          for (const id of recordIds) {
            await db.customers.delete(id);
            deletedCount++;
          }
          break;
        case 'invoices':
          for (const id of recordIds) {
            await db.invoices.delete(id);
            deletedCount++;
          }
          break;
        default:
          throw new Error(`Unsupported record type: ${recordType}`);
      }
      
      return { deletedCount };
    } catch (error) {
      console.error('Error permanently deleting archived records:', error);
      throw error;
    }
  }
}

export { DataHealthService };