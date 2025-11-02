# Database Schema and Invoice Management System Analysis

## Executive Summary
This analysis examines the existing database schema and invoice management system to prepare for implementing a Stock Return feature. The system uses a Dexie (IndexedDB) database with offline-first architecture, comprehensive invoice tracking, and robust stock movement monitoring.

## Database Schema Structure

### Core Entities and Relationships

#### 1. Products Table
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `name`, `type` (finish_goods, recipe_goods, raw_material)
  - `categoryId` (FK to categories.id)
  - `sku`, `price`, `cost` (HPP/Average Cost)
  - `currentStock` (real stock for finish_goods/raw_material)
  - `minStock`, `monitorStock`
  - `uom` (unit of measure with conversions)
  - `recipe` (for recipe_goods type)
- **Soft Delete**: `deletedAt` timestamp
- **Audit Trail**: `createdAt`, `updatedAt`, `createdBy`

#### 2. Suppliers Table
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `name` (required)
  - `phone`, `address` (optional)
  - `createdBy` (FK to users.id)
- **Soft Delete**: `deletedAt` timestamp

#### 3. Invoices Table (Purchase Invoices)
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `invoiceNumber` (auto-generated: `INV-${timestamp}`)
  - `supplierId` (FK to suppliers.id)
  - `shiftId` (optional FK to cashierShifts.id)
  - `items` (array of {productId, qty, unitPrice, total})
  - `subtotal`, `total`
  - `paymentMethod` ('kas_outlet' | 'bank')
  - `paymentType` ('cash' | 'non_cash')
  - `paymentStatus` ('lunas' | 'belum_lunas' | 'bayar_sebagian')
  - `paidAmount`, `remainingDebt`
  - `paymentDate` (nullable)
- **Soft Delete**: `deletedAt` timestamp

#### 4. Stock Movement Tables

##### StockOpname Table
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `items` (array of {productId, systemStock, actualStock, variance})
  - `notes`
  - `shiftId` (optional)

##### StockWaste Table
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `productId` (FK to products.id)
  - `qty`, `unit`, `reason`
  - `shiftId` (optional)

#### 5. Supporting Tables
- **Categories**: Product categorization
- **Transactions**: Sales transactions (for stock decrease)
- **CashierShifts**: Operational shift tracking
- **Users**: User management
- **Settings**: System configuration
- **Notifications**: System notifications

### Database Version History
- **Version 1**: Initial schema
- **Version 2**: Added soft deletes (deletedAt field)
- **Version 3**: Added phone field to suppliers, shiftId to transactions
- **Version 4**: Added shiftId to invoices, stockOpnames, stockWastes
- **Version 5**: Added paymentStatus to invoices
- **Version 6**: Current version with value/updatedBy fields in settings

## Invoice Management System

### Core Components

#### 1. InvoiceDetails Component (`components/inventory/invoice-details.tsx`)
- **Purpose**: Main invoice listing and management interface
- **Features**:
  - Invoice listing with search functionality
  - Payment status tracking (lunas, bayar_sebagian, belum_lunas)
  - Supplier information display
  - Invoice detail modal view
  - Payment update functionality
  - Soft delete implementation

#### 2. PurchaseInvoiceForm Component (`components/inventory/purchase-invoice-form.tsx`)
- **Purpose**: Create new purchase invoices
- **Features**:
  - Supplier selection
  - Product selection with quantity and pricing
  - Payment method selection (cash/non-cash)
  - Payment amount and date tracking
  - Automatic stock updates on save

#### 3. UpdatePaymentModal Component
- **Purpose**: Update invoice payment status
- **Features**:
  - Partial payment tracking
  - Payment date recording
  - Automatic status calculation (lunas/bayar_sebagian/belum_lunas)

### Invoice Store Management (`lib/stores/productStore.ts`)

#### Key Functions:
- `addPurchaseInvoice()`: Creates invoices and updates stock
- `updateInvoicePayment()`: Handles payment updates
- `fetchInvoices()`: Retrieves active invoices
- Stock integration: Automatically updates product stock on invoice creation

#### Stock Update Logic:
```typescript
// From productStore.ts (lines 345-364)
for (const item of invoiceData.items) {
  const product = await db.products.get(item.productId);
  if (product) {
    const newCurrentStock = (product.currentStock || 0) + item.qty;
    // Update HPP (Average Cost) calculation
    let newCost = product.cost;
    if (product.cost === 0) {
      newCost = item.unitPrice;
    } else {
      const totalValue = (product.currentStock * product.cost) + (item.qty * item.unitPrice);
      newCost = totalValue / newCurrentStock;
    }
    
    await db.products.update(item.productId, {
      currentStock: newCurrentStock,
      cost: newCost,
      updatedAt: new Date()
    });
  }
}
```

## Stock Tracking Mechanisms

### StockHistoryService (`lib/services/stockHistoryService.ts`)

#### Stock Movement Types:
1. **Purchase** (type: 'purchase')
   - Source: invoices table
   - Effect: Increases stock
   - Reference: invoice.id

2. **Sale** (type: 'sale')
   - Source: transactions table
   - Effect: Decreases stock
   - Reference: transaction.id

3. **Opname** (type: 'opname')
   - Source: stockOpnames table
   - Effect: Adjusts to actual stock
   - Reference: stockOpname.id

4. **Waste** (type: 'waste')
   - Source: stockWastes table
   - Effect: Decreases stock
   - Reference: stockWastes.id

#### Stock Movement Structure:
```typescript
interface StockMovement {
  id: string;
  type: 'purchase' | 'sale' | 'opname' | 'waste' | 'adjustment';
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
  referenceType: 'invoice' | 'transaction' | 'opname' | 'waste';
  createdAt: Date;
  createdBy: string;
}
```

### Stock Tracking Components

#### 1. StockList Component (`components/inventory/stock-list.tsx`)
- **Purpose**: Display current stock levels
- **Features**:
  - Product stock display with search/filter
  - Low stock alerts
  - Category filtering
  - Stock status badges

#### 2. StockMovementTracker (referenced in codebase)
- **Purpose**: Track stock movements
- **Features**: (Implementation details not fully analyzed)

## Supplier Management System

### SupplierStore Integration (`lib/stores/productStore.ts`)

#### Key Functions:
- `fetchSuppliers()`: Retrieves active suppliers
- `addSupplier()`: Creates new suppliers
- `updateSupplier()`: Updates supplier information
- `deleteSupplier()`: Soft deletes suppliers
- `searchSuppliers()`: Search functionality

### Supplier Components

#### SupplierList Component (`components/inventory/supplier-list.tsx`)
- **Purpose**: Manage supplier information
- **Features**:
  - Supplier listing with search
  - Add/edit/delete suppliers
  - Contact information management
  - Form validation

## System Architecture Insights

### Data Flow
1. **Invoice Creation**:
   - User creates invoice with supplier and products
   - System calculates totals and payment status
   - Invoice saved to database
   - Product stock automatically updated
   - HPP (Average Cost) recalculated

2. **Stock Movement Tracking**:
   - Every stock change recorded through dedicated tables
   - StockHistoryService aggregates movements for reporting
   - Movements categorized by type and source

3. **Payment Tracking**:
   - Payment status automatically calculated
   - Remaining debt tracked
   - Payment dates recorded

### Current Limitations for Stock Returns
1. **No Return Tracking**: No dedicated table for stock returns
2. **No Reverse Stock Movement**: No mechanism to decrease stock with return reference
3. **No Supplier Credit**: No tracking of supplier credits/returns
4. **No Return Documentation**: No UI for processing returns

## Recommendations for Stock Return Feature

### Database Schema Additions Needed:
1. **stock_returns** table:
   - id, referenceInvoiceId, supplierId, reason, status
   - items (array of {productId, qty, unitPrice, total})
   - returnDate, processedBy, processedAt

2. **stock_return_items** table (if normalized):
   - id, returnId, productId, qty, unitPrice, total

### Service Layer Additions:
1. **stockReturnService**: Handle return operations
2. **supplierCreditService**: Track supplier credits/debits
3. **Return UI Components**: Forms and listing interfaces

### Integration Points:
1. **ProductStore**: Add return processing functions
2. **StockHistoryService**: Extend with return movement type
3. **InvoiceDetails**: Add return reference display
4. **Supplier Management**: Show outstanding credits

## Conclusion

The existing system provides a solid foundation for implementing stock returns with:
- ✅ Robust invoice management
- ✅ Comprehensive stock tracking
- ✅ Supplier management
- ✅ Payment tracking
- ✅ Audit trails and soft deletes

The main gaps are:
- ❌ No return-specific data structures
- ❌ No UI for return processing
- ❌ No supplier credit tracking

The Stock Return feature can be implemented by extending the existing patterns used for invoice creation and stock movements, with proper integration into the current supplier and invoice management workflows.