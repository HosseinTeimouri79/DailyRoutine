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
      className={`inline-flex items-center justify-center rounded-full flex-[0_0_${size}px] ${className}`.trim()}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: `conic-gradient(var(--color-success-border) ${normalizedPercent}%, color-mix(in srgb, var(--color-primary-soft) 62%, var(--color-bg-surface)) 0)`,
        flexShrink: 0,
      }}
      title={title}
    >
      <span
        className="inline-flex items-center justify-center rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border-soft)] text-[var(--color-text-secondary)] text-[0.56rem] font-bold leading-none"
        style={{ width: `${innerSize}px`, height: `${innerSize}px` }}
      >
        {normalizedPercent}
      </span>
    </span>
  );
}
