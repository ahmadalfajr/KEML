// src/components/extraction/ConversationList.tsx
'use client';
import { Conversation } from "@/types";
import { formatDate, formatConversationTitle } from "@/lib/utils/formatting";

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
}

export function ConversationList({ conversations, onSelectConversation }: ConversationListProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Select a Conversation</h2>
          <span className="text-sm text-gray-500">
            {conversations.length} conversations found
          </span>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">
                  {formatConversationTitle(conversation)}
                </h3>
                <div className="text-sm text-gray-500 space-x-4">
                  <span>📅 {formatDate(conversation.create_time)}</span>
                  <span>💬 {(conversation.messages || []).length} messages</span>
                  <span>🤖 {(conversation.messages || []).filter(m => m.role === 'assistant').length} LLM responses</span>
                </div>
              </div>
              <div className="text-blue-600 hover:text-blue-800">→</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}