import fs from 'fs';
import path from 'path';
import { pool } from '../lib/database';
import { ChildSchema } from '../schemas/child.schema';
import { UserSchema } from '../schemas/user.schema';
import bcrypt from 'bcrypt';

export async function runSeed() {
    const seedPath = path.resolve(__dirname, '../../data/seed.json');

    const { rows } = await pool.query('SELECT COUNT(*)::int as total FROM children');
    const total = rows && rows[0] ? Number(rows[0].total) : 0;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insert children only if table is empty
        if (total === 0) {
            const rawData = fs.readFileSync(seedPath, 'utf-8');
            const jsonData = JSON.parse(rawData);

            const insertChildSql = `
                INSERT INTO children (id, nome, data_nascimento, bairro, responsavel, revisado, revisado_por, revisado_em)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            `;

            const insertSaudeSql = `
                INSERT INTO saude (child_id, ultima_consulta, vacinas_em_dia, alertas)
                VALUES ($1,$2,$3,$4::jsonb)
                ON CONFLICT (child_id) DO UPDATE SET ultima_consulta = EXCLUDED.ultima_consulta, vacinas_em_dia = EXCLUDED.vacinas_em_dia, alertas = EXCLUDED.alertas
            `;

            const insertEducacaoSql = `
                INSERT INTO educacao (child_id, escola, frequencia_percent, alertas)
                VALUES ($1,$2,$3,$4::jsonb)
                ON CONFLICT (child_id) DO UPDATE SET escola = EXCLUDED.escola, frequencia_percent = EXCLUDED.frequencia_percent, alertas = EXCLUDED.alertas
            `;

            const insertAssistSql = `
                INSERT INTO assistencia_social (child_id, cad_unico, beneficio_ativo, alertas)
                VALUES ($1,$2,$3,$4::jsonb)
                ON CONFLICT (child_id) DO UPDATE SET cad_unico = EXCLUDED.cad_unico, beneficio_ativo = EXCLUDED.beneficio_ativo, alertas = EXCLUDED.alertas
            `;

            for (const child of jsonData) {
                const validated = ChildSchema.parse(child);

                await client.query(insertChildSql, [
                    validated.id,
                    validated.nome,
                    validated.data_nascimento,
                    validated.bairro,
                    validated.responsavel,
                    validated.revisado,
                    validated.revisado_por,
                    validated.revisado_em
                ]);

                if (validated.saude) {
                    await client.query(insertSaudeSql, [
                        validated.id,
                        validated.saude.ultima_consulta,
                        validated.saude.vacinas_em_dia,
                        JSON.stringify(validated.saude.alertas || [])
                    ]);
                }

                if (validated.educacao) {
                    await client.query(insertEducacaoSql, [
                        validated.id,
                        validated.educacao.escola,
                        validated.educacao.frequencia_percent,
                        JSON.stringify(validated.educacao.alertas || [])
                    ]);
                }

                if (validated.assistencia_social) {
                    await client.query(insertAssistSql, [
                        validated.id,
                        validated.assistencia_social.cad_unico,
                        validated.assistencia_social.beneficio_ativo,
                        JSON.stringify(validated.assistencia_social.alertas || [])
                    ]);
                }
            }
        } else {
            console.log('Seed: Database already populated, skipping children insertion.');
        }

        // Ensure admin user exists (created/updated every seed run)
        const adminEmail = 'tecnico@prefeitura.rio';
        const adminPassword = 'painel@2024';
        const userRes = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
        if (!userRes.rows || userRes.rows.length === 0) {
            UserSchema.parse({ email: adminEmail, password: adminPassword, role: 'admin' });
            const passwordHash = await bcrypt.hash(adminPassword, 10);
            await client.query(
                'INSERT INTO users (email, password_hash, role) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING',
                [adminEmail, passwordHash, 'admin']
            );
            console.log('Seed: Admin user created');
        } else {
            console.log('Seed: Admin user already exists, skipping');
        }

        await client.query('COMMIT');
        console.log('Seed: Data successfully loaded!');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}