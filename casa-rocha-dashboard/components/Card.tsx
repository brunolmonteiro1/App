export function Card({
  title,
  children,
  footnote,
}: {
  title?: string;
  children: React.ReactNode;
  footnote?: string;
}) {
  return (
    <section className="rounded-xl border border-hairline bg-surface p-4">
      {title && <h2 className="text-sm font-medium text-secondary mb-3">{title}</h2>}
      {children}
      {footnote && <p className="mt-2 text-[11px] text-muted">{footnote}</p>}
    </section>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-4">
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
      <div className="text-sm text-secondary mt-1">{label}</div>
      {hint && <div className="text-[11px] text-muted mt-1">{hint}</div>}
    </div>
  );
}
