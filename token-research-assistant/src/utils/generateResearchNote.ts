import type { ResearchNote } from '../types/research';
import { getMockResearchNote } from '../data/mockResearch';

export async function generateResearchNote(query: string): Promise<ResearchNote> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return getMockResearchNote(query);
}
