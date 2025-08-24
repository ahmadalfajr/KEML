// src/types/index.ts

/**
 * Type definitions for the application's data structures.
 */

export interface Extraction {
  informationPiece: string;
  isInstruction: boolean;
  reasoning: string;
  rank: number;
  accepted?: boolean;
}

export interface ExtractionResponse {
  extractions: Extraction[];
}

export interface MissedInformation {
  informationPiece: string;
  isInstruction: boolean;
  reasoning: string;
  importance: 'low' | 'medium' | 'high';
}

export interface VerificationResponse {
  isComprehensive: boolean;
  confidenceScore: number;
  missedInformation: MissedInformation[];
  summary: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | { parts?: string[] } | any;
  timestamp?: number;
  create_time?: number;
  update_time?: number;
  author?: { role?: string };
  message?: {
    content?: {
      parts?: string[]
    };
    author?: { role?: string };
  };
}

export interface Conversation {
  id: string;
  title?: string;
  messages?: ConversationMessage[];
  mapping?: { [key: string]: any };
  conversation_id?: string;
  create_time: number;
  update_time?: number;
}

export interface ConversationFile {
  conversations: Conversation[];
}

export interface LLMInteraction {
  timestamp: number;
  type: 'extraction' | 'verification';
  prompt: string;
  response: any;
  rawResponse?: string;
  processingTime?: number;
}

export interface IterationStep {
  iterationNumber: number;
  extractions: Extraction[];
  verification?: VerificationResponse;
  feedback?: string;
  timestamp: number;
  interactions?: LLMInteraction[];
}

export interface ProcessedMessage {
  originalMessage: ConversationMessage;
  extractions: Extraction[];
  verification?: VerificationResponse;
  processingError?: string;
  iterationCount?: number;
  iterationHistory?: IterationStep[];
  fullLog?: DetailedProcessingLog;
}

export interface DetailedProcessingLog {
  sessionId: string;
  startTimestamp: number;
  endTimestamp: number;
  originalText: string;
  totalIterations: number;
  allInteractions: LLMInteraction[];
  finalResult: {
    extractions: Extraction[];
    verification?: VerificationResponse;
  };
}

export interface ProcessedConversation {
  conversation: Conversation;
  processedMessages: ProcessedMessage[];
  summary: {
    totalMessages: number;
    processedMessages: number;
    totalExtractions: number;
    errors: number;
  };
}