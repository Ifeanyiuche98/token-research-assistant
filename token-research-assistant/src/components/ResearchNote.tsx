import type { ResearchNote as ResearchNoteType } from '../types/research';

type ResearchNoteProps = {
  note: ResearchNoteType;
};

const sections = [
  { title: 'Summary', content: (note: ResearchNoteType) => note.summary },
  { title: 'Use Case', content: (note: ResearchNoteType) => note.useCase },
  { title: 'Risks', content: (note: ResearchNoteType) => note.risks },
  { title: 'Ecosystem Notes', content: (note: ResearchNoteType) => note.ecosystemNotes }
];

export function ResearchNote({ note }: ResearchNoteProps) {
  return (
    <section className={`card note-card ${note.isFallback ? 'note-card-fallback' : ''}`}>
      <div className="note-header">
        <p className="note-kicker">{note.isFallback ? 'Fallback research note' : 'Markdown-style research note'}</p>
        <h2>{note.project}</h2>
        <p className="note-intro">
          {note.isFallback
            ? 'This project is not yet part of the built-in dataset, so the note below is a careful research checklist-style fallback.'
            : 'A short, readable overview intended for quick first-pass research rather than deep due diligence.'}
        </p>

        <div className="note-meta">
          <span className="note-badge">Matched on: {note.matchedOn}</span>
          {!note.isFallback && note.aliases.length > 0 ? (
            <span className="note-badge">Aliases: {note.aliases.join(', ')}</span>
          ) : null}
        </div>
      </div>

      <div className="note-markdown">
        {sections.map((section) => (
          <article key={section.title} className="note-section">
            <h3>## {section.title}</h3>
            <p>{section.content(note)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
