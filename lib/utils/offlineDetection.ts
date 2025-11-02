import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import toast from 'react-hot-toast';

// Function to check if we're online
export const checkOnlineStatus = (): boolean => {
  return navigator.onLine;
};

// Function to monitor online/offline status changes
export const monitorOnlineStatus = () => {
  const updateOnlineStatus = (isOnline: boolean) => {
    // Update auth store
    useAuthStore.getState().updateOnlineStatus(isOnline);
    
    // Update UI store
    useUIStore.getState().setOffline(!isOnline);
    
    // Show notification based on status
    if (isOnline) {
      toast.success('Kembali online. Data akan disinkronkan saat tersedia.', {
        position: 'bottom-right',
      });
    } else {
      toast.error('Anda sedang offline. Beberapa fitur mungkin tidak tersedia.', {
        position: 'bottom-right',
      });
    }
  };

  // Initial status
  updateOnlineStatus(navigator.onLine);

  // Event listeners
  window.addEventListener('online', () => updateOnlineStatus(true));
  window.addEventListener('offline', () => updateOnlineStatus(false));

  // Return cleanup function
  return () => {
    window.removeEventListener('online', () => updateOnlineStatus(true));
    window.removeEventListener('offline', () => updateOnlineStatus(false));
  };
};

// Enhanced offline detection with additional checks
export const advancedOfflineDetection = async (): Promise<boolean> => {
  // First check navigator.onLine
  if (!navigator.onLine) {
    return true; // Definitely offline
  }

  // For a more accurate check, try to fetch a simple resource
  try {
    // Using a small resource that's likely to be available
    const response = await fetch('/', { method: 'HEAD', cache: 'no-store' });
    return !response.ok;
  } catch (error) {
    // If fetch fails, we're likely offline
    return true;
 }
};