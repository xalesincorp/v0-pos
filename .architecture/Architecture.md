# POS OFFLINE - FILE ARCHITECTURE & TECH STACK
## Version 1.0 - Phase 1.0 (MVP)

---

## 📋 PROJECT OVERVIEW

**Project Name**: POS Offline System  
**Type**: Progressive Web App (PWA)  
**Primary Goal**: Fully functional offline-first POS system with minimal internet dependency  
**Target Users**: UMKM (Small-Medium Business) - F&B, Retail, Service-based  

---

## 🛠️ TECH STACK

### Core Technologies
```json
{
  "framework": "React 18.x",
  "language": "JavaScript (ES6+)",
  "packageManager": "npm/yarn"
}
```

### State Management
```json
{
  "stateManagement": "Zustand 4.x",
  "reason": "Lightweight, minimal boilerplate, perfect for IndexedDB sync"
}
```

### UI & Styling
```json
{
  "uiLibrary": "shadcn/ui (Radix UI primitives)",
  "styling": "Tailwind CSS 3.x",
  "icons": "lucide-react",
  "customComponents": "Custom components when shadcn insufficient"
}
```

### Database & Storage
```json
{
  "database": "IndexedDB via Dexie.js 3.x",
  "sessionStorage": "For temporary UI state",
  "localStorage": "For user preferences only"
}
```

### Authentication
```json
{
  "provider": "Supabase Auth",
  "strategy": "Online-required for initial login, 3-day offline grace period"
}
```

### Printing
```json
{
  "library": "escpos-buffer / react-thermal-printer",
  "method": "USB Printer (Phase 1.0 only)",
  "future": "Bluetooth & Network (Phase 1.5)"
}
```

### Export
```json
{
  "excel": "xlsx (SheetJS)",
  "pdf": "jsPDF + jspdf-autotable"
}
```

### Image Handling
```json
{
  "compression": "browser-image-compression",
  "format": "WebP (via Canvas API)",
  "maxSize": "200KB per image",
  "maxDimension": "800x800px"
}
```

### PWA
```json
{
  "serviceWorker": "Workbox (via CRA)",
  "manifest": "Custom manifest.json",
  "caching": "Cache-first strategy for static assets"
}
```

### Utilities
```json
{
  "uuid": "uuid v7 (time-sortable)",
  "dateTime": "date-fns",
  "validation": "zod",
  "notifications": "react-hot-toast"
}
```

---

## 📁 FOLDER STRUCTURE

```
pos-offline-app/
├── public/
│   ├── index.html
│   ├── manifest.json              # PWA manifest
│   ├── robots.txt
│   ├── favicon.ico
│   └── icons/                     # PWA icons (192x192, 512x512)
│       ├── icon-192.png
│       └── icon-512.png
│
├── src/
│   ├── index.js                   # Entry point
│   ├── App.jsx                    # Root component with routing
│   ├── index.css                  # Global Tailwind imports
│   │
│   ├── assets/                    # Static assets
│   │   ├── images/
│   │   │   ├── logo.png
│   │   │   └── placeholder-product.png
│   │   └── sounds/                # Optional: notification sounds
│   │       └── beep.mp3
│   │
│   ├── components/                # Reusable components
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.jsx
│   │   │   ├── input.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── dropdown-menu.jsx
│   │   │   ├── table.jsx
│   │   │   ├── tabs.jsx
│   │   │   ├── badge.jsx
│   │   │   ├── card.jsx
│   │   │   ├── select.jsx
│   │   │   ├── checkbox.jsx
│   │   │   ├── toast.jsx
│   │   │   ├── switch.jsx
│   │   │   └── alert.jsx
│   │   │
│   │   ├── layout/                # Layout components
│   │   │   ├── Header.jsx         # Top navigation (Notif, Menu, Lock)
│   │   │   ├── Sidebar.jsx        # Side navigation (if needed)
│   │   │   ├── MainLayout.jsx     # Wrapper layout
│   │   │   └── AuthLayout.jsx     # Login layout
│   │   │
│   │   ├── cashier/               # Cashier/POS components
│   │   │   ├── ProductGrid.jsx    # Main product grid view
│   │   │   ├── ProductCard.jsx    # Individual product card
│   │   │   ├── SummaryOrder.jsx   # Order summary sidebar
│   │   │   ├── CheckoutModal.jsx  # Checkout flow
│   │   │   ├── PaymentSelector.jsx # Payment method selection
│   │   │   ├── Calculator.jsx     # Payment calculator
│   │   │   ├── SavedOrdersList.jsx # Daftar order
│   │   │   ├── CustomerSelector.jsx # Modal to select/add customer
│   │   │   └── LockScreen.jsx     # PIN lock screen
│   │   │
│   │   ├── products/              # Product management
│   │   │   ├── ProductList.jsx    # Product table list
│   │   │   ├── ProductForm.jsx    # Add/Edit product form
│   │   │   ├── CategoryManager.jsx # Category CRUD
│   │   │   ├── RecipeBuilder.jsx  # Recipe goods builder
│   │   │   └── UOMManager.jsx     # Unit of measure setup
│   │   │
│   │   ├── inventory/             # Inventory components
│   │   │   ├── StockList.jsx      # Stock overview
│   │   │   ├── PurchaseInvoiceForm.jsx # Faktur pembelian
│   │   │   ├── StockOpnameForm.jsx # Stok opname
│   │   │   ├── WasteStockForm.jsx  # Stok terbuang
│   │   │   ├── SupplierList.jsx   # Supplier management
│   │   │   └── DebtPaymentModal.jsx # Bayar hutang
│   │   │
│   │   ├── customers/             # Customer management
│   │   │   ├── CustomerList.jsx   # Customer table
│   │   │   ├── CustomerForm.jsx   # Add/Edit customer
│   │   │   └── CustomerStats.jsx  # Customer statistics
│   │   │
│   │   ├── reports/               # Reports components
│   │   │   ├── TransactionReport.jsx # Laporan transaksi
│   │   │   ├── SalesReport.jsx    # Laporan penjualan
│   │   │   ├── CloseCashierReport.jsx # Tutup kasir
│   │   │   ├── ExportButton.jsx   # Excel/PDF export
│   │   │   └── DateRangeFilter.jsx # Date range picker
│   │   │
│   │   ├── settings/              # Settings components
│   │   │   ├── ReceiptSettings.jsx # Pengaturan struk
│   │   │   ├── TaxSettings.jsx    # Pengaturan pajak
│   │   │   ├── AccountSettings.jsx # Akun user
│   │   │   ├── BusinessSettings.jsx # Info bisnis
│   │   │   ├── DataHealth.jsx     # Archive & optimization
│   │   │   └── LanguageSwitch.jsx # Language switcher
│   │   │
│   │   ├── notifications/         # Notification system
│   │   │   ├── NotificationBell.jsx # Bell icon with badge
│   │   │   ├── NotificationPanel.jsx # Dropdown list
│   │   │   └── NotificationItem.jsx # Individual notification
│   │   │
│   │   └── common/                # Common reusable components
│   │       ├── SearchBar.jsx
│   │       ├── ConfirmDialog.jsx
│   │       ├── LoadingSpinner.jsx
│   │       ├── EmptyState.jsx
│   │       ├── ErrorBoundary.jsx
│   │       └── PinInput.jsx       # PIN input component
│   │
│   ├── pages/                     # Page components (routing)
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── ResetPassword.jsx
│   │   │
│   │   ├── cashier/
│   │   │   └── CashierPage.jsx    # Main POS page
│   │   │
│   │   ├── products/
│   │   │   └── ProductsPage.jsx
│   │   │
│   │   ├── inventory/
│   │   │   └── InventoryPage.jsx
│   │   │
│   │   ├── customers/
│   │   │   └── CustomersPage.jsx
│   │   │
│   │   ├── reports/
│   │   │   └── ReportsPage.jsx
│   │   │
│   │   └── settings/
│   │       └── SettingsPage.jsx
│   │
│   ├── stores/                    # Zustand stores
│   │   ├── authStore.js           # Auth state (user, session)
│   │   ├── cashierStore.js        # Cashier state (cart, savedOrders)
│   │   ├── productStore.js        # Products cache
│   │   ├── inventoryStore.js      # Inventory cache
│   │   ├── customerStore.js       # Customers cache
│   │   ├── settingsStore.js       # App settings
│   │   ├── notificationStore.js   # Notifications state
│   │   └── uiStore.js             # UI state (loading, modals)
│   │
│   ├── db/                        # Dexie.js database
│   │   ├── index.js               # Dexie instance & config
│   │   ├── schemas/               # Table schemas
│   │   │   ├── productsSchema.js
│   │   │   ├── categoriesSchema.js
│   │   │   ├── inventorySchema.js
│   │   │   ├── transactionsSchema.js
│   │   │   ├── customersSchema.js
│   │   │   ├── suppliersSchema.js
│   │   │   ├── invoicesSchema.js
│   │   │   ├── receiptsSchema.js
│   │   │   ├── usersSchema.js
│   │   │   └── settingsSchema.js
│   │   │
│   │   └── migrations/            # Database migrations
│   │       └── v1_initial.js
│   │
│   ├── services/                  # Business logic services
│   │   ├── auth/
│   │   │   ├── authService.js     # Supabase auth integration
│   │   │   └── sessionService.js  # Offline session handling
│   │   │
│   │   ├── products/
│   │   │   ├── productService.js  # Product CRUD
│   │   │   ├── categoryService.js # Category CRUD
│   │   │   └── recipeService.js   # Recipe calculation
│   │   │
│   │   ├── inventory/
│   │   │   ├── stockService.js    # Stock management
│   │   │   ├── invoiceService.js  # Faktur pembelian
│   │   │   ├── opnameService.js   # Stok opname
│   │   │   ├── wasteService.js    # Stok terbuang
│   │   │   └── supplierService.js # Supplier CRUD
│   │   │
│   │   ├── transactions/
│   │   │   ├── transactionService.js # Transaction CRUD
│   │   │   ├── paymentService.js     # Payment processing
│   │   │   └── discountService.js    # Discount calculation
│   │   │
│   │   ├── customers/
│   │   │   └── customerService.js # Customer CRUD
│   │   │
│   │   ├── reports/
│   │   │   ├── reportService.js      # Report generation
│   │   │   ├── closeCashierService.js # Tutup kasir logic
│   │   │   └── exportService.js      # Excel/PDF export
│   │   │
│   │   ├── printing/
│   │   │   ├── printerService.js     # Printer abstraction
│   │   │   ├── receiptFormatter.js   # Receipt layout
│   │   │   └── escposAdapter.js      # ESC/POS commands
│   │   │
│   │   └── notifications/
│   │       └── notificationService.js # Notification management
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.js             # Auth hook
│   │   ├── useProducts.js         # Products data hook
│   │   ├── useInventory.js        # Inventory data hook
│   │   ├── useTransactions.js     # Transactions hook
│   │   ├── useCustomers.js        # Customers hook
│   │   ├── useNotifications.js    # Notifications hook
│   │   ├── usePrinter.js          # Printer hook
│   │   ├── useOfflineSync.js      # Offline state detection
│   │   └── useDebounce.js         # Debounce utility hook
│   │
│   ├── utils/                     # Utility functions
│   │   ├── constants.js           # App constants
│   │   ├── validators.js          # Zod schemas
│   │   ├── formatters.js          # Number, date, currency formatters
│   │   ├── calculations.js        # Business calculations (tax, HPP, etc)
│   │   ├── imageUtils.js          # Image compression & WebP conversion
│   │   ├── exportUtils.js         # Export helpers
│   │   ├── dateUtils.js           # Date manipulation (date-fns wrappers)
│   │   └── errorHandlers.js       # Error handling utilities
│   │
│   ├── config/                    # Configuration files
│   │   ├── supabase.js            # Supabase client config
│   │   ├── printer.js             # Printer config
│   │   └── app.js                 # General app config
│   │
│   └── routes/                    # React Router config
│       ├── index.jsx              # Main routes
│       ├── PrivateRoute.jsx       # Protected route wrapper
│       └── routes.js              # Route constants
│
├── .env                           # Environment variables
├── .env.example                   # Example env file
├── .gitignore
├── package.json
├── README.md                      # Project documentation
├── tailwind.config.js
└── jsconfig.json                  # VS Code path aliases
```

---

## 🗄️ DATABASE SCHEMA (IndexedDB via Dexie.js)

### Table: `users`
```javascript
{
  id: String (UUID v7),
  supabaseId: String,
  email: String,
  name: String,
  role: String, // 'owner' | 'kasir'
  pin: String (hashed),
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
```

### Table: `categories`
```javascript
{
  id: String (UUID v7),
  name: String,
  description: String | null,
  createdBy: String (user.id),
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
```

### Table: `products`
```javascript
{
  id: String (UUID v7),
  name: String,
  type: String, // 'finish_goods' | 'recipe_goods' | 'raw_material'
  categoryId: String (categories.id),
  sku: String | null,
  price: Number,
  cost: Number, // HPP (Average)
  image: String | null, // Base64 WebP
  monitorStock: Boolean,
  minStock: Number | null,
  currentStock: Number, // Real stock for finish_goods/raw_material
  calculatedStock: Number | null, // Calculated for recipe_goods
  uom: Object, // { base: 'gram', conversions: [{unit: 'kg', value: 1000}] }
  recipe: Array | null, // [{ materialId: String, qty: Number, unit: String }]
  createdBy: String (user.id),
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
```

### Table: `suppliers`
```javascript
{
  id: String (UUID v7),
  name: String,
  phone: String | null,
  address: String | null,
  createdBy: String (user.id),
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
```

### Table: `invoices`
```javascript
{
  id: String (UUID v7),
  invoiceNumber: String, // Auto-generated
  supplierId: String (suppliers.id),
  items: Array, // [{ productId, qty, unitPrice, total }]
  subtotal: Number,
  total: Number,
  paymentMethod: String, // 'kas_outlet' | 'bank'
  paymentType: String, // 'cash' | 'non_cash'
  status: String, // 'paid' | 'unpaid'
  paidAmount: Number,
  remainingDebt: Number,
  createdBy: String (user.id),
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
```

### Table: `stock_opname`
```javascript
{
  id: String (UUID v7),
  items: Array, // [{ productId, systemStock, actualStock, variance }]
  notes: String | null,
  createdBy: String (user.id),
  createdAt: Date
}
```

### Table: `stock_waste`
```javascript
{
  id: String (UUID v7),
  productId: String (products.id),
  qty: Number,
  unit: String,
  reason: String,
  createdBy: String (user.id),
  createdAt: Date
}
```

### Table: `customers`
```javascript
{
  id: String (UUID v7),
  name: String,
  phone: String | null,
  gender: String | null, // 'male' | 'female'
  createdBy: String (user.id),
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
```

### Table: `transactions`
```javascript
{
  id: String (UUID v7),
  transactionNumber: String, // Auto-generated
  customerId: String | null (customers.id),
  items: Array, // [{ productId, name, qty, price, subtotal }]
  subtotal: Number,
  discount: Object, // { type: 'percent'|'nominal', value: Number, amount: Number }
  tax: Object, // { enabled: Boolean, rate: Number, amount: Number }
  total: Number,
  payments: Array, // [{ method: 'cash'|'ewallet'|'qris', amount: Number }]
  change: Number,
  status: String, // 'paid' | 'unpaid' | 'saved'
  savedAt: Date | null,
  paidAt: Date | null,
  createdBy: String (user.id),
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
```

### Table: `cashier_shifts`
```javascript
{
  id: String (UUID v7),
  openedBy: String (user.id),
  closedBy: String | null (user.id),
  openingBalance: Number,
  closingBalance: Number | null,
  actualCash: Number | null,
  variance: Number | null, // actualCash - closingBalance
  totalTransactions: Number,
  totalSales: Number,
  totalCash: Number,
  totalNonCash: Number,
  openedAt: Date,
  closedAt: Date | null,
  status: String // 'open' | 'closed'
}
```

### Table: `settings`
```javascript
{
  id: String (UUID v7),
  key: String, // Unique setting key
  value: Any, // JSON value
  updatedBy: String (user.id),
  updatedAt: Date
}
```

**Example settings keys**:
- `receipt_transaction_settings`
- `tax_settings`
- `business_info`
- `stock_restriction_enabled`
- `saved_order_reminder_hours`
- `language`

### Table: `notifications`
```javascript
{
  id: String (UUID v7),
  type: String, // 'low_stock' | 'unpaid_transaction' | 'saved_order'
  title: String,
  message: String,
  data: Object | null, // Related data (productId, transactionId, etc)
  read: Boolean,
  createdAt: Date
}
```

---

## 🔐 AUTHENTICATION FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                       │
└─────────────────────────────────────────────────────────────────┘

1. FIRST TIME LOGIN (Online Required)
   ↓
   User enters email/password
   ↓
   Supabase Auth validates
   ↓
   Store session token + user data in IndexedDB
   ↓
   Set session expiry (3 days from now)
   ↓
   Redirect to Cashier Page

2. SUBSEQUENT LOGINS (Offline Capable)
   ↓
   Check IndexedDB for valid session
   ↓
   If session valid (< 3 days) → Proceed offline
   ↓
   If session expired → Force online login

3. LOCK CASHIER (Screen Lock)
   ↓
   User clicks lock icon
   ↓
   Show PIN input overlay
   ↓
   Validate PIN against user.pin (hashed)
   ↓
   Unlock → Resume session (cart data preserved)

4. SESSION EXPIRY WARNING
   ↓
   Day 2: Show "Session expires in 1 day" banner
   ↓
   Day 3: Show "Session expired, login required" modal
   ↓
   Force online login
```

---

## 🔄 DATA FLOW PATTERNS

### Product Stock Calculation (Recipe Goods)
```javascript
// Example: 1 Bakso needs 200gr Daging Sapi
// Daging Sapi current stock: 1000gr
// Calculated stock for Bakso: Math.floor(1000 / 200) = 5 porsi

function calculateRecipeStock(product) {
  if (product.type !== 'recipe_goods') return null;
  
  let minPortions = Infinity;
  
  for (const ingredient of product.recipe) {
    const material = getMaterialById(ingredient.materialId);
    const possiblePortions = Math.floor(material.currentStock / ingredient.qty);
    minPortions = Math.min(minPortions, possiblePortions);
  }
  
  return minPortions;
}
```

### Transaction Flow
```
Add to Cart → Summary Order → [Simpan | Bayar]
                                   ↓          ↓
                            Daftar Order   Checkout Modal
                                              ↓
                                      Select Payment
                                              ↓
                                      Enter Amount
                                              ↓
                                      Calculate Change
                                              ↓
                                      Confirm Payment
                                              ↓
                                   Deduct Stock (if recipe)
                                              ↓
                                      Save Transaction
                                              ↓
                                      Print Receipt
                                              ↓
                                      Clear Cart
```

### HPP Calculation (Average Cost)
```javascript
// Example: Purchase History
// Invoice 1: 100kg @ Rp50,000 = Rp5,000,000
// Invoice 2: 50kg @ Rp60,000 = Rp3,000,000
// Total: 150kg for Rp8,000,000
// Average HPP: Rp8,000,000 / 150kg = Rp53,333/kg

function calculateAverageHPP(productId) {
  const invoices = getInvoicesByProduct(productId);
  let totalCost = 0;
  let totalQty = 0;
  
  for (const invoice of invoices) {
    const item = invoice.items.find(i => i.productId === productId);
    totalCost += item.total;
    totalQty += item.qty;
  }
  
  return totalQty > 0 ? totalCost / totalQty : 0;
}

// Update product.cost after every invoice
```

---

## 📱 PWA CONFIGURATION

### manifest.json
```json
{
  "name": "POS Offline System",
  "short_name": "POS Offline",
  "description": "Offline-first Point of Sale system",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker Strategy
```javascript
// Cache-first for static assets (JS, CSS, images)
// Network-first for API calls (when online)
// Fallback to IndexedDB when offline
```

---

## 🧪 TESTING REQUIREMENTS

### Unit Tests
- All services in `src/services/`
- Utility functions in `src/utils/`
- Critical calculations (HPP, stock, tax)

### Integration Tests
- Checkout flow (end-to-end)
- Stock deduction (recipe goods)
- Invoice creation & debt payment

### Manual Testing Checklist
- Offline functionality (disconnect network)
- Session expiry (wait 3 days or manipulate date)
- Printer connection (USB)
- Large data performance (1000+ products)

---

## 📦 PACKAGE.JSON DEPENDENCIES (Estimated)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.0",
    "dexie": "^3.2.0",
    "dexie-react-hooks": "^1.1.0",
    "@supabase/supabase-js": "^2.38.0",
    "date-fns": "^2.30.0",
    "uuid": "^9.0.0",
    "zod": "^3.22.0",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.292.0",
    "xlsx": "^0.18.5",
    "jspdf": "^2.5.0",
    "jspdf-autotable": "^3.6.0",
    "browser-image-compression": "^2.0.0",
    "escpos-buffer": "^1.2.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@tailwindcss/forms": "^0.5.0"
  }
}
```

---

## 🔒 SECURITY CONSIDERATIONS

1. **PIN Storage**: Hash using bcrypt before storing in IndexedDB
2. **Session Token**: Store securely, rotate every 3 days
3. **Audit Trail**: Log all critical actions (delete, void, edit stock)
4. **Input Validation**: Zod schemas for all forms
5. **XSS Prevention**: Sanitize all user inputs before rendering

---

## 🚀 DEPLOYMENT

### Build Command
```bash
npm run build
```

### Hosting Options
- **Netlify** (recommended for PWA)
- **Vercel**
- **Firebase Hosting**
- Self-hosted (Nginx)

### Build Optimization
- Code splitting by route
- Lazy load heavy components
- Tree-shaking unused code
- Image optimization (WebP)
- Minify CSS/JS

---

## 📈 PERFORMANCE TARGETS

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **IndexedDB Query**: < 100ms
- **Product Grid Render**: < 200ms (100 products)
- **Checkout Flow**: < 500ms
- **Receipt Print**: < 2s

---

## 🔧 DEVELOPMENT WORKFLOW

1. **Setup**: Clone repo → `npm install` → Copy `.env.example` to `.env`
2. **Database**: Initialize Dexie tables on first run
3. **Seed Data**: Optional seed script for testing
4. **Dev Server**: `npm start` (with service worker disabled)
5. **Build**: `npm run build` (with service worker enabled)
6. **Test PWA**: Serve build folder with HTTPS (required for service worker)

---

## 📝 NOTES

- **Browser Compatibility**: Chrome/Edge 90+, Safari 14+, Firefox 90+
- **IndexedDB Limit**: ~50-100MB per domain (varies by browser)
- **Image Storage**: Compress aggressively, consider external storage for V2
- **Offline Period**: Max 3 days before forced online login
- **Multi-device**: NOT supported in V1 (single-device only)

---

## ✅ PHASE 1.0 MVP CHECKLIST

### Core Features
- [ ] Authentication (Supabase + 3-day offline)
- [ ] Product Management (3 types, categories, UOM)
- [ ] Recipe Builder (auto-deduct, calculated stock)
- [ ] Main Cashier (Grid view, search by name)
- [ ] Summary Order & Cart
- [ ] Saved Orders (Daftar Order)
- [ ] Checkout (3 payment methods: Cash, Non-Tunai, QRIS)
- [ ] Customer Management (basic info)
- [ ] Inventory (Faktur, Stok Opname, Waste, Supplier)
- [ ] Debt Payment (bayar hutang)
- [ ] Reports (Transaksi, Penjualan, Tutup Kasir)
- [ ] Export (Excel & PDF)
- [ ] Settings (Receipt, Tax, Account, Business)
- [ ] Notifications (Low stock, Unpaid, Saved orders)
- [ ] Lock Cashier (PIN screen lock)
- [ ] Print Receipt (USB only)
- [ ] Data Health (Archive & optimize)
- [ ] Language Switch (ID/EN)

### Technical
- [ ] IndexedDB setup (Dexie.js)
- [ ] Zustand stores
- [ ] UUID v7 implementation
- [ ] Soft delete for all master data
- [ ] Audit trail logging
- [ ] PWA setup (manifest + service worker)
- [ ] Image compression (WebP)
- [ ] Average HPP calculation
- [ ] Receipt template engine
- [ ] Error handling & boundaries

---

## 🎨 UI/UX GUIDELINES

### Design Principles
- **Mobile-first**: Responsive for tablet (10"+) and desktop
- **Touch-friendly**: Min 44x44px touch targets
- **High contrast**: Accessible color combinations
- **Fast feedback**: Loading states, toast notifications
- **Offline indicators**: Clear when offline/online

### Color Scheme (Recommendation)
```javascript
// Tailwind config
colors: {
  primary: '#000000',      // Black (modern, clean)
  secondary: '#3B82F6',    // Blue (trust, professional)
  success: '#10B981',      // Green (confirmation)
  warning: '#F59E0B',      // Amber (alerts)
  danger: '#EF4444',       // Red (errors, delete)
  neutral: '#6B7280'       // Gray (text, borders)
}
```

### Typography
- **Headings**: Inter/SF Pro (700)
- **Body**: Inter/SF Pro (400, 500)
- **Numbers**: Tabular figures for currency

### Component Guidelines
- **Buttons**: Primary (solid), Secondary (outline), Ghost (text)
- **Inputs**: Floating labels or top labels
- **Tables**: Sticky headers, striped rows, hover states
- **Modals**: Centered, max-width 600px, backdrop blur
- **Cards**: Subtle shadow, rounded corners (8px)

---

## 🧩 KEY COMPONENT SPECIFICATIONS

### ProductCard (Cashier Grid)
```
┌─────────────────────────┐
│ [Badge: 5]              │  ← Calculated stock (top-left)
│                         │
│    [Product Image]      │
│                         │
├─────────────────────────┤
│ Product Name            │
│ Rp 25.000               │  ← Price
└─────────────────────────┘
```
- Badge color: Green (>10), Yellow (5-10), Red (<5)
- Click behavior: Add to cart (qty +1)
- Long press: Show product details modal

### SummaryOrder (Sidebar)
```
┌──────────────────────────────┐
│ Order Summary         [Clear]│
├──────────────────────────────┤
│ [+Customer]                  │  ← Optional
├──────────────────────────────┤
│ Bakso Sapi        x2  50.000 │
│ Es Teh            x1  5.000  │
├──────────────────────────────┤
│ Subtotal:            55.000  │
│ Discount:            -5.000  │  ← If applied
│ Tax (10%):            5.000  │  ← If enabled
│ Total:               55.000  │
├──────────────────────────────┤
│ [Simpan]         [Bayar]     │
└──────────────────────────────┘
```

### CheckoutModal
```
┌──────────────────────────────┐
│           CHECKOUT           │
├──────────────────────────────┤
│ Total Tagihan:  Rp 55.000    │
│ Pembayaran:     Rp _______   │  ← Calculator input
│ Kembalian:      Rp 0         │
├──────────────────────────────┤
│ Metode Pembayaran:           │
│ [Cash] [E-Wallet] [QRIS]     │
├──────────────────────────────┤
│        [Batal] [Bayar]       │
└──────────────────────────────┘
```

### NotificationBell
```
┌────┐
│ 🔔 │  ← Badge (red dot) if unread
└────┘
```
Click → Dropdown panel:
```
┌──────────────────────────────┐
│ Notifications          [×]   │
├──────────────────────────────┤
│ ⚠️ Low Stock                 │
│ Daging Sapi: 200gr left      │
│ 5 mins ago                   │
├──────────────────────────────┤
│ 💰 Unpaid Transaction        │
│ 3 transactions pending       │
│ 2 hours ago                  │
└──────────────────────────────┘
```

---

## 🎯 RECEIPT TEMPLATE STRUCTURE

### Receipt Settings (Checkbox Options)

**HEADER**
- [ ] Business Logo (from Business Settings)
- [ ] Business Name
- [ ] Business Address
- [ ] Business Phone
- [ ] Cashier Name
- [ ] Transaction Date/Time

**BODY**
- [ ] Item List (Name, Qty, Price, Subtotal)
- [ ] Subtotal
- [ ] Discount
- [ ] Tax
- [ ] Total
- [ ] Payment Method
- [ ] Cash Received
- [ ] Change

**FOOTER**
- [ ] Custom Message (e.g., "Terima kasih!")
- [ ] Business Website/Social Media
- [ ] Barcode/QR (Transaction ID)

### Example Receipt Output
```
================================
      WARUNG BAKSO SAPI
   Jl. Merdeka No. 123
    Telp: 0812-3456-7890
================================
Kasir: Budi
25 Okt 2025, 14:30 WIB
--------------------------------
Bakso Sapi        x2    50.000
Es Teh            x1     5.000
--------------------------------
Subtotal:               55.000
Diskon (10%):           -5.500
Pajak (10%):             4.950
--------------------------------
TOTAL:                  54.450
--------------------------------
Tunai:                  60.000
Kembali:                 5.550
================================
   Terima kasih atas
    kunjungan Anda!
================================
```

---

## 🔐 ROLE-BASED ACCESS CONTROL (RBAC)

### Owner Role
- ✅ Full access to all modules
- ✅ Can manage users
- ✅ Can edit settings
- ✅ Can view all reports
- ✅ Can void transactions
- ✅ Can manage inventory

### Kasir Role
- ✅ Cashier page (POS)
- ✅ View products (read-only)
- ✅ Create transactions
- ✅ View saved orders
- ✅ View customer list (read-only)
- ❌ Cannot edit products
- ❌ Cannot edit inventory
- ❌ Cannot view detailed reports (only their shift)
- ❌ Cannot void without Owner PIN
- ❌ Cannot access Settings

### Permission Check Pattern
```javascript
// Example usage
const canEditProduct = user.role === 'owner';
const canVoidTransaction = user.role === 'owner';
const canAccessSettings = user.role === 'owner';
```

---

## 🔄 STATE MANAGEMENT PATTERNS (Zustand)

### Example Store Structure

#### authStore.js
```javascript
const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isOnline: true,
  
  login: async (email, password) => { /* ... */ },
  logout: () => { /* ... */ },
  checkSession: () => { /* ... */ },
  lockScreen: () => { /* ... */ },
  unlockScreen: (pin) => { /* ... */ }
}));
```

#### cashierStore.js
```javascript
const useCashierStore = create((set, get) => ({
  cart: [],
  savedOrders: [],
  selectedCustomer: null,
  
  addToCart: (product) => { /* ... */ },
  removeFromCart: (productId) => { /* ... */ },
  updateQuantity: (productId, qty) => { /* ... */ },
  clearCart: () => { /* ... */ },
  saveOrder: () => { /* ... */ },
  loadSavedOrder: (orderId) => { /* ... */ },
  calculateTotal: () => { /* ... */ }
}));
```

---

## 📊 BUSINESS LOGIC RULES

### Stock Deduction Rules
1. **Finish Goods**: Direct deduction from `products.currentStock`
2. **Recipe Goods**: Deduct each `recipe[].materialId` stock by `recipe[].qty * transaction qty`
3. **Raw Material**: Same as Finish Goods

### Discount Calculation Order
```javascript
// Settings: Tax timing
// Option 1: Tax BEFORE discount
subtotal = 100.000
tax = 100.000 * 10% = 10.000
subtotal_with_tax = 110.000
discount = 110.000 * 10% = 11.000
total = 99.000

// Option 2: Tax AFTER discount
subtotal = 100.000
discount = 100.000 * 10% = 10.000
subtotal_after_discount = 90.000
tax = 90.000 * 10% = 9.000
total = 99.000

// Option 3: Price INCLUDES tax
display_price = 110.000 (includes 10% tax)
actual_price = 110.000 / 1.1 = 100.000
tax = 10.000 (already included)
```

### Transaction Number Format
```
Format: TRX-YYYYMMDD-XXXX
Example: TRX-20251025-0001

- YYYY: Year
- MM: Month
- DD: Day
- XXXX: Sequential number (resets daily)
```

### Invoice Number Format
```
Format: INV-YYYYMMDD-XXXX
Example: INV-20251025-0001
```

---

## ⚠️ CRITICAL WARNINGS & VALIDATIONS

### Before Transaction Payment
- ✅ Check stock availability (if restriction enabled)
- ✅ Validate payment amount >= total
- ✅ Check if cashier shift is open
- ✅ Confirm recipe materials available

### Before Product Deletion
- ✅ Check if product has active transactions
- ✅ Check if product is used in any recipe
- ✅ Soft delete only (keep for historical data)

### Before Invoice Creation
- ✅ Validate supplier exists
- ✅ Validate all products exist
- ✅ Validate quantities > 0
- ✅ Validate unit prices > 0

### Before Close Cashier
- ✅ Check for unpaid transactions (warning)
- ✅ Check for saved orders (warning)
- ✅ Require actual cash count input
- ✅ Calculate variance (actual vs expected)

---

## 🚨 ERROR HANDLING STRATEGY

### Error Categories
1. **Validation Errors**: Show inline form errors
2. **Business Logic Errors**: Show toast notification
3. **Database Errors**: Show error modal + log to console
4. **Network Errors**: Show offline indicator
5. **Critical Errors**: Show error boundary page

### Error Message Examples
```javascript
// Validation
"Nama produk harus diisi"
"Harga harus lebih besar dari 0"

// Business Logic
"Stok tidak mencukupi untuk transaksi ini"
"Shift kasir belum dibuka"

// Database
"Gagal menyimpan data. Silakan coba lagi."

// Network
"Anda sedang offline. Beberapa fitur tidak tersedia."
```

---

## 🔍 SEARCH & FILTER PATTERNS

### Product Search (Cashier)
- Search by: Name (case-insensitive)
- Filter by: Category
- Sort by: Name (A-Z), Price (Low-High), Stock (Low-High)

### Customer List
- Search by: Name, Phone
- Filter by: Gender
- Sort by: Name, Total Transactions, Total Spent

### Transaction Report
- Filter by: Date Range, Status (Paid/Unpaid), Payment Method
- Sort by: Date (Newest), Total (Highest)

---

## 📱 RESPONSIVE BREAKPOINTS

```javascript
// Tailwind breakpoints
sm: '640px',   // Small tablet
md: '768px',   // Tablet
lg: '1024px',  // Desktop
xl: '1280px',  // Large desktop
```

### Layout Adaptations
- **< 768px**: Hide sidebar, use modal for summary order
- **768px - 1024px**: Sidebar visible, grid 2-3 columns
- **> 1024px**: Full layout, grid 4-6 columns

---

## 🎓 DEVELOPMENT BEST PRACTICES

### Code Style
- Use functional components (React Hooks)
- Prefer named exports over default
- Keep components under 300 lines
- Extract complex logic to custom hooks
- Use TypeScript JSDoc for type hints

### File Naming
- Components: PascalCase (`ProductCard.jsx`)
- Hooks: camelCase with 'use' prefix (`useProducts.js`)
- Services: camelCase (`productService.js`)
- Utils: camelCase (`formatters.js`)

### Git Commit Convention
```
feat: Add product search functionality
fix: Fix stock calculation for recipe goods
refactor: Simplify checkout flow
docs: Update README with setup instructions
```

---

## 🔮 FUTURE ENHANCEMENTS (Post-Phase 1.0)

### Phase 1.5 (Short-term)
- Barcode scanner support
- Product variants
- Table List & Layout View
- Split Bill payment
- Advanced reports with graphs
- Shift management
- Multiple receipt templates

### Version 2.0 (Long-term)
- Supabase online sync
- Multi-device support
- Multi-outlet management
- Kitchen Display System (KDS)
- Promo/Voucher engine
- Member/Loyalty program
- Batch/Expiry tracking
- Advanced analytics dashboard

---

## 📞 SUPPORT & MAINTENANCE

### Browser Support Matrix
| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 90+     | ✅ Full |
| Edge    | 90+     | ✅ Full |
| Safari  | 14+     | ✅ Full |
| Firefox | 90+     | ✅ Full |
| Opera   | 76+     | ⚠️ Limited |

### Known Limitations
- IndexedDB storage limit (50-100MB)
- Service Worker requires HTTPS
- Print API varies by browser
- No iOS PWA install on Safari < 16.4

---

## 📄 LICENSE & CREDITS

**License**: Proprietary (Internal Use)
**Framework**: React 18 (Meta Platforms, Inc.)
**Database**: Dexie.js (David Fahlander)
**UI**: shadcn/ui (shadcn)
**Icons**: Lucide (Lucide Contributors)

---

**END OF ARCHITECTURE DOCUMENT**

Version: 1.0.0
Last Updated: October 25, 2025
Status: READY FOR DEVELOPMENT