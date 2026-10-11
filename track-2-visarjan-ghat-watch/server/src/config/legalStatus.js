/**
 * Legal/operational status evidence per ghat (docs/DATA_DICTIONARY.md "Legal status evidence").
 *
 * A status other than `not_verified` requires a current, applicable official source
 * (order/clause, scope, effective dates and the date the team verified it).
 * No such evidence has been verified yet, so every ghat defaults to `not_verified`.
 * Historical water-quality results must never be used to infer legal status.
 */

export const LEGAL_STATUSES = Object.freeze(['authorised', 'prohibited', 'conditional', 'not_verified']);

// Add verified entries here keyed by canonical ghatId, e.g.
// 'example-ghat': { status, sourceTitle, sourceUrl, clauseOrOrder, scope, effectiveFrom, effectiveTo, verifiedAt, notes }
const VERIFIED_LEGAL_EVIDENCE = Object.freeze({});

const NOT_VERIFIED = Object.freeze({
  status: 'not_verified',
  sourceTitle: null,
  sourceUrl: null,
  clauseOrOrder: null,
  scope: null,
  effectiveFrom: null,
  effectiveTo: null,
  verifiedAt: null,
  notes: null,
});

function isCompleteEvidence(evidence) {
  return (
    LEGAL_STATUSES.includes(evidence.status) &&
    evidence.status !== 'not_verified' &&
    Boolean(evidence.sourceTitle && evidence.sourceUrl && evidence.clauseOrOrder && evidence.verifiedAt)
  );
}

export function getLegalStatus(ghatId) {
  const evidence = VERIFIED_LEGAL_EVIDENCE[ghatId];
  if (!evidence || !isCompleteEvidence(evidence)) return { ...NOT_VERIFIED };
  return { ...NOT_VERIFIED, ...evidence };
}
