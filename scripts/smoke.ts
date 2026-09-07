// Awde pre-deploy smoke test. Boots the REAL app (imports server.ts) with your
// real .env config and hits the live AI endpoints through real HTTP (supertest),
// asserting:
//   1. The provider chain actually reaches a real model (response is NOT the
//      offline fallback).
//   2. With a DATABASE_URL, a repeat request is served from the Postgres cache
//      (fromCache: true) — the money path local unit tests cannot cover.
//
// Run:  npm run smoke
// This needs real provider keys in .env (GEMINI/GROQ/NVIDIA). It is NOT part of
// CI (which has no secrets); run it locally before you push to a deploy.
import request from 'supertest';
import { app } from '../server';
import { runMigrations } from '../server/db/migrate';
import { getGeminiClient, getGroqApiKey, getNvidiaApiKey } from '../server/ai';

const configured = [getGeminiClient(), getGroqApiKey(), getNvidiaApiKey()].filter(Boolean).length;
const hasDb = Boolean(process.env.DATABASE_URL);

async function main(): Promise<void> {
  if (configured === 0) {
    console.error('SMOKE FAIL: no AI provider keys configured (.env). Nothing meaningful to test.');
    process.exit(1);
  }
  console.log(`Providers configured: ${configured}  |  DATABASE_URL: ${hasDb ? 'yes' : 'no'}`);
  if (hasDb) {
    await runMigrations();
    console.log('Migrations applied.');
  }

  const topic = { topic: 'Photosynthesis', subject: 'Biology', gradeLevel: '8', language: 'en' };

  console.log('\n1) POST /api/mindmap/generate (live AI call) ...');
  const r1 = await request(app).post('/api/mindmap/generate').send(topic);
  if (r1.status !== 200 || !r1.body.success) {
    console.error(`SMOKE FAIL: mindmap request failed: ${r1.status}`, JSON.stringify(r1.body).slice(0, 300));
    process.exit(1);
  }
  if (r1.body.isFallback) {
    console.error('SMOKE FAIL: every provider failed and the offline fallback answered.');
    process.exit(1);
  }
  console.log(`  OK  provider="${r1.body.provider || 'unknown'}" unit=${r1.body.unit?.nodes?.length ?? '?'} nodes`);

  if (hasDb) {
    console.log('2) POST /api/mindmap/generate AGAIN (should hit Postgres cache) ...');
    const r2 = await request(app).post('/api/mindmap/generate').send(topic);
    if (!r2.body.fromCache) {
      console.error('SMOKE FAIL: repeat request did NOT hit the cache (fromCache missing).', JSON.stringify(r2.body).slice(0, 200));
      process.exit(1);
    }
    console.log('  OK  fromCache=true (identical unit served without spending tokens)');
  } else {
    console.log('2) repeat-request cache check skipped (no DATABASE_URL)');
  }

  console.log('3) POST /api/quiz/generate (live AI call) ...');
  const r3 = await request(app).post('/api/quiz/generate').send({ topic: topic.topic, count: 3 });
  if (r3.status !== 200 || !r3.body.success || !r3.body.questions?.length) {
    console.error(`SMOKE FAIL: quiz request failed: ${r3.status}`, JSON.stringify(r3.body).slice(0, 300));
    process.exit(1);
  }
  if (r3.body.isFallback) {
    console.error('SMOKE FAIL: quiz came from the offline fallback.');
    process.exit(1);
  }
  console.log(`  OK  provider="${r3.body.provider || 'unknown'}" questions=${r3.body.questions.length}`);

  console.log('\nSMOKE PASS');
}

main().catch((err) => {
  console.error('SMOKE FAIL:', err instanceof Error ? err.message : err);
  process.exit(1);
});