import { create } from 'zustand';

interface UIState {
  loading: boolean;
  error: string | null;
  success: string | null;
  modalOpen: boolean;
 currentModal: string | null;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'warning' | 'info' | null;
  offline: boolean;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  openModal: (modalName: string) => void;
  closeModal: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  hideToast: () => void;
 setOffline: (offline: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  loading: false,
  error: null,
 success: null,
 modalOpen: false,
  currentModal: null,
  toastMessage: null,
  toastType: null,
  offline: false,
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => {
    set({ error, success: null });
    // Auto clear error after 5 seconds
    if (error) {
      setTimeout(() => set(state => state.error === error ? { error: null } : {}), 5000);
    }
  },
  
  setSuccess: (success) => {
    set({ success, error: null });
    // Auto clear success after 3 seconds
    if (success) {
      setTimeout(() => set(state => state.success === success ? { success: null } : {}), 3000);
    }
  },
  
  openModal: (modalName) => set({ modalOpen: true, currentModal: modalName }),
  
  closeModal: () => set({ modalOpen: false, currentModal: null }),
  
  showToast: (message, type) => {
    set({ toastMessage: message, toastType: type });
    // Auto clear toast after 3 seconds
    setTimeout(() => set(state => state.toastMessage === message ? { toastMessage: null, toastType: null } : {}), 3000);
  },
  
 hideToast: () => set({ toastMessage: null, toastType: null }),
  
  setOffline: (offline) => set({ offline }),
}));