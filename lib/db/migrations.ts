import { db, Transaction } from './index';

// Migration functions to handle database schema updates
export const runMigrations = async () => {
  console.log('Running database migrations...');
  
  // Migration to add shiftId to existing transactions (if not already present)
  await migrateTransactionsToAddShiftId();
  
  console.log('Database migrations completed.');
};

// Migration to add shiftId field to existing transactions
async function migrateTransactionsToAddShiftId() {
  try {
    // Get all transactions that don't have shiftId or have undefined shiftId
    const transactions = await db.transactions.toArray();
    let updatedCount = 0;
    
    for (const transaction of transactions) {
      // If shiftId is not defined, set it to null
      if ((transaction as any).shiftId === undefined) {
        await db.transactions.update(transaction.id, { shiftId: null });
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      console.log(`Updated ${updatedCount} transactions with shiftId field`);
    }
  } catch (error) {
    console.error('Error migrating transactions to add shiftId:', error);
    // Don't throw the error as this is just a migration issue, not a critical failure
  }
}

// Initialize the database and run migrations
export const initializeDB = async () => {
  try {
    // Open the database to ensure it's ready for use
    await db.open();
    console.log('Database initialized successfully');
    
    // Run any pending migrations
    await runMigrations();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};