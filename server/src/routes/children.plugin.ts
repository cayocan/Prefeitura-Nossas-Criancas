import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { pool } from '../lib/database';
import { MSG } from '../lib/messages';
import '../plugins/authenticate.plugin';

//#region OpenAPI Schemas

const BEARER_AUTH = [{ bearerAuth: [] }];

const SaudeSchema = {
    type: 'object',
    nullable: true,
    properties: {
        ultima_consulta: { type: 'string' },
        vacinas_em_dia: { type: 'boolean' },
        alertas: { type: 'array', items: { type: 'string' } },
    },
};

const EducacaoSchema = {
    type: 'object',
    nullable: true,
    properties: {
        escola: { type: 'string', nullable: true },
        frequencia_percent: { type: 'number', nullable: true },
        alertas: { type: 'array', items: { type: 'string' } },
    },
};

const AssistenciaSocialSchema = {
    type: 'object',
    nullable: true,
    properties: {
        cad_unico: { type: 'boolean' },
        beneficio_ativo: { type: 'boolean' },
        alertas: { type: 'array', items: { type: 'string' } },
    },
};

const ChildSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        nome: { type: 'string' },
        data_nascimento: { type: 'string', format: 'date' },
        bairro: { type: 'string' },
        responsavel: { type: 'string' },
        revisado: { type: 'boolean' },
        revisado_por: { type: 'string', nullable: true },
        revisado_em: { type: 'string', format: 'date-time', nullable: true },
        saude: SaudeSchema,
        educacao: EducacaoSchema,
        assistencia_social: AssistenciaSocialSchema,
    },
};

const ErrorSchema = {
    type: 'object',
    properties: { error: { type: 'string' } },
};

//#endregion

//#region Query Helpers

const ListQuerySchema = z.object({
    bairro: z.string().optional(),
    revisado: z.enum(['true', 'false']).optional(),
    com_alertas: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const CHILDREN_SELECT = `
    c.id, c.nome, c.data_nascimento, c.bairro, c.responsavel,
    c.revisado, c.revisado_por, c.revisado_em,
    s.child_id AS saude_child_id, s.ultima_consulta, s.vacinas_em_dia, s.alertas AS saude_alertas,
    e.child_id AS educacao_child_id, e.escola, e.frequencia_percent, e.alertas AS educacao_alertas,
    a.child_id AS assistencia_child_id, a.cad_unico, a.beneficio_ativo, a.alertas AS assistencia_alertas
`;

const CHILDREN_JOINS = `
    FROM children c
    LEFT JOIN saude s ON s.child_id = c.id
    LEFT JOIN educacao e ON e.child_id = c.id
    LEFT JOIN assistencia_social a ON a.child_id = c.id
`;

function mapRow(row: Record<string, unknown>) {
    return {
        id: row.id,
        nome: row.nome,
        data_nascimento: row.data_nascimento,
        bairro: row.bairro,
        responsavel: row.responsavel,
        revisado: row.revisado,
        revisado_por: row.revisado_por ?? null,
        revisado_em: row.revisado_em ?? null,
        saude: row.saude_child_id != null ? {
            ultima_consulta: row.ultima_consulta,
            vacinas_em_dia: row.vacinas_em_dia,
            alertas: row.saude_alertas ?? [],
        } : null,
        educacao: row.educacao_child_id != null ? {
            escola: row.escola,
            frequencia_percent: row.frequencia_percent,
            alertas: row.educacao_alertas ?? [],
        } : null,
        assistencia_social: row.assistencia_child_id != null ? {
            cad_unico: row.cad_unico,
            beneficio_ativo: row.beneficio_ativo,
            alertas: row.assistencia_alertas ?? [],
        } : null,
    };
}

//#endregion

//#region Plugin

const childrenPlugin: FastifyPluginAsync = async (fastify) => {

    fastify.addHook('onRequest', fastify.authenticate);

    // GET /children/summary
    fastify.get('/summary', {
        schema: {
            tags: ['children'],
            summary: 'Resumo agregado do painel',
            security: BEARER_AUTH,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        total: { type: 'integer' },
                        revisados: { type: 'integer' },
                        alertas_saude: { type: 'integer' },
                        alertas_educacao: { type: 'integer' },
                        alertas_assistencia: { type: 'integer' },
                    },
                },
            },
        },
    }, async (_request, reply) => {
        const result = await pool.query(`
            SELECT
                COUNT(*)::int                                                                       AS total,
                SUM(CASE WHEN c.revisado THEN 1 ELSE 0 END)::int                                   AS revisados,
                SUM(CASE WHEN COALESCE(jsonb_array_length(s.alertas), 0) > 0 THEN 1 ELSE 0 END)::int AS alertas_saude,
                SUM(CASE WHEN COALESCE(jsonb_array_length(e.alertas), 0) > 0 THEN 1 ELSE 0 END)::int AS alertas_educacao,
                SUM(CASE WHEN COALESCE(jsonb_array_length(a.alertas), 0) > 0 THEN 1 ELSE 0 END)::int AS alertas_assistencia
            ${CHILDREN_JOINS}
        `);
        return reply.send(result.rows[0]);
    });

    // GET /children
    fastify.get('/', {
        schema: {
            tags: ['children'],
            summary: 'Lista paginada de crianças com filtros opcionais',
            security: BEARER_AUTH,
            querystring: {
                type: 'object',
                properties: {
                    bairro: { type: 'string', description: 'Filtrar por bairro' },
                    revisado: { type: 'string', description: 'true | false' },
                    com_alertas: { type: 'string', description: 'true | false' },
                    page: { type: 'integer', description: 'Página (mín. 1)', default: 1 },
                    limit: { type: 'integer', description: 'Itens por página (mín. 1, máx. 100)', default: 20 },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        data: { type: 'array', items: ChildSchema },
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                    },
                },
                400: ErrorSchema,
            },
        },
    }, async (request, reply) => {
        const parsed = ListQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            return reply.status(400).send({ error: MSG.children.requisicaoInvalida, details: parsed.error.issues });
        }
        const { bairro, revisado, com_alertas, page, limit } = parsed.data;

        const params: unknown[] = [];
        const conditions: string[] = [];

        if (bairro) {
            params.push(bairro);
            conditions.push(`c.bairro = $${params.length}`);
        }
        if (revisado !== undefined) {
            params.push(revisado === 'true');
            conditions.push(`c.revisado = $${params.length}`);
        }
        if (com_alertas === 'true') {
            conditions.push(`(
                COALESCE(jsonb_array_length(s.alertas), 0) > 0 OR
                COALESCE(jsonb_array_length(e.alertas), 0) > 0 OR
                COALESCE(jsonb_array_length(a.alertas), 0) > 0
            )`);
        } else if (com_alertas === 'false') {
            conditions.push(`(
                COALESCE(jsonb_array_length(s.alertas), 0) = 0 AND
                COALESCE(jsonb_array_length(e.alertas), 0) = 0 AND
                COALESCE(jsonb_array_length(a.alertas), 0) = 0
            )`);
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        params.push(limit);
        const limitIdx = params.length;
        params.push((page - 1) * limit);
        const offsetIdx = params.length;

        const result = await pool.query(`
            SELECT
                COUNT(*) OVER()::int AS total_count,
                ${CHILDREN_SELECT}
            ${CHILDREN_JOINS}
            ${where}
            ORDER BY c.nome
            LIMIT $${limitIdx} OFFSET $${offsetIdx}
        `, params);

        return reply.send({
            data: result.rows.map(mapRow),
            page,
            limit,
            total: result.rows[0]?.total_count ?? 0,
        });
    });

    // GET /children/:id
    fastify.get('/:id', {
        schema: {
            tags: ['children'],
            summary: 'Detalhes completos de uma criança',
            security: BEARER_AUTH,
            params: {
                type: 'object',
                properties: { id: { type: 'string' } },
                required: ['id'],
            },
            response: {
                200: ChildSchema,
                404: ErrorSchema,
            },
        },
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const result = await pool.query(`
            SELECT ${CHILDREN_SELECT}
            ${CHILDREN_JOINS}
            WHERE c.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return reply.status(404).send({ error: MSG.children.naoEncontrada });
        }
        return reply.send(mapRow(result.rows[0]));
    });

    // PATCH /children/:id/review
    fastify.patch<{ Params: { id: string } }>('/:id/review', {
        schema: {
            tags: ['children'],
            summary: 'Registrar revisão de uma criança',
            security: BEARER_AUTH,
            params: {
                type: 'object',
                properties: { id: { type: 'string' } },
                required: ['id'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        ok: { type: 'boolean' },
                        id: { type: 'string' },
                    },
                },
                404: ErrorSchema,
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const { preferred_username } = request.user;

        const result = await pool.query(
            `UPDATE children
            SET revisado = true, revisado_por = $1, revisado_em = now()
            WHERE id = $2
            RETURNING id`,
            [preferred_username, id]
        );

        if (result.rowCount === 0) {
            return reply.status(404).send({ error: MSG.children.naoEncontrada });
        }
        return reply.send({ ok: true, id });
    });

};

export default childrenPlugin;

//#endregion
