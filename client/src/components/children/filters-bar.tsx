"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";

const REVISADO_OPTIONS = [
    { value: "", label: "Todos" },
    { value: "true", label: "Revisados" },
    { value: "false", label: "Não revisados" },
];

const ALERTAS_OPTIONS = [
    { value: "", label: "Todos" },
    { value: "true", label: "Com alertas" },
    { value: "false", label: "Sem alertas" },
];

export function FiltersBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const bairro = searchParams.get("bairro") ?? "";
    const revisado = searchParams.get("revisado") ?? "";
    const com_alertas = searchParams.get("com_alertas") ?? "";

    const push = useCallback(
        (updates: Record<string, string>) => {
            const params = new URLSearchParams(searchParams.toString());
            for (const [key, value] of Object.entries(updates)) {
                if (value) params.set(key, value);
                else params.delete(key);
            }
            params.delete("page"); // reset to page 1 on filter change
            startTransition(() =>
                router.push(`${pathname}?${params.toString()}`),
            );
        },
        [searchParams, router, pathname],
    );

    const hasFilters = bairro || revisado || com_alertas;

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Bairro */}
            <div className="relative flex-1 min-w-40 max-w-xs">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                    placeholder="Filtrar por bairro…"
                    defaultValue={bairro}
                    className="pl-8 h-9 text-sm"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            push({
                                bairro: (e.target as HTMLInputElement).value,
                            });
                        }
                    }}
                    onBlur={(e) => push({ bairro: e.target.value })}
                />
            </div>

            {/* Revisado */}
            <div className="flex rounded-md border border-input overflow-hidden h-9 text-sm shrink-0">
                {REVISADO_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => push({ revisado: opt.value })}
                        className={`px-3 py-1.5 transition-colors whitespace-nowrap ${
                            revisado === opt.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-foreground hover:bg-muted"
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Alertas */}
            <div className="flex rounded-md border border-input overflow-hidden h-9 text-sm shrink-0">
                {ALERTAS_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => push({ com_alertas: opt.value })}
                        className={`px-3 py-1.5 transition-colors whitespace-nowrap ${
                            com_alertas === opt.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-foreground hover:bg-muted"
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Clear + Loading */}
            <div className="flex items-center gap-2">
                {hasFilters && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                            push({ bairro: "", revisado: "", com_alertas: "" })
                        }
                        className="h-9 gap-1.5 text-muted-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                        Limpar
                    </Button>
                )}
                {isPending && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>
        </div>
    );
}
