import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CashierShiftService } from '../services/cashierShiftService';
import { CashierShift } from '../db';

interface ShiftState {
  currentShiftId: string | null;
  shiftStatus: 'open' | 'closed' | 'unknown';
  isCheckingShift: boolean;
  
  // Methods
  checkShiftStatus: (userId: string) => Promise<void>;
  openShift: (userId: string, openingBalance: number) => Promise<void>;
  closeShift: (shiftId: string, actualCash: number) => Promise<void>;
  resetShiftState: () => void;
  isShiftOpen: () => boolean;
  getCurrentShift: () => Promise<CashierShift | null>;
}

export const useShiftStore = create<ShiftState>()(
  persist<ShiftState>(
    (set, get) => ({
      currentShiftId: null,
      shiftStatus: 'closed',
      isCheckingShift: false,
      
      checkShiftStatus: async (userId: string) => {
        console.log('[DEBUG] checkShiftStatus called for userId:', userId);
        set({ isCheckingShift: true });
        try {
          const hasActiveShift = await CashierShiftService.hasActiveShift(userId);
          console.log('[DEBUG] hasActiveShift result:', hasActiveShift);
          if (hasActiveShift) {
            const currentShift = await CashierShiftService.getCurrentOpenShift(userId);
            console.log('[DEBUG] currentShift result:', currentShift);
            if (currentShift) {
              console.log('[DEBUG] Setting shift as OPEN, shiftId:', currentShift.id);
              set({
                currentShiftId: currentShift.id,
                shiftStatus: 'open',
                isCheckingShift: false,
              });
            } else {
              console.log('[DEBUG] No current shift found, setting as CLOSED');
              set({
                currentShiftId: null,
                shiftStatus: 'closed',
                isCheckingShift: false,
              });
            }
          } else {
            console.log('[DEBUG] No active shift found, setting as CLOSED');
            set({
              currentShiftId: null,
              shiftStatus: 'closed',
              isCheckingShift: false,
            });
          }
        } catch (error) {
          console.error('Error checking shift status:', error);
          set({
            currentShiftId: null,
            shiftStatus: 'unknown',
            isCheckingShift: false,
          });
        }
      },
      
      openShift: async (userId: string, openingBalance: number) => {
        try {
          const newShift = await CashierShiftService.openShift(userId, openingBalance);
          set({
            currentShiftId: newShift.id,
            shiftStatus: 'open',
          });
        } catch (error) {
          console.error('Error opening shift:', error);
          throw error;
        }
      },
      
      closeShift: async (shiftId: string, actualCash: number) => {
        try {
          const updatedShift = await CashierShiftService.closeShift(shiftId, actualCash);
          if (updatedShift) {
            set({
              currentShiftId: null,
              shiftStatus: 'closed',
            });
          }
        } catch (error) {
          console.error('Error closing shift:', error);
          throw error;
        }
      },
      
      resetShiftState: () => {
        set({
          currentShiftId: null,
          shiftStatus: 'closed',
        });
      },
      
      isShiftOpen: () => {
        return get().shiftStatus === 'open';
      },
      
      getCurrentShift: async () => {
        const { currentShiftId } = get();
        if (!currentShiftId) return null;
        
        try {
          const shift = await CashierShiftService.getShiftById(currentShiftId);
          return shift;
        } catch (error) {
          console.error('Error getting current shift:', error);
          return null;
        }
      },
    }),
    {
      name: 'shift-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
      partialize: (state) => ({
        // Only persist these fields
        currentShiftId: state.currentShiftId,
        shiftStatus: state.shiftStatus,
      }) as ShiftState,
      onRehydrateStorage: () => {
        // Called before state is rehydrated from storage
        return (state, error) => {
          if (error) {
            console.error('An error happened during shift state hydration', error);
            // Reset to safe defaults on error
            if (state) {
              state.currentShiftId = null;
              state.shiftStatus = 'closed';
            }
          } else if (state) {
            // Ensure we have a consistent state after rehydration
            if (!state.currentShiftId) {
              state.shiftStatus = 'closed';
            } else if (state.currentShiftId && state.shiftStatus !== 'open') {
              state.shiftStatus = 'unknown'; // Need to verify status after rehydration
            }
          }
        };
      },
    }
  )
);