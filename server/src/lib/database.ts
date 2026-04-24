import { Pool } from 'pg';
import process from 'process';

const connectionString = process.env.DATABASE_URL || '';
export const pool = new Pool({ connectionString });

export async function initDb() {
    const createChildren = `
        CREATE TABLE IF NOT EXISTS children (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            data_nascimento DATE NOT NULL,
            bairro TEXT NOT NULL,
            responsavel TEXT NOT NULL,
            revisado BOOLEAN DEFAULT false,
            revisado_por TEXT,
            revisado_em TIMESTAMPTZ
        );
    `;

    const createSaude = `
        CREATE TABLE IF NOT EXISTS saude (
            child_id TEXT PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
            ultima_consulta DATE,
            vacinas_em_dia BOOLEAN,
            alertas JSONB
        );
    `;

    const createEducacao = `
        CREATE TABLE IF NOT EXISTS educacao (
            child_id TEXT PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
            escola TEXT,
            frequencia_percent NUMERIC,
            alertas JSONB
        );
    `;

    const createAssistencia = `
        CREATE TABLE IF NOT EXISTS assistencia_social (
            child_id TEXT PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
            cad_unico BOOLEAN,
            beneficio_ativo BOOLEAN,
            alertas JSONB
        );
    `;

    const createUsers = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    `;

    await pool.query(createChildren);
    await pool.query(createSaude);
    await pool.query(createEducacao);
    await pool.query(createAssistencia);
    await pool.query(createUsers);
}

export const query = (text: string, params?: any[]) => pool.query(text, params);