import { db, StockReturn, StockReturnItem, Invoice, Product } from '../db';
import { useShiftStore } from '../stores/shiftStore';
import { v7 as uuidv7 } from 'uuid';
import { stockHistoryService } from './stockHistoryService';

export interface CreateStockReturnData {
  supplierId: string;
  originalInvoiceId: string;
  returnDate: Date;
  confirmationDate?: Date | null;
  totalAmount: number;
  confirmedAmount?: number | null;
  status: 'belum_selesai' | 'selesai';
  notes?: string | null;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export interface StockReturnWithItems extends StockReturn {
  items: StockReturnItem[];
  supplierName?: string;
  originalInvoiceNumber?: string;
}

export class StockReturnService {
  
  /**
   * Create a new stock return record
   */
  static async createStockReturn(data: CreateStockReturnData, createdBy: string): Promise<string> {
    try {
      // Validate that the original invoice exists and belongs to the supplier
      const originalInvoice = await db.invoices.get(data.originalInvoiceId);
      if (!originalInvoice) {
        throw new Error('Original invoice not found');
      }
      
      if (originalInvoice.supplierId !== data.supplierId) {
        throw new Error('Invoice does not belong to the specified supplier');
      }
      
      // Generate unique return number
      const returnNumber = await this.generateUniqueReturnNumber();
      
      // Get current shift ID if there's an active shift
      const { currentShiftId } = useShiftStore.getState();
      
      // Create the main stock return record
      const stockReturnId = uuidv7();
      const newStockReturn: StockReturn = {
        id: stockReturnId,
        returnNumber,
        supplierId: data.supplierId,
        originalInvoiceId: data.originalInvoiceId,
        returnDate: data.returnDate,
        confirmationDate: data.confirmationDate || null,
        totalAmount: data.totalAmount,
        confirmedAmount: data.confirmedAmount || null,
        status: data.status,
        notes: data.notes || null,
        shiftId: currentShiftId || null,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      
      // Add the stock return to the database
      await db.stockReturns.add(newStockReturn);
      
      // Create stock return items
      const returnItems: StockReturnItem[] = data.items.map(item => ({
        id: uuidv7(),
        stockReturnId: stockReturnId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      // Add all return items to the database
      await db.stockReturnItems.bulkAdd(returnItems);
      
      // Update stock levels for returned items (decrease stock)
      await this.updateStockForReturn(stockReturnId);
      
      return stockReturnId;
    } catch (error) {
      console.error('Error creating stock return:', error);
      throw error;
    }
  }
  
  /**
   * Update stock levels for a stock return and create movement records
   */
  private static async updateStockForReturn(stockReturnId: string): Promise<void> {
    try {
      // Get all items for this return
      const returnItems = await db.stockReturnItems.where('stockReturnId').equals(stockReturnId).toArray();
      const stockReturn = await db.stockReturns.get(stockReturnId);
      
      if (!stockReturn) {
        throw new Error('Stock return not found');
      }
      
      // Update stock for each returned item
      for (const item of returnItems) {
        const product = await db.products.get(item.productId);
        if (product) {
          const previousStock = product.currentStock || 0;
          const newCurrentStock = Math.max(0, previousStock - item.quantity);
          
          // Recalculate HPP (Average Cost) - remove the returned quantity from the cost calculation
          const newCost = this.calculateNewCostAfterReturn(product, item);
          
          // Update product stock and cost
          await db.products.update(item.productId, {
            currentStock: newCurrentStock,
            cost: newCost,
            updatedAt: new Date()
          });
          
          // Create movement record for stock tracking
          // Note: The movement record will be created by the movement tracking system
          // when we call the stock history service
          console.log(`Stock return processed: ${item.quantity} units of ${product.name} returned`);
        }
      }
    } catch (error) {
      console.error('Error updating stock for return:', error);
      throw error;
    }
  }
  
  /**
   * Calculate new HPP after a return
   */
  private static calculateNewCostAfterReturn(product: Product, returnItem: StockReturnItem): number {
    const currentStock = product.currentStock || 0;
    const currentCost = product.cost || 0;
    const returnQuantity = returnItem.quantity;
    
    // If returning all stock, cost becomes 0
    if (returnQuantity >= currentStock) {
      return 0;
    }
    
    // Calculate remaining stock value
    const remainingStock = currentStock - returnQuantity;
    const totalStockValue = currentStock * currentCost;
    const returnedValue = returnQuantity * returnItem.unitPrice;
    const remainingValue = totalStockValue - returnedValue;
    
    // New cost is remaining value divided by remaining stock
    return remainingValue / remainingStock;
  }
  
  /**
   * Get all stock returns with their items
   */
  static async getStockReturns(): Promise<StockReturnWithItems[]> {
    try {
      const returns = await db.stockReturns.filter(ret => !ret.deletedAt).toArray();
      
      const returnsWithItems: StockReturnWithItems[] = [];
      
      for (const stockReturn of returns) {
        // Get items for this return
        const items = await db.stockReturnItems.where('stockReturnId').equals(stockReturn.id).toArray();
        
        // Get supplier name
        const supplier = await db.suppliers.get(stockReturn.supplierId);
        
        // Get original invoice number
        const originalInvoice = await db.invoices.get(stockReturn.originalInvoiceId);
        
        returnsWithItems.push({
          ...stockReturn,
          items,
          supplierName: supplier?.name || 'Unknown Supplier',
          originalInvoiceNumber: originalInvoice?.invoiceNumber || 'Unknown Invoice'
        });
      }
      
      return returnsWithItems.sort((a, b) => b.returnDate.getTime() - a.returnDate.getTime());
    } catch (error) {
      console.error('Error fetching stock returns:', error);
      throw error;
    }
  }
  
  /**
   * Get stock returns by supplier
   */
  static async getStockReturnsBySupplier(supplierId: string): Promise<StockReturnWithItems[]> {
    try {
      const returns = await db.stockReturns
        .where('supplierId')
        .equals(supplierId)
        .filter(ret => !ret.deletedAt)
        .toArray();
      
      const returnsWithItems: StockReturnWithItems[] = [];
      
      for (const stockReturn of returns) {
        const items = await db.stockReturnItems.where('stockReturnId').equals(stockReturn.id).toArray();
        const supplier = await db.suppliers.get(stockReturn.supplierId);
        const originalInvoice = await db.invoices.get(stockReturn.originalInvoiceId);
        
        returnsWithItems.push({
          ...stockReturn,
          items,
          supplierName: supplier?.name || 'Unknown Supplier',
          originalInvoiceNumber: originalInvoice?.invoiceNumber || 'Unknown Invoice'
        });
      }
      
      return returnsWithItems.sort((a, b) => b.returnDate.getTime() - a.returnDate.getTime());
    } catch (error) {
      console.error('Error fetching stock returns by supplier:', error);
      throw error;
    }
  }
  
  /**
   * Update stock return status
   */
  static async updateReturnStatus(returnId: string, status: 'belum_selesai' | 'selesai', confirmationDate?: Date): Promise<void> {
    try {
      const updates: Partial<StockReturn> = {
        status,
        updatedAt: new Date()
      };
      
      if (confirmationDate) {
        updates.confirmationDate = confirmationDate;
      }
      
      await db.stockReturns.update(returnId, updates);
    } catch (error) {
      console.error('Error updating return status:', error);
      throw error;
    }
  }
  
  /**
   * Soft delete a stock return
   */
  static async deleteStockReturn(returnId: string): Promise<void> {
    try {
      // Note: This is a soft delete implementation
      // In a production system, you might want to reverse the stock changes
      // or implement business rules around return deletion
      
      await db.stockReturns.update(returnId, {
        deletedAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error deleting stock return:', error);
      throw error;
    }
  }
  
  /**
   * Validate return quantities against original invoice
   */
  static async validateReturnQuantities(originalInvoiceId: string, returnItems: { productId: string; quantity: number }[]): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const errors: string[] = [];
      
      // Get the original invoice
      const invoice = await db.invoices.get(originalInvoiceId);
      if (!invoice) {
        errors.push('Original invoice not found');
        return { isValid: false, errors };
      }
      
      // Check each return item against the original invoice
      for (const returnItem of returnItems) {
        const invoiceItem = invoice.items.find(item => item.productId === returnItem.productId);
        
        if (!invoiceItem) {
          errors.push(`Product ${returnItem.productId} not found in original invoice`);
          continue;
        }
        
        if (returnItem.quantity > invoiceItem.qty) {
          errors.push(`Return quantity (${returnItem.quantity}) exceeds invoice quantity (${invoiceItem.qty}) for product ${returnItem.productId}`);
        }
        
        if (returnItem.quantity <= 0) {
          errors.push(`Return quantity must be positive for product ${returnItem.productId}`);
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating return quantities:', error);
      throw error;
    }
  }
  
  /**
   * Generate unique return number
   */
  private static async generateUniqueReturnNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Find the highest sequence number for today
    const todayReturns = await db.stockReturns
      .where('returnNumber')
      .startsWith(`RT-${dateStr}-`)
      .toArray();
    
    let maxSequence = 0;
    for (const ret of todayReturns) {
      const parts = ret.returnNumber.split('-');
      if (parts.length === 3) {
        const sequence = parseInt(parts[2]);
        if (!isNaN(sequence) && sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    }
    
    const nextSequence = (maxSequence + 1).toString().padStart(3, '0');
    return `RT-${dateStr}-${nextSequence}`;
  }
  
  /**
   * Get stock return statistics
   */
  static async getReturnStatistics(supplierId?: string): Promise<{
    totalReturns: number;
    totalAmount: number;
    pendingReturns: number;
    completedReturns: number;
  }> {
    try {
      let returnsQuery = db.stockReturns.filter(ret => !ret.deletedAt);
      
      if (supplierId) {
        returnsQuery = returnsQuery.filter(ret => ret.supplierId === supplierId);
      }
      
      const returns = await returnsQuery.toArray();
      
      return {
        totalReturns: returns.length,
        totalAmount: returns.reduce((sum, ret) => sum + ret.totalAmount, 0),
        pendingReturns: returns.filter(ret => ret.status === 'belum_selesai').length,
        completedReturns: returns.filter(ret => ret.status === 'selesai').length,
      };
    } catch (error) {
      console.error('Error fetching return statistics:', error);
      throw error;
    }
  }
}