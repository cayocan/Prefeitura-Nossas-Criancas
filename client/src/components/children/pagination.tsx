"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface PaginationProps {
    page: number;
    total: number;
    limit: number;
}

export function Pagination({ page, total, limit }: PaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const from = total === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);

    function goTo(p: number) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(p));
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
    }

    // Build page number windows: first, current-1..current+1, last
    const pages = new Set<number>(
        [1, totalPages, page - 1, page, page + 1].filter(
            (p) => p >= 1 && p <= totalPages,
        ),
    );
    const sorted = Array.from(pages).sort((a, b) => a - b);

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
                {total === 0
                    ? "Nenhum resultado"
                    : `Exibindo ${from}–${to} de ${total.toLocaleString("pt-BR")} crianças`}
                {isPending && (
                    <Loader2 className="inline ml-2 h-3.5 w-3.5 animate-spin" />
                )}
            </p>

            {totalPages > 1 && (
                <div className="flex items-center gap-1">
                    <Button
                        size="icon-sm"
                        variant="outline"
                        disabled={page <= 1 || isPending}
                        onClick={() => goTo(page - 1)}
                        aria-label="Página anterior"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {sorted.map((p, i) => {
                        const prev = sorted[i - 1];
                        const gap = prev !== undefined && p - prev > 1;
                        return (
                            <span key={p} className="flex items-center gap-1">
                                {gap && (
                                    <span className="px-1 text-xs text-muted-foreground">
                                        …
                                    </span>
                                )}
                                <Button
                                    size="icon-sm"
                                    variant={p === page ? "default" : "outline"}
                                    disabled={isPending}
                                    onClick={() => goTo(p)}
                                >
                                    {p}
                                </Button>
                            </span>
                        );
                    })}

                    <Button
                        size="icon-sm"
                        variant="outline"
                        disabled={page >= totalPages || isPending}
                        onClick={() => goTo(page + 1)}
                        aria-label="Próxima página"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
