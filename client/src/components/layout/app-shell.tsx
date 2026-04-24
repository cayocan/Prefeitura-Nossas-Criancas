"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, X, Menu, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { InactivityWatcher } from "@/components/providers/inactivity-watcher";
import { logoutAction } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
    { label: "Crianças", href: "/criancas", icon: Users },
] as const;

// ── Shared sub-components ─────────────────────────────────────────────────────

function SidebarNavLinks({
    pathname,
    onNavigate,
}: {
    pathname: string;
    onNavigate?: () => void;
}) {
    return (
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
                const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                        )}
                    >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}

function SidebarFooter({ userEmail }: { userEmail?: string }) {
    return (
        <div className="shrink-0 border-t border-sidebar-border px-3 pb-4 pb-safe pt-3 space-y-1">
            {userEmail && (
                <p className="px-3 text-xs text-sidebar-foreground/50 truncate">
                    {userEmail}
                </p>
            )}
            <div className="flex items-center gap-1">
                <ThemeToggle className="text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground" />
                <form action={logoutAction} className="flex-1">
                    <button
                        type="submit"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        Sair
                    </button>
                </form>
            </div>
        </div>
    );
}

function SidebarBrand() {
    return (
        <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-sidebar-foreground">
                Nossas Crianças
            </span>
            <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
                Prefeitura-RJ
            </span>
        </div>
    );
}

// ── AppShell ──────────────────────────────────────────────────────────────────

interface AppShellProps {
    children: React.ReactNode;
    userEmail?: string;
}

export function AppShell({ children, userEmail }: AppShellProps) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const pathname = usePathname();

    const currentPage = NAV_ITEMS.find(
        (item) =>
            pathname === item.href || pathname.startsWith(item.href + "/"),
    );

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <InactivityWatcher />

            {/* ── Desktop sidebar ─────────────────────────────────────── */}
            <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
                <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
                    <SidebarBrand />
                </div>
                <SidebarNavLinks pathname={pathname} />
                <SidebarFooter userEmail={userEmail} />
            </aside>

            {/* ── Mobile drawer ───────────────────────────────────────── */}
            {drawerOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 z-40 bg-black/40 md:hidden"
                        onClick={() => setDrawerOpen(false)}
                        aria-hidden
                    />
                    {/* Drawer */}
                    <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar md:hidden">
                        <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
                            <SidebarBrand />
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent"
                                aria-label="Fechar menu"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <SidebarNavLinks
                            pathname={pathname}
                            onNavigate={() => setDrawerOpen(false)}
                        />
                        <SidebarFooter userEmail={userEmail} />
                    </aside>
                </>
            )}

            {/* ── Main area ───────────────────────────────────────────── */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Mobile top bar */}
                <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 pt-safe-add-3 md:pt-0 md:hidden">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="rounded-md p-1.5 text-foreground hover:bg-muted"
                        aria-label="Abrir menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="flex-1 truncate text-sm font-semibold">
                        {currentPage?.label ?? "Painel"}
                    </span>
                    <ThemeToggle />
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
