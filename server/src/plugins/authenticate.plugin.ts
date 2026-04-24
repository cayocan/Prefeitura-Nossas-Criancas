import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { id: number; role: string; preferred_username: string };
        user: { id: number; role: string; preferred_username: string };
    }
}

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

const authenticatePlugin: FastifyPluginAsync = async (fastify) => {
    fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
        await request.jwtVerify();
    });
};

export default fp(authenticatePlugin, { name: 'authenticate' });
