import type { Child } from "@/lib/types";
import { AlertTriangle, CheckCircle2, Clock, FileWarning } from "lucide-react";

function allAlerts(child: Child) {
    const items: { label: string; text: string }[] = [];
    for (const a of child.saude?.alertas ?? [])
        items.push({ label: "Saúde", text: a });
    for (const a of child.educacao?.alertas ?? [])
        items.push({ label: "Educação", text: a });
    for (const a of child.assistencia_social?.alertas ?? [])
        items.push({ label: "Assistência", text: a });
    return items;
}

function AlertsBadge({ child }: { child: Child }) {
    const count = alertCount(child);
    if (count === 0)
        return <span className="text-xs text-muted-foreground">—</span>;

    const list = allAlerts(child);

    return (
        <span className="group/tooltip relative inline-flex">
            <span className="inline-flex cursor-default items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                <AlertTriangle className="h-3 w-3 text-accent" />
                {count}
            </span>

            {/* Tooltip */}
            <span
                role="tooltip"
                className="
                    pointer-events-none absolute bottom-full left-1/2 z-50 mb-2
                    w-max max-w-55 -translate-x-1/2
                    rounded-lg border border-border bg-popover px-3 py-2 shadow-lg
                    opacity-0 scale-95 transition-all duration-150
                    group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100
                "
            >
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Alertas
                </p>
                <ul className="space-y-1">
                    {list.map((item, i) => (
                        <li
                            key={i}
                            className="flex items-start gap-1.5 text-xs text-popover-foreground"
                        >
                            <span className="mt-0.5 shrink-0 rounded bg-accent/20 px-1 py-px text-[9px] font-medium text-accent-foreground">
                                {item.label}
                            </span>
                            {item.text}
                        </li>
                    ))}
                </ul>
                {/* Arrow */}
                <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-border filter-[drop-shadow(0_1px_0_var(--border))]" />
            </span>
        </span>
    );
}

function age(dob: string) {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function isIncomplete(child: Child) {
    return !child.saude || !child.educacao || !child.assistencia_social;
}

function alertCount(child: Child) {
    return (
        (child.saude?.alertas.length ?? 0) +
        (child.educacao?.alertas.length ?? 0) +
        (child.assistencia_social?.alertas.length ?? 0)
    );
}

// ── Mobile card ───────────────────────────────────────────────────────────────
function ChildCard({ child }: { child: Child }) {
    const alerts = alertCount(child);
    const incomplete = isIncomplete(child);
    return (
        <div className="rounded-lg border border-border bg-card p-3.5 space-y-2">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-medium text-sm truncate">
                            {child.nome}
                        </p>
                        {incomplete && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                <FileWarning className="h-2.5 w-2.5" />
                                Dados incompletos
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {child.bairro}
                    </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {alerts > 0 && <AlertsBadge child={child} />}
                    {child.revisado ? (
                        <CheckCircle2 className="h-4 w-4 text-secondary-foreground shrink-0" />
                    ) : (
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{age(child.data_nascimento)} anos</span>
                <span className="truncate">Resp.: {child.responsavel}</span>
            </div>
        </div>
    );
}

// ── Desktop table ─────────────────────────────────────────────────────────────
function ChildRow({ child }: { child: Child }) {
    const alerts = alertCount(child);
    const incomplete = isIncomplete(child);
    return (
        <tr className="border-b border-border hover:bg-muted/40 transition-colors">
            <td className="py-3 pl-4 pr-2">
                <span className="font-medium text-sm">{child.nome}</span>
                {incomplete && (
                    <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 align-middle">
                        <FileWarning className="h-2.5 w-2.5" />
                        Dados incompletos
                    </span>
                )}
            </td>
            <td className="py-3 px-2 text-sm text-muted-foreground">
                {age(child.data_nascimento)} anos
            </td>
            <td className="py-3 px-2 text-sm text-muted-foreground">
                {child.bairro}
            </td>
            <td className="py-3 px-2 text-sm text-muted-foreground truncate max-w-40">
                {child.responsavel}
            </td>
            <td className="py-3 px-2 text-center">
                <AlertsBadge child={child} />
            </td>
            <td className="py-3 px-2 pr-4 text-center">
                {child.revisado ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Sim
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" /> Pendente
                    </span>
                )}
            </td>
        </tr>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ChildrenTable({ children }: { children: Child[] }) {
    if (children.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                    Nenhuma criança encontrada.
                </p>
                <p className="text-xs text-muted-foreground">
                    Tente ajustar os filtros.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Mobile: cards */}
            <div className="flex flex-col gap-2 md:hidden">
                {children.map((c) => (
                    <ChildCard key={c.id} child={c} />
                ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block rounded-xl border border-border bg-card overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="py-2.5 pl-4 pr-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Nome
                            </th>
                            <th className="py-2.5 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Idade
                            </th>
                            <th className="py-2.5 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Bairro
                            </th>
                            <th className="py-2.5 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Responsável
                            </th>
                            <th className="py-2.5 px-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Alertas
                            </th>
                            <th className="py-2.5 px-2 pr-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Revisado
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {children.map((c) => (
                            <ChildRow key={c.id} child={c} />
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
