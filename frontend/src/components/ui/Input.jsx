export default function Input({ label, id, error, ...props }) {
  return (
    <div className="field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <input
        id={id}
        className={`input ${error ? "input-error" : ""}`}
        {...props}
      />
      {error ? <small className="field-error">{error}</small> : null}
    </div>
  );
}
