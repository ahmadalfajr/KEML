// src/components/extraction/LogDownloader.tsx
'use client';
import { useState } from 'react';
import { DetailedProcessingLog } from "@/types";
import { downloadLog, downloadCombinedLogs, LogExportOptions } from "@/lib/utils/logExporter";

interface LogDownloaderProps {
  logs: DetailedProcessingLog[];
  sessionName?: string;
}

export function LogDownloader({ logs, sessionName = "processing_session" }: LogDownloaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<LogExportOptions>({
    includeRawResponses: true,
    includeTimestamps: true,
    format: 'txt'
  });

  const handleDownloadSingle = (log: DetailedProcessingLog, index: number) => {
    const filename = `${sessionName}_log_${index + 1}_${log.sessionId}`;
    downloadLog(log, filename, exportOptions);
  };

  const handleDownloadAll = () => {
    const filename = `${sessionName}_all_logs`;
    downloadCombinedLogs(logs, filename, exportOptions);
  };

  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
      >
        📊 Download Logs
        <span className="text-xs bg-gray-500 px-2 py-1 rounded-full">{logs.length}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Export Options</h3>
            
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as 'json' | 'txt' }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="txt">Text (.txt)</option>
                  <option value="json">JSON (.json)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeTimestamps"
                  checked={exportOptions.includeTimestamps}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeTimestamps: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="includeTimestamps" className="text-sm text-gray-700">Include timestamps</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeRawResponses"
                  checked={exportOptions.includeRawResponses}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeRawResponses: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="includeRawResponses" className="text-sm text-gray-700">Include raw responses</label>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleDownloadAll}
                className="w-full px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                Download All Logs Combined
              </button>

              {logs.length > 1 && (
                <div className="border-t pt-2">
                  <p className="text-xs text-gray-600 mb-2">Download individual logs:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {logs.map((log, index) => (
                      <button
                        key={log.sessionId}
                        onClick={() => handleDownloadSingle(log, index)}
                        className="w-full px-2 py-1 text-left text-xs bg-gray-50 hover:bg-gray-100 rounded border text-gray-700 truncate"
                        title={`Session: ${log.sessionId}`}
                      >
                        Log {index + 1}: {log.totalIterations} iteration{log.totalIterations !== 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
