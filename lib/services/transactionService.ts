import { db, Transaction } from '../db';
import { validateTransaction, safeValidateTransaction } from '../utils/validators';
import { v7 as uuidv7 } from 'uuid';
import { Product } from '../db';

// Helper function to clean up validation result and ensure proper null values
function cleanTransactionData(data: any): Transaction {
  return {
    ...data,
    customerId: data.customerId || null,
    savedAt: data.savedAt || null,
    paidAt: data.paidAt || null,
    deletedAt: data.deletedAt || null,
  };
}

// Transaction Service with full CRUD operations
export class TransactionService {
  // Create a new transaction
 static async create(transactionData: Omit<Transaction, 'id' | 'transactionNumber' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Transaction> {
    try {
      // Ensure all optional fields have proper values
      const transactionToCreate: Transaction = {
              ...transactionData,
              customerId: transactionData.customerId || null,
              shiftId: transactionData.shiftId || null, // Include shiftId
              savedAt: transactionData.savedAt || null,
              paidAt: transactionData.paidAt || null,
              deletedAt: null,
              id: uuidv7(),
              transactionNumber: this.generateTransactionNumber(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };
      
      // Validate the transaction data
      const validation = safeValidateTransaction(transactionToCreate);
      
      if (!validation.success) {
        throw new Error(`Transaction validation failed: ${validation.error.message}`);
      }
      
      // Clean the validation result to ensure proper null values
      const cleanedData = cleanTransactionData(validation.data);
      
      // Add to database
      const id = await db.transactions.add(cleanedData);
      
      // Return the created transaction
      return { ...cleanedData, id };
    } catch (error) {
      throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate transaction number in TRX-YYYYMMDD-XXXX format
  static generateTransactionNumber(): string {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    
    // Generate a unique 4-digit number
    const randomNum = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    
    return `TRX-${dateStr}-${randomNum}`;
  }

  // Get transaction by ID
  static async getById(id: string): Promise<Transaction | null> {
    try {
      const transaction = await db.transactions.get(id);
      return transaction || null;
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

 // Get all transactions with optional filters
 static async getAll(
   filters?: {
     status?: 'paid' | 'unpaid' | 'saved';
     customerId?: string;
     dateFrom?: Date;
     dateTo?: Date;
   }
 ): Promise<Transaction[]> {
   try {
     // Build the query with all filters
     let query = db.transactions;
     
     // Apply all filters using filter method
     const transactions = await query.filter(tx => {
       // Check status filter
       if (filters?.status && tx.status !== filters.status) {
         return false;
       }
       // Check customerId filter
       if (filters?.customerId && tx.customerId !== filters.customerId) {
         return false;
       }
       // Check dateFrom filter
       if (filters?.dateFrom && tx.createdAt < filters.dateFrom) {
         return false;
       }
       // Check dateTo filter
       if (filters?.dateTo && tx.createdAt > filters.dateTo) {
         return false;
       }
       return true;
     }).toArray();
     
     // Sort by createdAt in descending order
     return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
   } catch (error) {
     throw new Error(`Failed to get transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
   }
 }

  // Update transaction
  static async update(id: string, updateData: Partial<Transaction>): Promise<Transaction | null> {
    try {
      // Get the existing transaction
      const existingTransaction = await db.transactions.get(id);
      if (!existingTransaction) {
        return null;
      }

      // Prepare updated transaction data
      const updatedTransaction = {
              ...existingTransaction,
              ...updateData,
              shiftId: updateData.shiftId !== undefined ? updateData.shiftId : existingTransaction.shiftId, // Preserve shiftId if not explicitly updated
              updatedAt: new Date()
            };

      // Validate the updated data
      const validation = safeValidateTransaction(updatedTransaction);
      if (!validation.success) {
        throw new Error(`Transaction validation failed: ${validation.error.message}`);
      }

      // Clean the validation result to ensure proper null values
      const cleanedData = cleanTransactionData(validation.data);

      // Update in database - only update the fields that have changed
      await db.transactions.update(id, {
        ...cleanedData,
        id: undefined // Don't update the id field
      });
      
      // Return updated transaction
      return { ...cleanedData, id };
    } catch (error) {
      throw new Error(`Failed to update transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Soft delete transaction
  static async delete(id: string): Promise<boolean> {
    try {
      const result = await db.transactions.update(id, { deletedAt: new Date() });
      // Dexie's update method returns a Promise<number> indicating the number of updated records
      return result > 0;
    } catch (error) {
      throw new Error(`Failed to delete transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Hard delete transaction (only for development/testing)
  static async hardDelete(id: string): Promise<boolean> {
    try {
      await db.transactions.delete(id);
      return true; // Assuming deletion was successful if no error was thrown
    } catch (error) {
      throw new Error(`Failed to hard delete transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get deleted transactions
  static async getDeleted(): Promise<Transaction[]> {
    try {
      const deletedTransactions = await db.transactions.filter(tx => tx.deletedAt !== null).toArray();
      return deletedTransactions;
    } catch (error) {
      throw new Error(`Failed to get deleted transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Restore soft deleted transaction
 static async restore(id: string): Promise<boolean> {
    try {
      await db.transactions.update(id, { deletedAt: null });
      return true; // Assuming restoration was successful if no error was thrown
    } catch (error) {
      throw new Error(`Failed to restore transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Calculate discount amount based on type and value
  static calculateDiscount(subtotal: number, discount: { type: 'percent' | 'nominal'; value: number }): number {
    if (discount.type === 'percent') {
      return (subtotal * discount.value) / 100;
    } else {
      return Math.min(discount.value, subtotal); // Don't allow discount to exceed subtotal
    }
  }

 // Calculate tax amount
  static calculateTax(subtotal: number, discountAmount: number, tax: { enabled: boolean; rate: number }): number {
    if (!tax.enabled) return 0;
    const baseAmount = subtotal - discountAmount;
    return (baseAmount * tax.rate) / 100;
  }

  // Calculate total amount
  static calculateTotal(subtotal: number, discount: { type: 'percent' | 'nominal'; value: number }, tax: { enabled: boolean; rate: number }): number {
    const discountAmount = this.calculateDiscount(subtotal, discount);
    const taxAmount = this.calculateTax(subtotal, discountAmount, tax);
    return subtotal - discountAmount + taxAmount;
  }

  // Calculate change amount
  static calculateChange(total: number, paymentAmount: number): number {
    return Math.max(paymentAmount - total, 0);
  }

 // Process payment for a transaction
 static async processPayment(
   transactionId: string,
   payment: { method: 'cash' | 'ewallet' | 'qris'; amount: number }
 ): Promise<Transaction | null> {
   try {
     const existingTransaction = await db.transactions.get(transactionId);
     if (!existingTransaction) {
       throw new Error('Transaction not found');
     }

     if (existingTransaction.status === 'paid') {
       throw new Error('Transaction is already paid');
     }

     // Calculate change
     const change = this.calculateChange(existingTransaction.total, payment.amount);

     // Update transaction with payment info
     const updatedTransaction = {
             ...existingTransaction,
             payments: [...existingTransaction.payments, payment],
             change,
             status: 'paid' as const,
             paidAt: new Date(),
             updatedAt: new Date(),
             shiftId: existingTransaction.shiftId // Preserve the shiftId
           };

     // Validate updated transaction
     const validation = safeValidateTransaction(updatedTransaction);
     if (!validation.success) {
       throw new Error(`Transaction validation failed: ${validation.error.message}`);
     }

     // Clean the validation result to ensure proper null values
     const cleanedData = cleanTransactionData(validation.data);

     // Update in database - only update the fields that have changed
     await db.transactions.update(transactionId, {
       payments: cleanedData.payments,
       change: cleanedData.change,
       status: cleanedData.status,
       paidAt: cleanedData.paidAt,
       updatedAt: cleanedData.updatedAt
     });

     // Return the updated transaction
     const finalTransaction = await db.transactions.get(transactionId);
     return finalTransaction || null;
   } catch (error) {
     throw new Error(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
   }
}

  // Save transaction (for saved orders)
  static async saveTransaction(
    transactionData: Omit<Transaction, 'id' | 'transactionNumber' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'paidAt'>
  ): Promise<Transaction> {
    try {
      // Prepare the transaction object with required fields
      const transactionToSave: Transaction = {
              ...transactionData,
              customerId: transactionData.customerId || null,
              shiftId: transactionData.shiftId || null, // Include shiftId
              savedAt: transactionData.savedAt || new Date(),
              paidAt: null,
              deletedAt: null,
              id: uuidv7(),
              transactionNumber: this.generateTransactionNumber(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };
      
      // Validate the transaction data
      const validation = safeValidateTransaction(transactionToSave);
      
      if (!validation.success) {
        throw new Error(`Transaction validation failed: ${validation.error.message}`);
      }
      
      // Clean the validation result to ensure proper null values
      const cleanedData = cleanTransactionData(validation.data);
      
      // Add to database
      const id = await db.transactions.add(cleanedData);
      
      // Return the saved transaction
      return { ...cleanedData, id };
    } catch (error) {
      throw new Error(`Failed to save transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
 }

  // Deduct stock for transaction items
  static async deductStock(transaction: Transaction): Promise<void> {
    try {
      for (const item of transaction.items) {
        const product = await db.products.get(item.productId);
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        // Only update stock for products that monitor stock
        if (product.monitorStock) {
          if (product.type === 'finish_goods' || product.type === 'raw_material') {
            // Direct stock deduction
            const newStock = product.currentStock - item.qty;
            if (newStock < 0) {
              throw new Error(`Insufficient stock for product: ${product.name}`);
            }
            
            await db.products.update(product.id, {
              currentStock: newStock
            });
          } else if (product.type === 'recipe_goods') {
            // For recipe goods, calculate and deduct materials
            if (product.recipe) {
              for (const recipeItem of product.recipe) {
                const material = await db.products.get(recipeItem.materialId);
                if (material && material.monitorStock) {
                  const requiredQty = recipeItem.qty * item.qty; // qty needed * number of items sold
                  const newMaterialStock = material.currentStock - requiredQty;
                  
                  if (newMaterialStock < 0) {
                    throw new Error(`Insufficient stock for material: ${material.name}`);
                  }
                  
                  await db.products.update(material.id, {
                    currentStock: newMaterialStock
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to deduct stock: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}