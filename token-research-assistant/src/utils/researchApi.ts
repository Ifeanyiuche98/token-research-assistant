import type { ResearchResponse } from '../types/research';

export async function fetchResearch(query: string): Promise<ResearchResponse> {
  const response = await fetch(`/api/research?q=${encodeURIComponent(query)}`);
  const data = (await response.json()) as ResearchResponse;

  if (!response.ok) {
    throw new Error(data.message || 'Unable to fetch research right now.');
  }

  return data;
}
