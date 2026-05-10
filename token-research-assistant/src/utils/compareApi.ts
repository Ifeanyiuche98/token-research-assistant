import type { CompareResponse } from '../types/compare';

function extractServerErrorMessage(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 'Unable to compare tokens right now.';
  if (trimmed.startsWith('<')) return 'The compare service returned a server error page. Please try again.';
  return trimmed.slice(0, 200);
}

export async function fetchComparison(leftQuery: string, rightQuery: string): Promise<CompareResponse> {
  const response = await fetch(`/api/compare?a=${encodeURIComponent(leftQuery)}&b=${encodeURIComponent(rightQuery)}`);
  const rawText = await response.text();

  let data: (CompareResponse & { message?: string }) | null = null;

  try {
    data = rawText ? (JSON.parse(rawText) as CompareResponse & { message?: string }) : null;
  } catch {
    throw new Error(extractServerErrorMessage(rawText));
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Unable to compare tokens right now.');
  }

  if (!data) {
    throw new Error('Compare service returned an empty response.');
  }

  return data;
}
