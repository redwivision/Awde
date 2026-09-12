import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { app } from '../server';
import {
  extractPdfText,
  buildFallbackTextbookWorkspace,
  processTextbookPdf
} from '../server/textbook';
import { refreshQuotaLimits } from '../server/quota';

// All tests here run with AI keys unset, so the AI pipeline resolves through
// the deterministic offline builder. History: this whole module had ZERO test
// coverage before this file — both the /api/textbook/process endpoint (incl.
// magic-byte PDF validation and the per-client textbook quota) and the three
// exported builder/parser functions.

async function makePdf(text = 'Thermal Equilibrium Laws', extraLine = ''): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([612, 792]);
  page.drawText(text, { x: 100, y: 700, font, size: 18 });
  if (extraLine) {
    page.drawText(extraLine, { x: 100, y: 660, font, size: 14 });
  }
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

beforeAll(() => {
  // Force an offline chain: no provider keys at all.
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.NVIDIA_API_KEY;
  // Roomy enough that the validation/error tests below never trip it; the
  // dedicated quota test lowers it itself so it can observe the 429.
  process.env.FREE_TIER_TEXTBOOK_PROCESSES_PER_DAY = '5';
  refreshQuotaLimits();
});

afterAll(() => {
  delete process.env.FREE_TIER_TEXTBOOK_PROCESSES_PER_DAY;
  refreshQuotaLimits();
});

describe('extractPdfText', () => {
  it('parses a real PDF into text', async () => {
    const pdf = await makePdf('Thermal Equilibrium Laws');
    const result = await extractPdfText(pdf);
    expect(result.pages).toBe(1);
    expect(result.text).toContain('Thermal Equilibrium');
  });
});

describe('buildFallbackTextbookWorkspace (deterministic offline builder)', () => {
  const text = [
    'First concept that we need',
    'Second major governing law',
    'Third real world example',
    '-- 3 of 10 --', // pdf-parse page separator - must be dropped
    'Fourth component here'
  ].join('\n');

  const ws = buildFallbackTextbookWorkspace('book.pdf', 'My Textbook', 'Physics', 'Grade 9', text);

  it('builds a structurally complete TextbookWorkspace', () => {
    expect(ws.title).toBe('My Textbook');
    expect(ws.sourcePdfName).toBe('book.pdf');
    expect(ws.subject).toBe('Physics');
    expect(ws.gradeOrLevel).toBe('Grade 9');
    expect(ws.generatedByAI).toBe(false);
    expect(ws.totalUnits).toBe(1);
    expect(ws.units).toHaveLength(1);
    expect(ws.units[0].connections.length).toBe(ws.units[0].nodes.length - 1);
  });

  it('extracts topic lines from the text, dropping pdf-parse page separators', () => {
    const labels = ws.units[0].nodes.map((n) => n.label);
    expect(labels).toContain('First concept that we need');
    expect(labels).not.toContain('-- 3 of 10 --');
  });

  it('falls back to generic topics when the text has no usable lines', () => {
    const built = buildFallbackTextbookWorkspace('x.pdf', 'T', 'S', 'G', 'x');
    const labels = built.units[0].nodes.map((n) => n.label);
    expect(labels).toContain('Core Conceptual Foundations');
    expect(labels).toContain('Mechanisms & Governing Laws');
    expect(labels).toContain('Real-World Applications');
  });

  it('only surfaces formulas the topic label literally spells out', () => {
    const withFormula = buildFallbackTextbookWorkspace('f.pdf', 'T', 'S', 'G', 'Newton second law F = m a\nSomething else');
    const formulaNode = withFormula.units[0].nodes.find((n) => /F = m a/.test(n.label));
    expect(formulaNode?.keyFormulasOrRules).toEqual(['Newton second law F = m a']);

    const noFormula = buildFallbackTextbookWorkspace('f.pdf', 'T', 'S', 'G', 'Just a concept word\nAnother plain idea');
    for (const node of noFormula.units[0].nodes) {
      expect(node.keyFormulasOrRules).toEqual([]);
    }
  });

  it('structures node categories and prerequisites as a learning flow', () => {
    const nodes = ws.units[0].nodes;
    expect(nodes[0].category).toBe('Foundation');
    expect(nodes[0].depthLevel).toBe(1);
    expect(nodes[1].category).toBe('Core Law');
    expect(nodes[0].prerequisites).toEqual([]);
  });

  it('emits quiz/flashcard entries grounded in the first topic', () => {
    expect(ws.units[0].quizQuestions.length).toBeGreaterThanOrEqual(1);
    expect(ws.units[0].flashcards.length).toBeGreaterThanOrEqual(1);
    const q = ws.units[0].quizQuestions[0];
    expect(q.correctIndex).toBe(0);
    expect(q.options).toHaveLength(4);
  });
});

describe('POST /api/textbook/process (end-to-end, offline)', () => {
  it('turns a real PDF buffer into a workspace', async () => {
    const pdf = await makePdf('Thermal Equilibrium Laws', 'Second law of thermodynamics intro');
    const res = await request(app)
      .post('/api/textbook/process')
      .field('bookTitle', 'Heat & Energy')
      .field('subject', 'Physics')
      .field('gradeLevel', 'Grade 9')
      .attach('file', pdf, { filename: 'heat-energy.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.extractedPages).toBe(1);
    expect(res.body.textLength).toBeGreaterThan(0);
    expect(res.body.workspace).toBeDefined();
    expect(res.body.workspace.title).toBe('Heat & Energy');
    expect(res.body.generatedByAI).toBe(false);
  });

  it('runs through processTextbookPdf directly for unit-level access to spans', async () => {
    const pdf = await makePdf('Newton Laws of Motion');
    const out = await processTextbookPdf(pdf, 'laws.pdf', 'Motion Textbook', 'Physics', 'Grade 10');
    expect(out.extractedPages).toBe(1);
    expect(out.textLength).toBeGreaterThan(0);
    expect(out.workspace.title).toBe('Motion Textbook');
    expect(out.workspace.generatedByAI).toBe(false);
  });

  it('rejects a file renamed to .pdf but not actually a PDF (magic-byte check)', async () => {
    const res = await request(app)
      .post('/api/textbook/process')
      .attach('file', Buffer.from('this is just plain text, not a pdf at all'), {
        filename: 'fake.pdf',
        contentType: 'application/pdf'
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/valid PDF/);
  });

  it('rejects a request with no file at all', async () => {
    const res = await request(app).post('/api/textbook/process').field('bookTitle', 'No File');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No PDF file was uploaded.');
  });

  it('accepts a PDF upload whose extension is .pdf even when the mimetype is generic', async () => {
    const pdf = await makePdf('Generic type but still a pdf');
    const res = await request(app)
      .post('/api/textbook/process')
      .attach('file', pdf, { filename: 'weird.pdf', contentType: 'application/octet-stream' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects a file with a clearly non-PDF mimetype via the multer filter', async () => {
    // The mimetype filter rejects text files BEFORE the route handler, so this
    // exercises the post-route multer error middleware (clean 400, not a 500).
    const res = await request(app)
      .post('/api/textbook/process')
      .attach('file', Buffer.from('just some text'), { filename: 'notes.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Only PDF files/);
  });
});

describe('POST /api/textbook/process — daily quota', () => {
  it('429s past a lowered textbook quota, then recovers after refreshQuotaLimits()', async () => {
    // Lower + refresh solely for this test so the 429 is observable; the file's
    // other tests run at the roomier default (5/day) set in beforeAll.
    process.env.FREE_TIER_TEXTBOOK_PROCESSES_PER_DAY = '2';
    refreshQuotaLimits();

    const pdf = await makePdf('Quota probe pdf');
    const first = await request(app)
      .post('/api/textbook/process')
      .attach('file', pdf, { filename: 'q1.pdf', contentType: 'application/pdf' });
    expect(first.status).toBe(200);
    const second = await request(app)
      .post('/api/textbook/process')
      .attach('file', pdf, { filename: 'q2.pdf', contentType: 'application/pdf' });
    expect(second.status).toBe(200);

    const third = await request(app)
      .post('/api/textbook/process')
      .attach('file', pdf, { filename: 'q3.pdf', contentType: 'application/pdf' });
    expect(third.status).toBe(429);

    // A fresh quota window (simulated by re-reading env) unblocks the client.
    refreshQuotaLimits();
    const after = await request(app)
      .post('/api/textbook/process')
      .attach('file', pdf, { filename: 'q4.pdf', contentType: 'application/pdf' });
    expect(after.status).toBe(200);

    // Restore the roomier default for any later tests in this file.
    process.env.FREE_TIER_TEXTBOOK_PROCESSES_PER_DAY = '5';
    refreshQuotaLimits();
  });
});

describe('POST /api/textbook/process — quota reset hygiene', () => {
  beforeEach(() => {
    refreshQuotaLimits();
  });

  it('leaves the quota limiter in a clean state for the rest of the file', async () => {
    const pdf = await makePdf('Clean state probe');
    const res = await request(app)
      .post('/api/textbook/process')
      .attach('file', pdf, { filename: 'clean.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(200);
  });
});