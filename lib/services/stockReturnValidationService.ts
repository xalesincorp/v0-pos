import { db, Invoice, Product, Supplier } from '../db';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ReturnValidationData {
  supplierId: string;
  originalInvoiceId: string;
  returnItems: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes?: string;
}

export class StockReturnValidationService {
  
  /**
   * Validate complete return data
   */
  static async validateReturnData(data: ReturnValidationData): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // 1. Validate supplier exists and is active
      const supplierValidation = await this.validateSupplier(data.supplierId);
      if (!supplierValidation.isValid) {
        errors.push(...supplierValidation.errors);
      }
      
      // 2. Validate original invoice exists and belongs to supplier
      const invoiceValidation = await this.validateOriginalInvoice(
        data.originalInvoiceId, 
        data.supplierId
      );
      if (!invoiceValidation.isValid) {
        errors.push(...invoiceValidation.errors);
      }
      
      // 3. Validate return items
      const itemsValidation = await this.validateReturnItems(
        data.originalInvoiceId, 
        data.returnItems
      );
      if (!itemsValidation.isValid) {
        errors.push(...itemsValidation.errors);
      } else {
        warnings.push(...itemsValidation.warnings);
      }
      
      // 4. Validate return amount against invoice
      const amountValidation = await this.validateReturnAmount(
        data.originalInvoiceId, 
        data.returnItems
      );
      if (!amountValidation.isValid) {
        warnings.push(...amountValidation.warnings);
      }
      
      // 5. Business rule validations
      const businessValidation = this.validateBusinessRules(data);
      errors.push(...businessValidation.errors);
      warnings.push(...businessValidation.warnings);
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
      
    } catch (error) {
      console.error('Error validating return data:', error);
      return {
        isValid: false,
        errors: ['Validation system error occurred'],
        warnings: []
      };
    }
  }
  
  /**
   * Validate supplier exists and is not deleted
   */
  private static async validateSupplier(supplierId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!supplierId) {
      errors.push('Supplier ID is required');
      return { isValid: false, errors, warnings };
    }
    
    const supplier = await db.suppliers.get(supplierId);
    if (!supplier) {
      errors.push('Supplier not found');
      return { isValid: false, errors, warnings };
    }
    
    if (supplier.deletedAt) {
      errors.push('Cannot create return for deleted supplier');
      return { isValid: false, errors, warnings };
    }
    
    if (!supplier.name || supplier.name.trim() === '') {
      errors.push('Supplier must have a valid name');
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }
  
  /**
   * Validate original invoice exists and belongs to the supplier
   */
  private static async validateOriginalInvoice(
    invoiceId: string, 
    supplierId: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!invoiceId) {
      errors.push('Original invoice ID is required');
      return { isValid: false, errors, warnings };
    }
    
    const invoice = await db.invoices.get(invoiceId);
    if (!invoice) {
      errors.push('Original invoice not found');
      return { isValid: false, errors, warnings };
    }
    
    if (invoice.deletedAt) {
      errors.push('Cannot create return for deleted invoice');
      return { isValid: false, errors, warnings };
    }
    
    if (invoice.supplierId !== supplierId) {
      errors.push('Invoice does not belong to the specified supplier');
      return { isValid: false, errors, warnings };
    }
    
    // Check if invoice has items
    if (!invoice.items || invoice.items.length === 0) {
      errors.push('Invoice has no items to return');
      return { isValid: false, errors, warnings };
    }
    
    // Warning if invoice is old (more than 30 days)
    const invoiceAge = Date.now() - invoice.createdAt.getTime();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    if (invoiceAge > thirtyDaysInMs) {
      warnings.push('Invoice is more than 30 days old - returns may not be accepted');
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }
  
  /**
   * Validate return items against original invoice
   */
  private static async validateReturnItems(
    invoiceId: string, 
    returnItems: { productId: string; quantity: number; unitPrice: number }[]
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!returnItems || returnItems.length === 0) {
      errors.push('At least one return item is required');
      return { isValid: false, errors, warnings };
    }
    
    const invoice = await db.invoices.get(invoiceId);
    if (!invoice) {
      errors.push('Invoice not found during item validation');
      return { isValid: false, errors, warnings };
    }
    
    for (let i = 0; i < returnItems.length; i++) {
      const returnItem = returnItems[i];
      const itemIndex = i + 1;
      
      // Validate quantity
      if (returnItem.quantity <= 0) {
        errors.push(`Return item ${itemIndex}: Quantity must be greater than 0`);
        continue;
      }
      
      if (returnItem.quantity > 999999) {
        errors.push(`Return item ${itemIndex}: Quantity is too large`);
        continue;
      }
      
      // Check if product exists in invoice
      const invoiceItem = invoice.items.find(item => item.productId === returnItem.productId);
      if (!invoiceItem) {
        errors.push(`Return item ${itemIndex}: Product not found in original invoice`);
        continue;
      }
      
      // Validate quantity doesn't exceed invoice quantity
      if (returnItem.quantity > invoiceItem.qty) {
        errors.push(
          `Return item ${itemIndex}: Return quantity (${returnItem.quantity}) exceeds invoice quantity (${invoiceItem.qty})`
        );
      }
      
      // Validate unit price (allow small variance)
      const priceVariance = Math.abs(returnItem.unitPrice - invoiceItem.unitPrice);
      const priceVariancePercent = (priceVariance / invoiceItem.unitPrice) * 100;
      
      if (priceVariancePercent > 5) {
        warnings.push(
          `Return item ${itemIndex}: Unit price differs significantly from invoice (Invoice: ${invoiceItem.unitPrice}, Return: ${returnItem.unitPrice})`
        );
      }
      
      // Validate product exists in products table
      const product = await db.products.get(returnItem.productId);
      if (!product) {
        errors.push(`Return item ${itemIndex}: Product not found in product catalog`);
      }
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }
  
  /**
   * Validate return amount against original invoice
   */
  private static async validateReturnAmount(
    invoiceId: string, 
    returnItems: { productId: string; quantity: number; unitPrice: number }[]
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const invoice = await db.invoices.get(invoiceId);
    if (!invoice) {
      return { isValid: false, errors: ['Invoice not found'], warnings };
    }
    
    // Calculate return total
    const returnTotal = returnItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    // Calculate remaining invoice amount after return
    const invoiceTotal = invoice.total;
    const remainingAmount = invoiceTotal - returnTotal;
    
    // Warning if return is more than 80% of invoice
    const returnPercentage = (returnTotal / invoiceTotal) * 100;
    if (returnPercentage > 80) {
      warnings.push(`Return amount is ${returnPercentage.toFixed(1)}% of invoice total - verify this is correct`);
    }
    
    // Warning if return would make remaining amount negative
    if (returnTotal > invoiceTotal) {
      warnings.push('Return amount exceeds invoice total - this may indicate an error');
    }
    
    return { isValid: true, errors, warnings };
  }
  
  /**
   * Validate business rules
   */
  private static validateBusinessRules(data: ReturnValidationData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for duplicate products in return items
    const productIds = data.returnItems.map(item => item.productId);
    const uniqueProductIds = [...new Set(productIds)];
    
    if (productIds.length !== uniqueProductIds.length) {
      errors.push('Duplicate products found in return items');
    }
    
    // Check total return amount reasonableness
    const totalAmount = data.returnItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    if (totalAmount <= 0) {
      errors.push('Total return amount must be greater than 0');
    }
    
    if (totalAmount > 100000000) {
      errors.push('Total return amount is unusually high - verify this is correct');
    }
    
    // Check for meaningful notes
    if (data.notes && data.notes.trim().length > 0) {
      if (data.notes.length > 1000) {
        warnings.push('Notes are quite long - consider providing more concise information');
      }
      
      if (totalAmount > 10000 && data.notes.length < 10) {
        warnings.push('High value return should include detailed notes');
      }
    } else {
      warnings.push('Consider adding notes for the return');
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }
  
  /**
   * Validate product availability for return
   */
  static async validateProductAvailability(
    returnItems: { productId: string; quantity: number }[]
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (let i = 0; i < returnItems.length; i++) {
      const returnItem = returnItems[i];
      const itemIndex = i + 1;
      
      const product = await db.products.get(returnItem.productId);
      if (!product) {
        errors.push(`Return item ${itemIndex}: Product not found in catalog`);
        continue;
      }
      
      // Check if product has sufficient current stock for return
      if (product.currentStock < returnItem.quantity) {
        warnings.push(
          `Return item ${itemIndex}: Current stock (${product.currentStock}) is less than return quantity (${returnItem.quantity})`
        );
      }
      
      // Check if product is active
      if (product.deletedAt) {
        errors.push(`Return item ${itemIndex}: Cannot return deleted product`);
      }
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }
  
  /**
   * Validate return processing permissions
   */
  static validateReturnPermissions(
    userRole: string, 
    totalAmount: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Role-based validations
    if (userRole !== 'owner' && totalAmount > 100000) {
      warnings.push('High value returns may require owner approval');
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }
}