type ModeToggleProps = {
  mode: 'single' | 'compare';
  onChange: (mode: 'single' | 'compare') => void;
};

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="card mode-toggle-card" role="tablist" aria-label="Research mode">
      <button
        type="button"
        className={`mode-toggle-button ${mode === 'single' ? 'mode-toggle-button-active' : ''}`}
        onClick={() => onChange('single')}
      >
        Single Token
      </button>
      <button
        type="button"
        className={`mode-toggle-button ${mode === 'compare' ? 'mode-toggle-button-active' : ''}`}
        onClick={() => onChange('compare')}
      >
        Compare Two Tokens
      </button>
    </div>
  );
}
