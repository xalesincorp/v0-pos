import { Transaction, Customer, Product } from '../db';
import {
  validateTransaction,
  validateCustomer,
  validateProduct,
  safeValidateTransaction,
  safeValidateCustomer,
  safeValidateProduct
} from '../utils/validators';

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

// Helper function to clean up customer data
function cleanCustomerData(data: any): Customer {
  return {
    ...data,
    phone: data.phone || null,
    gender: data.gender || null,
    deletedAt: data.deletedAt || null,
  };
}

// Helper function to clean up product data
function cleanProductData(data: any): Product {
  return {
    ...data,
    sku: data.sku || null,
    image: data.image || null,
    deletedAt: data.deletedAt || null,
  };
}

export class ValidationService {
  // Validate transaction data
  static validateTransactionData(data: unknown): { success: boolean; data?: Transaction; error?: string } {
    try {
      const result = safeValidateTransaction(data);
      if (result.success) {
        return { success: true, data: cleanTransactionData(result.data) };
      } else {
        return { success: false, error: result.error.message };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown validation error' };
    }
  }

  // Validate customer data
  static validateCustomerData(data: unknown): { success: boolean; data?: Customer; error?: string } {
    try {
      const result = safeValidateCustomer(data);
      if (result.success) {
        return { success: true, data: cleanCustomerData(result.data) };
      } else {
        return { success: false, error: result.error.message };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown validation error' };
    }
  }

  // Validate product data
  static validateProductData(data: unknown): { success: boolean; data?: Product; error?: string } {
    try {
      const result = safeValidateProduct(data);
      if (result.success) {
        return { success: true, data: cleanProductData(result.data) };
      } else {
        return { success: false, error: result.error.message };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown validation error' };
    }
  }

  // Validate payment data
  static validatePaymentData(payment: { method: string; amount: number }): { success: boolean; error?: string } {
    if (!['cash', 'ewallet', 'qris'].includes(payment.method)) {
      return { success: false, error: `Invalid payment method: ${payment.method}. Must be cash, ewallet, or qris` };
    }

    if (typeof payment.amount !== 'number' || payment.amount < 0) {
      return { success: false, error: 'Payment amount must be a non-negative number' };
    }

    return { success: true };
  }

  // Validate discount data
  static validateDiscountData(discount: { type: string; value: number }): { success: boolean; error?: string } {
    if (!['percent', 'nominal'].includes(discount.type)) {
      return { success: false, error: `Invalid discount type: ${discount.type}. Must be percent or nominal` };
    }

    if (typeof discount.value !== 'number' || discount.value < 0) {
      return { success: false, error: 'Discount value must be a non-negative number' };
    }

    if (discount.type === 'percent' && discount.value > 100) {
      return { success: false, error: 'Percentage discount cannot exceed 100%' };
    }

    return { success: true };
  }

  // Validate tax data
  static validateTaxData(tax: { enabled: boolean; rate: number }): { success: boolean; error?: string } {
    if (typeof tax.enabled !== 'boolean') {
      return { success: false, error: 'Tax enabled must be a boolean' };
    }

    if (tax.enabled && (typeof tax.rate !== 'number' || tax.rate < 0 || tax.rate > 100)) {
      return { success: false, error: 'Tax rate must be a number between 0 and 100' };
    }

    return { success: true };
  }

  // Validate cart items
  static validateCartItems(items: { productId: string; name: string; qty: number; price: number; subtotal: number }[]): { success: boolean; error?: string } {
    if (!Array.isArray(items)) {
      return { success: false, error: 'Items must be an array' };
    }

    for (const [index, item] of items.entries()) {
      if (!item.productId) {
        return { success: false, error: `Item at index ${index} is missing productId` };
      }
      
      if (!item.name) {
        return { success: false, error: `Item at index ${index} is missing name` };
      }
      
      if (typeof item.qty !== 'number' || item.qty <= 0) {
        return { success: false, error: `Item at index ${index} quantity must be a positive number` };
      }
      
      if (typeof item.price !== 'number' || item.price < 0) {
        return { success: false, error: `Item at index ${index} price must be a non-negative number` };
      }
      
      if (typeof item.subtotal !== 'number' || item.subtotal < 0) {
        return { success: false, error: `Item at index ${index} subtotal must be a non-negative number` };
      }
    }

    return { success: true };
  }

  // Validate transaction totals
  static validateTransactionTotals(transaction: Transaction): { success: boolean; error?: string } {
    // Calculate expected subtotal
    const expectedSubtotal = transaction.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    if (Math.abs(transaction.subtotal - expectedSubtotal) > 0.01) { // Allow for small floating point differences
      return { success: false, error: `Subtotal mismatch: calculated ${expectedSubtotal}, but got ${transaction.subtotal}` };
    }

    // Calculate expected total
    const discountAmount = transaction.discount.type === 'percent' 
      ? (transaction.subtotal * transaction.discount.value) / 100 
      : Math.min(transaction.discount.value, transaction.subtotal);
    
    const taxAmount = transaction.tax.enabled 
      ? ((transaction.subtotal - discountAmount) * transaction.tax.rate) / 100 
      : 0;
    
    const expectedTotal = transaction.subtotal - discountAmount + taxAmount;
    
    if (Math.abs(transaction.total - expectedTotal) > 0.01) {
      return { success: false, error: `Total mismatch: calculated ${expectedTotal}, but got ${transaction.total}` };
    }

    return { success: true };
  }
}