const express = require('express');

const defaultAiService = require('../services/aiService');
const defaultComplaintService = require('../services/complaintService');
const defaultKnowledgeService = require('../services/legalKnowledgeService');
const { ValidationError, validateClassification, validateProblem } = require('../utils/validation');

function createLegalRouter({
  aiService = defaultAiService,
  complaintService = defaultComplaintService,
  legalKnowledgeService = defaultKnowledgeService,
} = {}) {
  const router = express.Router();

  router.post('/analyze', async (request, response, next) => {
    try {
      const problem = validateProblem(request.body?.problem);
      const classification = validateClassification(await aiService.analyzeProblem(problem));
      const legalInfo = await legalKnowledgeService.getInformation(
        classification.category,
        classification.problemType,
        { language: classification.language, extractedData: classification.extractedData },
      );
      const complaintDraft = await complaintService.generateDraft(problem, classification, legalInfo);

      response.json({
        category: classification.category,
        problemType: classification.problemType,
        confidence: classification.confidence,
        language: classification.language || legalInfo.language || 'en',
        extractedData: classification.extractedData,
        summary: legalInfo.summary,
        rights: legalInfo.rights,
        nextSteps: legalInfo.nextSteps,
        documents: legalInfo.documents,
        authority: legalInfo.authority,
        complaintDraft,
        disclaimer: legalInfo.disclaimer,
        source: legalInfo.source,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function legalErrorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);

  if (error instanceof ValidationError) {
    return response.status(error.status).json({ error: error.code, message: error.message });
  }

  if (error?.expose && Number.isInteger(error.status) && typeof error.code === 'string') {
    return response.status(error.status).json({ error: error.code, message: error.message });
  }

  console.error('Legal analysis failed:', error.message);
  return response.status(503).json({
    error: 'LEGAL_SERVICE_UNAVAILABLE',
    message: 'Legal analysis is temporarily unavailable. Your description was not saved. Please try again.',
  });
}

module.exports = { createLegalRouter, legalErrorHandler };
