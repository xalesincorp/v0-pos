import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db, User } from '../db';
import { authService } from '../config/supabase';

interface AuthState {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  loading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  lockScreen: () => void;
  unlockScreen: (pin: string) => Promise<boolean>;
  initializeAuth: () => Promise<void>;
  updateOnlineStatus: (isOnline: boolean) => void;
  refreshSession: () => Promise<void>;
  updateUserPin: (pin: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist<AuthState>(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isOnline: true,
      loading: true,
      
      login: async (email, password) => {
        set({ loading: true });
        const isOnline = get().isOnline;
        
        try {
          // Authenticate with Supabase if online
          if (isOnline) {
            const data = await authService.signIn(email, password);
            const supabaseUser = data.user;
            const session = data.session;
            
            if (!supabaseUser) {
              throw new Error('Authentication failed - no user returned');
            }
            
            // Check if user exists in our local database
            let localUser = await db.users.get(supabaseUser.id);
            
            if (!localUser) {
              // Create user in local database if doesn't exist
              localUser = {
                id: supabaseUser.id,
                supabaseId: supabaseUser.id,
                email: supabaseUser.email || '',
                name: supabaseUser.user_metadata?.name || supabaseUser.email || supabaseUser.user_metadata?.full_name || 'Unknown User',
                role: 'kasir', // Default role, can be updated later
                pin: '', // Will be set separately
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
              };
              
              await db.users.add(localUser);
            }
            
            set({
              user: localUser,
              session,
              isAuthenticated: true,
              loading: false,
            });
          } else {
            // Offline mode: try to find user in local DB
            const users = await db.users.where('email').equals(email).toArray();
            if (users.length > 0) {
              const localUser = users[0];
              set({
                user: localUser,
                session: null, // No session in offline mode
                isAuthenticated: true,
                loading: false,
              });
            } else {
              set({ loading: false });
              throw new Error('User not found locally. Please connect to internet to login.');
            }
          }
        } catch (error: any) {
          set({ loading: false });
          console.error('Login error:', error);
          
          // If it's a network error and we haven't tried offline mode yet, try offline access
          if (!get().isOnline || error.message.includes('NetworkError') || error.message.includes('network')) {
            try {
              const users = await db.users.where('email').equals(email).toArray();
              if (users.length > 0) {
                const localUser = users[0];
                set({
                  user: localUser,
                  session: null, // No session in offline mode
                  isAuthenticated: true,
                  loading: false,
                });
                return; // Allow offline access
              }
            } catch (dbError) {
              console.error('Local DB error during offline login:', dbError);
            }
          }
          
          throw new Error(error.message || 'Login failed');
        }
      },
      
      logout: async () => {
        console.log('[DEBUG] AuthStore: logout called');
        set({ loading: true });

        try {
          // Sign out from Supabase
          await authService.signOut();

          console.log('[DEBUG] AuthStore: Supabase sign out successful, clearing auth state');
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            loading: false,
          });
          console.log('[DEBUG] AuthStore: Auth state cleared, isAuthenticated set to false');

          // Reset shift state on logout to prevent persistence across login sessions
          console.log('[DEBUG] AuthStore: Resetting shift state on logout');
          const { useShiftStore } = await import('./shiftStore');
          useShiftStore.getState().resetShiftState();
          console.log('[DEBUG] AuthStore: Shift state reset completed');
        } catch (error: any) {
          // Even if Supabase sign out fails, clear local state
          console.error('Logout error:', error);
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            loading: false,
          });
          console.log('[DEBUG] AuthStore: Auth state cleared on error, isAuthenticated set to false');

          // Still reset shift state even on error
          try {
            const { useShiftStore } = await import('./shiftStore');
            useShiftStore.getState().resetShiftState();
            console.log('[DEBUG] AuthStore: Shift state reset completed on error');
          } catch (shiftError) {
            console.error('Error resetting shift state:', shiftError);
          }
        }
        console.log('[DEBUG] AuthStore: logout function completed');
      },
      
      checkSession: async () => {
        const isOnline = get().isOnline;
        
        try {
          if (isOnline) {
            // Try to get session from Supabase first
            const supabaseSession = await authService.getSession();
            
            if (supabaseSession) {
              // Get user from local database
              const user = await db.users.get(supabaseSession.user.id);
              
              if (user) {
                set({
                  user,
                  session: supabaseSession,
                  isAuthenticated: true,
                });
              } else {
                // User doesn't exist locally, create it
                const newUser: User = {
                  id: supabaseSession.user.id,
                  supabaseId: supabaseSession.user.id,
                  email: supabaseSession.user.email || '',
                  name: supabaseSession.user.user_metadata?.name || supabaseSession.user.email || supabaseSession.user.user_metadata?.full_name || 'Unknown User',
                  role: 'kasir' as const, // Default role
                  pin: '', // Will be set separately
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  deletedAt: null,
                };
                
                await db.users.add(newUser);
                
                set({
                  user: newUser,
                  session: supabaseSession,
                  isAuthenticated: true,
                });
              }
            } else {
              // No valid session found, and we're online - user needs to log in again
              // Don't fall back to local database when online
              set({ isAuthenticated: false, user: null, session: null });
            }
          } else {
            // Offline mode: try to find any local user
            const users = await db.users.toArray();
            if (users.length > 0) {
              set({
                user: users[0],
                session: null, // No session in offline mode
                isAuthenticated: true,
              });
            } else {
              // No users available offline
              set({ isAuthenticated: false, user: null, session: null });
            }
          }
        } catch (error) {
          console.error('Error checking session:', error);
          // When online, don't fall back to offline users on error
          if (get().isOnline) {
            set({ isAuthenticated: false, user: null, session: null });
          } else {
            // Only try offline recovery when actually offline
            try {
              const users = await db.users.toArray();
              if (users.length > 0) {
                set({
                  user: users[0],
                  session: null, // No session in offline mode
                  isAuthenticated: true,
                });
              } else {
                // Clear authentication state on error
                set({ isAuthenticated: false, user: null, session: null });
              }
            } catch (dbError) {
              console.error('Error accessing local DB during recovery:', dbError);
              // Clear authentication state on error
              set({ isAuthenticated: false, user: null, session: null });
            }
          }
        }
      },
      
      refreshSession: async () => {
        const isOnline = get().isOnline;
        try {
          if (isOnline) {
            const currentSession = get().session;
            if (!currentSession) return;
            
            // Refresh the session to ensure it's still valid
            const refreshedSession = await authService.getSession();
            
            if (refreshedSession) {
              const user = await db.users.get(refreshedSession.user.id);
              if (user) {
                set({
                  user,
                  session: refreshedSession,
                  isAuthenticated: true,
                });
              } else {
                // User doesn't exist locally, create it
                const newUser: User = {
                  id: refreshedSession.user.id,
                  supabaseId: refreshedSession.user.id,
                  email: refreshedSession.user.email || '',
                  name: refreshedSession.user.user_metadata?.name || refreshedSession.user.email || refreshedSession.user.user_metadata?.full_name || 'Unknown User',
                  role: 'kasir' as const, // Default role
                  pin: '', // Will be set separately
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  deletedAt: null,
                };
                
                await db.users.add(newUser);
                
                set({
                  user: newUser,
                  session: refreshedSession,
                  isAuthenticated: true,
                });
              }
            } else {
              // Session is no longer valid, and we're online - user needs to log in again
              // Don't fall back to local database when online
              set({ isAuthenticated: false, user: null, session: null });
            }
          } else {
            // In offline mode, just ensure we have a user available
            const users = await db.users.toArray();
            if (users.length > 0) {
              set({
                user: users[0],
                session: null, // No session in offline mode
                isAuthenticated: true,
              });
            } else {
              set({ isAuthenticated: false, user: null, session: null });
            }
          }
        } catch (error) {
          console.error('Error refreshing session:', error);
          // When online, don't fall back to offline users on error
          if (get().isOnline) {
            set({ isAuthenticated: false, user: null, session: null });
          } else {
            // Only try offline recovery when actually offline
            try {
              const users = await db.users.toArray();
              if (users.length > 0) {
                set({
                  user: users[0],
                  session: null, // No session in offline mode
                  isAuthenticated: true,
                });
              } else {
                set({ isAuthenticated: false, user: null, session: null });
              }
            } catch (dbError) {
              console.error('Error accessing local DB during session refresh recovery:', dbError);
              set({ isAuthenticated: false, user: null, session: null });
            }
          }
        }
      },
      
      lockScreen: () => {
        // For now, just set a flag. Actual lock screen implementation would be in UI
        set({ isAuthenticated: false });
      },
      
      unlockScreen: async (pin) => {
        const { user } = get();
        if (!user) return false;

        // TODO: Implement proper PIN verification with hashing
        // For now, we'll just return true for demonstration
        return true;
      },
      
      initializeAuth: async () => {
        // Check for existing session on app start
        await get().checkSession();
        set({ loading: false });
      },
      
      updateOnlineStatus: (isOnline) => {
        set({ isOnline });
      },

      updateUserPin: async (pin) => {
        const { user } = get();
        if (!user) throw new Error('No user found');

        try {
          // Update user in local database
          const updatedUser = {
            ...user,
            pin,
            updatedAt: new Date()
          };
          
          await db.users.put(updatedUser);
          
          // Update store state
          set({ user: updatedUser });
        } catch (error) {
          console.error('Error updating PIN:', error);
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
        isOnline: state.isOnline,
      }) as AuthState,
      onRehydrateStorage: () => {
        // Called before state is rehydrated from storage
        return (state, error) => {
          if (error) {
            console.error('An error happened during hydration', error);
            // Clear authentication state on error
            if (state) {
              state.user = null;
              state.session = null;
              state.isAuthenticated = false;
            }
          } else if (state) {
            // Set loading to true during rehydration
            state.loading = true;
          }
        };
      },
    }
  )
);

// Function to set up auth state change listeners
export const setupAuthStateListener = () => {
  let authSubscription: any = null;
  
  // Initialize auth state change listener
  authSubscription = authService.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session);
    if (event === 'SIGNED_IN' && session) {
      // User signed in - try to get user from local DB or create
      try {
        const user = await db.users.get(session.user.id);
        if (user) {
          useAuthStore.setState({
            user,
            session,
            isAuthenticated: true,
            loading: false,
          });
        } else {
          // User doesn't exist locally, create it
          const newUser: User = {
            id: session.user.id,
            supabaseId: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || session.user.user_metadata?.full_name || 'Unknown User',
            role: 'kasir' as const, // Default role
            pin: '', // Will be set separately
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          };
          
          await db.users.add(newUser);
          
          useAuthStore.setState({
            user: newUser,
            session,
            isAuthenticated: true,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Error getting user on sign in:', error);
        useAuthStore.setState({
          user: null,
          session,
          isAuthenticated: true, // Still authenticated with Supabase
          loading: false,
        });
      }
    } else if (event === 'SIGNED_OUT') {
      // User signed out
      console.log('[DEBUG] AuthStore: SIGNED_OUT event received, clearing auth state');
      useAuthStore.setState({
        user: null,
        session: null,
        isAuthenticated: false,
        loading: false,
      });

      // Reset shift state on sign out event to prevent persistence across login sessions
      console.log('[DEBUG] AuthStore: Resetting shift state on SIGNED_OUT event');
      const { useShiftStore } = await import('./shiftStore');
      useShiftStore.getState().resetShiftState();
    } else if (event === 'USER_UPDATED' && session) {
      // User updated - refresh user data
      try {
        const user = await db.users.get(session.user.id);
        useAuthStore.setState({
          user: user || null,
          session,
          loading: false,
        });
      } catch (error) {
        console.error('Error refreshing user data:', error);
        useAuthStore.setState({
          session,
          loading: false,
        });
      }
    } else if (event === 'PASSWORD_RECOVERY' || event === 'TOKEN_REFRESHED') {
      // Token refreshed
      useAuthStore.setState({
        session,
        loading: false,
      });
    }
  });

  return authSubscription; // Return subscription to allow cleanup if needed
};