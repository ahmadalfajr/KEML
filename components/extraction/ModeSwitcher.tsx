// src/components/extraction/ModeSwitcher.tsx
'use client';

interface ModeSwitcherProps {
  currentMode: 'single' | 'conversation';
  onModeChange: (mode: 'single' | 'conversation') => void;
  onClearState: () => void;
}

export function ModeSwitcher({ currentMode, onModeChange, onClearState }: ModeSwitcherProps) {
  const handleModeClick = (mode: 'single' | 'conversation') => {
    if (mode !== currentMode) {
      onModeChange(mode);
    }
  };

  return (
    <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
      <div className="flex">
        <button
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${currentMode === 'single' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => handleModeClick('single')}
        >
          📝 Single Text Mode
        </button>
        <button
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${currentMode === 'conversation' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => handleModeClick('conversation')}
        >
          💬 Conversation Mode
        </button>
      </div>
      
      <button
        onClick={onClearState}
        className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm"
      >
        🗑️ Clear {currentMode === 'single' ? 'Text' : 'Conversation'}
      </button>
    </div>
  );
}