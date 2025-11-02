"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLockScreenStore } from "@/lib/services/lockScreenService";
import { useAuthStore } from "@/lib/stores/authStore";
import { Lock, Unlock, User } from "lucide-react";

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isLocked, unlockAttempts, maxAttempts } = useLockScreenStore();
  const { user } = useAuthStore();

  // If screen is not locked, don't render anything
  if (!isLocked) {
    return null;
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError("Please enter your PIN");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to unlock the screen
      const { unlockScreen } = useLockScreenStore.getState();
      const success = await unlockScreen(pin);

      if (success) {
        onUnlock();
      } else {
        setError("Incorrect PIN. Please try again.");
        setPin("");
      }
    } catch (err) {
      console.error("Error unlocking screen:", err);
      setError("Failed to unlock screen. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const remainingAttempts = maxAttempts - unlockAttempts;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Screen Locked</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your PIN to unlock
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">
                Enter PIN
              </div>
              <div className="relative">
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="pr-10 text-center text-2xl tracking-widest"
                  maxLength={6}
                  disabled={isLoading}
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Unlock className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
                {error}
              </div>
            )}

            {remainingAttempts < maxAttempts && (
              <div className="rounded-md bg-warning/10 p-3 text-center text-sm text-warning">
                {remainingAttempts} attempts remaining
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.name || "User"}</span>
              </div>
              <Button
                type="submit"
                className="gap-2"
                disabled={isLoading || !pin.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" />
                    Unlock
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}