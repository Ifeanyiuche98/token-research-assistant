import type { ResearchNote as ResearchNoteType } from '../types/research';

type ResearchNoteProps = {
  note: ResearchNoteType;
};

export function ResearchNote({ note }: ResearchNoteProps) {
  return (
    <section className="card note-card">
      <p className="note-kicker">Research note</p>
      <h2>{note.project}</h2>

      <div className="note-section">
        <h3>Summary</h3>
        <p>{note.summary}</p>
      </div>

      <div className="note-section">
        <h3>Use Case</h3>
        <p>{note.useCase}</p>
      </div>

      <div className="note-section">
        <h3>Risks</h3>
        <p>{note.risks}</p>
      </div>

      <div className="note-section">
        <h3>Ecosystem Notes</h3>
        <p>{note.ecosystemNotes}</p>
      </div>
    </section>
  );
}
