import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ── Backend VPS URL ────────────────────────────────────────────────
const BACKEND_URL = process.env.BACKEND_URL || 'http://187.77.210.230:8000';

// ── Proxy /api/* to the VPS backend ────────────────────────────────
app.use(
  '/api',
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    timeout: 120000,        // 2 min for LLM responses
    proxyTimeout: 120000,
    onError(err, req, res) {
      console.error('Proxy error:', err.message);
      res.status(502).json({
        error: 'Could not reach backend server.',
        detail: err.message,
      });
    },
  })
);

// ── Serve static files from dist/ ──────────────────────────────────
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// ── SPA fallback — serve index.html for all other routes ───────────
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Proxying /api/* → ${BACKEND_URL}`);
});
