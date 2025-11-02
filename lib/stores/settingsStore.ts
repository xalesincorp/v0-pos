import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { settingsService } from '@/lib/services/settingsService';
import { AllSettings, SettingKey } from '@/lib/types/settings';

interface SettingsState {
  settings: AllSettings;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;

  // Actions
  initializeSettings: (userId: string) => Promise<void>;
  getSetting: <T extends SettingKey>(key: T) => AllSettings[T] | undefined;
  updateSetting: <T extends SettingKey>(key: T, value: AllSettings[T], userId: string) => Promise<void>;
  saveAllSettings: (settings: Partial<AllSettings>, userId: string) => Promise<void>;
  resetSetting: <T extends SettingKey>(key: T, userId: string) => Promise<void>;
  resetAllSettings: (userId: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: {} as AllSettings,
      isLoading: false,
      error: null,
      initialized: false,

      initializeSettings: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const allSettings = await settingsService.getAllSettings();
          set({ settings: allSettings, initialized: true, isLoading: false });
        } catch (error: any) {
          set({ error: error.message || 'Failed to initialize settings', isLoading: false });
          throw error;
        }
      },

      getSetting: <T extends SettingKey>(key: T) => {
        return get().settings[key];
      },

      updateSetting: async <T extends SettingKey>(key: T, value: AllSettings[T], userId: string) => {
        set({ isLoading: true });
        try {
          await settingsService.saveSettings(key, value, userId);
          
          set((state) => ({
            settings: {
              ...state.settings,
              [key]: value,
            },
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message || 'Failed to update setting', isLoading: false });
          throw error;
        }
      },

      saveAllSettings: async (settings: Partial<AllSettings>, userId: string) => {
        set({ isLoading: true });
        try {
          await settingsService.saveMultipleSettings(settings, userId);
          
          set((state) => ({
            settings: {
              ...state.settings,
              ...settings,
            },
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message || 'Failed to save settings', isLoading: false });
          throw error;
        }
      },

      resetSetting: async <T extends SettingKey>(key: T, userId: string) => {
        set({ isLoading: true });
        try {
          await settingsService.resetSettings(key, userId);
          
          const resetSetting = await settingsService.getSettings(key);
          if (resetSetting) {
            set((state) => ({
              settings: {
                ...state.settings,
                [key]: resetSetting,
              },
              isLoading: false,
            }));
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to reset setting', isLoading: false });
          throw error;
        }
      },

      resetAllSettings: async (userId: string) => {
        set({ isLoading: true });
        try {
          await settingsService.resetAllSettings(userId);
          const allSettings = await settingsService.getAllSettings();
          set({ settings: allSettings, isLoading: false });
        } catch (error: any) {
          set({ error: error.message || 'Failed to reset all settings', isLoading: false });
          throw error;
        }
      },

      refreshSettings: async () => {
        set({ isLoading: true });
        try {
          const allSettings = await settingsService.getAllSettings();
          set({ settings: allSettings, isLoading: false });
        } catch (error: any) {
          set({ error: error.message || 'Failed to refresh settings', isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'pos-settings-storage',
    }
  )
);