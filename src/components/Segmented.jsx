/** Accessible segmented control (radio group). */
export default function Segmented({ label, value, options, onChange, name }) {
  return (
    <fieldset>
      {label && <legend className="mb-2 text-sm font-semibold text-white/80">{label}</legend>}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              type="button"
              key={String(opt.value)}
              role="radio"
              aria-checked={active}
              name={name}
              onClick={() => onChange(opt.value)}
              className={`chip ${active ? 'chip-active' : ''}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
