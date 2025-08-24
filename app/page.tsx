'use client';

import React, { useState } from 'react';
import { ConversationMode } from '@/components/extraction/ConversationMode';
import { SingleTextMode } from '@/components/extraction/SingleTextMode';
import { ModeSwitcher } from '@/components/extraction/ModeSwitcher';
import { ApiKeyInput } from '@/components/ui/ApiKeyInput';

/**
 * The main entry point of the application.
 * Manages the current mode ('single' or 'conversation') and renders the appropriate UI.
 */
export default function HomePage() {
  const [currentMode, setCurrentMode] = useState<'single' | 'conversation'>('single');
  const [apiKey, setApiKey] = useState<string>('');

  // Keys only used for explicit clearing, not mode switching
  const [singleModeKey, setSingleModeKey] = useState(0);
  const [conversationModeKey, setConversationModeKey] = useState(0);

  const handleClearCurrentMode = () => {
    // Only clear the current mode's data when explicitly requested
    if (currentMode === 'single') {
      setSingleModeKey(prev => prev + 1);
    } else {
      setConversationModeKey(prev => prev + 1);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 bg-gray-50 font-sans">
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">KEML - Information Pieces Extractor</h1>
        <p className="text-gray-600 mb-6">Extract information from single text or process entire ChatGPT conversations.</p>

        <ApiKeyInput onApiKeyChange={setApiKey} />

        <ModeSwitcher
          currentMode={currentMode}
          onModeChange={setCurrentMode}
          onClearState={handleClearCurrentMode}
        />

        <div style={{ display: currentMode === 'single' ? 'block' : 'none' }}>
          <div key={singleModeKey}>
            <SingleTextMode />
          </div>
        </div>
        <div style={{ display: currentMode === 'conversation' ? 'block' : 'none' }}>
          <div key={conversationModeKey}>
            <ConversationMode />
          </div>
        </div>
      </div>
    </main>
  );
}


