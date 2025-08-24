// src/lib/utils/formatting.ts
import { Conversation, ConversationMessage } from "@/types";

/**
 * Helper functions for formatting data for display in the UI.
 */

export function formatConversationTitle(conversation: Conversation): string {
  if (conversation.title && conversation.title.trim()) {
    return conversation.title.trim();
  }

  const messages = conversation.messages || [];
  const firstUserMessage = messages.find(m => m.role === 'user' && m.content?.trim());
  if (firstUserMessage && typeof firstUserMessage.content === 'string') {
    const preview = firstUserMessage.content.slice(0, 50);
    return preview.length < firstUserMessage.content.length ? `${preview}...` : preview;
  }

  return `Conversation ${conversation.id?.slice(-8) || 'Unknown'}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export const getConfidenceColor = (score: number) => {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
};

export const getImportanceColor = (importance: string) => {
  switch (importance) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getMessageContent = (message: ConversationMessage): string => {
  if (typeof message.content === 'string') {
    return message.content;
  } else if (message.content?.parts && Array.isArray(message.content.parts)) {
    return message.content.parts.join('\n');
  }
  return String(message.content || '');
};