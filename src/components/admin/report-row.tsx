"use client";

import { useState } from "react";
import Link from "next/link";

type Report = {
  id: string;
  reason: string;
  message: string | null;
  status: string;
  contentTitle: string;
  contentSlug: string;
  reporter: string;
};

export function ReportRow({ report }: { report: Report }) {
  const [status, setStatus] = useState(report.status);
  const [loading, setLoading] = useState(false);

  async function setReportStatus(next: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (res.ok) setStatus(next);
  }

  return (
    <div className="index-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm">
          <span className="stamp text-brass">{report.reason.replace("_", " ")}</span> on{" "}
          <Link href={`/content/${report.contentSlug}`} className="text-brass hover:underline">
            {report.contentTitle}
          </Link>
        </p>
        <span
          className={`stamp ${
            status === "RESOLVED" ? "text-teal" : status === "DISMISSED" ? "text-text-muted" : "text-danger"
          }`}
        >
          {status}
        </span>
      </div>
      {report.message && <p className="mt-2 text-sm text-text-muted">{report.message}</p>}
      <p className="mt-1 font-mono text-[0.65rem] text-text-muted">Reported by {report.reporter}</p>
      <div className="mt-3 flex gap-2 text-xs">
        <button
          disabled={loading}
          onClick={() => setReportStatus("RESOLVED")}
          className="rounded-sm border border-teal px-2 py-1 text-teal hover:bg-teal hover:text-ink"
        >
          Mark resolved
        </button>
        <button
          disabled={loading}
          onClick={() => setReportStatus("DISMISSED")}
          className="rounded-sm border border-border px-2 py-1 text-text-muted hover:text-text"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
