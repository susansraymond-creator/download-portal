"use client";

import { useEffect, useState } from "react";

type VoteType = "MUST_WATCH" | "GOOD" | "AVERAGE";

type Tally = { MUST_WATCH: number; GOOD: number; AVERAGE: number };

const OPTIONS: { type: VoteType; icon: string; label: string; sub: string }[] = [
  { type: "MUST_WATCH", icon: "🔥", label: "Must Watch", sub: "অবশ্যই দেখুন" },
  { type: "GOOD", icon: "👍", label: "Good", sub: "ভালো লেগেছে" },
  { type: "AVERAGE", icon: "😐", label: "Average", sub: "মোটামুটি" },
];

export function VoteWidget({ contentId }: { contentId: string }) {
  const [tally, setTally] = useState<Tally>({ MUST_WATCH: 0, GOOD: 0, AVERAGE: 0 });
  const [total, setTotal] = useState(0);
  const [myVote, setMyVote] = useState<VoteType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/content/${contentId}/vote`)
      .then((r) => r.json())
      .then((data) => {
        setTally(data.tally);
        setTotal(data.total);
        setMyVote(data.myVote);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [contentId]);

  async function castVote(voteType: VoteType) {
    setMyVote(voteType);
    const res = await fetch(`/api/content/${contentId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voteType }),
    });
    if (res.ok) {
      const data = await res.json();
      setTally(data.tally);
      setTotal(data.total);
      setMyVote(data.myVote);
    }
  }

  const topPercent =
    total > 0 ? Math.round((Math.max(tally.MUST_WATCH, tally.GOOD, tally.AVERAGE) / total) * 100) : 0;

  if (loading) return null;

  return (
    <div className="index-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-muted">
            Community verdict
          </p>
          <h3 className="mt-1 font-display text-lg">How's this content?</h3>
        </div>
        {total > 0 && (
          <div className="text-right">
            <p className="font-display text-2xl text-teal">{topPercent}%</p>
            <p className="font-mono text-[0.6rem] text-text-muted">recommend</p>
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full bg-teal transition-all"
            style={{ width: `${topPercent}%` }}
          />
        </div>
      )}
      {total > 0 && (
        <p className="mt-1 font-mono text-[0.6rem] text-text-muted">{total} votes</p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => {
          const count = tally[opt.type];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const selected = myVote === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => castVote(opt.type)}
              className={`rounded-sm border p-3 text-center transition-colors ${
                selected
                  ? "border-teal bg-teal/10"
                  : "border-border hover:border-text-muted"
              }`}
            >
              <p className="text-lg">{opt.icon}</p>
              <p className="mt-1 text-xs font-medium">{opt.label}</p>
              <p className="font-mono text-[0.6rem] text-text-muted">{opt.sub}</p>
              {total > 0 && (
                <p className="mt-1 font-mono text-[0.6rem] text-teal">{pct}% · {count}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}