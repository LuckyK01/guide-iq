import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutGrid, Route as RouteIcon, BookOpen, ClipboardCheck, Bot, Library, ShieldCheck,
  Users, ScrollText, LogOut, Menu, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe, ROLE_LABEL } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Shell,
});

type NavItem = { to: string; label: string; icon: typeof LayoutGrid; show: (m: { isStaff: boolean; isAdmin: boolean; canReview: boolean }) => boolean };
const GROUPS: { label?: string; items: NavItem[] }[] = [
  { items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutGrid, show: () => true }] },
  {
    label: "Onboarding",
    items: [
      { to: "/journey", label: "My Journey", icon: RouteIcon, show: () => true },
      { to: "/modules", label: "Modules", icon: BookOpen, show: () => true },
      { to: "/assessments", label: "Assessments", icon: ClipboardCheck, show: () => true },
    ],
  },
  { items: [{ to: "/mentor", label: "AI Mentor", icon: Bot, show: () => true }] },
  {
    label: "Knowledge",
    items: [
      { to: "/knowledge", label: "Knowledge Hub", icon: Library, show: (m) => m.isStaff },
      { to: "/review", label: "Content Review", icon: ShieldCheck, show: (m) => m.canReview },
    ],
  },
  {
    label: "Governance",
    items: [
      { to: "/people", label: "People & Roles", icon: Users, show: (m) => m.isStaff },
      { to: "/audit", label: "Audit Trail", icon: ScrollText, show: (m) => m.isAdmin || m.canReview },
    ],
  },
];

function Shell() {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const nav = useNavigate();
  const perms = me ?? { isStaff: false, isAdmin: false, canReview: false };

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5 font-semibold">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">M</span> MentorMatch
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3">
        {GROUPS.map((g, i) => {
          const items = g.items.filter((it) => it.show(perms));
          if (!items.length) return null;
          return (
            <div key={i}>
              {g.label && <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</div>}
              {items.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-muted"
                  activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent" }}
                >
                  <it.icon className="size-4" /> {it.label}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 border-t p-4">
        <div className="grid size-9 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-accent-foreground">
          {(me?.name ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{me?.name}</div>
          <div className="truncate text-xs text-muted-foreground">{me?.roles.filter((r) => r !== "new_joiner" || me.roles.length === 1).map((r) => ROLE_LABEL[r]).join(", ")}</div>
        </div>
        <button onClick={signOut} aria-label="Sign out" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><LogOut className="size-4" /></button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-sidebar lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar">{sidebar}</aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
          <span className="font-semibold">MentorMatch</span>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8"><Outlet /></main>
      </div>
    </div>
  );
}
