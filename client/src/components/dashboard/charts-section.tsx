import type { ChartsData } from "@/lib/types";

// ── Donut ring (SVG) ──────────────────────────────────────────────────────────
function DonutRing({ revisados, total }: { revisados: number; total: number }) {
    const r = 54;
    const circ = 2 * Math.PI * r;
    const pct = total > 0 ? revisados / total : 0;
    const arc = circ * pct;
    const pendentes = total - revisados;

    return (
        <div className="flex flex-col items-center gap-4">
            <svg
                width="148"
                height="148"
                viewBox="0 0 148 148"
                aria-hidden="true"
            >
                {/* Track */}
                <circle
                    cx="74"
                    cy="74"
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    className="text-muted"
                    strokeWidth="16"
                />
                {/* Arc */}
                {pct > 0 && (
                    <circle
                        cx="74"
                        cy="74"
                        r={r}
                        fill="none"
                        stroke="currentColor"
                        className="text-secondary"
                        strokeWidth="16"
                        strokeDasharray={`${arc} ${circ - arc}`}
                        strokeLinecap="round"
                        transform="rotate(-90 74 74)"
                    />
                )}
                {/* Center percentage */}
                <text
                    x="74"
                    y="70"
                    textAnchor="middle"
                    fontSize="28"
                    fontWeight="700"
                    style={{ fill: "var(--foreground)" }}
                >
                    {Math.round(pct * 100)}%
                </text>
                <text
                    x="74"
                    y="90"
                    textAnchor="middle"
                    fontSize="11"
                    style={{ fill: "var(--muted-foreground)" }}
                >
                    revisadas
                </text>
            </svg>

            {/* Legend */}
            <div className="flex gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-secondary" />
                    {revisados.toLocaleString("pt-BR")} revisadas
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted" />
                    {pendentes.toLocaleString("pt-BR")} pendentes
                </span>
            </div>
        </div>
    );
}

// ── Alert horizontal bars ─────────────────────────────────────────────────────
const BAR_COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-5"] as const;

function AlertBars({ alertas }: { alertas: ChartsData["alertas"] }) {
    const max = Math.max(...alertas.map((a) => a.total), 1);

    return (
        <div className="space-y-4 w-full">
            {alertas.map((item, i) => (
                <div key={item.categoria} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                            {item.categoria}
                        </span>
                        <span className="font-semibold tabular-nums">
                            {item.total}
                        </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                            className={`h-full rounded-full ${BAR_COLORS[i]}`}
                            style={{
                                width: `${Math.max((item.total / max) * 100, item.total > 0 ? 4 : 0)}%`,
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Coverage stacked bars ─────────────────────────────────────────────────────
function CoverageChart({ cobertura }: { cobertura: ChartsData["cobertura"] }) {
    return (
        <div className="space-y-4">
            {cobertura.map((item) => {
                const total = item.com_dados + item.sem_dados;
                const pct =
                    total > 0 ? Math.round((item.com_dados / total) * 100) : 0;
                return (
                    <div key={item.categoria} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                                {item.categoria}
                            </span>
                            <span className="font-semibold tabular-nums">
                                {pct}%{" "}
                                <span className="font-normal text-muted-foreground">
                                    com dados
                                </span>
                            </span>
                        </div>
                        <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 rounded-full bg-secondary"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{item.com_dados} com dados</span>
                            <span>{item.sem_dados} sem dados</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Bairro heatmap ────────────────────────────────────────────────────────────
function bairroClasses(rate: number): {
    cell: string;
    bar: string;
    count: string;
} {
    if (rate === 0)
        return {
            cell: "bg-secondary/15 border-secondary/30",
            bar: "bg-secondary",
            count: "text-secondary-foreground",
        };
    if (rate < 0.25)
        return {
            cell: "bg-yellow-500/10 border-yellow-500/25 dark:bg-yellow-400/10 dark:border-yellow-400/20",
            bar: "bg-yellow-500 dark:bg-yellow-400",
            count: "text-yellow-700 dark:text-yellow-300",
        };
    if (rate < 0.5)
        return {
            cell: "bg-orange-500/10 border-orange-500/25 dark:bg-orange-400/10 dark:border-orange-400/20",
            bar: "bg-orange-500 dark:bg-orange-400",
            count: "text-orange-700 dark:text-orange-300",
        };
    return {
        cell: "bg-destructive/10 border-destructive/25",
        bar: "bg-destructive",
        count: "text-destructive",
    };
}

function BairroHeatmap({
    por_bairro,
}: {
    por_bairro: ChartsData["por_bairro"];
}) {
    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-3 rounded-sm bg-secondary/40" />
                    Sem alertas
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-3 rounded-sm bg-yellow-500/30" />
                    &lt;25%
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-3 rounded-sm bg-orange-500/30" />
                    25–50%
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-3 rounded-sm bg-destructive/30" />
                    ≥50%
                </span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {por_bairro.map((item) => {
                    const rate =
                        item.total > 0 ? item.com_alertas / item.total : 0;
                    const cls = bairroClasses(rate);

                    return (
                        <div
                            key={item.bairro}
                            className={`rounded-lg border p-3 space-y-2 ${cls.cell}`}
                        >
                            <p
                                className="text-xs font-semibold leading-tight line-clamp-2"
                                title={item.bairro}
                            >
                                {item.bairro}
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span
                                    className={`text-xl font-bold tabular-nums leading-none ${cls.count}`}
                                >
                                    {item.total}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    crianças
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                {item.com_alertas} alerta
                                {item.com_alertas !== 1 ? "s" : ""}
                                {item.total > 0
                                    ? ` · ${Math.round(rate * 100)}%`
                                    : ""}
                            </p>
                            {/* Mini heat bar */}
                            <div className="h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${cls.bar}`}
                                    style={{
                                        width: `${Math.round(rate * 100)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Main exported component ───────────────────────────────────────────────────
export function ChartsSection({ data }: { data: ChartsData }) {
    const total = data.revisao.revisados + data.revisao.pendentes;

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold">Visualizações</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Dados agregados do acompanhamento
                </p>
            </div>

            {/* Revisão + Alertas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm flex flex-col gap-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Taxa de Revisão
                    </p>
                    <div className="flex flex-1 items-center justify-center">
                        <DonutRing
                            revisados={data.revisao.revisados}
                            total={total}
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm flex flex-col gap-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Alertas por Categoria
                    </p>
                    <div className="flex flex-1 items-center">
                        <AlertBars alertas={data.alertas} />
                    </div>
                </div>
            </div>

            {/* Cobertura */}
            <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-4">
                    Cobertura de Dados por Seção
                </p>
                <CoverageChart cobertura={data.cobertura} />
            </div>

            {/* Heatmap */}
            <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                    Mapa de Calor por Bairro
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                    Intensidade de cor indica taxa de alertas por bairro
                </p>
                <BairroHeatmap por_bairro={data.por_bairro} />
            </div>
        </div>
    );
}
