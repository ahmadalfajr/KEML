// src/lib/openai/api.ts
import { extractFirstJsonObjectFromString } from "../utils/validation";

export async function callOpenAI(messages: any[], schema: any, apiKey?: string) {
  // Try to get API key from parameter, localStorage, or environment
  const finalApiKey = apiKey || 
    (typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : null) || 
    process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  if (!finalApiKey) {
    throw new Error('OpenAI API key not found. Please provide your API key in the application.');
  }

  const body = {
    model: 'gpt-4o-2024-08-06',
    messages,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'response_schema',
        schema
      }
    }
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${finalApiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let errorMsg = `OpenAI API returned status ${response.status}`;
    try {
      const errData = await response.json();
      errorMsg = errData?.error?.message ?? JSON.stringify(errData);
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const choice = data?.choices?.[0];
  if (!choice) throw new Error('No choices returned from API');

  let parsedObj: any = undefined;
  if (choice.message && typeof choice.message === 'object' && 'parsed' in choice.message) {
    parsedObj = choice.message.parsed;
  }

  if (!parsedObj && choice.message && typeof choice.message.content === 'string') {
    const raw = choice.message.content.trim();
    const jsonCandidate = extractFirstJsonObjectFromString(raw);
    if (!jsonCandidate) {
      throw new Error('Could not find JSON object in model response content');
    }
    parsedObj = JSON.parse(jsonCandidate);
  }

  return parsedObj;
}