/**
 * Reports JSON-LD @graph entity counts (run after build: uses Vite to resolve asset globs).
 * Usage: npm run schema:count
 */
import { createServer } from 'vite';

const server = await createServer({
  configFile: 'vite.config.js',
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const mod = await server.ssrLoadModule('/src/lib/schema/buildHomeGraph.js');
  const graph = await mod.buildHomeGraph();
  const count = graph['@graph']?.length ?? 0;
  console.log(`Home page JSON-LD entities: ${count}`);
  if (count < 200) {
    console.warn('Warning: fewer than 200 entities on home graph.');
    process.exitCode = 1;
  }
} finally {
  await server.close();
}
