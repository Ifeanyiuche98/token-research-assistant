import type { CompareResponse } from '../types/compare';

export async function fetchComparison(leftQuery: string, rightQuery: string): Promise<CompareResponse> {
  const response = await fetch(`/api/compare?a=${encodeURIComponent(leftQuery)}&b=${encodeURIComponent(rightQuery)}`);
  const data = (await response.json()) as CompareResponse & { message?: string };

  if (!response.ok) {
    throw new Error(data.message || 'Unable to compare tokens right now.');
  }

  return data;
}
