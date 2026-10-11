/**
 * Express API integration tests (Supertest) against the real committed dataset.
 * No API keys or network access are required.
 */

import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { loadDataContext } from './services/dataContext.service.js';
import { buildBriefFacts } from './services/reports/briefFacts.service.js';
import { renderTemplateBrief } from './services/reports/briefTemplate.service.js';

process.env.NODE_ENV = 'test';

const config = loadEnv({ NODE_ENV: 'test', CLIENT_ORIGIN: 'http://localhost:5173' });

let dataContext;
before(async () => {
  dataContext = await loadDataContext();
});

function appWith() {
  return createApp({ config, dataContext });
}

// Every number in a brief must be traceable to the facts payload.
function numbersNotInFacts(text, facts) {
  const numbers = (value) => (value.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  const allowed = new Set(numbers(JSON.stringify(facts)));
  return numbers(text).filter((n) => !allowed.has(n));
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

  it('returns an English brief with facts, sources and limitations', async () => {
    const res = await request(appWith()).post('/api/v1/reports/brief').send(body);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.language, 'en');
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

  it('only uses numbers that come from backend facts, for every ghat and language', () => {
    for (const ghatId of dataContext.ghats.keys()) {
      const facts = buildBriefFacts(dataContext, ghatId);
      for (const language of ['en', 'hi']) {
        assert.deepEqual(numbersNotInFacts(renderTemplateBrief(facts, language), facts), [], `${ghatId} ${language}`);
      }
    }
  });

  it('never calls a ghat safe or decides legal status', () => {
    for (const ghatId of dataContext.ghats.keys()) {
      const facts = buildBriefFacts(dataContext, ghatId);
      assert.doesNotMatch(renderTemplateBrief(facts, 'en'), /\b(is|are)\s+(safe|permitted|prohibited)\b/i);
      assert.doesNotMatch(renderTemplateBrief(facts, 'hi'), /सुरक्षित\s+(है|हैं)/);
    }
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
    for (let i = 0; i < 31; i += 1) {
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

describe('loadEnv', () => {
  it('requires CLIENT_ORIGIN in production', () => {
    assert.throws(() => loadEnv({ NODE_ENV: 'production' }), /CLIENT_ORIGIN/);
  });
});

describe('GET /api/v1/risk (Python engine proxy)', () => {
  const engineBody = { data: [{ site: 'Test ghat', risk: 'Needs attention' }], meta: { count: 1 } };
  const appWithEngine = (fetchImpl) => createApp({ config, dataContext, fetchImpl });

  it('relays the engine response and forwards validated filters', async () => {
    let requestedUrl;
    const fetchImpl = async (url) => {
      requestedUrl = url;
      return { ok: true, status: 200, json: async () => engineBody };
    };
    const res = await request(appWithEngine(fetchImpl)).get('/api/v1/risk?year=2025&phase=during&festival=Durga');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, engineBody);
    assert.match(requestedUrl, /year=2025&phase=during&festival=Durga$/);
  });

  it('rejects invalid query values before calling the engine', async () => {
    const fetchImpl = async () => assert.fail('engine must not be called');
    for (const query of ['', '?year=abc', '?year=2025&phase=later', '?year=2025&festival=<x>']) {
      const res = await request(appWithEngine(fetchImpl)).get(`/api/v1/risk${query}`);
      assert.equal(res.status, 400, query);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    }
  });

  it('returns 503 ENGINE_UNAVAILABLE when the engine is down', async () => {
    const fetchImpl = async () => {
      throw new Error('ECONNREFUSED');
    };
    const res = await request(appWithEngine(fetchImpl)).get('/api/v1/risk?year=2025');
    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, 'ENGINE_UNAVAILABLE');
  });

  it('maps engine 422 to INSUFFICIENT_DATA', async () => {
    const fetchImpl = async () => ({ ok: false, status: 422, json: async () => ({}) });
    const res = await request(appWithEngine(fetchImpl)).get('/api/v1/risk?year=2025');
    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'INSUFFICIENT_DATA');
  });
});
