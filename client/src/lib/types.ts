export type Child = {
    id: string
    nome: string
    data_nascimento: string
    bairro: string
    responsavel: string
    revisado: boolean
    revisado_por: string | null
    revisado_em: string | null
    saude: {
        ultima_consulta: string
        vacinas_em_dia: boolean
        alertas: string[]
    } | null
    educacao: {
        escola: string | null
        frequencia_percent: number | null
        alertas: string[]
    } | null
    assistencia_social: {
        cad_unico: boolean
        beneficio_ativo: boolean
        alertas: string[]
    } | null
}

export type ChildrenPage = {
    data: Child[]
    page: number
    limit: number
    total: number
}

export type ListParams = {
    bairro?: string
    revisado?: string
    com_alertas?: string
    page?: number
    limit?: number
}

export type ChartsData = {
    revisao: { revisados: number; pendentes: number }
    alertas: Array<{ categoria: string; total: number }>
    cobertura: Array<{ categoria: string; com_dados: number; sem_dados: number }>
    por_bairro: Array<{ bairro: string; total: number; revisados: number; com_alertas: number }>
}
