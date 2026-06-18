import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading, rolesLoading, roles } = useAuth();

  if (loading || (user && rolesLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Admin area requires admin or vendor role
  const hasAdminAccess = roles.includes("admin") || roles.includes("vendor");
  if (!hasAdminAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
