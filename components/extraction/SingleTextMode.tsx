// src/components/extraction/SingleTextMode.tsx
'use client';
import { useSingleTextProcessor } from "@/hooks/useSingleTextProcessor";
import { ExtractionResults } from "./ExtractionResults";
import { useState } from "react";

export function SingleTextMode() {
  const {
    inputText,
    setInputText,
    extractions,
    verification,
    isExtracting,
    isVerifying,
    error,
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
  } = useSingleTextProcessor();

  return (
    <div>
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Enter Text to Analyze</h2>
        
        {/* Iteration Settings */}
        <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
          <label className="text-sm font-medium text-gray-900">Max Iterations:</label>
          <select
            value={maxIterations}
            onChange={(e) => setMaxIterations(Number(e.target.value))}
            disabled={isExtracting}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500  text-gray-900"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
          <span className="text-xs text-gray-500">
            {maxIterations === 1 ? 'Single extraction + manual continue option' : `Auto-refine up to ${maxIterations} times`}
          </span>
        </div>
        
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your text here..."
          className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-gray-800"
          disabled={isExtracting}
        />
        <div className="text-center">
          <button
            onClick={handleExtract}
            disabled={isExtracting || !inputText.trim()}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isExtracting ? 'Processing...' : 
             maxIterations === 1 ? '🔄 Extract Information' : 
             `🔄 Extract with ${maxIterations} Max Iterations`}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            {maxIterations === 1 ? 
             'Single extraction with option to continue refinement manually' :
             `Auto-refines up to ${maxIterations} times based on evaluator feedback`}
          </p>
        </div>
      </div>
      
      {/* Show pulsing placeholders when extracting but no results yet */}
      {isExtracting && extractions.length === 0 && (
        <div className="w-full mt-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Extracted Information Pieces</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-blue-600 text-2xl mr-4 w-8 h-8 bg-gray-300 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4 mt-3"></div>
                    </div>
                    <div className="px-3 py-1 text-xs font-semibold rounded-full w-20 h-6 bg-gray-300"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Show actual results when extraction is complete */}
      {!isExtracting && extractions.length > 0 && (
        <>
          <ExtractionResults
            extractions={extractions}
            verification={verification}
            showVerification={showVerification}
            error={error}
            isVerifying={isVerifying}
            iterationCount={iterationCount}
            processedMessage={processedMessage}
            canContinue={canContinue}
            onVerify={handleVerify}
            onContinueRefinement={handleContinueRefinement}
            onToggleAcceptance={handleToggleAcceptance}
          />
          
          {/* Download buttons */}
          <div className="bg-white p-6 rounded-lg shadow mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Download Options</h3>
              <div className="space-x-3">
                <button
                  onClick={handleDownloadResults}
                  className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  📄 Download Results
                </button>
                <button
                  onClick={handleDownloadLogs}
                  className="px-5 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  📊 Download Logs
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Results contain only accepted extractions. Logs include verification, iteration history, and all extractions.
            </p>
          </div>
        </>
      )}
    </div>
  );
}