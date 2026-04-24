import { apiGet } from "@/lib/api";
import type { ChartsData } from "@/lib/types";
import { ChartsSection } from "@/components/dashboard/charts-section";
import {
    Users,
    ClipboardCheck,
    HeartPulse,
    GraduationCap,
    HandHeart,
    AlertTriangle,
} from "lucide-react";

type Summary = {
    total: number;
    revisados: number;
    alertas_saude: number;
    alertas_educacao: number;
    alertas_assistencia: number;
};

type CardConfig = {
    label: string;
    value: number;
    subtitle?: string;
    icon: React.ElementType;
    variant: "default" | "success" | "warning";
};

function SummaryCard({
    label,
    value,
    subtitle,
    icon: Icon,
    variant,
}: CardConfig) {
    const colors = {
        default: "bg-card border-border text-foreground",
        success: "bg-secondary/20 border-secondary/40 text-foreground",
        warning: "bg-accent/15 border-accent/40 text-foreground",
    };
    const iconColors = {
        default: "text-primary",
        success: "text-secondary-foreground",
        warning: "text-accent",
    };

    return (
        <div
            className={`rounded-xl border p-4 md:p-5 shadow-sm ${colors[variant]}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                    </p>
                    <p className="mt-1.5 text-3xl font-bold tabular-nums leading-none">
                        {value.toLocaleString("pt-BR")}
                    </p>
                    {subtitle && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>
                <Icon
                    className={`h-6 w-6 shrink-0 mt-0.5 ${iconColors[variant]}`}
                />
            </div>
        </div>
    );
}

export default async function DashboardPage() {
    let summary: Summary;
    let charts: ChartsData | null = null;

    try {
        summary = await apiGet<Summary>("/children/summary");
    } catch {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="text-sm font-medium text-destructive">
                    Não foi possível carregar os dados do painel.
                </p>
                <p className="text-xs text-muted-foreground">
                    Verifique a conexão com o servidor e recarregue a página.
                </p>
            </div>
        );
    }
    try {
        charts = await apiGet<ChartsData>("/children/charts");
    } catch {
        // charts opcionais — falha silenciosa
    }
    const pct =
        summary.total > 0
            ? Math.round((summary.revisados / summary.total) * 100)
            : 0;

    const cards: CardConfig[] = [
        {
            label: "Total de Crianças",
            value: summary.total,
            icon: Users,
            variant: "default",
        },
        {
            label: "Revisadas",
            value: summary.revisados,
            subtitle: `${pct}% do total`,
            icon: ClipboardCheck,
            variant: "success",
        },
        {
            label: "Alertas — Saúde",
            value: summary.alertas_saude,
            icon: HeartPulse,
            variant: "warning",
        },
        {
            label: "Alertas — Educação",
            value: summary.alertas_educacao,
            icon: GraduationCap,
            variant: "warning",
        },
        {
            label: "Alertas — Assistência",
            value: summary.alertas_assistencia,
            icon: HandHeart,
            variant: "warning",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold md:text-2xl">Visão Geral</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Panorama atual do acompanhamento de crianças
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 md:gap-4">
                {cards.map((card) => (
                    <SummaryCard key={card.label} {...card} />
                ))}
            </div>

            {charts && <ChartsSection data={charts} />}
        </div>
    );
}
