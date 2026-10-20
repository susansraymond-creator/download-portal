ALTER TABLE "Episode" ADD COLUMN "episodeNumberLabel" TEXT;

ALTER TABLE "Episode"
  ADD CONSTRAINT "Episode_episodeNumberLabel_format_check"
  CHECK ("episodeNumberLabel" IS NULL OR "episodeNumberLabel" ~ '^[0-9]+([ -–—][0-9]+)?$');
