"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FavoriteButton({
  contentId,
  isLoggedIn,
  initialFavorited = false,
}: {
  contentId: string;
  isLoggedIn: boolean;
  initialFavorited?: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: favorited ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      if (res.ok) setFavorited(!favorited);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex-1 rounded-sm border px-3 py-2 text-sm transition-colors ${
        favorited
          ? "border-brass text-brass"
          : "border-border text-text-muted hover:border-brass hover:text-brass"
      }`}
    >
      {favorited ? "★ Favorited" : "☆ Favorite"}
    </button>
  );
}
