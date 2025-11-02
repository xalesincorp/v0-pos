import ReportsPage from "@/components/pages/reports-page";
import AuthGuard from "@/components/auth/auth-guard";

export default function Page() {
  return (
    <AuthGuard>
      <ReportsPage />
    </AuthGuard>
  );
}