import { FastifyInstance } from 'fastify';
import routingRoutes from './routing';

export default async function registerRoutes(app: FastifyInstance) {
	app.register(routingRoutes);
}
