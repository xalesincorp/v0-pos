import ProductsPage from "@/components/pages/products-page";
import AuthGuard from "@/components/auth/auth-guard";

export default function Page() {
  return (
    <AuthGuard>
      <ProductsPage />
    </AuthGuard>
  );
}