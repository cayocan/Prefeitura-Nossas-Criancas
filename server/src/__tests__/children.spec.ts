import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

// Mock the database pool before importing the plugin
vi.mock('../lib/database', () => {
    const query = vi.fn();
    return { pool: { query } };
});

import fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import authenticatePlugin from '../plugins/authenticate.plugin';
import childrenPlugin from '../routes/children.plugin';
import { pool } from '../lib/database';
import { MSG } from '../lib/messages';

//#region Fixtures

const mockChildRow = {
    total_count: 1,
    id: 'child-1',
    nome: 'Ana Silva',
    data_nascimento: '2015-03-10',
    bairro: 'Copacabana',
    responsavel: 'Maria Silva',
    revisado: false,
    revisado_por: null,
    revisado_em: null,
    saude_child_id: 'child-1',
    ultima_consulta: '2024-01-01',
    vacinas_em_dia: true,
    saude_alertas: [],
    educacao_child_id: 'child-1',
    escola: 'Escola Municipal X',
    frequencia_percent: 90,
    educacao_alertas: [],
    assistencia_child_id: 'child-1',
    cad_unico: true,
    beneficio_ativo: true,
    assistencia_alertas: [],
};

const mockChildRowNoJoins = {
    ...mockChildRow,
    saude_child_id: null,
    educacao_child_id: null,
    assistencia_child_id: null,
};

const mockSummaryRow = {
    total: 10,
    revisados: 3,
    alertas_saude: 2,
    alertas_educacao: 1,
    alertas_assistencia: 4,
};

//#endregion

describe('children endpoints', () => {
    let app: ReturnType<typeof fastify>;
    let token: string;

    beforeEach(async () => {
        app = fastify();
        await app.register(fastifyJwt, { secret: 'test-secret' });
        await app.register(authenticatePlugin);
        await app.register(childrenPlugin, { prefix: '/children' });
        token = app.jwt.sign({ id: 1, role: 'admin', preferred_username: 'tecnico@prefeitura.rio' });
    });

    afterEach(async () => {
        await app.close();
        vi.clearAllMocks();
    });

    function auth() {
        return { authorization: `Bearer ${token}` };
    }

    //#region GET /children/summary

    describe('GET /children/summary', () => {
        it('returns 401 without token', async () => {
            const res = await app.inject({ method: 'GET', url: '/children/summary' });
            expect(res.statusCode).toBe(401);
        });

        it('returns aggregated counts', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [mockSummaryRow] });

            const res = await app.inject({ method: 'GET', url: '/children/summary', headers: auth() });

            expect(res.statusCode).toBe(200);
            expect(JSON.parse(res.payload)).toEqual(mockSummaryRow);
        });
    });

    //#endregion

    //#region GET /children

    describe('GET /children', () => {
        it('returns 401 without token', async () => {
            const res = await app.inject({ method: 'GET', url: '/children' });
            expect(res.statusCode).toBe(401);
        });

        it('returns paginated list with defaults (page=1, limit=20)', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [mockChildRow] });

            const res = await app.inject({ method: 'GET', url: '/children', headers: auth() });

            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.page).toBe(1);
            expect(body.limit).toBe(20);
            expect(body.total).toBe(1);
            expect(body.data).toHaveLength(1);
            expect(body.data[0].id).toBe('child-1');
        });

        it('returns empty list when no results', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [] });

            const res = await app.inject({ method: 'GET', url: '/children', headers: auth() });

            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.data).toHaveLength(0);
            expect(body.total).toBe(0);
        });

        it('maps saude, educacao and assistencia_social as nested objects', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [mockChildRow] });

            const res = await app.inject({ method: 'GET', url: '/children', headers: auth() });
            const { data } = JSON.parse(res.payload);

            expect(data[0].saude).toMatchObject({ ultima_consulta: '2024-01-01', vacinas_em_dia: true });
            expect(data[0].educacao).toMatchObject({ escola: 'Escola Municipal X', frequencia_percent: 90 });
            expect(data[0].assistencia_social).toMatchObject({ cad_unico: true, beneficio_ativo: true });
        });

        it('sets nested objects to null when child has no joins', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [mockChildRowNoJoins] });

            const res = await app.inject({ method: 'GET', url: '/children', headers: auth() });
            const { data } = JSON.parse(res.payload);

            expect(data[0].saude).toBeNull();
            expect(data[0].educacao).toBeNull();
            expect(data[0].assistencia_social).toBeNull();
        });

        it('accepts filter: bairro', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [mockChildRow] });

            const res = await app.inject({ method: 'GET', url: '/children?bairro=Copacabana', headers: auth() });

            expect(res.statusCode).toBe(200);
            const [sql, params] = (pool.query as any).mock.calls[0];
            expect(sql).toContain('c.bairro ILIKE');
            expect(params).toContain('%Copacabana%');
        });

        it('accepts filter: revisado=true', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [] });

            const res = await app.inject({ method: 'GET', url: '/children?revisado=true', headers: auth() });

            expect(res.statusCode).toBe(200);
            const [sql, params] = (pool.query as any).mock.calls[0];
            expect(sql).toContain('c.revisado =');
            expect(params).toContain(true);
        });

        it('accepts filter: revisado=false', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [] });

            const res = await app.inject({ method: 'GET', url: '/children?revisado=false', headers: auth() });

            expect(res.statusCode).toBe(200);
            const [sql, params] = (pool.query as any).mock.calls[0];
            expect(sql).toContain('c.revisado =');
            expect(params).toContain(false);
        });

        it('accepts filter: com_alertas=true', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [] });

            const res = await app.inject({ method: 'GET', url: '/children?com_alertas=true', headers: auth() });

            expect(res.statusCode).toBe(200);
            const [sql] = (pool.query as any).mock.calls[0];
            expect(sql).toContain('jsonb_array_length(s.alertas)');
            expect(sql).toContain('OR');
        });

        it('accepts filter: com_alertas=false', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [] });

            const res = await app.inject({ method: 'GET', url: '/children?com_alertas=false', headers: auth() });

            expect(res.statusCode).toBe(200);
            const [sql] = (pool.query as any).mock.calls[0];
            expect(sql).toContain('jsonb_array_length(s.alertas)');
            expect(sql).toContain('AND');
        });

        it('accepts custom page and limit', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [] });

            const res = await app.inject({ method: 'GET', url: '/children?page=3&limit=5', headers: auth() });

            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.page).toBe(3);
            expect(body.limit).toBe(5);
            // offset = (3 - 1) * 5 = 10
            const [, params] = (pool.query as any).mock.calls[0];
            expect(params).toContain(5);
            expect(params).toContain(10);
        });

        it('returns 400 for page=0', async () => {
            const res = await app.inject({ method: 'GET', url: '/children?page=0', headers: auth() });
            expect(res.statusCode).toBe(400);
            expect(JSON.parse(res.payload).error).toBe(MSG.children.requisicaoInvalida);
        });

        it('returns 400 for limit=101', async () => {
            const res = await app.inject({ method: 'GET', url: '/children?limit=101', headers: auth() });
            expect(res.statusCode).toBe(400);
            expect(JSON.parse(res.payload).error).toBe(MSG.children.requisicaoInvalida);
        });

        it('returns 400 for invalid revisado value', async () => {
            const res = await app.inject({ method: 'GET', url: '/children?revisado=maybe', headers: auth() });
            expect(res.statusCode).toBe(400);
            expect(JSON.parse(res.payload).error).toBe(MSG.children.requisicaoInvalida);
        });
    });

    //#endregion

    //#region GET /children/:id

    describe('GET /children/:id', () => {
        it('returns 401 without token', async () => {
            const res = await app.inject({ method: 'GET', url: '/children/child-1' });
            expect(res.statusCode).toBe(401);
        });

        it('returns full child object when found', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [mockChildRow] });

            const res = await app.inject({ method: 'GET', url: '/children/child-1', headers: auth() });

            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.id).toBe('child-1');
            expect(body.nome).toBe('Ana Silva');
            expect(body.saude).not.toBeNull();
            expect(body.educacao).not.toBeNull();
            expect(body.assistencia_social).not.toBeNull();
        });

        it('returns null sub-objects when joins are empty', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [mockChildRowNoJoins] });

            const res = await app.inject({ method: 'GET', url: '/children/child-1', headers: auth() });

            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.saude).toBeNull();
            expect(body.educacao).toBeNull();
            expect(body.assistencia_social).toBeNull();
        });

        it('returns 404 when child not found', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [] });

            const res = await app.inject({ method: 'GET', url: '/children/nao-existe', headers: auth() });

            expect(res.statusCode).toBe(404);
            expect(JSON.parse(res.payload).error).toBe(MSG.children.naoEncontrada);
        });

        it('passes the id to the query', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [mockChildRow] });

            await app.inject({ method: 'GET', url: '/children/child-abc', headers: auth() });

            const [, params] = (pool.query as any).mock.calls[0];
            expect(params).toContain('child-abc');
        });
    });

    //#endregion

    //#region PATCH /children/:id/review

    describe('PATCH /children/:id/review', () => {
        it('returns 401 without token', async () => {
            const res = await app.inject({ method: 'PATCH', url: '/children/child-1/review' });
            expect(res.statusCode).toBe(401);
        });

        it('returns 401 for an invalid token', async () => {
            const res = await app.inject({
                method: 'PATCH',
                url: '/children/child-1/review',
                headers: { authorization: 'Bearer token.invalido.aqui' },
            });
            expect(res.statusCode).toBe(401);
        });

        it('returns 404 when child not found', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [], rowCount: 0 });

            const res = await app.inject({
                method: 'PATCH',
                url: '/children/nao-existe/review',
                headers: auth(),
            });

            expect(res.statusCode).toBe(404);
            expect(JSON.parse(res.payload).error).toBe(MSG.children.naoEncontrada);
        });

        it('marks child as reviewed and returns ok', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [{ id: 'child-1' }], rowCount: 1 });

            const res = await app.inject({
                method: 'PATCH',
                url: '/children/child-1/review',
                headers: auth(),
            });

            expect(res.statusCode).toBe(200);
            expect(JSON.parse(res.payload)).toEqual({ ok: true, id: 'child-1' });
        });

        it('stores preferred_username from token in revisado_por', async () => {
            (pool.query as any).mockResolvedValueOnce({ rows: [{ id: 'child-1' }], rowCount: 1 });

            await app.inject({
                method: 'PATCH',
                url: '/children/child-1/review',
                headers: auth(),
            });

            const [, params] = (pool.query as any).mock.calls[0];
            expect(params[0]).toBe('tecnico@prefeitura.rio');
            expect(params[1]).toBe('child-1');
        });
    });

    //#endregion
});
