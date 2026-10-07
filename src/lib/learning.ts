import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Question = { q: string; type: "mcq" | "multi" | "tf"; options: string[]; answer: number[] };

export function useMyModules() {
  return useQuery({
    queryKey: ["my-modules"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const [{ data: mods, error }, { data: prog }] = await Promise.all([
        supabase.from("modules").select("*").eq("published", true).order("sort_order"),
        supabase.from("module_progress").select("*").eq("user_id", u.user!.id),
      ]);
      if (error) throw error;
      return (mods ?? []).map((m) => {
        const p = prog?.find((x) => x.module_id === m.id);
        return { ...m, questions: (m.questions as unknown as Question[]) ?? [], p, state: p?.state ?? "not_started", progress: p?.progress ?? 0 };
      });
    },
  });
}

export const TRACK_LABEL: Record<string, string> = { mandatory: "Mandatory", role: "Role-based", experience: "Experience-based" };
