import { Suspense } from "react";
import { apiGet } from "@/lib/api";
import type { ChildrenPage } from "@/lib/types";
import { FiltersBar } from "@/components/children/filters-bar";
import { ChildrenTable } from "@/components/children/children-table";
import { Pagination } from "@/components/children/pagination";
import { Loader2, AlertTriangle } from "lucide-react";

interface PageProps {
    searchParams: Promise<{
        bairro?: string;
        revisado?: string;
        com_alertas?: string;
        page?: string;
    }>;
}

async function ChildrenContent({
    bairro,
    revisado,
    com_alertas,
    page,
}: {
    bairro?: string;
    revisado?: string;
    com_alertas?: string;
    page: number;
}) {
    const limit = 20;
    const qs = new URLSearchParams();
    if (bairro) qs.set("bairro", bairro);
    if (revisado) qs.set("revisado", revisado);
    if (com_alertas) qs.set("com_alertas", com_alertas);
    qs.set("page", String(page));
    qs.set("limit", String(limit));

    let result: ChildrenPage;

    try {
        result = await apiGet<ChildrenPage>(`/children?${qs.toString()}`);
    } catch {
        return (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <p className="text-sm font-medium text-destructive">
                    Erro ao carregar os dados. Verifique a conexão com o
                    servidor.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <ChildrenTable children={result.data} />
            <Pagination
                page={result.page}
                total={result.total}
                limit={result.limit}
            />
        </div>
    );
}

export default async function CriancasPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = Math.max(1, Number(params.page ?? 1));
    const { bairro, revisado, com_alertas } = params;

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-bold md:text-2xl">Crianças</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Listagem de crianças cadastradas na rede municipal
                </p>
            </div>

            {/* Filters são client components — ficam fora do Suspense */}
            <FiltersBar />

            <Suspense
                key={`${bairro}-${revisado}-${com_alertas}-${page}`}
                fallback={
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                }
            >
                <ChildrenContent
                    bairro={bairro}
                    revisado={revisado}
                    com_alertas={com_alertas}
                    page={page}
                />
            </Suspense>
        </div>
    );
}
