// src/components/extraction/ExtractionResults.tsx
'use client';
import { Extraction, VerificationResponse, ProcessedMessage } from "@/types";
import { getConfidenceColor, getImportanceColor } from "@/lib/utils/formatting";
import { IterationHistory } from "./IterationHistory";
import { useState } from "react";

interface ExtractionResultsProps {
  extractions: Extraction[];
  verification: VerificationResponse | null;
  showVerification: boolean;
  error?: string | null;
  isVerifying?: boolean;
  iterationCount?: number;
  processedMessage?: ProcessedMessage | null;
  canContinue?: boolean;
  onVerify?: () => void;
  onContinueRefinement?: () => void;
  isRefining?: boolean;
  onToggleAcceptance?: (index: number) => void;
}

export function ExtractionResults({ extractions, verification, showVerification, error, isVerifying, iterationCount, processedMessage, canContinue, onVerify, onContinueRefinement, isRefining, onToggleAcceptance }: ExtractionResultsProps) {
  const [showIterationHistory, setShowIterationHistory] = useState<boolean>(false);
  
  if (extractions.length === 0 && !error) {
    return null;
  }
  
  return (
    <div className="w-full mt-6">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">{error}</div>}
      
      {extractions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Extracted Information Pieces</h2>
            {iterationCount && iterationCount > 1 && (
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  🔄 {iterationCount} Iterations
                </span>
              </div>
            )}
          </div>
          <ul className="space-y-4">
            {extractions.map((ext, idx) => (
              <li key={idx} className={`p-4 rounded-lg border transition-all ${ext.accepted === false ? 'bg-red-50 border-red-200 opacity-60' : ext.accepted === true ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    {onToggleAcceptance && (
                      <div className="flex flex-col items-center space-y-1 mt-1">
                        <input
                          type="checkbox"
                          checked={ext.accepted !== false}
                          onChange={() => onToggleAcceptance(idx)}
                          className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-xs text-gray-500">
                          {ext.accepted === false ? 'Rejected' : ext.accepted === true ? 'Accepted' : 'Pending'}
                        </span>
                      </div>
                    )}
                    <span className="font-bold text-blue-600 text-2xl">{ext.rank}</span>
                  </div>
                  <div className="flex-1 mx-4">
                    <p className="text-gray-800">{ext.informationPiece}</p>
                    <p className="text-sm text-gray-500 mt-2"><strong>Reasoning:</strong> {ext.reasoning}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${ext.isInstruction ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                    {ext.isInstruction ? 'Instruction' : 'Information'}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {onToggleAcceptance && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">
                  Accepted: {extractions.filter(ext => ext.accepted === true).length} | 
                  Rejected: {extractions.filter(ext => ext.accepted === false).length} | 
                  Pending: {extractions.filter(ext => ext.accepted === undefined).length}
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => extractions.forEach((_, idx) => onToggleAcceptance(idx))}
                    className="px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={() => extractions.forEach((_, idx) => {
                      if (extractions[idx].accepted !== false) onToggleAcceptance(idx);
                    })}
                    className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors"
                  >
                    Reject All
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 text-center space-y-3">
            {onVerify && (
              <button
                onClick={onVerify}
                disabled={isVerifying}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors mr-3"
              >
                {isVerifying ? 'Processing...' : verification ? '👁️ Toggle Verification Details' : '✅ Show Verification Results'}
              </button>
            )}
            
            {processedMessage?.iterationHistory && processedMessage.iterationHistory.length > 0 && (
              <button
                onClick={() => setShowIterationHistory(!showIterationHistory)}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mr-3"
              >
                {showIterationHistory ? '🔼 Hide Iteration History' : '🔄 Show Iteration History'}
              </button>
            )}
            
            {canContinue && onContinueRefinement && (
              <button
                onClick={onContinueRefinement}
                disabled={isRefining}
                className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
              >
                {isRefining ? '🔄 Refining...' : '✨ Continue Refinement'}
              </button>
            )}
            
            {!verification && onVerify && (
              <p className="text-sm text-gray-600 mt-2">
                Verification was automatically performed during extraction
              </p>
            )}
            
            {canContinue && (
              <p className="text-sm text-gray-600 mt-2">
                💡 Results can be improved further - click "Continue Refinement" to add another iteration
              </p>
            )}
          </div>
        </div>
      )}

      {showVerification && verification && (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Verification Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700">Comprehensiveness</h3>
              <p className={`text-2xl font-bold ${verification.isComprehensive ? 'text-green-600' : 'text-red-600'}`}>
                {verification.isComprehensive ? 'Comprehensive' : 'Not Comprehensive'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700">Confidence Score</h3>
              <p className={`text-2xl font-bold ${getConfidenceColor(verification.confidenceScore)}`}>
                {(verification.confidenceScore * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <h3 className="font-semibold text-gray-700">Summary</h3>
            <p className="text-gray-600 italic">{verification.summary}</p>
          </div>

          {verification.missedInformation.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Missed Information</h3>
              <ul className="space-y-3">
                {verification.missedInformation.map((item, idx) => (
                  <li key={idx} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-800">{item.informationPiece}</p>
                        <p className="text-sm text-gray-500 mt-1"><strong>Reasoning:</strong> {item.reasoning}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getImportanceColor(item.importance)}`}>
                        {item.importance}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Iteration History */}
      {showIterationHistory && processedMessage?.iterationHistory && (
        <IterationHistory iterationHistory={processedMessage.iterationHistory} />
      )}
    </div>
  );
}