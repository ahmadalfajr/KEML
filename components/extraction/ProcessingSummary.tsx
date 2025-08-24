// src/components/extraction/ProcessingSummary.tsx
'use client';
import { ProcessedConversation } from "@/types";
import { getMessageContent } from "@/lib/utils/formatting";
import { ExtractionResults } from "./ExtractionResults";
import { LogDownloader } from "./LogDownloader";

interface ProcessingSummaryProps {
  processedConversation: ProcessedConversation;
  onDownload: () => void;
  onDownloadLogs?: () => void;
  onContinueRefinement?: (messageIndex: number) => void;
  isRefining?: boolean;
  onToggleAcceptance?: (messageIndex: number, extractionIndex: number) => void;
}

export function ProcessingSummary({ processedConversation, onDownload, onDownloadLogs, onContinueRefinement, isRefining, onToggleAcceptance }: ProcessingSummaryProps) {
  const { summary, processedMessages } = processedConversation;

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Processing Complete</h2>
        <div className="space-x-3">
          <button
            onClick={onDownload}
            className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            📄 Download Results
          </button>
          <LogDownloader 
            logs={processedMessages.map(pm => pm.fullLog).filter(Boolean) as any[]}
            sessionName={`conversation_${processedConversation.conversation.id || 'unknown'}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
        <div className="p-4 bg-gray-100 rounded-lg">
          <div className="text-sm text-gray-600">Total Messages</div>
          <div className="text-2xl font-bold text-gray-900">{summary.totalMessages}</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">Processed Responses</div>
          <div className="text-2xl font-bold text-blue-900">{summary.processedMessages}</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-green-800">Total Extractions</div>
          <div className="text-2xl font-bold text-green-900">{summary.totalExtractions}</div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="text-sm text-red-800">Errors</div>
          <div className="text-2xl font-bold text-red-900">{summary.errors}</div>
        </div>
      </div>

      <div className="space-y-6">
        {processedMessages.map((pm, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <details>
              <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                Assistant Message #{index + 1}: "{getMessageContent(pm.originalMessage).slice(0, 80)}..."
              </summary>
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-semibold mb-2">Original Message:</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{getMessageContent(pm.originalMessage)}</p>
                <div className="mt-4">
                  <ExtractionResults
                    extractions={pm.extractions}
                    verification={pm.verification || null}
                    showVerification={!!pm.verification}
                    error={pm.processingError}
                    iterationCount={pm.iterationCount}
                    processedMessage={pm}
                    canContinue={pm.verification ? (!pm.verification.isComprehensive || pm.verification.confidenceScore < 0.8) : false}
                    onContinueRefinement={onContinueRefinement ? () => onContinueRefinement(index) : undefined}
                    isRefining={isRefining}
                    onToggleAcceptance={onToggleAcceptance ? (extractionIndex: number) => onToggleAcceptance(index, extractionIndex) : undefined}
                  />
                </div>
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}