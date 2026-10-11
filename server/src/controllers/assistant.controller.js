/**
 * AI Assistant controller - evidence-grounded responses using historical data and OpenAI.
 * The API key is never exposed in responses.
 */

import { generateAssistantResponse } from '../services/assistant/assistant.service.js';

export async function chat(req, res) {
  const { dataContext, config } = req.app.locals;
  const request = req.validated;

  const response = await generateAssistantResponse(request, { dataContext, config });

  res.json({
    data: {
      response: response.content,
      sources: response.sources,
      isLLMGenerated: response.isLLMGenerated,
      generatedAt: new Date().toISOString(),
    },
    meta: {
      language: request.language,
      datasetYears: '2023-2025',
      notice: response.notice || response.error || null,
    },
  });
}
