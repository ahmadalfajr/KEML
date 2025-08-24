// src/lib/utils/validation.ts
import { Extraction, VerificationResponse } from "@/types";

/**
 * Functions for validating and normalizing data, especially from the OpenAI API.
 */

export function validateAndNormalizeExtractionResponse(obj: any): Extraction[] {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Response is not an object');
  }
  if (!Array.isArray(obj.extractions)) {
    throw new Error('`extractions` is missing or not an array');
  }

  const arr = obj.extractions;
  if (arr.length < 1 || arr.length > 5) {
    throw new Error('Number of extractions must be between 1 and 5');
  }

  const normalized: Extraction[] = arr.map((item: any, idx: number) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Extraction at index ${idx} is not an object`);
    }

    const informationPiece = item.informationPiece ?? item.information ?? item.text;
    if (typeof informationPiece !== 'string') {
      throw new Error(`extractions[${idx}].informationPiece must be a string`);
    }

    let isInstruction = item.isInstruction;
    if (typeof isInstruction === 'string') {
      const lower = isInstruction.trim().toLowerCase();
      if (lower === 'true') isInstruction = true;
      else if (lower === 'false') isInstruction = false;
    }
    if (typeof isInstruction !== 'boolean') {
      throw new Error(`extractions[${idx}].isInstruction must be a boolean`);
    }

    const reasoning = item.reasoning ?? item.reason ?? '';
    if (typeof reasoning !== 'string') {
      throw new Error(`extractions[${idx}].reasoning must be a string`);
    }

    let rank = item.rank;
    if (typeof rank === 'string') {
      const parsed = Number(rank);
      if (!Number.isNaN(parsed)) rank = parsed;
    }
    if (typeof rank !== 'number' || !Number.isInteger(rank)) {
      rank = NaN;
    }

    return {
      informationPiece: informationPiece.trim(),
      isInstruction,
      reasoning: reasoning.trim(),
      rank
    } as Extraction;
  });

  const n = normalized.length;
  const ranks = normalized.map((r) => r.rank);
  const rankSet = new Set(ranks.filter((r) => Number.isInteger(r) && !Number.isNaN(r)));
  const allRanksValidRange = ranks.every((r) => Number.isInteger(r) && !Number.isNaN(r) && r >= 1 && r <= n);
  const allUnique = rankSet.size === n;

  if (!allRanksValidRange || !allUnique) {
    for (let i = 0; i < normalized.length; i++) {
      normalized[i].rank = i + 1;
    }
  } else {
    normalized.sort((a, b) => a.rank - b.rank);
  }

  return normalized;
}

export function validateVerificationResponse(obj: any): VerificationResponse {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Verification response is not an object');
  }

  const isComprehensive = obj.isComprehensive;
  if (typeof isComprehensive !== 'boolean') {
    throw new Error('isComprehensive must be a boolean');
  }

  const confidenceScore = obj.confidenceScore;
  if (typeof confidenceScore !== 'number' || confidenceScore < 0 || confidenceScore > 1) {
    throw new Error('confidenceScore must be a number between 0 and 1');
  }

  const missedInformation = obj.missedInformation || [];
  if (!Array.isArray(missedInformation)) {
    throw new Error('missedInformation must be an array');
  }

  const summary = obj.summary || '';
  if (typeof summary !== 'string') {
    throw new Error('summary must be a string');
  }

  return {
    isComprehensive,
    confidenceScore,
    missedInformation: missedInformation.map((item: any) => ({
      informationPiece: item.informationPiece || '',
      isInstruction: Boolean(item.isInstruction),
      reasoning: item.reasoning || '',
      importance: ['low', 'medium', 'high'].includes(item.importance) ? item.importance : 'medium'
    })),
    summary
  };
}

export function extractFirstJsonObjectFromString(s: string): string | null {
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/i;
  const fenceMatch = s.match(fenceRegex);
  if (fenceMatch && fenceMatch[1]) {
    s = fenceMatch[1].trim();
  }

  const start = s.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') {
      depth--;
      if (depth === 0) {
        const candidate = s.slice(start, i + 1);
        try {
          JSON.parse(candidate);
          return candidate;
        } catch {
          // continue searching
        }
      }
    }
  }
  return null;
}