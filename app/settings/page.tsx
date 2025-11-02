import SettingsPage from "@/components/pages/settings-page";
import AuthGuard from "@/components/auth/auth-guard";

export default function Page() {
  return (
    <AuthGuard>
      <SettingsPage />
    </AuthGuard>
  );
}