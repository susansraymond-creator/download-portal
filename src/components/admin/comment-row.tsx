"use client";

import { useState } from "react";
import Link from "next/link";

type Comment = {
  id: string;
  body: string;
  status: string;
  author: string;
  contentTitle: string;
  contentSlug: string;
};

export function CommentModerationRow({ comment }: { comment: Comment }) {
  const [status, setStatus] = useState(comment.status);
  const [loading, setLoading] = useState(false);

  async function setCommentStatus(next: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/comments/${comment.id}`, {
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
        <p className="text-sm text-text-muted">
          {comment.author} on{" "}
          <Link href={`/content/${comment.contentSlug}`} className="text-brass hover:underline">
            {comment.contentTitle}
          </Link>
        </p>
        <span
          className={`stamp ${
            status === "APPROVED" ? "text-teal" : status === "REJECTED" ? "text-danger" : "text-brass"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="mt-2 text-sm">{comment.body}</p>
      <div className="mt-3 flex gap-2 text-xs">
        <button
          disabled={loading}
          onClick={() => setCommentStatus("APPROVED")}
          className="rounded-sm border border-teal px-2 py-1 text-teal hover:bg-teal hover:text-ink"
        >
          Approve
        </button>
        <button
          disabled={loading}
          onClick={() => setCommentStatus("REJECTED")}
          className="rounded-sm border border-danger px-2 py-1 text-danger hover:bg-danger hover:text-ink"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
