import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetDb } from './db';
import { registerRoutes } from './routes/index';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const distDir = fileURLToPath(new URL('../dist', import.meta.url));

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/reset', (_req, res) => {
  resetDb();
  res.json({ ok: true });
});

registerRoutes(app);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
});

app.use(express.static(distDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
