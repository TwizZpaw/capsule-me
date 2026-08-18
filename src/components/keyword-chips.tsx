export function KeywordChips({
  keywords,
  accent,
}: {
  keywords: string[];
  accent?: string;
}) {
  if (keywords.length === 0) return null;

  return (
    <ul className="flex flex-wrap justify-center gap-2">
      {keywords.map((keyword) => (
        <li
          key={keyword}
          className="rounded-full px-3 py-1 text-xs tracking-wide"
          style={{
            background: accent ? `${accent}33` : "rgba(120, 80, 40, 0.08)",
            color: accent ? undefined : "#57534e",
            border: accent ? `1px solid ${accent}66` : "1px solid rgba(214, 189, 150, 0.5)",
          }}
        >
          #{keyword}
        </li>
      ))}
    </ul>
  );
}
