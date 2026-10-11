/**
 * AI Assistant controller - evidence-grounded responses using historical data.
 */

import { generateAssistantResponse } from '../services/assistant/assistant.service.js';

export async function chat(req, res) {
  const { dataContext } = req.app.locals;
  const request = req.validated;

  const response = await generateAssistantResponse(request, { dataContext });

  res.json({
    data: {
      response: response.content,
      sources: response.sources,
      generatedAt: new Date().toISOString(),
    },
    meta: {
      language: request.language,
      datasetYears: '2023-2025',
    },
  });
}
