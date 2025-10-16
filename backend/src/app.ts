import Fastify from 'fastify';
import registerRoutes from './routes';

export async function buildApp() {
	const app = Fastify({ logger: true });

	// register all routes
	await app.register(registerRoutes);

	return app;
}
