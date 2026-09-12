import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';

// Boots the REAL production server (startServer → listen) and asserts the
// wiring the module-level supertest suites can't see: the production static
// serving, the source-map blacklist, the SPA fallback, and a live /api/health.
// Skipped when there is no production build (CI runs tests before `npm run
// build`), mirroring the DB-backed suites.
const distIndex = path.join(process.cwd(), 'dist', 'index.html');
const skip = !fs.existsSync(distIndex);

const describeBoot = skip ? describe.skip : describe;

describeBoot('production server boot (startServer)', () => {
  let server: any;
  let base: string;

  beforeAll(async () => {
    delete process.env.DATABASE_URL;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.NVIDIA_API_KEY;
    for (const k of ['RESEND_API_KEY', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']) {
      delete process.env[k];
    }
    process.env.NODE_ENV = 'production';
    // Shrink the mind-map daily quota so the load test trips it with a small,
    // non-flaky burst instead of hammering the shared per-minute limiter under
    // parallel CI load. Quotas are built from env at server import time.
    process.env.FREE_TIER_MINDMAPS_PER_DAY = '20';

    const { startServer } = await import('../server');
    server = await startServer(0);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 3000;
    base = `http://127.0.0.1:${port}`;
  }, 30000);

  afterAll(async () => {
    delete process.env.NODE_ENV;
    delete process.env.FREE_TIER_MINDMAPS_PER_DAY;
    if (server) {
      await new Promise((r) => server.close(r));
      server.closeAllConnections?.();
    }
  }, 30000);

  it('serves /api/health from the live listener', async () => {
    const res = await request(base).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('serves the built SPA at the root', async () => {
    const res = await request(base).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
  });

  it('falls back to index.html for client-side routes', async () => {
    const res = await request(base).get('/workspace/some-book');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
  });

  it('refuses to serve source maps or other build artifacts', async () => {
    for (const p of ['/assets/app.js.map', '/server.cjs.map', '/index.html.map']) {
      const res = await request(base).get(p);
      expect(res.status).toBe(404);
      expect(res.body?.error).toBe('Not found');
    }
  });

  it('rate-limits AI endpoints with clean JSON 429s (not an HTML crash page)', async () => {
    // With the daily mind-map quota lowered to 20 in beforeAll, a small burst
    // over that cap must yield clean 429 JSON, not HTML. Tolerating a dropped
    // connection keeps the assertion focused under heavy parallel load.
    const N = 25;
    const attempted = Array.from({ length: N }, () =>
      request(base)
        .post('/api/mindmap/generate')
        .set('User-Agent', 'boot-test-agent')
        .send({ topic: 'Thermodynamics' })
        .then((r) => ({ status: r.status, body: r.body }))
        .catch(() => ({ status: 0, body: null as unknown }))
    );
    const responses = await Promise.all(attempted);
    const blocked = responses.find((r) => r.status === 429);
    expect(blocked).toBeTruthy();
    expect(typeof blocked!.body?.error).toBe('string');
    expect((blocked!.body as { error: string }).error.length).toBeGreaterThan(0);
  }, 60000);
});