// src/lib/utils/logExporter.ts
import { DetailedProcessingLog, LLMInteraction } from "@/types";

export interface LogExportOptions {
  includeRawResponses?: boolean;
  includeTimestamps?: boolean;
  format?: 'json' | 'txt' | 'csv';
}

/**
 * Formats a detailed processing log for export
 */
export function formatLogForExport(
  log: DetailedProcessingLog, 
  options: LogExportOptions = {}
): string {
  const { 
    includeRawResponses = true, 
    includeTimestamps = true, 
    format = 'txt' 
  } = options;

  if (format === 'json') {
    return JSON.stringify(log, null, 2);
  }

  if (format === 'csv') {
    return formatLogAsCSV(log, includeTimestamps);
  }

  // Default text format
  return formatLogAsText(log, includeRawResponses, includeTimestamps);
}

function formatLogAsText(
  log: DetailedProcessingLog, 
  includeRawResponses: boolean, 
  includeTimestamps: boolean
): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(80));
  lines.push('DETAILED PROCESSING LOG');
  lines.push('='.repeat(80));
  lines.push('');
  
  lines.push(`Session ID: ${log.sessionId}`);
  if (includeTimestamps) {
    lines.push(`Start Time: ${new Date(log.startTimestamp).toISOString()}`);
    lines.push(`End Time: ${new Date(log.endTimestamp).toISOString()}`);
    lines.push(`Total Duration: ${log.endTimestamp - log.startTimestamp}ms`);
  }
  lines.push(`Total Iterations: ${log.totalIterations}`);
  lines.push('');
  
  lines.push('ORIGINAL TEXT:');
  lines.push('-'.repeat(40));
  lines.push(log.originalText);
  lines.push('');
  
  lines.push('INTERACTION LOG:');
  lines.push('-'.repeat(40));
  
  log.allInteractions.forEach((interaction, index) => {
    lines.push(`\n[${index + 1}] ${interaction.type.toUpperCase()} INTERACTION`);
    if (includeTimestamps) {
      lines.push(`Timestamp: ${new Date(interaction.timestamp).toISOString()}`);
      if (interaction.processingTime) {
        lines.push(`Processing Time: ${interaction.processingTime}ms`);
      }
    }
    lines.push('');
    
    lines.push('PROMPT:');
    lines.push(interaction.prompt);
    lines.push('');
    
    lines.push('RESPONSE:');
    if (includeRawResponses && interaction.rawResponse) {
      lines.push(interaction.rawResponse);
    } else {
      lines.push(JSON.stringify(interaction.response, null, 2));
    }
    lines.push('');
    lines.push('-'.repeat(60));
  });
  
  lines.push('\nFINAL RESULTS:');
  lines.push('-'.repeat(40));
  lines.push('');
  
  lines.push('EXTRACTIONS:');
  log.finalResult.extractions.forEach((ext, index) => {
    lines.push(`${index + 1}. [${ext.isInstruction ? 'INSTRUCTION' : 'INFORMATION'}] ${ext.informationPiece}`);
    lines.push(`   Reasoning: ${ext.reasoning}`);
    lines.push(`   Rank: ${ext.rank}`);
  });
  
  if (log.finalResult.verification) {
    lines.push('');
    lines.push('VERIFICATION:');
    lines.push(`Comprehensive: ${log.finalResult.verification.isComprehensive}`);
    lines.push(`Confidence Score: ${log.finalResult.verification.confidenceScore}`);
    lines.push(`Summary: ${log.finalResult.verification.summary}`);
    
    if (log.finalResult.verification.missedInformation.length > 0) {
      lines.push('');
      lines.push('MISSED INFORMATION:');
      log.finalResult.verification.missedInformation.forEach((missed, index) => {
        lines.push(`${index + 1}. [${missed.importance.toUpperCase()}] ${missed.informationPiece}`);
        lines.push(`   Reasoning: ${missed.reasoning}`);
      });
    }
  }
  
  lines.push('');
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}

function formatLogAsCSV(log: DetailedProcessingLog, includeTimestamps: boolean): string {
  const headers = [
    'Interaction_Index',
    'Type',
    'Prompt_Length',
    'Response_Summary',
    ...(includeTimestamps ? ['Timestamp', 'Processing_Time_MS'] : [])
  ];
  
  const rows: string[][] = [headers];
  
  log.allInteractions.forEach((interaction, index) => {
    const row = [
      (index + 1).toString(),
      interaction.type,
      interaction.prompt.length.toString(),
      JSON.stringify(interaction.response).substring(0, 100) + '...',
      ...(includeTimestamps ? [
        new Date(interaction.timestamp).toISOString(),
        (interaction.processingTime || 0).toString()
      ] : [])
    ];
    rows.push(row);
  });
  
  return rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
}

/**
 * Downloads a log as a file
 */
export function downloadLog(
  log: DetailedProcessingLog, 
  filename?: string, 
  options: LogExportOptions = {}
): void {
  const { format = 'txt' } = options;
  const content = formatLogForExport(log, options);
  
  const defaultFilename = `processing_log_${log.sessionId}_${new Date().toISOString().split('T')[0]}.${format}`;
  const finalFilename = filename || defaultFilename;
  
  const blob = new Blob([content], { 
    type: format === 'json' ? 'application/json' : 'text/plain' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads multiple logs as a combined file
 */
export function downloadCombinedLogs(
  logs: DetailedProcessingLog[], 
  filename?: string, 
  options: LogExportOptions = {}
): void {
  const { format = 'txt' } = options;
  
  let combinedContent: string;
  
  if (format === 'json') {
    combinedContent = JSON.stringify(logs, null, 2);
  } else {
    const formattedLogs = logs.map((log, index) => {
      const header = `\n${'='.repeat(100)}\nLOG ${index + 1} OF ${logs.length}\n${'='.repeat(100)}\n`;
      return header + formatLogForExport(log, { ...options, format: 'txt' });
    });
    combinedContent = formattedLogs.join('\n\n');
  }
  
  const defaultFilename = `combined_processing_logs_${new Date().toISOString().split('T')[0]}.${format}`;
  const finalFilename = filename || defaultFilename;
  
  const blob = new Blob([combinedContent], { 
    type: format === 'json' ? 'application/json' : 'text/plain' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
