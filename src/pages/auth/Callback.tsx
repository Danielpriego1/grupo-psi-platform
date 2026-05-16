import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    // The OAuth client sets session via setSession; Supabase email confirmation
    // also lands here. Wait briefly, then route by role.
    const t = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      const roleSet = new Set((roles ?? []).map((r) => r.role));
      if (roleSet.has("admin") || roleSet.has("vendor")) navigate("/admin", { replace: true });
      else if (roleSet.has("tecnico")) navigate("/tecnico", { replace: true });
      else navigate("/portal", { replace: true });
    }, 400);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
