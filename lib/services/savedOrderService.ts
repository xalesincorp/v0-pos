import { db, Transaction } from '../db';
import { TransactionService } from './transactionService';
import { v7 as uuidv7 } from 'uuid';

export class SavedOrderService {
  // Save a transaction as a saved order
  static async saveOrder(transactionData: Omit<Transaction, 'id' | 'transactionNumber' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'paidAt'>): Promise<Transaction> {
    try {
      // Use the existing saveTransaction method from TransactionService
      return await TransactionService.saveTransaction(transactionData);
    } catch (error) {
      throw new Error(`Failed to save order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

 // Get all saved orders
  static async getAllSavedOrders(): Promise<Transaction[]> {
    try {
      // Get all transactions with status 'saved'
      const savedOrders = await db.transactions
        .filter(transaction => transaction.status === 'saved' && transaction.deletedAt === null)
        .toArray();
      
      // Sort by createdAt in descending order
      return savedOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      throw new Error(`Failed to get saved orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
 }

  // Get a specific saved order by ID
  static async getSavedOrderById(id: string): Promise<Transaction | null> {
    try {
      const transaction = await db.transactions.get(id);
      
      // Check if it's a saved order and not deleted
      if (transaction && transaction.status === 'saved' && transaction.deletedAt === null) {
        return transaction;
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to get saved order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
 }

  // Load a saved order (convert it back to an active order in the cashier)
  static async loadSavedOrder(id: string): Promise<Transaction | null> {
    try {
      const transaction = await this.getSavedOrderById(id);
      return transaction;
    } catch (error) {
      throw new Error(`Failed to load saved order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete a saved order (soft delete)
  static async deleteSavedOrder(id: string): Promise<boolean> {
    try {
      // Instead of soft deleting, we'll update the status to 'deleted' or remove it
      // For now, let's just delete it completely as it's a saved order
      await db.transactions.delete(id);
      return true; // Assuming deletion was successful if no error was thrown
    } catch (error) {
      throw new Error(`Failed to delete saved order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update a saved order
  static async updateSavedOrder(id: string, updateData: Partial<Transaction>): Promise<Transaction | null> {
    try {
      // Get the existing saved order
      const existingOrder = await this.getSavedOrderById(id);
      if (!existingOrder) {
        return null;
      }

      // Prepare updated transaction data
            const updatedTransaction = {
              ...existingOrder,
              ...updateData,
              shiftId: updateData.shiftId !== undefined ? updateData.shiftId : existingOrder.shiftId, // Preserve shiftId if not explicitly updated
              updatedAt: new Date()
            };

      // Update in database
            await db.transactions.update(id, {
              ...updatedTransaction,
              id: undefined, // Don't update the id field
              shiftId: updatedTransaction.shiftId
            });
      
      // Return updated transaction
      const updatedOrder = await db.transactions.get(id);
      return updatedOrder || null;
    } catch (error) {
      throw new Error(`Failed to update saved order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convert a saved order to a paid transaction
  static async convertToPaidOrder(savedOrderId: string, paymentMethod: 'cash' | 'ewallet' | 'qris', paymentAmount: number): Promise<Transaction | null> {
    try {
      const savedOrder = await this.getSavedOrderById(savedOrderId);
      if (!savedOrder) {
        throw new Error('Saved order not found');
      }

      // Calculate change
      const change = Math.max(paymentAmount - savedOrder.total, 0);
      
      if (paymentAmount < savedOrder.total) {
        throw new Error(`Insufficient payment. Required: ${savedOrder.total}, Provided: ${paymentAmount}`);
      }

      // Update the transaction to be paid
            const paidTransaction = {
              ...savedOrder,
              payments: [{ method: paymentMethod, amount: paymentAmount }],
              change,
              status: 'paid' as const,
              paidAt: new Date(),
              updatedAt: new Date(),
              shiftId: savedOrder.shiftId // Preserve the shiftId
            };

      // Update in database
            await db.transactions.update(savedOrderId, {
              payments: paidTransaction.payments,
              change: paidTransaction.change,
              status: paidTransaction.status,
              paidAt: paidTransaction.paidAt,
              updatedAt: paidTransaction.updatedAt,
              shiftId: paidTransaction.shiftId
            });

      // Get the updated transaction
      const finalTransaction = await db.transactions.get(savedOrderId);

      // Deduct stock after successful payment
      if (finalTransaction) {
        await TransactionService.deductStock(finalTransaction);
      }

      return finalTransaction || null;
    } catch (error) {
      throw new Error(`Failed to convert saved order to paid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Count saved orders
  static async countSavedOrders(): Promise<number> {
    try {
      const savedOrders = await this.getAllSavedOrders();
      return savedOrders.length;
    } catch (error) {
      throw new Error(`Failed to count saved orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}