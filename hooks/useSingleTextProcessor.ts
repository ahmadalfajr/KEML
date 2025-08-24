// src/hooks/useSingleTextProcessor.ts
'use client';
import { useState } from 'react';
import { Extraction, VerificationResponse, ProcessedMessage } from '@/types';
import { processMessageForExtractions } from '@/lib/openai/processing';

export function useSingleTextProcessor() {
  const [inputText, setInputText] = useState<string>('');
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [processedMessage, setProcessedMessage] = useState<ProcessedMessage | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [includeVerification, setIncludeVerification] = useState<boolean>(false);
  const [maxIterations, setMaxIterations] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [canContinue, setCanContinue] = useState<boolean>(false);
  const [verification, setVerification] = useState<VerificationResponse | null>(null);
  const [iterationCount, setIterationCount] = useState<number>(0);

  const handleToggleAcceptance = (index: number) => {
    setExtractions(prev => prev.map((ext, idx) => {
      if (idx === index) {
        return {
          ...ext,
          accepted: ext.accepted === false ? true : ext.accepted === true ? false : true
        };
      }
      return ext;
    }));
  };

  const handleExtract = async () => {
    if (!inputText) {
      setError('Please provide input text.');
      return;
    }

    setIsExtracting(true);
    setError(null);
    setExtractions([]);
    setVerification(null);
    setShowVerification(false);
    setIterationCount(0);
    setProcessedMessage(null);

    try {
      // Create a mock conversation message from the input text
      const message = {
        role: 'user' as const,
        content: inputText
      };

      // Use our iterative processing function with verification enabled
      const result = await processMessageForExtractions(message, true, maxIterations);
      
      setProcessedMessage(result);
      // Initialize all extractions as accepted by default
      const extractionsWithAcceptance = result.extractions.map(ext => ({ ...ext, accepted: true }));
      setExtractions(extractionsWithAcceptance);
      setVerification(result.verification || null);
      setIterationCount(result.iterationCount || 1);
      
      // Show verification results immediately if available
      if (result.verification) {
        setShowVerification(true);
      }
      
      // Enable continue button if we can still improve and haven't hit max iterations
      const canStillContinue = result.verification && 
        (!result.verification.isComprehensive || result.verification.confidenceScore < 0.8) &&
        (result.iterationCount || 0) < 3; // Hard limit of 3 total iterations
      setCanContinue(!!canStillContinue);
      
      if (result.processingError) {
        setError(result.processingError);
      }
    } catch (e: any) {
      console.error(e);
      setError(`Extraction failed: ${e?.message ?? String(e)}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleVerify = async () => {
    // Since we now run verification automatically during extraction,
    // this function just toggles the display of verification results
    if (verification) {
      setShowVerification(!showVerification);
    } else if (processedMessage) {
      // If no verification exists but we have a processed message,
      // re-run the extraction with verification enabled
      setIsVerifying(true);
      try {
        const message = {
          role: 'user' as const,
          content: inputText
        };
        
        const result = await processMessageForExtractions(message, true, maxIterations);
        setProcessedMessage(result);
        const extractionsWithAcceptance = result.extractions.map(ext => ({ ...ext, accepted: true }));
        setExtractions(extractionsWithAcceptance);
        setVerification(result.verification || null);
        setIterationCount(result.iterationCount || 1);
        
        if (result.verification) {
          setShowVerification(true);
        }
      } catch (e: any) {
        console.error(e);
        setError(`Verification failed: ${e?.message ?? String(e)}`);
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleContinueRefinement = async () => {
    if (!processedMessage || !inputText) {
      setError('No previous processing context available.');
      return;
    }

    setIsExtracting(true);
    setError(null);
    setCanContinue(false);

    try {
      const message = {
        role: 'user' as const,
        content: inputText
      };
      
      // Prepare context from previous processing
      const lastVerification = processedMessage.verification;
      let lastFeedback = '';
      
      if (lastVerification) {
        const missedInfo = lastVerification.missedInformation
          .filter(info => info.importance === 'high' || info.importance === 'medium')
          .map(info => `- Missing: ${info.informationPiece} (${info.importance} importance) - ${info.reasoning}`)
          .join('\n');
        
        lastFeedback = `Previous Results:\n` +
          `- Confidence Score: ${lastVerification.confidenceScore}\n` +
          `- Is Comprehensive: ${lastVerification.isComprehensive}\n` +
          `- Evaluator Summary: ${lastVerification.summary}\n` +
          (missedInfo ? `\nMissed Information:\n${missedInfo}` : '') +
          '\n\nPlease address these issues in your next extraction attempt.';
      }
      
      const existingContext = {
        iterationHistory: processedMessage.iterationHistory || [],
        lastFeedback
      };
      
      // Continue with one more iteration
      const result = await processMessageForExtractions(message, true, (processedMessage.iterationCount || 0) + 1, existingContext);
      
      setProcessedMessage(result);
      // Preserve existing acceptance states when updating extractions
      const updatedExtractions = result.extractions.map((ext, idx) => ({
        ...ext,
        accepted: extractions[idx]?.accepted ?? true
      }));
      setExtractions(updatedExtractions);
      setVerification(result.verification || null);
      setIterationCount(result.iterationCount || 1);
      
      if (result.verification) {
        setShowVerification(true);
      }
      
      // Check if we can continue further
      const canStillContinue = result.verification && 
        (!result.verification.isComprehensive || result.verification.confidenceScore < 0.8) &&
        (result.iterationCount || 0) < 3;
      setCanContinue(!!canStillContinue);
      
      if (result.processingError) {
        setError(result.processingError);
      }
    } catch (e: any) {
      console.error(e);
      setError(`Continue refinement failed: ${e?.message ?? String(e)}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDownloadResults = () => {
    if (!extractions.length) return;

    const downloadData = {
      metadata: {
        processedAt: new Date().toISOString(),
        inputText: inputText,
        maxIterations: maxIterations,
        iterationCount: iterationCount
      },
      extractions: extractions.filter(ext => ext.accepted !== false) // Only accepted extractions
    };

    const blob = new Blob([JSON.stringify(downloadData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `single-text-extractions-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadLogs = () => {
    if (!processedMessage) return;

    const logsData = {
      metadata: {
        processedAt: new Date().toISOString(),
        inputText: inputText,
        maxIterations: maxIterations,
        iterationCount: iterationCount
      },
      logs: {
        verification: verification,
        iterationHistory: processedMessage.iterationHistory,
        allExtractions: extractions, // Include all extractions with acceptance status
        processingError: processedMessage.processingError
      }
    };

    const blob = new Blob([JSON.stringify(logsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `single-text-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    inputText,
    setInputText,
    extractions,
    verification,
    isExtracting,
    isVerifying,
    error,
    setError,
    showVerification,
    iterationCount,
    processedMessage,
    maxIterations,
    setMaxIterations,
    canContinue,
    handleExtract,
    handleVerify,
    handleContinueRefinement,
    handleToggleAcceptance,
    handleDownloadResults,
    handleDownloadLogs
  };
}