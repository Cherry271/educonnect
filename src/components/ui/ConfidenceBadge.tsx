interface Props {
  score: number;
  model?: string;
  responseTime?: number;
  tokens?: number;
  compact?: boolean;
}

export default function ConfidenceBadge({ score, model, responseTime, tokens, compact }: Props) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 90 ? 'bg-green-100 text-green-800 border-green-200' :
    pct >= 70 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
    'bg-red-100 text-red-800 border-red-200';

  if (compact) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
        {pct}% confidence
      </span>
    );
  }

  return (
    <div className={`inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-lg text-xs border ${color}`}>
      <span className="font-semibold">{pct}% confidence</span>
      {model && <span className="opacity-75">· {model}</span>}
      {responseTime && <span className="opacity-75">· {responseTime}ms</span>}
      {tokens && <span className="opacity-75">· {tokens} tokens</span>}
    </div>
  );
}
