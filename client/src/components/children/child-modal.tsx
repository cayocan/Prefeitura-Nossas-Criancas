"use client";

import { useEffect, useState, useTransition } from "react";
import type { Child } from "@/lib/types";
import {
    X,
    CheckCircle2,
    Clock,
    FileWarning,
    HeartPulse,
    GraduationCap,
    HandHeart,
    AlertTriangle,
    User,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewChildAction } from "@/lib/auth";

interface Props {
    child: Child;
    onClose: () => void;
    onReview?: (id: string, revisado_por: string, revisado_em: string) => void;
}

function age(dob: string) {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR");
}

function SectionTitle({
    icon: Icon,
    label,
}: {
    icon: React.ElementType;
    label: string;
}) {
    return (
        <div className="flex items-center gap-2 border-b border-border pb-1.5 mb-2">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </h3>
        </div>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-0.5">
            <span className="text-xs text-muted-foreground shrink-0">
                {label}
            </span>
            <span className="text-xs text-right font-medium">{value}</span>
        </div>
    );
}

function AlertsList({ alertas }: { alertas: string[] }) {
    if (alertas.length === 0)
        return <p className="text-xs text-muted-foreground">Nenhum alerta</p>;
    return (
        <ul className="space-y-1 mt-1">
            {alertas.map((a, i) => (
                <li
                    key={i}
                    className="flex items-start gap-1.5 text-xs text-destructive"
                >
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    {a}
                </li>
            ))}
        </ul>
    );
}

export function ChildModal({ child, onClose, onReview }: Props) {
    const [revisado, setRevisado] = useState(child.revisado);
    const [revisadoPor, setRevisadoPor] = useState(child.revisado_por ?? null);
    const [revisadoEm, setRevisadoEm] = useState(child.revisado_em ?? null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const incomplete =
        !child.saude || !child.educacao || !child.assistencia_social;

    function handleReview() {
        setError(null);
        startTransition(async () => {
            const result = await reviewChildAction(child.id);
            if (result.ok && result.revisado_por && result.revisado_em) {
                setRevisado(true);
                setRevisadoPor(result.revisado_por);
                setRevisadoEm(result.revisado_em);
                onReview?.(child.id, result.revisado_por, result.revisado_em);
            } else {
                setError(result.error ?? "Erro ao revisar.");
            }
        });
    }

    // Fechar com Escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    // Bloquear scroll do body
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    return (
        /* Backdrop — full-screen no mobile, centralizado no desktop */
        <div
            className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center md:p-4 bg-black/40 backdrop-blur-sm"
            aria-modal="true"
            role="dialog"
            aria-label={`Detalhes de ${child.nome}`}
        >
            {/* Panel — full-screen no mobile, floating no desktop */}
            <div className="flex flex-col flex-1 md:flex-none w-full md:max-w-lg md:max-h-[90vh] md:rounded-2xl border-0 md:border border-border bg-card shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-border bg-card px-4 py-3 pt-safe-add-3 md:pt-3 md:rounded-t-2xl shrink-0">
                    <div className="min-w-0">
                        <h2 className="font-bold text-sm leading-tight">
                            {child.nome}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {age(child.data_nascimento)} anos · {child.bairro}
                        </p>
                        {incomplete && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                <FileWarning className="h-2.5 w-2.5" />
                                Dados incompletos
                            </span>
                        )}
                    </div>
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={onClose}
                        className="shrink-0"
                        aria-label="Fechar"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Body — flex-1 para ocupar o espaço disponível; overflow-y-auto só como fallback */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {/* Dados gerais */}
                    <section>
                        <SectionTitle icon={User} label="Dados Gerais" />
                        <Row label="Responsável" value={child.responsavel} />
                        <Row
                            label="Nascimento"
                            value={formatDate(child.data_nascimento)}
                        />
                        <Row
                            label="Status"
                            value={
                                revisado ? (
                                    <span className="inline-flex items-center gap-1 text-secondary-foreground">
                                        <CheckCircle2 className="h-3 w-3" />{" "}
                                        Revisado
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3 w-3" /> Pendente
                                    </span>
                                )
                            }
                        />
                        {revisadoPor && (
                            <Row label="Revisado por" value={revisadoPor} />
                        )}
                        {revisadoEm && (
                            <Row
                                label="Data revisão"
                                value={formatDate(revisadoEm)}
                            />
                        )}
                    </section>

                    {/* Saúde */}
                    <section>
                        <SectionTitle icon={HeartPulse} label="Saúde" />
                        {child.saude ? (
                            <>
                                <Row
                                    label="Última consulta"
                                    value={formatDate(
                                        child.saude.ultima_consulta,
                                    )}
                                />
                                <Row
                                    label="Vacinas em dia"
                                    value={
                                        child.saude.vacinas_em_dia
                                            ? "Sim"
                                            : "Não"
                                    }
                                />
                                {child.saude.alertas.length > 0 && (
                                    <AlertsList alertas={child.saude.alertas} />
                                )}
                            </>
                        ) : (
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                Sem dados de saúde cadastrados
                            </p>
                        )}
                    </section>

                    {/* Educação */}
                    <section>
                        <SectionTitle icon={GraduationCap} label="Educação" />
                        {child.educacao ? (
                            <>
                                <Row
                                    label="Escola"
                                    value={child.educacao.escola ?? "—"}
                                />
                                <Row
                                    label="Frequência"
                                    value={
                                        child.educacao.frequencia_percent !=
                                        null
                                            ? `${child.educacao.frequencia_percent}%`
                                            : "—"
                                    }
                                />
                                {child.educacao.alertas.length > 0 && (
                                    <AlertsList
                                        alertas={child.educacao.alertas}
                                    />
                                )}
                            </>
                        ) : (
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                Sem dados de educação cadastrados
                            </p>
                        )}
                    </section>

                    {/* Assistência Social */}
                    <section>
                        <SectionTitle
                            icon={HandHeart}
                            label="Assistência Social"
                        />
                        {child.assistencia_social ? (
                            <>
                                <Row
                                    label="CAD Único"
                                    value={
                                        child.assistencia_social.cad_unico
                                            ? "Sim"
                                            : "Não"
                                    }
                                />
                                <Row
                                    label="Benefício ativo"
                                    value={
                                        child.assistencia_social.beneficio_ativo
                                            ? "Sim"
                                            : "Não"
                                    }
                                />
                                {child.assistencia_social.alertas.length >
                                    0 && (
                                    <AlertsList
                                        alertas={
                                            child.assistencia_social.alertas
                                        }
                                    />
                                )}
                            </>
                        ) : (
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                Sem dados de assistência social cadastrados
                            </p>
                        )}
                    </section>
                </div>

                {/* Footer */}
                <div className="border-t border-border bg-card px-4 py-2.5 pb-safe-add-3 md:pb-2.5 flex items-center justify-between gap-2 md:rounded-b-2xl shrink-0">
                    <div className="min-w-0">
                        {error && (
                            <p className="text-xs text-destructive truncate">
                                {error}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {!revisado && (
                            <Button
                                size="sm"
                                onClick={handleReview}
                                disabled={isPending}
                                className="gap-1.5"
                            >
                                {isPending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Revisar
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={onClose}>
                            Fechar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
