// src/components/extraction/IterationHistory.tsx
'use client';
import { IterationStep } from "@/types";
import { getConfidenceColor, getImportanceColor } from "@/lib/utils/formatting";
import { useState } from "react";

interface IterationHistoryProps {
  iterationHistory: IterationStep[];
}

export function IterationHistory({ iterationHistory }: IterationHistoryProps) {
  const [expandedIteration, setExpandedIteration] = useState<number | null>(null);

  if (!iterationHistory || iterationHistory.length === 0) {
    return null;
  }

  const toggleIteration = (iterationNumber: number) => {
    setExpandedIteration(expandedIteration === iterationNumber ? null : iterationNumber);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">🔄 Iteration History</h2>
      <p className="text-sm text-gray-600 mb-4">
        View the step-by-step refinement process showing how the AI improved its extractions based on evaluator feedback.
      </p>
      
      <div className="space-y-4">
        {iterationHistory.map((step, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Iteration Header */}
            <button
              onClick={() => toggleIteration(step.iterationNumber)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="font-bold text-blue-600 text-lg">
                  Iteration {step.iterationNumber}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </span>
                {step.verification && (
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    step.verification.isComprehensive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {step.verification.isComprehensive ? 'Comprehensive' : 'Needs Improvement'}
                  </span>
                )}
              </div>
              <span className="text-gray-400">
                {expandedIteration === step.iterationNumber ? '▼' : '▶'}
              </span>
            </button>

            {/* Iteration Details */}
            {expandedIteration === step.iterationNumber && (
              <div className="p-4 border-t border-gray-200">
                {/* Extractor Output */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                    🤖 Extractor Output ({step.extractions.length} items)
                  </h4>
                  <div className="space-y-3">
                    {step.extractions.map((ext, extIdx) => (
                      <div key={extIdx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-blue-600 text-lg mr-3">{ext.rank}</span>
                          <div className="flex-1">
                            <p className="text-gray-800">{ext.informationPiece}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              <strong>Reasoning:</strong> {ext.reasoning}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            ext.isInstruction ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {ext.isInstruction ? 'Instruction' : 'Information'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evaluator Output */}
                {step.verification && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                      🔍 Evaluator Assessment
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-white rounded border">
                          <h5 className="font-medium text-gray-600">Comprehensiveness</h5>
                          <p className={`text-lg font-bold ${
                            step.verification.isComprehensive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {step.verification.isComprehensive ? 'Complete' : 'Incomplete'}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <h5 className="font-medium text-gray-600">Confidence</h5>
                          <p className={`text-lg font-bold ${getConfidenceColor(step.verification.confidenceScore)}`}>
                            {(step.verification.confidenceScore * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-white rounded border mb-4">
                        <h5 className="font-medium text-gray-600 mb-2">Evaluator Summary</h5>
                        <p className="text-gray-700 italic">{step.verification.summary}</p>
                      </div>

                      {step.verification.missedInformation.length > 0 && (
                        <div className="p-3 bg-white rounded border">
                          <h5 className="font-medium text-gray-600 mb-2">Missed Information</h5>
                          <div className="space-y-2">
                            {step.verification.missedInformation.map((missed, missedIdx) => (
                              <div key={missedIdx} className="p-2 bg-yellow-50 rounded border border-yellow-200">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="text-gray-800 text-sm">{missed.informationPiece}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      <strong>Reasoning:</strong> {missed.reasoning}
                                    </p>
                                  </div>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getImportanceColor(missed.importance)}`}>
                                    {missed.importance}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Feedback for Next Iteration */}
                {step.feedback && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                      💬 Feedback to Next Iteration
                    </h4>
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                        {step.feedback}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
