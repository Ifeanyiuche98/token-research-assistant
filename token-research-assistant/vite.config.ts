import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveResearch } from './src/lib/research/endpoint';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'research-api-dev-middleware',
      configureServer(server) {
        server.middlewares.use('/api/research', async (req, res) => {
          const requestUrl = new URL((req as { url?: string }).url ?? '', 'http://localhost');
          const queryValue = requestUrl.searchParams.get('q') ?? '';
          const { statusCode, body } = await resolveResearch(queryValue);

          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        });
      }
    }
  ]
});
