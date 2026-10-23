"use client";

import { ShareButton } from "@/components/share-button";
import { NoPreviewShareButton } from "@/components/no-preview-share-button";

export function ContentShareActions({ title, slug }: { title: string; slug: string }) {
  return (
    <>
      <ShareButton title={title} slug={slug} />
      <NoPreviewShareButton slug={slug} />
    </>
  );
}
