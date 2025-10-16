import { buildApp } from './src/app.ts';

async function main() {
	const app = await buildApp();
	await app.listen({ port: 4000 });
	console.log('🚀 Server running at http://localhost:4000/graphiql');
}

main().catch(console.error);
