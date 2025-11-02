"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { useIsMobile } from "@/hooks/use-mobile";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode; // Optional fallback component to show while loading
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { isAuthenticated, loading, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize authentication state
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // If user is not authenticated and not loading, redirect to login
    if (!loading && !isAuthenticated) {
      console.log('[DEBUG] AuthGuard: User not authenticated, redirecting to login page (/)');
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  // Show fallback while checking authentication status
 if (loading || !isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  return <>{children}</>;
}