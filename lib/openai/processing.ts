// src/lib/openai/processing.ts
import { ConversationMessage, ProcessedMessage, IterationStep, LLMInteraction, DetailedProcessingLog } from "@/types";
import { extractionJsonSchema, verificationJsonSchema } from "@/config/schemas";
import { validateAndNormalizeExtractionResponse, validateVerificationResponse } from "../utils/validation";
import { callOpenAI } from "./api";

/**
 * Core business logic for processing a single message to get extractions and verification.
 * Implements iterative refinement loop with configurable max iterations.
 */
export async function processMessageForExtractions(
  message: ConversationMessage,
  includeVerification: boolean,
  maxIterations: number = 1,
  existingContext?: { iterationHistory: IterationStep[], lastFeedback?: string }
): Promise<ProcessedMessage> {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTimestamp = Date.now();
  const allInteractions: LLMInteraction[] = [];
  
  const result: ProcessedMessage = {
    originalMessage: message,
    extractions: []
  };

  let messageContent = '';
  if (typeof message.content === 'string') {
    messageContent = message.content;
  } else if (message.content?.parts && Array.isArray(message.content.parts)) {
    messageContent = message.content.parts.join('\n');
  } else {
    messageContent = String(message.content || '');
  }

  if (message.role === 'system' || messageContent.trim().length < 20) {
    return result;
  }

  try {
    const MAX_ITERATIONS = maxIterations;
    const CONFIDENCE_THRESHOLD = 0.8;
    let iteration = existingContext?.iterationHistory.length || 0;
    const iterationHistory: IterationStep[] = existingContext?.iterationHistory || [];
    
    // Initialize conversation messages array for maintaining context
    const conversationMessages: any[] = [
      { 
        role: 'system', 
        content: `You are an extraction assistant. Extract the most essential and distinct information pieces from the text (1-5 pieces). Focus on critical facts, key decisions, important outcomes, or actionable items. Keep each piece concise (less than 10 words). Prioritize quality over quantity. Return exactly one JSON object that conforms to the provided schema.`
      },
      { role: 'user', content: messageContent }
    ];

    // Initialize verification conversation messages array for maintaining verification context
    const verificationConversationMessages: any[] = [
      { 
        role: 'system', 
        content: `You are a verification assistant. Your task is to analyze whether the provided extractions cover the most important information from the original text. Be lenient and focus only on truly critical missing information. Compare the original text with the extracted information pieces and determine: 1. If any truly critical information was missed (be selective) 2. Rate the completeness on a 0-1 confidence scale (favor higher scores for reasonable extractions) 3. List only the most important missed information if any exists. Return exactly one JSON object conforming to the schema.`
      }
    ];
    
    while (iteration < MAX_ITERATIONS) {
      iteration++;

      // Log extraction interaction
      const extractionStartTime = Date.now();
      const extractionPrompt = conversationMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
      
      const extractionObj = await callOpenAI(conversationMessages, extractionJsonSchema);
      const extractionEndTime = Date.now();
      
      // Record extraction interaction
      const extractionInteraction: LLMInteraction = {
        timestamp: extractionStartTime,
        type: 'extraction',
        prompt: extractionPrompt,
        response: extractionObj,
        rawResponse: JSON.stringify(extractionObj, null, 2),
        processingTime: extractionEndTime - extractionStartTime
      };
      allInteractions.push(extractionInteraction);
      
      const normalized = validateAndNormalizeExtractionResponse(extractionObj);
      result.extractions = normalized.sort((a, b) => a.rank - b.rank);
      
      // Add assistant's extraction response to conversation history
      const extractionResponse = JSON.stringify(result.extractions);
      conversationMessages.push({ role: 'assistant', content: extractionResponse });
      
      // Create iteration step record
      const iterationStep: IterationStep = {
        iterationNumber: iteration,
        extractions: [...result.extractions],
        timestamp: Date.now(),
        interactions: [extractionInteraction]
      };

      // Always run verification if we have extractions
      if (includeVerification && result.extractions.length > 0) {
        const extractionSummary = result.extractions.map((ext, idx) =>
          `${idx + 1}. ${ext.isInstruction ? '[INSTRUCTION]' : '[INFORMATION]'} ${ext.informationPiece}`
        ).join('\n');

        const verificationPrompt = `Original Text:\n"""\n${messageContent}\n"""\n\nExtracted Information Pieces:\n"""\n${extractionSummary}\n"""\n\nPlease verify if the extraction covers the essential information. Be lenient - only flag truly critical missing information that would significantly impact understanding.`;

        // Add verification request to both conversations
        conversationMessages.push({ 
          role: 'user', 
          content: `Please verify if my extraction covers the essential information. Be lenient - only flag truly critical missing information.\n\nOriginal Text:\n"""\n${messageContent}\n"""\n\nExtracted Information Pieces:\n"""\n${extractionSummary}\n"""\n\nPlease verify if the extraction covers the essential information.`
        });

        // Add verification request to verification conversation (maintaining its own context)
        verificationConversationMessages.push({ 
          role: 'user', 
          content: verificationPrompt
        });

        // Log verification interaction
        const verificationStartTime = Date.now();
        const verificationFullPrompt = verificationConversationMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
        
        const verificationObj = await callOpenAI(verificationConversationMessages, verificationJsonSchema);
        const verificationEndTime = Date.now();
        
        // Record verification interaction
        const verificationInteraction: LLMInteraction = {
          timestamp: verificationStartTime,
          type: 'verification',
          prompt: verificationFullPrompt,
          response: verificationObj,
          rawResponse: JSON.stringify(verificationObj, null, 2),
          processingTime: verificationEndTime - verificationStartTime
        };
        allInteractions.push(verificationInteraction);
        iterationStep.interactions!.push(verificationInteraction);
        
        result.verification = validateVerificationResponse(verificationObj);
        
        // Add verification response to verification conversation
        const verificationResponseForVerifier = JSON.stringify(result.verification);
        verificationConversationMessages.push({ role: 'assistant', content: verificationResponseForVerifier });
        
        // Add verification response to main conversation
        const verificationResponse = `Verification complete. Comprehensive: ${result.verification.isComprehensive}, Confidence: ${result.verification.confidenceScore}. ${result.verification.missedInformation.length > 0 ? `Missing: ${result.verification.missedInformation.map(info => info.informationPiece).join(', ')}` : 'No missing information identified.'}`;
        conversationMessages.push({ role: 'assistant', content: verificationResponse });
        
        // Add verification to current iteration step
        iterationStep.verification = result.verification;
        
        // Check if we should continue iterating
        const shouldContinue = (
          !result.verification.isComprehensive || 
          result.verification.confidenceScore < CONFIDENCE_THRESHOLD
        ) && iteration < MAX_ITERATIONS;
        
        if (shouldContinue && result.verification.missedInformation.length > 0) {
          // Add improvement request to conversation for next iteration
          const improvementRequest = `Based on the verification, please improve your extraction. Missing important information: ${result.verification.missedInformation.map(info => 
            `"${info.informationPiece}" (${info.importance} importance)`
          ).join(', ')}. Please extract these missing pieces in your next attempt.`;
          
          conversationMessages.push({ role: 'user', content: improvementRequest });
          
          // Add feedback to iteration step
          iterationStep.feedback = improvementRequest;
        }
        
        // Store this iteration in history (always, regardless of whether continuing)
        iterationHistory.push(iterationStep);
        
        if (!shouldContinue) {
          // Exit loop - either good results or max iterations reached
          break;
        }
      } else {
        // No verification requested, store iteration and exit
        iterationHistory.push(iterationStep);
        break;
      }
    }
    
    // Add iteration metadata to result
    result.iterationCount = iteration;
    result.iterationHistory = iterationHistory;
    
    // Create comprehensive log
    const endTimestamp = Date.now();
    const fullLog: DetailedProcessingLog = {
      sessionId,
      startTimestamp,
      endTimestamp,
      originalText: messageContent,
      totalIterations: iteration,
      allInteractions,
      finalResult: {
        extractions: result.extractions,
        verification: result.verification
      }
    };
    result.fullLog = fullLog;
    
  } catch (error: any) {
    result.processingError = error.message || 'Unknown processing error';
    
    // Still create log even if there was an error
    const endTimestamp = Date.now();
    const fullLog: DetailedProcessingLog = {
      sessionId,
      startTimestamp,
      endTimestamp,
      originalText: messageContent,
      totalIterations: existingContext?.iterationHistory.length || 0,
      allInteractions,
      finalResult: {
        extractions: result.extractions,
        verification: result.verification
      }
    };
    result.fullLog = fullLog;
  }

  return result;
}