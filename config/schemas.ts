// src/config/schemas.ts

/**
 * JSON Schemas for enforcing OpenAI API response structure.
 */

export const extractionJsonSchema = {
  type: 'object',
  properties: {
    extractions: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          informationPiece: { type: 'string' },
          isInstruction: { type: 'boolean' },
          reasoning: { type: 'string' },
          rank: { type: 'integer', minimum: 1, maximum: 5 }
        },
        required: ['informationPiece', 'isInstruction', 'reasoning', 'rank'],
        additionalProperties: false
      }
    }
  },
  required: ['extractions'],
  additionalProperties: false
};

export const verificationJsonSchema = {
  type: 'object',
  properties: {
    isComprehensive: { type: 'boolean' },
    confidenceScore: { type: 'number', minimum: 0, maximum: 1 },
    missedInformation: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          informationPiece: { type: 'string' },
          isInstruction: { type: 'boolean' },
          reasoning: { type: 'string' },
          importance: { type: 'string', enum: ['low', 'medium', 'high'] }
        },
        required: ['informationPiece', 'isInstruction', 'reasoning', 'importance'],
        additionalProperties: false
      }
    },
    summary: { type: 'string' }
  },
  required: ['isComprehensive', 'confidenceScore', 'missedInformation', 'summary'],
  additionalProperties: false
};