import { ApiError } from '../middleware/errorHandler.js';
import { getLegalStatus } from '../config/legalStatus.js';
import { CPCB_CRITERIA_SOURCE, getSourceDocument } from '../config/sources.js';
import { parsePaging } from '../validators/common.validator.js';

const COORDINATE_LIMITATION = 'Coordinates are not verified: the source reports give no coordinates for this ghat.';

function getGhatOrThrow(dataContext, ghatId) {
  const ghat = dataContext.ghats.get(ghatId);
  if (!ghat) throw new ApiError(404, 'GHAT_NOT_FOUND', 'No ghat exists with this ghatId.');
  return ghat;
}

// No verified coordinate source exists yet, so coordinates are null and `not_verified`.
function locationFields() {
  return { latitude: null, longitude: null, coordinateStatus: 'not_verified', locationSourceId: null };
}

function buildSources(ghat) {
  const pagesBySource = new Map();
  for (const observation of ghat.observations) {
    if (!pagesBySource.has(observation.sourceId)) pagesBySource.set(observation.sourceId, new Set());
    if (observation.sourcePage) pagesBySource.get(observation.sourceId).add(observation.sourcePage);
  }

  const reports = [...pagesBySource.entries()]
    .map(([sourceId, pages]) => ({
      ...(getSourceDocument(sourceId) ?? { sourceId, title: sourceId }),
      pageReferences: [...pages].sort((a, b) => Number(a) - Number(b)),
    }))
    .sort((a, b) => a.sourceId.localeCompare(b.sourceId));

  return [...reports, { ...CPCB_CRITERIA_SOURCE, pageReferences: [] }];
}

export function listGhats(req, res) {
  const { dataContext } = req.app.locals;

  const data = [...dataContext.ghats.values()]
    .map((ghat) => ({
      ghatId: ghat.ghatId,
      name: ghat.name,
      waterBody: ghat.waterBodies.join('; '),
      ...locationFields(),
      legalStatus: getLegalStatus(ghat.ghatId).status,
      environmentalPriority: dataContext.rankingByGhat.get(ghat.ghatId)?.priority ?? 'insufficient_data',
      siteMatchConfidence: ghat.siteMatchConfidence,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  res.json({ data, meta: { count: data.length } });
}

export function getGhat(req, res) {
  const { dataContext } = req.app.locals;
  const ghat = getGhatOrThrow(dataContext, req.params.ghatId);
  const { limit, offset } = parsePaging(req.query);
  const observations =
    limit === undefined ? ghat.observations.slice(offset) : ghat.observations.slice(offset, offset + limit);
  const evidence = dataContext.ghatEvidence[ghat.ghatId];
  const ranking = dataContext.rankingByGhat.get(ghat.ghatId);

  const limitations = new Set([...(evidence.limitations ?? []), ...(ranking?.limitations ?? []), COORDINATE_LIMITATION]);
  if (ghat.siteMatchConfidence.includes('medium')) {
    limitations.add('Site name match is medium confidence: the source tables may describe more than one place under this name.');
  }

  res.json({
    data: {
      ghatId: ghat.ghatId,
      name: ghat.name,
      aliases: ghat.aliases,
      waterBody: ghat.waterBodies.join('; '),
      siteMatchConfidence: ghat.siteMatchConfidence,
      ...locationFields(),
      legal: getLegalStatus(ghat.ghatId),
      historicalEvidence: {
        startYear: evidence.startYear,
        endYear: evidence.endYear,
        sampleCount: evidence.totalRecords,
        validSampleCount: ranking?.validSampleCount ?? 0,
        coverage: evidence.coverage,
        priority: ranking?.priority ?? 'insufficient_data',
        score: ranking?.score ?? null,
        rank: ranking?.rank ?? null,
        explanation: ranking?.explanation ?? null,
        exceedances: evidence.exceedanceSummary,
        parameterSummaries: Object.values(evidence.parameterSummaries),
        observations,
      },
      sources: buildSources(ghat),
      limitations: [...limitations],
    },
    meta: {
      observationCount: ghat.observations.length,
      observationOffset: offset,
      observationLimit: limit ?? null,
    },
  });
}

export function getGhatSources(req, res) {
  const { dataContext } = req.app.locals;
  const ghat = getGhatOrThrow(dataContext, req.params.ghatId);
  const data = buildSources(ghat);
  res.json({ data, meta: { count: data.length } });
}
