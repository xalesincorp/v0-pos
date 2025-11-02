export interface Discount {
  type: 'percent' | 'nominal';
  value: number;
  amount: number;
}

export interface Tax {
  enabled: boolean;
  rate: number;
  amount: number;
}

export interface Payment {
  method: 'cash' | 'ewallet' | 'qris';
  amount: number;
}

export class CalculationService {
  // Calculate discount amount based on type and value
  static calculateDiscount(subtotal: number, discount: { type: 'percent' | 'nominal'; value: number }): number {
    if (discount.type === 'percent') {
      return (subtotal * discount.value) / 100;
    } else {
      return Math.min(discount.value, subtotal); // Don't allow discount to exceed subtotal
    }
  }

  // Calculate tax amount
  static calculateTax(subtotal: number, discountAmount: number, tax: { enabled: boolean; rate: number; timing?: 'before_discount' | 'after_discount' | 'included' }): number {
    if (!tax.enabled) return 0;
    
    let baseAmount = subtotal;
    
    // Apply tax timing logic
    if (tax.timing === 'before_discount' || !tax.timing) {
      // Tax calculated before discount
      baseAmount = subtotal;
    } else if (tax.timing === 'after_discount') {
      // Tax calculated after discount
      baseAmount = subtotal - discountAmount;
    } else if (tax.timing === 'included') {
      // Tax is already included in the price
      baseAmount = subtotal;
    }
    
    return (baseAmount * tax.rate) / 100;
  }

  // Calculate total amount
  static calculateTotal(subtotal: number, discount: { type: 'percent' | 'nominal'; value: number }, tax: { enabled: boolean; rate: number; timing?: 'before_discount' | 'after_discount' | 'included' }): number {
    const discountAmount = this.calculateDiscount(subtotal, discount);
    const taxAmount = this.calculateTax(subtotal, discountAmount, tax);
    
    // Handle included tax case - tax is already in the subtotal
    if (tax.timing === 'included' && tax.enabled) {
      return subtotal - discountAmount;
    }
    
    return subtotal - discountAmount + taxAmount;
  }

  // Calculate change amount
  static calculateChange(total: number, paymentAmount: number): number {
    return Math.max(paymentAmount - total, 0);
  }

  // Calculate total for items
  static calculateSubtotal(items: { qty: number; price: number }[]): number {
    return items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  }

  // Format currency for display
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // Calculate item subtotal
  static calculateItemSubtotal(qty: number, price: number): number {
    return qty * price;
  }

  // Calculate tax amount based on tax settings
  static calculateTaxAmount(subtotal: number, discountAmount: number, taxRate: number): number {
    const baseAmount = subtotal - discountAmount;
    return (baseAmount * taxRate) / 100;
  }

  // Calculate discount amount based on discount settings
 static calculateDiscountAmount(subtotal: number, discountType: 'percent' | 'nominal', discountValue: number): number {
    if (discountType === 'percent') {
      return (subtotal * discountValue) / 100;
    } else {
      return Math.min(discountValue, subtotal);
    }
  }

  // Validate discount settings
  static validateDiscount(discountType: 'percent' | 'nominal', discountValue: number): boolean {
    if (discountType === 'percent') {
      return discountValue >= 0 && discountValue <= 100;
    } else {
      return discountValue >= 0;
    }
  }

  // Validate tax rate
 static validateTaxRate(taxRate: number): boolean {
    return taxRate >= 0 && taxRate <= 100; // Max 100% tax
  }

  // Validate payment amount
  static validatePaymentAmount(paymentAmount: number, total: number): boolean {
    return paymentAmount >= total;
  }

  // Calculate payment change
  static calculatePaymentChange(paymentAmount: number, total: number): number {
    if (paymentAmount < total) {
      throw new Error('Payment amount is less than total');
    }
    return paymentAmount - total;
 }

  // Calculate split payment
  static calculateSplitPayment(total: number, methods: { method: string; amount: number }[]): { method: string; amount: number }[] {
    const remaining = total;
    const calculatedPayments: { method: string; amount: number }[] = [];

    for (const payment of methods) {
      if (remaining <= 0) break;

      const amountToPay = Math.min(payment.amount, remaining);
      calculatedPayments.push({
        method: payment.method,
        amount: amountToPay
      });
    }

    return calculatedPayments;
  }
}