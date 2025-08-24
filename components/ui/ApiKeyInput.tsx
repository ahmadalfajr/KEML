// src/components/ui/ApiKeyInput.tsx
'use client';
import { useState, useEffect } from 'react';

interface ApiKeyInputProps {
  onApiKeyChange: (apiKey: string) => void;
}

export function ApiKeyInput({ onApiKeyChange }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Load API key from localStorage on component mount
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      onApiKeyChange(savedApiKey);
    }
  }, [onApiKeyChange]);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    onApiKeyChange(value);
    
    // Save to localStorage
    if (value.trim()) {
      localStorage.setItem('openai_api_key', value.trim());
    } else {
      localStorage.removeItem('openai_api_key');
    }
  };

  const clearApiKey = () => {
    setApiKey('');
    onApiKeyChange('');
    localStorage.removeItem('openai_api_key');
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center mb-2">
        <span className="text-yellow-800 font-medium">🔑 OpenAI API Key Required</span>
        {apiKey && (
          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            ✓ Configured
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type={isVisible ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {isVisible ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {apiKey && (
            <button
              onClick={clearApiKey}
              className="px-3 py-2 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        
        <p className="text-xs text-yellow-700">
          Your API key is stored locally in your browser and never sent to any server except OpenAI's API.
          Get your API key from{' '}
          <a 
            href="https://platform.openai.com/api-keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-yellow-900"
          >
            OpenAI Platform
          </a>
        </p>
      </div>
    </div>
  );
}
