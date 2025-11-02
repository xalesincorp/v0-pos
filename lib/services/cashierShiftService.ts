import { db, CashierShift } from '../db';
import { v7 as uuidv7 } from 'uuid';
import { Transaction } from '../db';

export class CashierShiftService {
  // Open a new cashier shift
  static async openShift(userId: string, openingBalance: number): Promise<CashierShift> {
    try {
      // Check if there's already an open shift for this user
      const existingOpenShift = await db.cashierShifts
        .where('openedBy')
        .equals(userId)
        .and(shift => shift.status === 'open')
        .first();
      
      if (existingOpenShift) {
        throw new Error('User already has an open shift');
      }

      // Create new shift
      const newShift: CashierShift = {
        id: uuidv7(),
        openedBy: userId,
        closedBy: null,
        openingBalance,
        closingBalance: null,
        actualCash: null,
        variance: null,
        totalTransactions: 0,
        totalSales: 0,
        totalCash: 0,
        totalNonCash: 0,
        openedAt: new Date(),
        closedAt: null,
        status: 'open'
      };

      // Add to database
      const id = await db.cashierShifts.add(newShift);
      
      return { ...newShift, id };
    } catch (error) {
      throw new Error(`Failed to open shift: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

 // Close an existing cashier shift
  static async closeShift(shiftId: string, actualCash: number): Promise<CashierShift | null> {
    try {
      // Get the shift
      const shift = await db.cashierShifts.get(shiftId);
      if (!shift) {
        throw new Error('Shift not found');
      }

      if (shift.status !== 'open') {
        throw new Error('Shift is not open');
      }

      // Calculate shift statistics
      const shiftStats = await this.calculateShiftStats(shiftId);
      
      // Calculate variance
      const expectedCash = shift.openingBalance + shiftStats.totalCash;
      const variance = actualCash - expectedCash;

      // Update the shift
      const updatedShift = {
        ...shift,
        closedBy: shift.openedBy, // For now, same as openedBy, but could be different user
        closingBalance: expectedCash,
        actualCash,
        variance,
        totalTransactions: shiftStats.totalTransactions,
        totalSales: shiftStats.totalSales,
        totalCash: shiftStats.totalCash,
        totalNonCash: shiftStats.totalNonCash,
        closedAt: new Date(),
        status: 'closed',
        updatedAt: new Date() // Note: CashierShift interface doesn't have updatedAt, so we won't include it
      };

      // Update in database
      await db.cashierShifts.update(shiftId, {
        closedBy: updatedShift.closedBy,
        closingBalance: updatedShift.closingBalance,
        actualCash: updatedShift.actualCash,
        variance: updatedShift.variance,
        totalTransactions: updatedShift.totalTransactions,
        totalSales: updatedShift.totalSales,
        totalCash: updatedShift.totalCash,
        totalNonCash: updatedShift.totalNonCash,
        closedAt: updatedShift.closedAt,
        status: updatedShift.status as 'closed'
      });

      // Get the updated shift
      const finalShift = await db.cashierShifts.get(shiftId);
      return finalShift || null;
    } catch (error) {
      throw new Error(`Failed to close shift: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

 // Get current open shift for a user
  static async getCurrentOpenShift(userId: string): Promise<CashierShift | null> {
    try {
      const shift = await db.cashierShifts
        .where('openedBy')
        .equals(userId)
        .and(shift => shift.status === 'open')
        .first();
      
      return shift || null;
    } catch (error) {
      throw new Error(`Failed to get current open shift: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get shift by ID
  static async getShiftById(id: string): Promise<CashierShift | null> {
    try {
      const shift = await db.cashierShifts.get(id);
      return shift || null;
    } catch (error) {
      throw new Error(`Failed to get shift: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

 // Get all shifts for a user
  static async getShiftsByUser(userId: string): Promise<CashierShift[]> {
    try {
      const shifts = await db.cashierShifts
        .where('openedBy')
        .equals(userId)
        .toArray();
      
      // Sort by openedAt in descending order
      return shifts.sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime());
    } catch (error) {
      throw new Error(`Failed to get shifts for user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all shifts (for management purposes)
  static async getAllShifts(): Promise<CashierShift[]> {
    try {
      const shifts = await db.cashierShifts.toArray();
      
      // Sort by openedAt in descending order
      return shifts.sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime());
    } catch (error) {
      throw new Error(`Failed to get all shifts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Calculate shift statistics
  static async calculateShiftStats(shiftId: string): Promise<{
    totalTransactions: number;
    totalSales: number;
    totalCash: number;
    totalNonCash: number;
  }> {
    try {
      const shift = await db.cashierShifts.get(shiftId);
      if (!shift) {
        throw new Error('Shift not found');
      }

      // Get all transactions during the shift period
      const transactions = await db.transactions
        .filter(transaction => {
          // Check if transaction is within the shift period
          // If shift is still open, use current time as end
          const shiftEnd = shift.closedAt || new Date();
          return (
            transaction.createdAt >= shift.openedAt &&
            transaction.createdAt <= shiftEnd &&
            transaction.status === 'paid' // Only paid transactions count
          );
        })
        .toArray();

      let totalCash = 0;
      let totalNonCash = 0;
      
      for (const transaction of transactions) {
        for (const payment of transaction.payments) {
          if (payment.method === 'cash') {
            totalCash += payment.amount;
          } else {
            totalNonCash += payment.amount;
          }
        }
      }

      return {
        totalTransactions: transactions.length,
        totalSales: transactions.reduce((sum, tx) => sum + tx.total, 0),
        totalCash,
        totalNonCash
      };
    } catch (error) {
      throw new Error(`Failed to calculate shift stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check if a user has an active shift
  static async hasActiveShift(userId: string): Promise<boolean> {
    try {
      const openShift = await this.getCurrentOpenShift(userId);
      return openShift !== null;
    } catch (error) {
      throw new Error(`Failed to check active shift: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get shift report
  static async getShiftReport(shiftId: string): Promise<{
    shift: CashierShift;
    transactions: Transaction[];
    stats: {
      totalTransactions: number;
      totalSales: number;
      totalCash: number;
      totalNonCash: number;
    };
  } | null> {
    try {
      const shift = await this.getShiftById(shiftId);
      if (!shift) {
        return null;
      }

      // Get transactions during the shift
      const transactions = await db.transactions
        .filter(transaction => {
          const shiftEnd = shift.closedAt || new Date();
          return (
            transaction.createdAt >= shift.openedAt &&
            transaction.createdAt <= shiftEnd &&
            transaction.status === 'paid'
          );
        })
        .toArray();

      const stats = await this.calculateShiftStats(shiftId);

      return {
        shift,
        transactions,
        stats
      };
    } catch (error) {
      throw new Error(`Failed to get shift report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}