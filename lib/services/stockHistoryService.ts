import { db, Product, StockOpname, StockWaste, Invoice } from '../db';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export interface StockMovement {
  id: string;
  type: 'purchase' | 'sale' | 'opname' | 'waste' | 'adjustment' | 'return';
  productId: string;
  productName: string;
  productSku: string | null;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  totalValue: number;
  reason?: string;
  referenceId: string;
  referenceType: 'invoice' | 'transaction' | 'opname' | 'waste' | 'stock_return';
  createdAt: Date;
  createdBy: string;
  createdByName?: string;
}

export interface StockMovementFilter {
  productId?: string;
  startDate?: Date;
  endDate?: Date;
  type?: StockMovement['type'];
  referenceId?: string;
}

export interface StockMovementSummary {
  totalMovements: number;
  totalPurchaseValue: number;
  totalWasteValue: number;
  netStockChange: number;
  movementsByType: { [key in StockMovement['type']]?: number };
  topProducts: {
    productId: string;
    productName: string;
    movements: number;
    totalValue: number;
  }[];
}

class StockHistoryService {
  private static instance: StockHistoryService;

  private constructor() {}

  static getInstance(): StockHistoryService {
    if (!StockHistoryService.instance) {
      StockHistoryService.instance = new StockHistoryService();
    }
    return StockHistoryService.instance;
  }

  /**
   * Get stock movements for a specific product
   */
  async getStockMovements(productId: string, filter?: StockMovementFilter): Promise<StockMovement[]> {
    try {
      const movements: StockMovement[] = [];

      // Get purchase movements (from invoices)
      const purchaseMovements = await this.getPurchaseMovements(productId, filter);
      movements.push(...purchaseMovements);

      // Get opname movements
      const opnameMovements = await this.getOpnameMovements(productId, filter);
      movements.push(...opnameMovements);

      // Get waste movements
      const wasteMovements = await this.getWasteMovements(productId, filter);
      movements.push(...wasteMovements);

      // Get sale movements (from transactions)
      const saleMovements = await this.getSaleMovements(productId, filter);
      movements.push(...saleMovements);

      // Get return movements
      const returnMovements = await this.getReturnMovements(productId, filter);
      movements.push(...returnMovements);

      // Sort by date (newest first)
      return movements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting stock movements:', error);
      return [];
    }
  }

  /**
   * Get purchase movements from invoices
   */
  private async getPurchaseMovements(productId: string, filter?: StockMovementFilter): Promise<StockMovement[]> {
    try {
      const invoices = await db.invoices
        .filter(invoice => {
          // Filter by date
          if (filter?.startDate && invoice.createdAt < filter.startDate) return false;
          if (filter?.endDate && invoice.createdAt > filter.endDate) return false;
          return true;
        })
        .toArray();

      const movements: StockMovement[] = [];
      
      for (const invoice of invoices) {
        const item = invoice.items.find(i => i.productId === productId);
        if (item) {
          // Calculate previous stock (simplified - in reality we'd need to track running stock)
          const product = await db.products.get(productId);
          if (!product) continue;

          movements.push({
            id: `${invoice.id}-${item.productId}`,
            type: 'purchase',
            productId,
            productName: product.name,
            productSku: product.sku,
            quantity: item.qty,
            previousStock: (product.currentStock || 0) - item.qty, // Simplified calculation
            newStock: (product.currentStock || 0),
            unitCost: item.unitPrice,
            totalValue: item.total,
            referenceId: invoice.id,
            referenceType: 'invoice',
            createdAt: invoice.createdAt,
            createdBy: invoice.createdBy,
          });
        }
      }

      return movements;
    } catch (error) {
      console.error('Error getting purchase movements:', error);
      return [];
    }
  }

  /**
   * Get opname movements
   */
  private async getOpnameMovements(productId: string, filter?: StockMovementFilter): Promise<StockMovement[]> {
    try {
      const opnames = await db.stockOpnames
        .filter(opname => {
          // Filter by date
          if (filter?.startDate && opname.createdAt < filter.startDate) return false;
          if (filter?.endDate && opname.createdAt > filter.endDate) return false;
          
          // Filter by specific opname
          if (filter?.referenceId && opname.id !== filter.referenceId) return false;
          
          return true;
        })
        .toArray();

      const movements: StockMovement[] = [];
      
      for (const opname of opnames) {
        const opnameItem = opname.items.find(item => item.productId === productId);
        if (opnameItem) {
          const product = await db.products.get(productId);
          if (!product) continue;

          movements.push({
            id: `${opname.id}-${productId}`,
            type: 'opname',
            productId,
            productName: product.name,
            productSku: product.sku,
            quantity: opnameItem.variance,
            previousStock: opnameItem.systemStock,
            newStock: opnameItem.actualStock,
            totalValue: Math.abs(opnameItem.variance) * (product.cost || 0),
            reason: opname.notes || 'Stock opname adjustment',
            referenceId: opname.id,
            referenceType: 'opname',
            createdAt: opname.createdAt,
            createdBy: opname.createdBy,
          });
        }
      }

      return movements;
    } catch (error) {
      console.error('Error getting opname movements:', error);
      return [];
    }
  }

  /**
   * Get waste movements
   */
  private async getWasteMovements(productId: string, filter?: StockMovementFilter): Promise<StockMovement[]> {
    try {
      const wasteRecords = await db.stockWastes
        .filter(waste => {
          // Filter by product
          if (waste.productId !== productId) return false;
          
          // Filter by date
          if (filter?.startDate && waste.createdAt < filter.startDate) return false;
          if (filter?.endDate && waste.createdAt > filter.endDate) return false;
          
          // Filter by specific waste
          if (filter?.referenceId && waste.id !== filter.referenceId) return false;
          
          return true;
        })
        .toArray();

      const movements: StockMovement[] = [];
      
      for (const waste of wasteRecords) {
        const product = await db.products.get(productId);
        if (!product) continue;

        // Calculate previous stock (simplified)
        const previousStock = (product.currentStock || 0) + waste.qty;

        movements.push({
          id: waste.id,
          type: 'waste',
          productId,
          productName: product.name,
          productSku: product.sku,
          quantity: -waste.qty, // Negative for waste
          previousStock,
          newStock: (product.currentStock || 0),
          unitCost: product.cost,
          totalValue: waste.qty * (product.cost || 0),
          reason: waste.reason,
          referenceId: waste.id,
          referenceType: 'waste',
          createdAt: waste.createdAt,
          createdBy: waste.createdBy,
        });
      }

      return movements;
    } catch (error) {
      console.error('Error getting waste movements:', error);
      return [];
    }
  }

  /**
   * Get sale movements from transactions
   */
  private async getSaleMovements(productId: string, filter?: StockMovementFilter): Promise<StockMovement[]> {
    try {
      const transactions = await db.transactions
        .filter(transaction => {
          // Check if transaction contains this product
          const hasProduct = transaction.items.some(item => item.productId === productId);
          if (!hasProduct) return false;
          
          // Filter by date
          if (filter?.startDate && transaction.createdAt < filter.startDate) return false;
          if (filter?.endDate && transaction.createdAt > filter.endDate) return false;
          
          return true;
        })
        .toArray();

      const movements: StockMovement[] = [];
      
      for (const transaction of transactions) {
        const item = transaction.items.find(i => i.productId === productId);
        if (item) {
          const product = await db.products.get(productId);
          if (!product) continue;

          // Calculate previous stock (simplified)
          const previousStock = (product.currentStock || 0) + item.qty;

          movements.push({
            id: `${transaction.id}-${item.productId}`,
            type: 'sale',
            productId,
            productName: product.name,
            productSku: product.sku,
            quantity: -item.qty, // Negative for sales
            previousStock,
            newStock: (product.currentStock || 0),
            unitCost: item.price,
            totalValue: item.subtotal,
            referenceId: transaction.id,
            referenceType: 'transaction',
            createdAt: transaction.createdAt,
            createdBy: transaction.createdBy,
          });
        }
      }

      return movements;
    } catch (error) {
      console.error('Error getting sale movements:', error);
      return [];
    }
  }

  /**
   * Get return movements from stock returns
   */
  private async getReturnMovements(productId: string, filter?: StockMovementFilter): Promise<StockMovement[]> {
    try {
      const stockReturns = await db.stockReturns
        .filter(stockReturn => {
          // Filter by date
          if (filter?.startDate && stockReturn.createdAt < filter.startDate) return false;
          if (filter?.endDate && stockReturn.createdAt > filter.endDate) return false;
          
          // Filter by specific return
          if (filter?.referenceId && stockReturn.id !== filter.referenceId) return false;
          
          return true;
        })
        .toArray();

      const movements: StockMovement[] = [];
      
      for (const stockReturn of stockReturns) {
        // Get return items for this product
        const returnItems = await db.stockReturnItems.where('stockReturnId').equals(stockReturn.id).toArray();
        
        for (const returnItem of returnItems) {
          if (returnItem.productId === productId) {
            const product = await db.products.get(productId);
            if (!product) continue;

            // Calculate previous stock (stock before return)
            const previousStock = (product.currentStock || 0) + returnItem.quantity;

            movements.push({
              id: `${stockReturn.id}-${returnItem.productId}`,
              type: 'return',
              productId,
              productName: product.name,
              productSku: product.sku,
              quantity: -returnItem.quantity, // Negative for returns (stock out)
              previousStock,
              newStock: (product.currentStock || 0),
              unitCost: returnItem.unitPrice,
              totalValue: returnItem.totalPrice,
              reason: `Retur dari faktur ${stockReturn.id}`,
              referenceId: stockReturn.id,
              referenceType: 'stock_return',
              createdAt: stockReturn.createdAt,
              createdBy: stockReturn.createdBy,
            });
          }
        }
      }

      return movements;
    } catch (error) {
      console.error('Error getting return movements:', error);
      return [];
    }
  }

  /**
   * Get stock movement summary for a date range
   */
  async getStockMovementSummary(startDate?: Date, endDate?: Date): Promise<StockMovementSummary> {
    try {
      const products = await db.products.filter(p => !p.deletedAt).toArray();
      const movements: StockMovement[] = [];

      // Get movements for all products in the date range
      for (const product of products) {
        const productMovements = await this.getStockMovements(product.id, { startDate, endDate });
        movements.push(...productMovements);
      }

      // Calculate summary
      const totalMovements = movements.length;
      const totalPurchaseValue = movements
        .filter(m => m.type === 'purchase')
        .reduce((sum, m) => sum + m.totalValue, 0);
      
      const totalWasteValue = movements
        .filter(m => m.type === 'waste')
        .reduce((sum, m) => sum + m.totalValue, 0);
      
      const netStockChange = movements.reduce((sum, m) => sum + m.quantity, 0);

      // Count movements by type
      const movementsByType: { [key in StockMovement['type']]?: number } = {};
      movements.forEach(movement => {
        movementsByType[movement.type] = (movementsByType[movement.type] || 0) + 1;
      });

      // Top products by movement volume
      const productStats: { [productId: string]: { productName: string; movements: number; totalValue: number } } = {};
      movements.forEach(movement => {
        if (!productStats[movement.productId]) {
          productStats[movement.productId] = {
            productName: movement.productName,
            movements: 0,
            totalValue: 0,
          };
        }
        productStats[movement.productId].movements += 1;
        productStats[movement.productId].totalValue += Math.abs(movement.totalValue);
      });

      const topProducts = Object.entries(productStats)
        .map(([productId, stats]) => ({ productId, ...stats }))
        .sort((a, b) => b.movements - a.movements)
        .slice(0, 10);

      return {
        totalMovements,
        totalPurchaseValue,
        totalWasteValue,
        netStockChange,
        movementsByType,
        topProducts,
      };
    } catch (error) {
      console.error('Error getting stock movement summary:', error);
      return {
        totalMovements: 0,
        totalPurchaseValue: 0,
        totalWasteValue: 0,
        netStockChange: 0,
        movementsByType: {},
        topProducts: [],
      };
    }
  }

  /**
   * Get stock movement report by date range
   */
  async getStockMovementReport(startDate?: Date, endDate?: Date): Promise<{
    summary: StockMovementSummary;
    movements: StockMovement[];
  }> {
    try {
      const summary = await this.getStockMovementSummary(startDate, endDate);
      const allMovements: StockMovement[] = [];

      // Get all products and their movements
      const products = await db.products.filter(p => !p.deletedAt).toArray();
      for (const product of products) {
        const productMovements = await this.getStockMovements(product.id, { startDate, endDate });
        allMovements.push(...productMovements);
      }

      // Sort by date and type
      allMovements.sort((a, b) => {
        if (a.createdAt.getTime() === b.createdAt.getTime()) {
          return a.type.localeCompare(b.type);
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      return {
        summary,
        movements: allMovements,
      };
    } catch (error) {
      console.error('Error getting stock movement report:', error);
      return {
        summary: {
          totalMovements: 0,
          totalPurchaseValue: 0,
          totalWasteValue: 0,
          netStockChange: 0,
          movementsByType: {},
          topProducts: [],
        },
        movements: [],
      };
    }
  }

  /**
   * Export stock movement data to CSV format
   */
  async exportToCSV(startDate?: Date, endDate?: Date): Promise<string> {
    try {
      const report = await this.getStockMovementReport(startDate, endDate);
      
      const headers = [
        'Tanggal',
        'Tipe',
        'Produk',
        'SKU',
        'Quantity',
        'Stok Sebelum',
        'Stok Sesudah',
        'Unit Cost',
        'Total Value',
        'Alasan',
        'Reference ID',
        'User ID'
      ];

      const csvRows = [headers.join(',')];

      report.movements.forEach(movement => {
        const row = [
          format(movement.createdAt, 'dd/MM/yyyy HH:mm', { locale: idLocale }),
          movement.type,
          `"${movement.productName}"`,
          movement.productSku || '',
          movement.quantity.toString(),
          movement.previousStock.toString(),
          movement.newStock.toString(),
          (movement.unitCost || 0).toString(),
          movement.totalValue.toString(),
          `"${movement.reason || ''}"`,
          movement.referenceId,
          movement.createdBy
        ];
        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      return '';
    }
  }

  /**
   * Get low stock alerts based on recent movements
   */
  async getLowStockAlerts(): Promise<Array<{
    product: Product;
    recentMovements: StockMovement[];
    trend: 'increasing' | 'decreasing' | 'stable';
  }>> {
    try {
      const products = await db.products.filter(p => !p.deletedAt && p.monitorStock).toArray();
      const alerts: Array<{
        product: Product;
        recentMovements: StockMovement[];
        trend: 'increasing' | 'decreasing' | 'stable';
      }> = [];

      const thirtyDaysAgo = subDays(new Date(), 30);

      for (const product of products) {
        const recentMovements = await this.getStockMovements(product.id, {
          startDate: thirtyDaysAgo,
        });

        if (recentMovements.length === 0) continue;

        // Calculate trend
        const netMovement = recentMovements.reduce((sum, m) => sum + m.quantity, 0);
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        
        if (netMovement > 2) trend = 'increasing';
        else if (netMovement < -2) trend = 'decreasing';

        // Check if product is below minimum stock or trending towards it
        const isBelowMinStock = product.minStock && product.currentStock <= product.minStock;
        const isTrendingDown = trend === 'decreasing' && product.minStock && 
          (product.currentStock - Math.abs(netMovement)) <= product.minStock;

        if (isBelowMinStock || isTrendingDown) {
          alerts.push({
            product,
            recentMovements,
            trend,
          });
        }
      }

      return alerts.sort((a, b) => {
        // Sort by how critical the situation is
        const aStockLevel = a.product.minStock ? a.product.currentStock / a.product.minStock : 1;
        const bStockLevel = b.product.minStock ? b.product.currentStock / b.product.minStock : 1;
        return aStockLevel - bStockLevel;
      });
    } catch (error) {
      console.error('Error getting low stock alerts:', error);
      return [];
    }
  }
}

export const stockHistoryService = StockHistoryService.getInstance();