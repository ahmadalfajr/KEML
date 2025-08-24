// src/lib/utils/conversation.ts
import { Conversation, ConversationFile, ConversationMessage } from "@/types";

/**
 * Functions for parsing and normalizing conversation data from JSON files.
 */

export function parseConversationFile(fileContent: string): ConversationFile {
  try {
    const parsed = JSON.parse(fileContent);

    if (Array.isArray(parsed)) {
      return { conversations: parsed.map(normalizeConversation) };
    }

    if (parsed.conversations && Array.isArray(parsed.conversations)) {
      return { conversations: parsed.conversations.map(normalizeConversation) };
    }

    if (parsed.data && Array.isArray(parsed.data)) {
      return { conversations: parsed.data.map(normalizeConversation) };
    }

    if (parsed.id || parsed.conversation_id) {
      return { conversations: [normalizeConversation(parsed)] };
    }

    throw new Error('Invalid conversation file structure');
  } catch (e: any) {
    throw new Error(`Failed to parse conversation file: ${e.message}`);
  }
}

export function normalizeConversation(rawConversation: any): Conversation {
  const conversation: Conversation = {
    id: rawConversation.id || rawConversation.conversation_id || `conv_${Date.now()}`,
    title: rawConversation.title || '',
    create_time: rawConversation.create_time || Date.now() / 1000,
    update_time: rawConversation.update_time,
    messages: []
  };

  if (rawConversation.messages && Array.isArray(rawConversation.messages)) {
    conversation.messages = rawConversation.messages.map(normalizeMessage);
  } else if (rawConversation.mapping && typeof rawConversation.mapping === 'object') {
    const messages: ConversationMessage[] = [];

    Object.values(rawConversation.mapping).forEach((node: any) => {
      if (node?.message?.content?.parts && Array.isArray(node.message.content.parts)) {
        const role = node.message.author?.role || 'user';
        const content = node.message.content.parts.join('\n').trim();

        if (content && (role === 'user' || role === 'assistant')) {
          messages.push({
            role: role as 'user' | 'assistant',
            content: content,
            timestamp: node.message.create_time || conversation.create_time
          });
        }
      }
    });

    conversation.messages = messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }

  return conversation;
}

export function normalizeMessage(rawMessage: any): ConversationMessage {
  let content = '';
  let role: 'user' | 'assistant' | 'system' = 'user';

  if (typeof rawMessage.content === 'string') {
    content = rawMessage.content;
  } else if (rawMessage.content?.parts && Array.isArray(rawMessage.content.parts)) {
    content = rawMessage.content.parts.join('\n');
  } else if (rawMessage.message?.content?.parts && Array.isArray(rawMessage.message.content.parts)) {
    content = rawMessage.message.content.parts.join('\n');
  } else if (rawMessage.parts && Array.isArray(rawMessage.parts)) {
    content = rawMessage.parts.join('\n');
  }

  if (rawMessage.role) {
    role = rawMessage.role;
  } else if (rawMessage.author?.role) {
    role = rawMessage.author.role;
  } else if (rawMessage.message?.author?.role) {
    role = rawMessage.message.author.role;
  }

  return {
    role: role as 'user' | 'assistant' | 'system',
    content: content.trim(),
    timestamp: rawMessage.timestamp || rawMessage.create_time || rawMessage.message?.create_time
  };
}