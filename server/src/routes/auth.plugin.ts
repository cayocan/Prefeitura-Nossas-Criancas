import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { pool } from '../lib/database';

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
type LoginBody = z.infer<typeof LoginSchema>;

const authPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
        try {
            const { email, password } = LoginSchema.parse(request.body || {});

            const res = await pool.query(
                'SELECT id, email, password_hash, role FROM users WHERE email = $1',
                [email]
            );
            const user = res.rows[0];

            if (!user) {
                return reply.status(401).send({ error: 'Invalid email or password' });
            }

            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) {
                return reply.status(401).send({ error: 'Invalid email or password' });
            }

            const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });
            return reply.send({ token });
        } catch (err) {
            if (err instanceof z.ZodError) {
                return reply.status(400).send({ error: 'Invalid request', details: err.issues });
            }
            throw err;
        }
    });
};

export default authPlugin;
