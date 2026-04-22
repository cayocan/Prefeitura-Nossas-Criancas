import fastify from 'fastify';
import cors from '@fastify/cors';
import { runSeed } from './services/seed.service';
import { initDb } from './lib/database';

const app = fastify();

app.register(cors, { origin: '*' });

// Run a health check endpoint for monitoring
app.get('/health', () => ({ status: 'ok' }));

// Function that waits for the database to be ready and then runs the seeding process
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

// Start the server after ensuring the database is ready and seeded
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