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
    <section className="card note-card">
      <div className="note-header">
        <p className="note-kicker">Markdown-style research note</p>
        <h2>{note.project}</h2>
        <p className="note-intro">
          A short, readable overview intended for quick first-pass research rather than deep due diligence.
        </p>
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
