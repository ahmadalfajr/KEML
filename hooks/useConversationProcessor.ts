// src/hooks/useConversationProcessor.ts
'use client';
import { useState, useRef } from 'react';
import { Conversation, ConversationFile, ProcessedConversation, ProcessedMessage } from '@/types';
import { parseConversationFile } from '@/lib/utils/conversation';
import { processMessageForExtractions } from '@/lib/openai/processing';
import { formatConversationTitle } from '@/lib/utils/formatting';

export function useConversationProcessor() {
  const [conversationFile, setConversationFile] = useState<ConversationFile | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [processedConversation, setProcessedConversation] = useState<ProcessedConversation | null>(null);
  const [isProcessingConversation, setIsProcessingConversation] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [includeVerificationInBatch, setIncludeVerificationInBatch] = useState<boolean>(true);
  const [maxIterations, setMaxIterations] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleAcceptance = (messageIndex: number, extractionIndex: number) => {
    if (!processedConversation) return;
    
    setProcessedConversation(prev => {
      if (!prev) return prev;
      
      const updatedMessages = [...prev.processedMessages];
      const message = updatedMessages[messageIndex];
      if (!message) return prev;
      
      const updatedExtractions = [...message.extractions];
      const extraction = updatedExtractions[extractionIndex];
      if (!extraction) return prev;
      
      updatedExtractions[extractionIndex] = {
        ...extraction,
        accepted: extraction.accepted === false ? true : extraction.accepted === true ? false : true
      };
      
      updatedMessages[messageIndex] = {
        ...message,
        extractions: updatedExtractions
      };
      
      return {
        ...prev,
        processedMessages: updatedMessages
      };
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file.');
      return;
    }

    try {
      const fileContent = await file.text();
      const conversationData = parseConversationFile(fileContent);

      if (!conversationData.conversations || conversationData.conversations.length === 0) {
        throw new Error('No conversations found in the file');
      }

      setConversationFile(conversationData);
      setSelectedConversation(null);
      setProcessedConversation(null);
      setError(null);
    } catch (e: any) {
      setError(`Failed to load conversation file: ${e.message}`);
      setConversationFile(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcessConversation = async () => {
    if (!selectedConversation) {
      setError('Please select a conversation first.');
      return;
    }

    setIsProcessingConversation(true);
    setError(null);
    setProcessedConversation(null);

    const messages = selectedConversation.messages || [];
    const assistantMessages = messages.filter(m => {
      const content = typeof m.content === 'string' ? m.content :
        (m.content?.parts ? m.content.parts.join('\n') : String(m.content || ''));
      return m.role === 'assistant' && content.trim().length > 20;
    });

    setProcessingProgress({ current: 0, total: assistantMessages.length });

    try {
      const processedMessages: ProcessedMessage[] = [];

      for (let i = 0; i < assistantMessages.length; i++) {
        const message = assistantMessages[i];
        setProcessingProgress({ current: i + 1, total: assistantMessages.length });

        const processedMessage = await processMessageForExtractions(message, includeVerificationInBatch, maxIterations);
        // Initialize all extractions as accepted by default
        const messageWithAcceptance = {
          ...processedMessage,
          extractions: processedMessage.extractions.map(ext => ({ ...ext, accepted: true }))
        };
        processedMessages.push(messageWithAcceptance);

        if (i < assistantMessages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const summary = {
        totalMessages: messages.length,
        processedMessages: processedMessages.length,
        totalExtractions: processedMessages.reduce((sum, pm) => sum + pm.extractions.length, 0),
        errors: processedMessages.filter(pm => pm.processingError).length
      };

      setProcessedConversation({
        conversation: selectedConversation,
        processedMessages,
        summary
      });
    } catch (e: any) {
      setError(`Conversation processing failed: ${e.message}`);
    } finally {
      setIsProcessingConversation(false);
      setProcessingProgress({ current: 0, total: 0 });
    }
  };
  
  const handleContinueRefinement = async (messageIndex: number) => {
    if (!processedConversation) return;

    const processedMessage = processedConversation.processedMessages[messageIndex];
    if (!processedMessage) return;

    try {
      setError(null);
      setIsRefining(true);
      const updatedMessage = await processMessageForExtractions(
        processedMessage.originalMessage,
        includeVerificationInBatch,
        (processedMessage.iterationCount || 0) + 1, // Continue from current iteration count
        {
          iterationHistory: processedMessage.iterationHistory || [],
          lastFeedback: processedMessage.iterationHistory?.slice(-1)[0]?.feedback
        }
      );

      // Merge the new iteration with existing data, preserving acceptance states
      const mergedExtractions = updatedMessage.extractions.map((ext, idx) => ({
        ...ext,
        accepted: processedMessage.extractions[idx]?.accepted ?? true
      }));
      
      const mergedMessage: ProcessedMessage = {
        ...processedMessage,
        extractions: mergedExtractions,
        verification: updatedMessage.verification,
        iterationCount: updatedMessage.iterationCount,
        iterationHistory: updatedMessage.iterationHistory,
        processingError: updatedMessage.processingError
      };

      // Update the specific message in the processed conversation
      const updatedProcessedMessages = [...processedConversation.processedMessages];
      updatedProcessedMessages[messageIndex] = mergedMessage;

      // Recalculate summary
      const summary = {
        totalMessages: processedConversation.conversation.messages?.length || 0,
        processedMessages: updatedProcessedMessages.length,
        totalExtractions: updatedProcessedMessages.reduce((sum, pm) => sum + pm.extractions.length, 0),
        errors: updatedProcessedMessages.filter(pm => pm.processingError).length
      };

      setProcessedConversation({
        ...processedConversation,
        processedMessages: updatedProcessedMessages,
        summary
      });
    } catch (e: any) {
      setError(`Continue refinement failed: ${e.message}`);
    } finally {
      setIsRefining(false);
    }
  };

  const handleDownloadResults = () => {
    if (!processedConversation) return;

    const downloadData = {
      metadata: {
        conversationId: processedConversation.conversation.id,
        conversationTitle: formatConversationTitle(processedConversation.conversation),
        processedAt: new Date().toISOString(),
        summary: processedConversation.summary,
        includedVerification: includeVerificationInBatch,
        maxIterations: maxIterations
      },
      results: processedConversation.processedMessages.map(pm => ({
        originalMessage: {
          role: pm.originalMessage.role,
          content: pm.originalMessage.content,
          timestamp: pm.originalMessage.timestamp
        },
        extractions: pm.extractions.filter(ext => ext.accepted !== false) // Only include accepted extractions
      }))
    };

    const blob = new Blob([JSON.stringify(downloadData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-extractions-${processedConversation.conversation.id?.slice(-8) || 'unknown'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadLogs = () => {
    if (!processedConversation) return;

    const logsData = {
      metadata: {
        conversationId: processedConversation.conversation.id,
        conversationTitle: formatConversationTitle(processedConversation.conversation),
        processedAt: new Date().toISOString(),
        summary: processedConversation.summary,
        includedVerification: includeVerificationInBatch,
        maxIterations: maxIterations
      },
      logs: processedConversation.processedMessages.map(pm => ({
        originalMessage: {
          role: pm.originalMessage.role,
          content: pm.originalMessage.content,
          timestamp: pm.originalMessage.timestamp
        },
        verification: pm.verification,
        processingError: pm.processingError,
        iterationCount: pm.iterationCount,
        iterationHistory: pm.iterationHistory,
        allExtractions: pm.extractions // Include all extractions with acceptance status
      }))
    };

    const blob = new Blob([JSON.stringify(logsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-logs-${processedConversation.conversation.id?.slice(-8) || 'unknown'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return {
    conversationFile,
    selectedConversation,
    setSelectedConversation,
    processedConversation,
    setProcessedConversation,
    isProcessingConversation,
    processingProgress,
    includeVerificationInBatch,
    setIncludeVerificationInBatch,
    maxIterations,
    setMaxIterations,
    error,
    setError,
    isRefining,
    fileInputRef,
    handleFileUpload,
    handleProcessConversation,
    handleDownloadResults,
    handleDownloadLogs,
    handleContinueRefinement,
    handleToggleAcceptance
  };
}