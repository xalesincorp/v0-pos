import { Transaction, db } from '../db';
import { TransactionService } from './transactionService';

export interface PaymentMethod {
  method: 'cash' | 'ewallet' | 'qris';
  amount: number;
}

export interface PaymentResult {
  transaction: Transaction | null;
  change: number;
 success: boolean;
  message: string;
}

export class PaymentService {
  // Process payment for a transaction
  static async processPayment(
    transactionId: string,
    payment: PaymentMethod
  ): Promise<PaymentResult> {
    try {
      const transaction = await db.transactions.get(transactionId);
      if (!transaction) {
        return {
          transaction: null,
          change: 0,
          success: false,
          message: 'Transaction not found'
        };
      }

      if (transaction.status === 'paid') {
        return {
          transaction: null,
          change: 0,
          success: false,
          message: 'Transaction is already paid'
        };
      }

      // Calculate if the payment amount is sufficient
      if (payment.amount < transaction.total) {
        return {
          transaction: null,
          change: 0,
          success: false,
          message: `Insufficient payment. Required: ${transaction.total}, Provided: ${payment.amount}`
        };
      }

      // Calculate change
      const change = TransactionService.calculateChange(transaction.total, payment.amount);

      // Update transaction with payment info
      const updatedTransaction = {
              ...transaction,
              payments: [...transaction.payments, payment],
              change,
              status: 'paid' as const,
              paidAt: new Date(),
              updatedAt: new Date(),
              shiftId: transaction.shiftId // Preserve the shiftId
            };

      // Validate and clean the transaction data
      const cleanedData = this.cleanTransactionData(updatedTransaction);

      // Update in database
            await db.transactions.update(transactionId, {
              payments: cleanedData.payments,
              change: cleanedData.change,
              status: cleanedData.status,
              paidAt: cleanedData.paidAt,
              updatedAt: cleanedData.updatedAt,
              shiftId: cleanedData.shiftId
            });

      // Get the updated transaction
      const finalTransaction = await db.transactions.get(transactionId);

      // Deduct stock after successful payment
      if (finalTransaction) {
        await TransactionService.deductStock(finalTransaction);
      }

      return {
        transaction: finalTransaction || null,
        change,
        success: true,
        message: 'Payment processed successfully'
      };
    } catch (error) {
      return {
        transaction: null,
        change: 0,
        success: false,
        message: `Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Helper function to clean transaction data
    private static cleanTransactionData(data: any): Transaction {
      return {
        ...data,
        customerId: data.customerId || null,
        shiftId: data.shiftId || null,
        savedAt: data.savedAt || null,
        paidAt: data.paidAt || null,
        deletedAt: data.deletedAt || null,
      };
    }

  // Process multiple payment methods for a single transaction
 static async processMultiplePayments(
    transactionId: string,
    payments: PaymentMethod[]
  ): Promise<PaymentResult> {
    try {
      const transaction = await db.transactions.get(transactionId);
      if (!transaction) {
        return {
          transaction: null,
          change: 0,
          success: false,
          message: 'Transaction not found'
        };
      }

      if (transaction.status === 'paid') {
        return {
          transaction: null,
          change: 0,
          success: false,
          message: 'Transaction is already paid'
        };
      }

      // Calculate total payment amount
      const totalPayment = payments.reduce((sum, payment) => sum + payment.amount, 0);

      // Check if total payment is sufficient
      if (totalPayment < transaction.total) {
        return {
          transaction: null,
          change: 0,
          success: false,
          message: `Insufficient payment. Required: ${transaction.total}, Provided: ${totalPayment}`
        };
      }

      // Calculate change
      const change = totalPayment - transaction.total;

      // Update transaction with all payment methods
      const updatedTransaction = {
              ...transaction,
              payments: [...transaction.payments, ...payments],
              change,
              status: 'paid' as const,
              paidAt: new Date(),
              updatedAt: new Date(),
              shiftId: transaction.shiftId // Preserve the shiftId
            };

      // Validate and clean the transaction data
      const cleanedData = this.cleanTransactionData(updatedTransaction);

      // Update in database
            await db.transactions.update(transactionId, {
              payments: cleanedData.payments,
              change: cleanedData.change,
              status: cleanedData.status,
              paidAt: cleanedData.paidAt,
              updatedAt: cleanedData.updatedAt,
              shiftId: cleanedData.shiftId
            });

      // Get the updated transaction
      const finalTransaction = await db.transactions.get(transactionId);

      // Deduct stock after successful payment
      if (finalTransaction) {
        await TransactionService.deductStock(finalTransaction);
      }

      return {
        transaction: finalTransaction || null,
        change,
        success: true,
        message: 'Payment processed successfully'
      };
    } catch (error) {
      return {
        transaction: null,
        change: 0,
        success: false,
        message: `Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Calculate payment change
  static calculateChange(total: number, paymentAmount: number): number {
    return Math.max(paymentAmount - total, 0);
  }

  // Validate payment method
  static validatePaymentMethod(method: string): method is 'cash' | 'ewallet' | 'qris' {
    return ['cash', 'ewallet', 'qris'].includes(method);
  }

  // Validate payment amount
  static validatePaymentAmount(amount: number): boolean {
    return amount >= 0;
  }
}