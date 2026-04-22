import { z } from 'zod';

export const SaudeSchema = z.object({
    ultima_consulta: z.string(),
    vacinas_em_dia: z.boolean(),
    alertas: z.array(z.string()),
});

export const EducacaoSchema = z.object({
    escola: z.string().nullable(),
    frequencia_percent: z.number().nullable(),
    alertas: z.array(z.string()),
});

export const AssistenciaSocialSchema = z.object({
    cad_unico: z.boolean(),
    beneficio_ativo: z.boolean(),
    alertas: z.array(z.string()),
});

export const ChildSchema = z.object({
    id: z.string(),
    nome: z.string(),
    data_nascimento: z.string(),
    bairro: z.string(),
    responsavel: z.string(),
    saude: SaudeSchema.nullable(),
    educacao: EducacaoSchema.nullable(),
    assistencia_social: AssistenciaSocialSchema.nullable(),
    revisado: z.boolean(),
    revisado_por: z.string().nullable(),
    revisado_em: z.string().nullable(),
});

// This is for TypeScript type inference, allowing us to use the Child type elsewhere in our codebase
export type Child = z.infer<typeof ChildSchema>;