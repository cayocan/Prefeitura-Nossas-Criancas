import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { initDb, pool } from './lib/database';
import { runSeed } from './services/seed.service';
import authPlugin from './routes/auth.plugin';

//#region App

const app = fastify();

//#endregion

//#region Plugins

app.register(swagger, {
    openapi: {
        info: {
            title: 'API Documentation',
            description: 'API documentation for the Prefeitura-RJ Nossas Crianças project',
            version: '1.0.0',
        },
    },
});
app.register(swaggerUi, { routePrefix: '/docs' });

app.register(cors, { origin: 'http://localhost:3000' });
app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Missing JWT_SECRET environment variable in production');
    }
    console.warn('JWT_SECRET not set — using insecure fallback for development.');
}
app.register(fastifyJwt, { secret: jwtSecret ?? 'dev-secret' });

//#endregion

//#region Routes

app.get('/health', () => ({ status: 'ok' }));
app.register(authPlugin, { prefix: '/auth' });

//#endregion

//#region Database Initialization and Seeding

async function waitForDbAndSeed(retries = 10, delayMs = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            await initDb();
            await runSeed();
            return;
        } catch (err) {
            console.log(`DB not ready yet (attempt ${i + 1}/${retries}), retrying in ${delayMs}ms...`);
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
    throw new Error('Unable to initialize database after multiple attempts');
}

//#endregion

//#region Server Start

async function start() {
    try {
        await waitForDbAndSeed();
        await app.listen({ port: parseInt(process.env.PORT || '3001'), host: '0.0.0.0' });
        console.log('Server running at http://localhost:3001');
    } catch (err) {
        console.error('Startup error:', err);
        process.exit(1);
    }
}

start();

//#endregion