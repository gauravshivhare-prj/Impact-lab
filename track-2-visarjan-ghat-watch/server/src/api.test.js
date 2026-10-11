/**
 * Express API integration tests (Supertest) against the real committed dataset.
 * Cerebras is always mocked — no live key or network access is required.
 */

import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { loadDataContext } from './services/dataContext.service.js';
import { AiProviderError, createCerebrasClient } from './services/reports/cerebras.service.js';
import { checkDraft, findUnverifiedNumbers } from './services/reports/brief.service.js';
import { buildBriefFacts } from './services/reports/briefFacts.service.js';
import { renderTemplateBrief } from './services/reports/briefTemplate.service.js';

process.env.NODE_ENV = 'test';

const config = loadEnv({ NODE_ENV: 'test', CLIENT_ORIGIN: 'http://localhost:5173' });
const DISABLED_AI = Object.freeze({ enabled: false, generate: async () => assert.fail('AI must not be called') });

let dataContext;
before(async () => {
  dataContext = await loadDataContext();
});

function appWith(aiClient = DISABLED_AI) {
  return createApp({ config, dataContext, aiClient });
}

function fakeAi(generate) {
  return { enabled: true, generate };
}

describe('GET /api/v1/ghats', () => {
  it('returns the 7 canonical ghats with unverified legal status and coordinates', async () => {
    const res = await request(appWith()).get('/api/v1/ghats');
    assert.equal(res.status, 200);
    assert.equal(res.body.meta.count, 7);
    for (const ghat of res.body.data) {
      assert.match(ghat.ghatId, /^[a-z0-9-]+$/);
      assert.equal(ghat.legalStatus, 'not_verified');
      assert.equal(ghat.coordinateStatus, 'not_verified');
      assert.equal(ghat.latitude, null);
      assert.equal(ghat.longitude, null);
      assert.ok(ghat.environmentalPriority);
    }
  });

  it('uses the same ghatIds as the rankings endpoint', async () => {
    const app = appWith();
    const ghats = await request(app).get('/api/v1/ghats');
    const rankings = await request(app).get('/api/v1/analytics/rankings');
    assert.deepEqual(
      ghats.body.data.map((g) => g.ghatId).sort(),
      rankings.body.data.map((r) => r.ghatId).sort(),
    );
  });
});

describe('GET /api/v1/ghats/:ghatId', () => {
  it('returns evidence, legal status and limitations separately', async () => {
    const res = await request(appWith()).get('/api/v1/ghats/khatlapura-ghat');
    assert.equal(res.status, 200);
    const { data } = res.body;
    assert.equal(data.legal.status, 'not_verified');
    assert.equal(data.legal.sourceUrl, null);
    assert.equal(data.historicalEvidence.startYear, 2023);
    assert.equal(data.historicalEvidence.endYear, 2025);
    assert.ok(data.historicalEvidence.observations.length > 0);
    assert.ok(data.limitations.some((l) => /current/i.test(l)));
  });

  it('never turns missing or BDL readings into numeric zero', async () => {
    const res = await request(appWith()).get('/api/v1/ghats/malikhedi-kund');
    const observations = res.body.data.historicalEvidence.observations;
    const qualified = observations.filter((o) => o.validationStatus !== 'valid');
    assert.ok(qualified.length > 0);
    for (const observation of qualified) {
      assert.equal(observation.numericValue, null);
      assert.equal(observation.benchmark, null);
    }
    assert.ok(observations.some((o) => o.qualifier === 'BDL' && o.rawValue === 'BDL'));
  });

  it('keeps source page provenance on every observation', async () => {
    const res = await request(appWith()).get('/api/v1/ghats/prempura-ghat');
    for (const observation of res.body.data.historicalEvidence.observations) {
      assert.match(observation.sourceId, /^mppcb-\d{4}-(ganesh|durga)$/);
      assert.ok(observation.sourcePage);
    }
  });

  it('flags the medium-confidence site match', async () => {
    const res = await request(appWith()).get('/api/v1/ghats/rani-kamlapati-ghat');
    assert.ok(res.body.data.limitations.some((l) => /medium confidence/i.test(l)));
  });

  it('returns 404 GHAT_NOT_FOUND for an unknown ghat', async () => {
    const res = await request(appWith()).get('/api/v1/ghats/unknown-ghat');
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: { code: 'GHAT_NOT_FOUND', message: 'No ghat exists with this ghatId.' } });
  });

  it('returns 400 VALIDATION_ERROR for a malformed ghatId', async () => {
    const res = await request(appWith()).get('/api/v1/ghats/Bad$Id');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });
});

describe('GET /api/v1/ghats/:ghatId/sources', () => {
  it('returns MPPCB reports with page references and the CPCB criteria source', async () => {
    const res = await request(appWith()).get('/api/v1/ghats/khatlapura-ghat/sources');
    assert.equal(res.status, 200);
    const mppcb = res.body.data.filter((s) => s.sourceId.startsWith('mppcb-'));
    assert.equal(mppcb.length, 6);
    for (const source of mppcb) {
      assert.match(source.sourceUrl, /^https:\/\/www\.mppcb\.mp\.gov\.in\//);
      assert.ok(source.pageReferences.length > 0);
    }
    assert.ok(res.body.data.some((s) => s.sourceId === 'cpcb-water-quality-criteria'));
  });
});

describe('GET /api/v1/analytics', () => {
  it('summary matches the headline figures in the problem statement', async () => {
    const res = await request(appWith()).get('/api/v1/analytics/summary');
    assert.equal(res.status, 200);
    const { data } = res.body;
    assert.equal(data.totalRecords, 1524);
    assert.equal(data.ghatCount, 7);
    const byParameter = Object.fromEntries(data.benchmarkResults.map((b) => [b.parameter, b]));
    assert.equal(byParameter['Dissolved oxygen'].exceedanceCount, 42);
    assert.equal(byParameter['Dissolved oxygen'].validSampleCount, 116);
    assert.equal(byParameter.BOD.exceedanceCount, 100);
    assert.equal(byParameter.BOD.validSampleCount, 112);
  });

  it('rankings expose the contract fields with an explanation for each ghat', async () => {
    const res = await request(appWith()).get('/api/v1/analytics/rankings');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 7);
    for (const ranking of res.body.data) {
      for (const field of ['ghatId', 'priority', 'score', 'explanation', 'validSampleCount', 'coverage', 'observationPeriod', 'sourceIds']) {
        assert.ok(field in ranking, `missing ${field}`);
      }
      assert.ok(ranking.explanation.length > 0);
    }
    assert.ok(res.body.meta.methodology);
    assert.ok(res.body.meta.scoreDescription);
  });

  it('gives tied ghats the same rank (standard competition ranking)', async () => {
    const res = await request(appWith()).get('/api/v1/analytics/rankings');
    const rows = res.body.data;
    assert.equal(rows[0].rank, 1);
    for (let i = 1; i < rows.length; i += 1) {
      const tied = rows[i].priority === rows[i - 1].priority && rows[i].score === rows[i - 1].score;
      assert.equal(rows[i].rank, tied ? rows[i - 1].rank : i + 1);
    }
  });
});

describe('POST /api/v1/reports/brief', () => {
  const body = { ghatId: 'bairagarh-sant-hirdaram-kund', language: 'en' };

  it('returns a template brief when Cerebras is not configured', async () => {
    const res = await request(appWith()).post('/api/v1/reports/brief').send(body);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.generator, 'template');
    assert.equal(res.body.meta.aiStatus, 'not_configured');
    assert.match(res.body.data.brief, /not verified/i);
    assert.match(res.body.data.brief, /2025 Durga/);
    assert.ok(res.body.data.factsUsed.length > 0);
    assert.ok(res.body.data.sourceIds.length > 0);
    assert.ok(!Number.isNaN(Date.parse(res.body.data.generatedAt)));
  });

  it('returns a Hindi template brief in Devanagari', async () => {
    const res = await request(appWith()).post('/api/v1/reports/brief').send({ ...body, language: 'hi' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.language, 'hi');
    assert.match(res.body.data.brief, /[ऀ-ॿ]/);
  });

  it('sends only backend facts to the model and returns its text when it passes the fact check', async () => {
    let prompt;
    const ai = fakeAi(async (p) => {
      prompt = p;
      return 'Bairagarh (Sant Hirdaram) kund: 11 of 13 valid dissolved oxygen readings were below 5 mg/l between 2023 and 2025. Legal status is not verified.';
    });
    const res = await request(appWith(ai)).post('/api/v1/reports/brief').send(body);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.generator, 'cerebras');
    assert.equal(res.body.meta.aiStatus, 'ok');
    assert.match(prompt.user, /^FACTS \(JSON\):/);
    assert.match(prompt.system, /Do not add, change, round or calculate any number/);
  });

  it('discards an AI draft that invents numbers', async () => {
    const ai = fakeAi(async () => 'BOD rose by 87.5% to 4321 mg/l.');
    const res = await request(appWith(ai)).post('/api/v1/reports/brief').send(body);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.generator, 'template');
    assert.equal(res.body.meta.aiStatus, 'rejected_unverified_numbers');
  });

  it('discards a Hindi request answered in English', async () => {
    const ai = fakeAi(async () => 'Legal status is not verified.');
    const res = await request(appWith(ai)).post('/api/v1/reports/brief').send({ ...body, language: 'hi' });
    assert.equal(res.body.meta.aiStatus, 'rejected_wrong_language');
    assert.equal(res.body.data.generator, 'template');
  });

  it('maps an AI timeout to 502 AI_PROVIDER_ERROR', async () => {
    const ai = fakeAi(async () => {
      throw new AiProviderError('timeout');
    });
    const res = await request(appWith(ai)).post('/api/v1/reports/brief').send(body);
    assert.equal(res.status, 502);
    assert.equal(res.body.error.code, 'AI_PROVIDER_ERROR');
  });

  it('maps provider rate limiting to 429 RATE_LIMITED', async () => {
    const ai = fakeAi(async () => {
      throw new AiProviderError('rate_limited');
    });
    const res = await request(appWith(ai)).post('/api/v1/reports/brief').send(body);
    assert.equal(res.status, 429);
    assert.equal(res.body.error.code, 'RATE_LIMITED');
  });

  it('returns 500 without leaking internals on unexpected errors', async () => {
    const ai = fakeAi(async () => {
      throw new Error('secret-internal-detail at /srv/app.js:1');
    });
    const res = await request(appWith(ai)).post('/api/v1/reports/brief').send(body);
    assert.equal(res.status, 500);
    assert.deepEqual(res.body, { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
  });

  it('rejects user-supplied facts and invalid options', async () => {
    const app = appWith();
    const cases = [
      { ...body, facts: { score: 100 } },
      { ...body, language: 'fr' },
      { ...body, includeScenario: 'yes' },
      { language: 'en' },
    ];
    for (const payload of cases) {
      const res = await request(app).post('/api/v1/reports/brief').send(payload);
      assert.equal(res.status, 400, JSON.stringify(payload));
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    }
  });

  it('returns 404 for an unknown ghat', async () => {
    const res = await request(appWith()).post('/api/v1/reports/brief').send({ ghatId: 'unknown-ghat', language: 'en' });
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'GHAT_NOT_FOUND');
  });

  it('rate limits brief generation', async () => {
    const app = appWith();
    let last;
    for (let i = 0; i < 11; i += 1) {
      last = await request(app).post('/api/v1/reports/brief').send(body);
    }
    assert.equal(last.status, 429);
    assert.equal(last.body.error.code, 'RATE_LIMITED');
  });
});

describe('POST /api/v1/scenarios/compare', () => {
  const body = {
    ghatId: 'prempura-ghat',
    scenarioType: 'hypothetical_monitoring_or_waste_management',
    assumptions: { description: 'Extra sampling during immersion', changedInputs: [{ input: 'samplingPhases', value: 3 }] },
  };

  it('validates the request and reports that the scenario service is not available yet', async () => {
    const res = await request(appWith()).post('/api/v1/scenarios/compare').send(body);
    assert.equal(res.status, 501);
    assert.equal(res.body.error.code, 'NOT_IMPLEMENTED');
  });

  it('rejects an unknown scenario type', async () => {
    const res = await request(appWith()).post('/api/v1/scenarios/compare').send({ ...body, scenarioType: 'forecast' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });
});

describe('app hardening', () => {
  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(appWith()).get('/api/v1/nope');
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  it('rejects malformed and oversized JSON bodies', async () => {
    const app = appWith();
    const malformed = await request(app).post('/api/v1/reports/brief').set('Content-Type', 'application/json').send('{"bad');
    assert.equal(malformed.status, 400);
    assert.equal(malformed.body.error.code, 'VALIDATION_ERROR');

    const oversized = await request(app).post('/api/v1/reports/brief').send({ ghatId: 'x'.repeat(20000), language: 'en' });
    assert.equal(oversized.status, 413);
  });

  it('sets security headers, hides the framework and restricts CORS', async () => {
    const app = appWith();
    const res = await request(app).get('/api/v1/health').set('Origin', 'http://localhost:5173');
    assert.equal(res.headers['x-powered-by'], undefined);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');

    const other = await request(app).get('/api/v1/health').set('Origin', 'https://evil.example');
    assert.equal(other.headers['access-control-allow-origin'], undefined);
  });
});

describe('cerebras client', () => {
  it('is disabled without both a key and a model', () => {
    assert.equal(createCerebrasClient({ apiKey: 'k', model: null, timeoutMs: 1000 }).enabled, false);
    assert.equal(createCerebrasClient({ apiKey: null, model: 'm', timeoutMs: 1000 }).enabled, false);
  });

  it('sends the key only in the Authorization header and reads choices[0].message.content', async () => {
    let captured;
    const client = createCerebrasClient({
      apiKey: 'test-key',
      model: 'test-model',
      timeoutMs: 1000,
      fetchImpl: async (url, init) => {
        captured = { url, init };
        return new Response(JSON.stringify({ choices: [{ message: { content: 'hello' } }] }), { status: 200 });
      },
    });
    assert.equal(await client.generate({ system: 's', user: 'u' }), 'hello');
    assert.equal(captured.url, 'https://api.cerebras.ai/v1/chat/completions');
    assert.equal(captured.init.headers.Authorization, 'Bearer test-key');
    assert.ok(!captured.init.body.includes('test-key'));
  });

  it('maps upstream 429 and 5xx responses to provider errors', async () => {
    for (const [status, reason] of [[429, 'rate_limited'], [503, 'provider_error']]) {
      const client = createCerebrasClient({
        apiKey: 'k',
        model: 'm',
        timeoutMs: 1000,
        fetchImpl: async () => new Response('{}', { status }),
      });
      await assert.rejects(client.generate({ system: 's', user: 'u' }), (err) => err.reason === reason);
    }
  });
});

describe('observation paging', () => {
  it('returns all observations by default and pages with limit/offset', async () => {
    const app = appWith();
    const all = await request(app).get('/api/v1/ghats/khatlapura-ghat');
    const page = await request(app).get('/api/v1/ghats/khatlapura-ghat?limit=10&offset=5');
    assert.equal(all.body.data.historicalEvidence.observations.length, all.body.meta.observationCount);
    assert.equal(page.body.data.historicalEvidence.observations.length, 10);
    assert.deepEqual(page.body.data.historicalEvidence.observations[0], all.body.data.historicalEvidence.observations[5]);
  });

  it('rejects invalid paging values', async () => {
    const app = appWith();
    for (const query of ['limit=0', 'limit=abc', 'offset=-1', 'limit=1&limit=2']) {
      const res = await request(app).get(`/api/v1/ghats/khatlapura-ghat?${query}`);
      assert.equal(res.status, 400, query);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    }
  });

  it('returns 400 (not 500) for a badly encoded path', async () => {
    const res = await request(appWith()).get('/api/v1/ghats/%ZZ');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });
});

describe('draft checks', () => {
  it('template briefs for every ghat pass the same checks applied to AI drafts', () => {
    for (const ghatId of dataContext.ghats.keys()) {
      const facts = buildBriefFacts(dataContext, ghatId);
      for (const language of ['en', 'hi']) {
        assert.equal(checkDraft(renderTemplateBrief(facts, language), facts, language), null, `${ghatId} ${language}`);
      }
    }
  });

  it('rejects number words, negative numbers, safety/legal/health claims and mostly-English Hindi', () => {
    const facts = buildBriefFacts(dataContext, 'bairagarh-sant-hirdaram-kund');
    assert.equal(checkDraft('DO fell to zero in four readings.', facts, 'en'), 'rejected_unverified_numbers');
    assert.equal(checkDraft('DO dropped to -5 mg/l.', facts, 'en'), 'rejected_unverified_numbers');
    assert.equal(checkDraft('चार रीडिंग में DO कम था।', facts, 'hi'), 'rejected_unverified_numbers');
    assert.equal(checkDraft('The ghat is safe for immersion.', facts, 'en'), 'rejected_prohibited_claim');
    assert.equal(checkDraft('Immersion is prohibited here.', facts, 'en'), 'rejected_prohibited_claim');
    assert.equal(checkDraft('Low DO caused fish deaths.', facts, 'en'), 'rejected_prohibited_claim');
    assert.equal(checkDraft('यह घाट सुरक्षित है।', facts, 'hi'), 'rejected_prohibited_claim');
    assert.equal(checkDraft('Legal status is not verified. स्थिति', facts, 'hi'), 'rejected_wrong_language');
  });

  it('does not flag ordinary words that contain number-like substrings', () => {
    const facts = buildBriefFacts(dataContext, 'khatlapura-ghat');
    assert.equal(checkDraft('बरसात से पहले और दोनों पर्वों के दौरान जल-परीक्षण की आवश्यकता है।', facts, 'hi'), null);
    assert.equal(checkDraft('No one should treat missing readings as clean.', facts, 'en'), null);
  });
});

describe('fact check', () => {
  it('accepts numbers from the facts, including Devanagari digits', () => {
    const facts = { count: 42, limit: 5, years: '2023-2025' };
    assert.deepEqual(findUnverifiedNumbers('४२ readings, limit 5, 2023 to 2025', facts), []);
  });

  it('reports numbers that are not in the facts', () => {
    assert.deepEqual(findUnverifiedNumbers('About 60% of readings', { count: 42 }), [60]);
  });
});

describe('loadEnv', () => {
  it('requires CLIENT_ORIGIN in production', () => {
    assert.throws(() => loadEnv({ NODE_ENV: 'production' }), /CLIENT_ORIGIN/);
  });

  it('never exposes the Cerebras key on the config object', () => {
    const loaded = loadEnv({ CEREBRAS_API_KEY: 'secret-value', CEREBRAS_MODEL: 'm' });
    assert.ok(!JSON.stringify(loaded).includes('secret-value'));
  });
});
