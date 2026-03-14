import { useState } from 'react';
import { TokenForm } from './components/TokenForm';
import { ResearchNote } from './components/ResearchNote';
import { LoadingState } from './components/LoadingState';
import type { ResearchNote as ResearchNoteType } from './types/research';
import { generateResearchNote } from './utils/generateResearchNote';

function App() {
  const [query, setQuery] = useState('');
  const [note, setNote] = useState<ResearchNoteType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!query.trim()) {
      return;
    }

    setIsLoading(true);
    const result = await generateResearchNote(query);
    setNote(result);
    setIsLoading(false);
  };

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Phase 1</p>
        <h1>Token Research Assistant</h1>
        <p className="subtitle">
          Enter a token or project name and get a short research note in a clean, readable format.
        </p>
      </section>

      <TokenForm value={query} onChange={setQuery} onSubmit={handleGenerate} isLoading={isLoading} />

      {isLoading && <LoadingState />}
      {note && !isLoading && <ResearchNote note={note} />}
    </main>
  );
}

export default App;
