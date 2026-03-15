import type { ResearchNote } from '../types/research';
import { getResearchNote } from '../data/mockResearch';

export async function generateResearchNote(query: string): Promise<ResearchNote> {
  const normalizedQuery = query.trim();
  const delay = normalizedQuery.length > 8 ? 850 : 650;

  await new Promise((resolve) => setTimeout(resolve, delay));

  return getResearchNote(normalizedQuery);
}
