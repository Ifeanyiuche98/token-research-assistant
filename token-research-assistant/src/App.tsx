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
  const [error, setError] = useState('');

  const handleChange = (value: string) => {
    setQuery(value);

    if (error && value.trim()) {
      setError('');
    }
  };

  const handleGenerate = async () => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setError('Please enter a token or project name before generating a note.');
      setNote(null);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await generateResearchNote(trimmedQuery);
      setNote(result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Phase 2</p>
        <h1>Token Research Assistant</h1>
        <p className="subtitle">
          Enter a token or project name and get a short research note in a clean, readable format.
        </p>
      </section>

      <TokenForm
        value={query}
        onChange={handleChange}
        onSubmit={handleGenerate}
        isLoading={isLoading}
        error={error}
      />

      {isLoading && <LoadingState />}
      {note && !isLoading && <ResearchNote note={note} />}
    </main>
  );
}

export default App;
