// src/components/extraction/ConversationMode.tsx
'use client';
import { useConversationProcessor } from "@/hooks/useConversationProcessor";
import { formatConversationTitle, formatDate } from "@/lib/utils/formatting";
import { ConversationList } from "./ConversationList";
import { ProcessingSummary } from "./ProcessingSummary";

export function ConversationMode() {
  const {
    conversationFile,
    selectedConversation,
    setSelectedConversation,
    processedConversation,
    isProcessingConversation,
    processingProgress,
    includeVerificationInBatch,
    setIncludeVerificationInBatch,
    maxIterations,
    setMaxIterations,
    error,
    fileInputRef, 
    handleFileUpload,
    handleProcessConversation,
    handleDownloadResults,
    handleContinueRefinement,
    isRefining,
    handleToggleAcceptance,
    handleDownloadLogs,
  } = useConversationProcessor();

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">{error}</div>}

      {!conversationFile && (
        <div className="bg-white p-6 rounded-lg shadow border-2 border-dashed border-gray-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Conversation File</h2>
          <p className="text-gray-600 mb-4">Upload your ChatGPT conversation export (JSON file) to begin.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      )}

      {conversationFile && !selectedConversation && (
        <ConversationList conversations={conversationFile.conversations} onSelectConversation={setSelectedConversation} />
      )}

      {selectedConversation && !processedConversation && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <button onClick={() => setSelectedConversation(null)} className="text-sm text-blue-600 hover:underline mb-2">
                &larr; Back to list
              </button>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {formatConversationTitle(selectedConversation)}
              </h2>
              <div className="text-sm text-gray-500 space-x-4">
                <span>📅 {formatDate(selectedConversation.create_time)}</span>
                <span>💬 {(selectedConversation.messages || []).length} messages</span>
              </div>
            </div>
            {!isProcessingConversation && (
              <button
                onClick={handleProcessConversation}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {maxIterations === 1 ? '🔄 Process Conversation' : `🔄 Process with ${maxIterations} Max Iterations`}
              </button>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* Iteration Settings */}
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-900">Max Iterations per Message:</label>
              <select
                value={maxIterations}
                onChange={(e) => setMaxIterations(Number(e.target.value))}
                disabled={isProcessingConversation}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value={1}>1 </option>
                <option value={2}>2 </option>
                <option value={3}>3 </option>
              </select>
              <span className="text-xs text-gray-500">
                {maxIterations === 1 ? 'Single extraction per message' : `Auto-refine up to ${maxIterations} times per message`}
              </span>
            </div>
            
            {/* Verification Checkbox */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="includeVerification"
                checked={!includeVerificationInBatch}
                onChange={(e) => setIncludeVerificationInBatch(!e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="includeVerification" className="text-sm text-gray-700">
                Skip verification (disables iterative refinement)
              </label>
            </div>
          </div>

          {isProcessingConversation && (
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-blue-700">Processing...</span>
                <span className="text-sm font-medium text-blue-700">{processingProgress.current} of {processingProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}></div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {processedConversation && (
         <ProcessingSummary 
           processedConversation={processedConversation} 
           onDownload={handleDownloadResults}
           onDownloadLogs={handleDownloadLogs}
           onContinueRefinement={handleContinueRefinement}
           isRefining={isRefining}
           onToggleAcceptance={handleToggleAcceptance}
         />
      )}
    </div>
  );
}