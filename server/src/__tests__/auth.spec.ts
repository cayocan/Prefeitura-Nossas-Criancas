import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

// Mock the database pool before importing the plugin
vi.mock('../lib/database', () => {
    const query = vi.fn();
    return { pool: { query } };
});

import fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import authPlugin from '../routes/auth.plugin';
import { pool } from '../lib/database';
import bcrypt from 'bcryptjs';

describe('POST /auth/login', () => {
    let app: ReturnType<typeof fastify>;

    beforeEach(async () => {
        app = fastify();
        await app.register(fastifyJwt, { secret: 'test-secret' });
        await app.register(authPlugin, { prefix: '/auth' });
    });

    afterEach(async () => {
        await app.close();
        vi.clearAllMocks();
    });

    it('returns token for valid credentials', async () => {
        const password = 'painel@2024';
        const passwordHash = await bcrypt.hash(password, 10);
        (pool.query as any).mockResolvedValueOnce({ rows: [{ id: 1, email: 'tecnico@prefeitura.rio', password_hash: passwordHash, role: 'admin' }] });

        const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'tecnico@prefeitura.rio', password } });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body).toHaveProperty('token');

        const decoded = await app.jwt.verify(body.token as string);
        expect((decoded as any).email).toBe('tecnico@prefeitura.rio');
    });

    it('returns 401 when user not found', async () => {
        (pool.query as any).mockResolvedValueOnce({ rows: [] });
        const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'missing@x.com', password: 'x' } });
        expect(res.statusCode).toBe(401);
    });

    it('returns 401 for wrong password', async () => {
        const badHash = await bcrypt.hash('other', 10);
        (pool.query as any).mockResolvedValueOnce({ rows: [{ id: 1, email: 'tecnico@prefeitura.rio', password_hash: badHash, role: 'admin' }] });
        const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'tecnico@prefeitura.rio', password: 'painel@2024' } });
        expect(res.statusCode).toBe(401);
    });

    it('returns 400 for missing password', async () => {
        const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'tecnico@prefeitura.rio' } });
        expect(res.statusCode).toBe(400);
    });

    it('returns 400 for invalid email format', async () => {
        const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'invalid', password: 'x' } });
        expect(res.statusCode).toBe(400);
    });
});
