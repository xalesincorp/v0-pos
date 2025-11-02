# Team Management & Access Control System - Dokumentasi Lengkap

## 🎯 Goals Implementasi

**Tujuan Utama:**
- Implementasi sistem manajemen tim dengan kontrol akses granular
- Menciptakan sistem Role-Based Access Control (RBAC) yang fleksibel
- Memberikan kontrol kepada Owner untuk mengelola akses karyawan
- Memastikan security melalui PIN-based authentication
- Menciptakan sistem yang scalable untuk berbagai ukuran bisnis

## 🌐 Offline-First Architecture

**Konsep Utama:** Aplikasi menggunakan Supabase sebagai cloud sync mechanism, namun beroperasi secara offline-first untuk performa dan reliability yang optimal.

### Core Principles:
1. **Data Download:** Semua skema dan data di-download ke IndexDB saat login pertama
2. **Offline Operation:** Sistem bekerja penuh tanpa koneksi internet
3. **Sync on Demand:** Sinkronisasi ke Supabase hanya saat diperlukan
4. **Conflict Resolution:** Handle data conflicts saat sync kembali online

### 🛠️ Development Setup vs Production Usage:

**Development (Setup & Testing):**
- **MCP Supabase** digunakan HANYA untuk development/testing/database setup
- Using MCP untuk membuat table, apply migration, setup initial data
- Execute SQL commands untuk initial data setup
- Testing database operations

**Production (Operational App):**
- **Direct Supabase Client** untuk semua sync operations
- App menggunakan @supabase/supabase-js client
- IndexedDB untuk offline storage
- Direct API calls untuk sync ke cloud

### Data Storage Strategy:
```typescript
// IndexedDB Structure for Team Management
interface OfflineDataStore {
  users: User[];
  employees: Employee[];
  access_templates: AccessTemplate[];
  permissions: Permission[];
  sync_metadata: {
    last_sync: Date;
    pending_changes: ChangeLog[];
    schema_version: string;
  };
}
```

### 🔄 Sync Flow Management

#### First Login (Initial Download):
```
1. Login berhasil
2. ✅ Detect "schema_not_downloaded" flag
3. 📥 Download semua data dari Supabase:
   - Users + Permissions
   - Access Templates  
   - Employees list
   - Latest business data
4. 💾 Store ke IndexedDB
5. ✅ Set "schema_downloaded" = true
6. 🚀 App ready untuk offline operation
```

#### Subsequent Logins:
```
1. Login berhasil
2. ✅ Check "schema_downloaded" flag = true
3. ⚡ Skip download, langsung load dari IndexedDB
4. 🔍 Background sync check (optional)
5. 🚀 App ready untuk offline operation
```

#### Sync Trigger Conditions:
- **Manual:** User click "Sync" button di notification panel
- **Periodic:** Every 24 hours if online
- **Auto:** When coming back online after offline period
- **Critical:** When pending changes > 100 items

### 📶 Offline Detection & Sync Notification

#### Offline Detection Logic:
```typescript
interface OfflineManager {
  isOnline: boolean;
  lastOnlineTime: Date;
  offlineDuration: number; // in minutes
  pendingChanges: ChangeLog[];
}

const detectOfflineDuration = () => {
  const offlineTime = new Date() - lastOnlineTime;
  return Math.floor(offlineTime / 60000); // minutes
};
```

#### Sync Notification Modal:
```jsx
// When user comes back online after being offline
const SyncModal = ({ offlineDuration }) => (
  <Modal>
    <h3>🔄 Sinkronisasi Data</h3>
    <p>
      Anda sudah Offline selama <strong>{offlineDuration} menit</strong>.
      Apakah Anda ingin melakukan Sinkronisasi ke Cloud?
    </p>
    <div className="modal-actions">
      <button onClick={handleSyncNow}>Sync Sekarang</button>
      <button onClick={handleSyncLater}>Nanti Saja</button>
    </div>
  </Modal>
);
```

#### Sync Process:
```
1. 📊 Compare IndexedDB vs Supabase timestamps
2. 🔍 Identify conflicting changes
3. ⚖️ Resolve conflicts (Last Write Wins atau User Decision)
4. 📤 Upload local changes ke Supabase
5. 📥 Download latest data dari Supabase  
6. ✅ Update IndexedDB dengan merged data
7. 📝 Log sync results
```

## 📋 Phases Implementasi

### Phase 1: Foundation & Offline Database Setup
**Tujuan:** Setup offline-first architecture dengan database schema dan initial data

#### Database Schema Setup (Development - MCP Supabase):
```typescript
// Development setup menggunakan MCP Supabase (sekali waktu saja)
// Production: Langsung menggunakan direct Supabase client

// 1. Create Users Table
await useMCP('supabase', 'apply_migration', {
  name: 'create_users_table',
  query: `
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'owner',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `
});

// 2. Create Access Templates Table
await useMCP('supabase', 'apply_migration', {
  name: 'create_access_templates_table',
  query: `
    CREATE TABLE access_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      permissions JSONB NOT NULL,
      description TEXT,
      is_system BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `
});

// 3. Create Employees Table
await useMCP('supabase', 'apply_migration', {
  name: 'create_employees_table',
  query: `
    CREATE TABLE employees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      address TEXT,
      gender VARCHAR(20),
      pin VARCHAR(10) DEFAULT '123456',
      access_template_id UUID REFERENCES access_templates(id),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `
});

// 4. Setup Owner Template (Development)
await useMCP('supabase', 'execute_sql', {
  query: `
    INSERT INTO access_templates (name, permissions, is_system) 
    VALUES (
      'Owner',
      '${JSON.stringify(getFullAccessPermissions())}',
      true
    );
  `
});

// 5. Setup Owner User (Development)
await useMCP('supabase', 'execute_sql', {
  query: `
    INSERT INTO users (name, email, password_hash, role)
    VALUES ('Owner', 'owner@example.com', 'hashed_password', 'owner');
  `
});
```

#### IndexedDB Schema Setup:
```typescript
// lib/db/indexedDB.ts
export interface OfflineDB {
  users: {
    keyPath: 'id';
    data: User[];
  };
  employees: {
    keyPath: 'id';
    data: Employee[];
  };
  access_templates: {
    keyPath: 'id';
    data: AccessTemplate[];
  };
  permissions: {
    keyPath: 'userId';
    data: UserPermissions;
  };
  sync_queue: {
    keyPath: 'id';
    data: SyncOperation[];
  };
  metadata: {
    keyPath: 'key';
    data: { key: string; value: any; };
  };
}
```

#### Initial Schema Download:
1. **First-time Setup**
   - Create IndexedDB stores
   - Download Owner template dari Supabase
   - Cache semua access templates
   - Setup offline permission system

2. **Data Migration**
   - Existing POS data → IndexedDB
   - User authentication → Offline-first
   - All team management data → Cached

3. **Sync Metadata**
   - Track last sync timestamp
   - Version control untuk schema updates
   - Pending changes queue

### Phase 2: Offline-First Authentication & Team Management
**Tujuan:** Implementasi login flow offline dengan cloud sync

#### Modified Granular Tasks (Offline-First):

1. **Offline-First Authentication**
   - Login page dengan local permission check
   - IndexedDB session management  
   - Employee selection from cached data
   - PIN validation dari local database
   - Background sync when online

2. **Team Management UI (Offline Capable)**
   - Settings → Tab "Team" (works offline)
   - Employee list dari IndexedDB
   - Tambah karyawan modal (offline + queued sync)
   - Edit karyawan functionality (optimistic updates)

3. **Access Template Management (Offline)**
   - Tambah akses modal dengan multi-tab
   - CRUD permission grid (Create, Read, Update, Delete, Full)
   - Template save/update to IndexedDB + sync queue
   - Conflict resolution when syncing

4. **Offline Notification System**
   - Detect offline duration
   - Sync trigger notifications  
   - Manual sync options
   - Conflict resolution UI

### Phase 3: Offline Permission System Integration
**Tujuan:** Integrasi permission check offline dengan cloud sync capability

#### Modified Granular Tasks (Offline-First):

1. **Offline Permission Middleware**
   - Permission check dari IndexedDB
   - Route protection menggunakan cached permissions
   - Component-level permission checks (offline)
   - Button/form field hiding/disabled (local data)

2. **Offline UI Integration**
   - Hide/disable pages berdasarkan local permission cache
   - Context-based menu visibility (offline)
   - Action button state management (local)
   - Real-time permission updates when synced

3. **Offline Business Logic Integration**
   - Service layer permission checks (IndexedDB)
   - Offline data validation
   - API endpoint protection dengan fallback
   - Sync queue untuk permission-dependent actions

4. **Conflict Resolution System**
   - Last Write Wins untuk simple conflicts
   - User decision untuk critical conflicts
   - Permission template merging
   - Employee access dispute resolution

## 🔧 Struktur Fitur & Permissions

### 1. Cashier Module
**Permissions:** `cashier.*`
- **Read:** `/cashier` - Lihat halaman kasir
- **Create:** Transaksi baru, buka/shut kasir
- **Update:** Edit transaksi, update order
- **Delete:** Batalkan transaksi
- **Full:** Semua akses kasir

**File yang Terdampak:**
- `app/cashier/page.tsx`
- `components/cashier/*`
- `lib/stores/cashierStore.ts`
- `lib/services/cashierShiftService.ts`

### 2. Products Module
**Permissions:** `products.*`
- **Read:** `/products` - Lihat daftar produk
- **Create:** Tambah produk baru
- **Update:** Edit produk
- **Delete:** Hapus produk
- **Full:** Semua akses produk

**File yang Terdampak:**
- `app/products/page.tsx`
- `components/products/*`
- `lib/stores/productStore.ts`

### 3. Inventory Module
**Permissions:** `inventory.*`
- **Read:** `/inventory` - Lihat inventory
- **Create:** Purchase invoice, stock opname
- **Update:** Update stok, waste management
- **Delete:** Hapus entry inventory
- **Full:** Semua akses inventory

**File yang Terdampak:**
- `app/inventory/page.tsx`
- `components/inventory/*`
- `lib/services/transactionService.ts`

### 4. Customers Module
**Permissions:** `customers.*`
- **Read:** `/customers` - Lihat daftar customer
- **Create:** Tambah customer baru
- **Update:** Edit data customer
- **Delete:** Hapus customer
- **Full:** Semua akses customer

**File yang Terdampak:**
- `app/customers/page.tsx`
- `components/customers/*`
- `lib/services/customerService.ts`

### 5. Reports Module
**Permissions:** `reports.*`
- **Read:** `/reports` - Lihat laporan
- **Create:** Export laporan
- **Update:** N/A (read-only)
- **Delete:** Hapus laporan tersimpan
- **Full:** Semua akses laporan

**File yang Terdampak:**
- `app/reports/page.tsx`
- `components/reports/*`
- `lib/services/reportService.ts`

### 6. Settings Module
**Permissions:** `settings.*`
- **Read:** `/settings` - Lihat settings
- **Create:** Setup baru (backup, export)
- **Update:** Edit semua settings
- **Delete:** Hapus data settings
- **Full:** Semua akses settings

**File yang Terdampak:**
- `app/settings/page.tsx`
- `components/settings/*`
- `lib/services/settingsService.ts`

### 7. Team Management
**Permissions:** `team.*` (Special - Owner only)
- **Read:** Lihat daftar karyawan
- **Create:** Tambah karyawan
- **Update:** Edit data karyawan
- **Delete:** Hapus/nonaktifkan karyawan
- **Full:** Semua akses team

**File yang Terdampak:**
- `components/settings/team-management.tsx`
- `components/settings/team-form.tsx`

## 📱 User Flow & Access Scenarios

### Skenario 1: Owner Login
**Permission:** Full (semua TRUE)
```
✅ Halaman: All pages accessible
✅ Fitur: All features enabled
✅ Button: All buttons visible & clickable
✅ Forms: All forms functional
```

### Skenario 2: Kasir dengan C-R- - - 
**Permission:** Create + Read only (TRANSACTION + PRODUCTS + CUSTOMERS)
```
✅ Halaman: /cashier, /products, /customers
❌ Halaman: /inventory, /reports, /settings
✅ Fitur Cashier: Add transaction, view products
❌ Fitur Products: Edit/Delete disabled
✅ Fitur Customers: Add new customer
❌ Fitur Reports: Hidden completely
```

### Skenario 3: Staff Gudang dengan R-U- - - 
**Permission:** Read + Update (INVENTORY only)
```
✅ Halaman: /inventory
❌ Halaman: /cashier, /products, /customers, /reports, /settings
✅ Fitur Inventory: View stock, update quantities
❌ Fitur Inventory: Create invoice disabled
```

## 🏗️ Implementation Architecture

### Permission Check System
```typescript
// lib/permissions/index.ts
export interface Permission {
  module: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'full';
  granted: boolean;
}

export interface UserPermissions {
  userId: string;
  name: string;
  role: string;
  permissions: Permission[];
}
```

### Component Protection
```typescript
// components/PermissionGuard.tsx
interface PermissionGuardProps {
  permission: string;
  action: 'create' | 'read' | 'update' | 'delete';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
```

### Service Layer Protection
```typescript
// lib/services/protectedService.ts
export class ProtectedService {
  checkPermission(module: string, action: string): boolean {
    // Permission validation logic
  }
}
```

## 🔒 Offline Permission Management

#### Permission Storage in IndexedDB:
```typescript
// Offline Permission Cache Structure
interface OfflinePermissionCache {
  userPermissions: UserPermissions;
  accessTemplates: AccessTemplate[];
  lastUpdated: Date;
  syncVersion: number;
}

// Permission Check (Offline)
export class OfflinePermissionService {
  async checkPermission(module: string, action: string): Promise<boolean> {
    const cached = await this.getCachedPermissions();
    const permission = cached.permissions.find(
      p => p.module === module && p.action === action
    );
    return permission?.granted || false;
  }

  async syncPermissionsFromSupabase(): Promise<void> {
    if (!navigator.onLine) return;
    
    // PRODUCTION: Direct Supabase client (bukan MCP)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: latestTemplates, error } = await supabase
      .from('access_templates')
      .select('*');
      
    if (error) throw new Error(`Sync failed: ${error.message}`);
    
    const { data: userAccess, error: userError } = await supabase
      .from('employees')
      .select('*, access_templates(*)')
      .eq('id', currentEmployee.id);
      
    if (userError) throw new Error(`User access fetch failed: ${userError.message}`);
    
    await this.updateCachedPermissions(latestTemplates || [], userAccess);
  }
}
```

#### Permission Change Sync:
```typescript
// When Owner updates access template offline:
const updateAccessTemplateOffline = async (templateId: string, permissions: Permission[]) => {
  // 1. Update IndexedDB immediately
  await indexedDB.update('access_templates', templateId, permissions);
  
  // 2. Queue for sync
  await this.queueForSync({
    type: 'update_access_template',
    templateId,
    permissions,
    timestamp: new Date(),
    conflictResolution: 'owner_wins'
  });
  
  // 3. Update UI immediately (optimistic update)
  this.updatePermissionCache(permissions);
};
```

### 📊 Team Management Offline Features

#### Employee Data Caching:
```typescript
// All employee data cached for offline team management
interface CachedEmployeeData {
  id: string;
  name: string;
  phone: string;
  address: string;
  gender: string;
  pin: string;
  access_template_id: string;
  access_template: AccessTemplate;
  is_active: boolean;
  created_at: Date;
  offline_changes?: EmployeeChangeLog[];
}
```

#### Team Management Operations (Offline):
```typescript
// Add Employee (Offline)
const addEmployeeOffline = async (employeeData: EmployeeData) => {
  const newEmployee = {
    ...employeeData,
    id: generateUUID(),
    created_at: new Date(),
    offline_created: true,
    sync_status: 'pending_upload'
  };
  
  // Store in IndexedDB immediately
  await indexedDB.add('employees', newEmployee);
  
  // Queue for cloud sync
  await this.queueSyncOperation({
    operation: 'create_employee',
    data: newEmployee,
    priority: 'high'
  });
  
  return newEmployee;
};

// Update Employee (Offline)  
const updateEmployeeOffline = async (employeeId: string, updates: Partial<EmployeeData>) => {
  const updatedEmployee = {
    ...updates,
    updated_at: new Date(),
    offline_updated: true
  };
  
  await indexedDB.update('employees', employeeId, updatedEmployee);
  
  await this.queueSyncOperation({
    operation: 'update_employee',
    employeeId,
    data: updatedEmployee
  });
};
```

## 🔧 Technical Implementation Details

### Offline Sync Architecture
```typescript
// lib/sync/offlineSyncManager.ts
class OfflineSyncManager {
  private syncQueue: SyncOperation[] = [];
  private conflictResolver: ConflictResolver;
  private indexedDB: IDBDatabase;
  
  async queueOperation(operation: SyncOperation): Promise<void> {
    // 1. Add to IndexedDB sync_queue
    await this.indexedDB.add('sync_queue', {
      ...operation,
      id: generateUUID(),
      created_at: new Date(),
      status: 'pending'
    });
    
    // 2. Attempt immediate sync if online
    if (navigator.onLine) {
      await this.processSyncQueue();
    }
  }
  
  async processSyncQueue(): Promise<void> {
    const pendingOps = await this.getPendingOperations();
    
    for (const operation of pendingOps) {
      try {
        await this.executeOperation(operation);
        await this.markOperationComplete(operation.id);
      } catch (error) {
        await this.handleSyncError(operation, error);
      }
    }
  }
  
  async handleConflict(localData: any, remoteData: any, operation: SyncOperation): Promise<any> {
    // Priority: Owner decisions > Last Write Wins > User Choice
    if (operation.priority === 'critical') {
      return this.promptUserDecision(localData, remoteData);
    }
    return this.resolveByTimestamp(localData, remoteData);
  }
}
```

### IndexedDB Service Layer
```typescript
// lib/db/offlineDBService.ts
export class OfflineDBService {
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const permissions = await this.db.get('permissions', userId);
    return permissions || this.getDefaultPermissions();
  }
  
  async updateEmployee(employeeId: string, data: Partial<Employee>): Promise<void> {
    // Optimistic update
    await this.db.put('employees', { ...data, updated_at: new Date() });
    
    // Queue for sync
    await this.syncManager.queueOperation({
      type: 'update',
      table: 'employees',
      id: employeeId,
      data,
      timestamp: new Date()
    });
  }
  
  async syncPermissions(): Promise<void> {
    if (!navigator.onLine) return;
    
    // PRODUCTION: Direct Supabase client (bukan MCP)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: latestTemplates, error } = await supabase
      .from('access_templates')
      .select('*');
      
    if (error) throw new Error(`Sync failed: ${error.message}`);
    
    // Update local cache
    await this.db.clear('access_templates');
    await this.db.bulkAdd('access_templates', latestTemplates || []);
    
    // Update user permissions cache
    const userPermissions = await this.buildUserPermissions();
    await this.db.put('permissions', userPermissions);
  }
}
```

## 🛡️ Error Handling & Recovery

### Offline Error Scenarios
```typescript
interface OfflineErrorHandler {
  // Network errors
  handleNetworkError(error: NetworkError): void;
  
  // Sync conflicts
  handleSyncConflict(conflict: SyncConflict): Promise<Resolution>;
  
  // Data corruption
  handleDataCorruption(corruptedData: CorruptedData): Promise<void>;
  
  // Permission errors
  handlePermissionError(error: PermissionError): void;
}

// Error Recovery Strategies
const recoveryStrategies = {
  network_error: 'retry_with_backoff',
  sync_conflict: 'user_decision',
  data_corruption: 'restore_from_backup',
  permission_error: 'fallback_to_local'
};
```

### Data Consistency Checks
```typescript
// Periodic consistency validation
const validateDataConsistency = async () => {
  const localEmployees = await offlineDB.getAll('employees');
  const localTemplates = await offlineDB.getAll('access_templates');
  
  // Check for orphaned employee records
  const orphanedEmployees = localEmployees.filter(emp => 
    !localTemplates.find(template => template.id === emp.access_template_id)
  );
  
  if (orphanedEmployees.length > 0) {
    await this.handleOrphanedRecords(orphanedEmployees);
  }
  
  // Validate permission matrix integrity
  for (const template of localTemplates) {
    const isValid = this.validatePermissionMatrix(template.permissions);
    if (!isValid) {
      await this.repairPermissionMatrix(template);
    }
  }
};
```

## ⚡ Performance Optimization

### Efficient Data Loading
```typescript
// Lazy loading dengan caching strategy
const EmployeeList = lazy(() => 
  import('./EmployeeList').then(module => ({
    default: () => <module.EmployeeList />
  }))
);

// Permission pre-loading
const preloadUserPermissions = async () => {
  const permissions = await offlineDB.get('permissions', currentUser.id);
  if (!permissions) {
    // Load from IndexedDB or fallback
    return await loadPermissionsFromCache();
  }
  return permissions;
};
```

### Memory Management
```typescript
// Cleanup strategy untuk large datasets
const cleanupOldSyncData = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  await offlineDB.delete('sync_queue', 'created_at <', thirtyDaysAgo);
  await offlineDB.delete('change_logs', 'created_at <', thirtyDaysAgo);
};

// Compression untuk offline data
const compressOfflineData = (data: any[]): Uint8Array => {
  return pako.deflate(JSON.stringify(data));
};
```

## 🔐 Security Features

1. **PIN-based Authentication**
   - Default PIN: 123456
   - Changeable via Settings → Account tab
   - Session timeout management

2. **Permission Granularity**
   - Module-level permissions
   - Action-specific controls
   - UI-level enforcement

3. **Access Logging**
   - Track user actions
   - Security audit trail
   - Failed access attempts

## 📱 UI/UX Considerations

1. **Progressive Disclosure**
   - Show only accessible features
   - Graceful degradation of UI
   - Clear permission indicators

2. **User Experience**
   - Smooth permission checks
   - No broken functionality
   - Intuitive access patterns

3. **Error Handling**
   - Permission denied messages
   - Clear feedback on restricted actions
   - Suggest alternative actions

## 🚀 Future Development & Scalability

### Reusable Sync Framework

Sync mechanism yang dikembangkan untuk Team Management & Access Control ini dirancang sebagai **foundation framework** yang dapat digunakan kembali untuk modul-modul lainnya dalam aplikasi POS.

#### 🎯 **Design Principles untuk Reusability:**
```typescript
// Core Sync Interface - Reusable untuk semua modul
interface BaseSyncable<T> {
  // Generic sync operations
  queueSync(operation: SyncOperation<T>): Promise<void>;
  processSyncQueue(): Promise<void>;
  resolveConflicts(local: T[], remote: T[]): Promise<ConflictResolution>;
  
  // Generic offline detection
  detectOfflineDuration(): number;
  promptSyncNotification(): Promise<SyncDecision>;
}

// Specific implementations akan extend interface ini
interface TransactionSyncable extends BaseSyncable<Transaction> {}
interface ProductSyncable extends BaseSyncable<Product> {}
interface InvoiceSyncable extends BaseSyncable<Invoice> {}
```

#### 📋 **Modul yang Akan Menggunakan Framework Ini:**

1. **Transaction Module**
   - Sync penjualan, return, discount
   - Offline transaction processing
   - Real-time sales data sync

2. **Invoice Module**  
   - Purchase invoices dari suppliers
   - Sales invoices ke customers
   - Payment tracking sync

3. **Product Management**
   - Product catalog sync
   - Price changes sync
   - Category updates sync

4. **Inventory Management**
   - Stock level sync
   - Stock movement sync
   - Supplier data sync

5. **Customer Management**
   - Customer data sync
   - Purchase history sync
   - Loyalty points sync

#### 🔧 **Universal Sync Architecture:**
```typescript
// lib/sync/universalSyncManager.ts
export class UniversalSyncManager {
  private syncProviders: Map<string, BaseSyncable<any>> = new Map();
  
  registerSyncProvider(moduleName: string, provider: BaseSyncable<any>): void {
    this.syncProviders.set(moduleName, provider);
  }
  
  async syncModule(moduleName: string): Promise<void> {
    const provider = this.syncProviders.get(moduleName);
    if (provider) {
      await provider.processSyncQueue();
    }
  }
  
  async syncAllModules(): Promise<void> {
    const syncPromises = Array.from(this.syncProviders.values())
      .map(provider => provider.processSyncQueue());
    
    await Promise.allSettled(syncPromises);
  }
}

// Usage dalam aplikasi:
const syncManager = new UniversalSyncManager();
syncManager.registerSyncProvider('access', new AccessSyncProvider());
syncManager.registerSyncProvider('transactions', new TransactionSyncProvider());
syncManager.registerSyncProvider('products', new ProductSyncProvider());
```

#### 📊 **Module-Specific Implementation Examples:**

**Transaction Sync Implementation:**
```typescript
class TransactionSyncProvider implements BaseSyncable<Transaction> {
  async queueSync(operation: SyncOperation<Transaction>): Promise<void> {
    // Transaction-specific sync logic
    await this.offlineDB.add('sync_queue', {
      ...operation,
      module: 'transactions',
      priority: this.calculateTransactionPriority(operation.data)
    });
  }
  
  private calculateTransactionPriority(transaction: Transaction): SyncPriority {
    // High priority untuk transactions > $1000
    // Medium priority untuk normal transactions  
    // Low priority untuk small transactions
    return transaction.amount > 1000 ? 'high' : 
           transaction.amount > 100 ? 'medium' : 'low';
  }
}
```

**Product Sync Implementation:**
```typescript
class ProductSyncProvider implements BaseSyncable<Product> {
  async syncModule(): Promise<void> {
    // Product-specific sync dengan image handling
    const pendingProducts = await this.getPendingProducts();
    
    for (const product of pendingProducts) {
      if (product.hasImageUpdate) {
        await this.syncProductImages(product);
      }
      await this.syncProductData(product);
    }
  }
}
```

#### 🔄 **Unified Offline Notification System:**
```typescript
// Single notification system untuk semua modul
interface UnifiedOfflineNotification {
  module: string;
  offlineDuration: number;
  pendingChanges: number;
  priority: 'low' | 'medium' | 'high';
  autoSync: boolean;
}

const UnifiedSyncModal = ({ notifications }: { notifications: UnifiedOfflineNotification[] }) => (
  <Modal>
    <h3>🔄 Sinkronisasi Multi-Module</h3>
    <div className="module-list">
      {notifications.map(notif => (
        <div key={notif.module} className={`priority-${notif.priority}`}>
          <span>{notif.module}</span>
          <span>{notif.pendingChanges} perubahan</span>
          <span>{notif.offlineDuration} menit offline</span>
        </div>
      ))}
    </div>
    <div className="actions">
      <button onClick={() => syncManager.syncAllModules()}>
        Sync Semua Modul
      </button>
      <button onClick={() => this.selectiveSync()}>
        Pilih Modul
      </button>
    </div>
  </Modal>
);
```

#### 📈 **Performance Considerations:**
- **Parallel Sync:** Multiple modules sync simultaneously
- **Priority Queue:** Critical data (transactions) sync first
- **Bandwidth Management:** Throttle sync based on connection speed
- **Conflict Resolution:** Module-specific conflict handling

#### 🛡️ **Data Integrity Across Modules:**
```typescript
// Ensure consistency between related modules
const validateCrossModuleConsistency = async () => {
  // Product yang digunakan di transaction harus exist
  const orphanTransactions = await this.findOrphanTransactions();
  
  // Customer yang melakukan transaction harus valid  
  const invalidCustomerRefs = await this.validateCustomerReferences();
  
  // Inventory levels harus consistent dengan transactions
  const stockInconsistencies = await this.validateStockLevels();
  
  // Auto-repair inconsistencies where possible
  await this.autoRepairInconsistencies();
};
```

#### 📋 **Migration Strategy:**
1. **Phase 1:** Team Management & Access Control (current)
2. **Phase 2:** Core business data (Transactions, Products, Customers)
3. **Phase 3:** Advanced features (Advanced Reports, Analytics)
4. **Phase 4:** Third-party integrations (Accounting, E-commerce)

### 🎯 **Benefits untuk Future Development:**

✅ **Consistent Sync Experience** - Semua modul menggunakan pattern yang sama
✅ **Reduced Development Time** - Sync framework sudah ready untuk module baru
✅ **Unified Error Handling** - Single error handling strategy untuk semua sync operations
✅ **Performance Optimization** - Coordinated sync untuk menghindari database conflicts
✅ **Data Integrity** - Cross-module consistency validation

## 🧪 Testing Strategy

1. **Permission Matrix Testing**
   - Test all permission combinations
   - Verify UI hiding/disabling
   - Check business logic enforcement

2. **User Journey Testing**
   - Complete user flows for each role
   - Edge cases and error scenarios
   - Performance impact assessment

3. **Security Testing**
   - Unauthorized access attempts
   - Session management
   - Data exposure validation

---

**Catatan Penting untuk Implementasi:** 
- **MCP Supabase** hanya untuk development/testing/setup database schema
- **Production App** menggunakan direct Supabase client (@supabase/supabase-js)
- **Offline-first approach** dengan IndexedDB untuk local storage
- **Sync mechanism** ini focus pada Team Management untuk saat ini
- **Framework** sudah dirancang untuk extensibility ke modul lain
- **Setiap modul baru** cukup implement `BaseSyncable<T>` interface
- **Migration ke modul lain** akan menggunakan pattern yang sudah proven