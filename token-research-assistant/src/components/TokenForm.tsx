type TokenFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function TokenForm({ value, onChange, onSubmit, isLoading }: TokenFormProps) {
  return (
    <div className="card">
      <label className="label" htmlFor="project-name">
        Token or project name
      </label>
      <div className="form-row">
        <input
          id="project-name"
          className="input"
          type="text"
          placeholder="e.g. Bitcoin, Ethereum, Solana"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSubmit();
            }
          }}
        />
        <button className="button" onClick={onSubmit} disabled={isLoading || !value.trim()}>
          {isLoading ? 'Generating...' : 'Generate note'}
        </button>
      </div>
    </div>
  );
}
