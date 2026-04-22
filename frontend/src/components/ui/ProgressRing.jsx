import "./ProgressRing.css";

export default function ProgressRing({
  percent = 0,
  title,
  className = "",
  size = 26,
  innerSize = 19,
}) {
  const normalizedPercent = Number.isFinite(Number(percent))
    ? Math.min(100, Math.max(0, Math.round(Number(percent))))
    : 0;

  return (
    <span
      className={`progress-ring ${className}`.trim()}
      style={{
        "--progress": `${normalizedPercent}%`,
        "--ring-size": `${size}px`,
        "--ring-inner-size": `${innerSize}px`,
      }}
      title={title}
    >
      <span className="progress-ring-inner">{normalizedPercent}</span>
    </span>
  );
}
