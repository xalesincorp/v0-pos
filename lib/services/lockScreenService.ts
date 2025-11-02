import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from '@/lib/stores/authStore';

interface LockScreenState {
  isLocked: boolean;
  lockTime: Date | null;
  unlockAttempts: number;
  maxAttempts: number;
  lockScreenTimeout: number; // in minutes
  
  lockScreen: () => void;
  unlockScreen: (pin: string) => Promise<boolean>;
  resetAttempts: () => void;
  checkLockStatus: () => void;
}

export const useLockScreenStore = create<LockScreenState>()(
  persist(
    (set, get) => ({
      isLocked: false,
      lockTime: null,
      unlockAttempts: 0,
      maxAttempts: 5,
      lockScreenTimeout: 15, // Default to 15 minutes
      
      lockScreen: () => {
        set({ 
          isLocked: true, 
          lockTime: new Date(),
          unlockAttempts: 0 
        });
      },
      
      unlockScreen: async (pin: string): Promise<boolean> => {
        const { user } = useAuthStore.getState();
        
        if (!user) {
          return false;
        }
        
        try {
          // In a real implementation, you would validate the PIN against the stored hash
          // For this implementation, we'll check if the entered PIN matches the user's PIN
          // In a real app, this would be a secure hash comparison
          // Check if PIN matches user's stored PIN or default PIN
          const storedPin = user.pin || '' // Empty means use default
          const defaultPin = '1234'
          const isValid = pin === storedPin || (storedPin === '' && pin === defaultPin)
          
          if (isValid) {
            set({ 
              isLocked: false, 
              lockTime: null,
              unlockAttempts: 0 
            });
            return true;
          } else {
            const { unlockAttempts, maxAttempts } = get();
            const newAttempts = unlockAttempts + 1;
            
            if (newAttempts >= maxAttempts) {
              // Too many attempts - maybe lock for a period or notify admin
              // For now, just reset attempts
              set({ unlockAttempts: 0 });
              return false;
            }
            
            set({ unlockAttempts: newAttempts });
            return false;
          }
        } catch (error) {
          console.error('Error unlocking screen:', error);
          return false;
        }
      },
      
      resetAttempts: () => {
        set({ unlockAttempts: 0 });
      },
      
      checkLockStatus: () => {
        const { isLocked, lockTime, lockScreenTimeout } = get();
        if (!isLocked || !lockTime) return;
        
        // Check if timeout has been exceeded
        const timeoutMs = lockScreenTimeout * 60 * 1000; // Convert minutes to milliseconds
        const now = new Date();
        
        if (now.getTime() - lockTime.getTime() > timeoutMs) {
          // Timeout exceeded, unlock automatically
          set({ isLocked: false, lockTime: null });
        }
      }
    }),
    {
      name: 'lock-screen-storage',
    }
  )
);

// Service class for lock screen functionality
class LockScreenService {
  /**
   * Check if the app should be locked based on settings
   */
  static shouldLockScreen(): boolean {
    // In a real implementation, this would check the settings store
    // For now, we'll return false to prevent automatic locking during development
    return false;
  }

  /**
   * Initialize lock screen functionality
   */
  static initialize(): void {
    // Check if we should lock the screen on startup
    const { checkLockStatus } = useLockScreenStore.getState();
    checkLockStatus();
    
    // Set up event listeners for when the app becomes inactive
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // App is going to background - potentially lock if settings allow
        if (this.shouldLockScreen()) {
          // We'll lock after a timeout instead of immediately
          setTimeout(() => {
            if (document.hidden && this.shouldLockScreen()) {
              const { isLocked } = useLockScreenStore.getState();
              if (!isLocked) {
                const { lockScreen } = useLockScreenStore.getState();
                lockScreen();
              }
            }
          }, 1000); // Wait 1 second before checking if still hidden
        }
      }
    });

    // Listen for user activity to reset lock timer
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        if (this.shouldLockScreen()) {
          const { isLocked, checkLockStatus } = useLockScreenStore.getState();
          if (!isLocked) {
            checkLockStatus();
          }
        }
      }, { passive: true });
    });
  }

 /**
   * Lock the screen manually
   */
  static lockScreen(): void {
    const { lockScreen } = useLockScreenStore.getState();
    lockScreen();
  }

  /**
   * Check if screen is currently locked
   */
  static isLocked(): boolean {
    const { isLocked } = useLockScreenStore.getState();
    return isLocked;
  }

  /**
   * Attempt to unlock the screen with a PIN
   */
  static async unlockScreen(pin: string): Promise<boolean> {
    const { unlockScreen } = useLockScreenStore.getState();
    return await unlockScreen(pin);
  }

  /**
   * Get the number of remaining unlock attempts
   */
  static getRemainingAttempts(): number {
    const { unlockAttempts, maxAttempts } = useLockScreenStore.getState();
    return maxAttempts - unlockAttempts;
  }
  
  /**
   * Set lock screen timeout (in minutes)
   */
  static setLockScreenTimeout(timeout: number): void {
    useLockScreenStore.setState({ lockScreenTimeout: timeout });
  }
}

export { LockScreenService };