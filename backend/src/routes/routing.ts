import { FastifyInstance } from 'fastify';
import { isValidPoint } from "@shared/types";
import { getRouteORS } from "@shared/routing/ors";

export default async function routes(app: FastifyInstance) {
	app.post('/route', async (request, reply) => {
		try {
			const data = request.body as {
				startPoint: unknown;
				endPoint: unknown;
				options?: unknown;
			};
			const { startPoint, endPoint } = data;

			if (!startPoint || !endPoint || !isValidPoint(startPoint) || !isValidPoint(endPoint)) {
				return reply.status(400).send({ error: 'Invalid start or end point' });
			}

			const result = await getRouteORS(startPoint, endPoint);

			return reply.send(result);
		} catch (error) {
			console.error('Route API error:', error);
			return reply
				.status(500)
				.send({ error: error instanceof Error ? error.message : 'Unknown routing error' });
		}
	});
}
