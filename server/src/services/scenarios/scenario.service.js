/**
 * Scenario comparison service — owned by Gaurvee (docs/GAURVEE.md).
 *
 * Integration placeholder only: the API route, validation and error handling are wired
 * up, but no scenario calculation exists yet. Replace the body of compareScenario with
 * the real implementation, keeping this signature. The result must include
 * `isHypothetical: true`, baseline, assumptions, calculation method and limitations,
 * and must not invent effectiveness percentages (docs/API_CONTRACT.md).
 */

import { ApiError } from '../../middleware/errorHandler.js';

/**
 * @param {{ ghatId: string, scenarioType: string, assumptions: { description: string, changedInputs: Array<{input: string, value: unknown}> } }} request
 * @param {{ dataContext: object }} context
 */
// eslint-disable-next-line no-unused-vars
export function compareScenario(request, context) {
  throw new ApiError(501, 'NOT_IMPLEMENTED', 'Scenario comparison is not available yet.');
}
