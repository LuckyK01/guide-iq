import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "new_joiner" | "manager" | "sme" | "admin";

export const ROLE_LABEL: Record<AppRole, string> = {
  new_joiner: "New Joiner",
  manager: "Manager / HR",
  sme: "SME / Content Owner",
  admin: "Admin",
};

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
      ]);
      const r = (roles ?? []).map((x) => x.role as AppRole);
      return {
        id: u.user.id,
        email: u.user.email ?? "",
        profile,
        roles: r,
        name: profile?.full_name || u.user.email || "User",
        isStaff: r.some((x) => x !== "new_joiner"),
        isAdmin: r.includes("admin"),
        canReview: r.some((x) => x === "manager" || x === "sme" || x === "admin"),
      };
    },
  });
}

export async function logAudit(action: string, resource_type: string, resource_id: string | null, resource_label: string, details?: Record<string, unknown>) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { data: p } = await supabase.from("profiles").select("full_name").eq("id", u.user.id).maybeSingle();
  await supabase.from("audit_logs").insert({
    actor_id: u.user.id,
    actor_name: p?.full_name || u.user.email,
    action,
    resource_type,
    resource_id,
    resource_label,
    details: (details ?? null) as never,
  });
}
