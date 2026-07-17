import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z
  .object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(100),
});

export const downloadLinkSchema = z.object({
  providerName: z.string().min(1).max(60),
  url: z.string().url(),
  fileSize: z.string().max(30).optional().nullable(),
  version: z.string().max(30).optional().nullable(),
  quality: z.string().max(30).optional().nullable(),
  language: z.string().max(30).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(["ACTIVE", "DISABLED", "BROKEN"]).default("ACTIVE"),
  sortOrder: z.number().int().default(0),
});

export const contentSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, hyphenated"),
  description: z.string().min(10),
  shortDescription: z.string().max(300).optional().nullable(),
  type: z.enum([
    "VIDEO",
    "COURSE",
    "TUTORIAL",
    "DOCUMENT",
    "SOFTWARE",
    "AUDIO",
    "IMAGE",
    "ARCHIVE",
  ]),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  posterUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  tagIds: z.array(z.string().cuid()).default([]),
  isFeatured: z.boolean().default(false),
  publishAt: z.string().datetime().optional().nullable(),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  canonicalUrl: z.string().url().optional().nullable(),
  downloadLinks: z.array(downloadLinkSchema).default([]),
});

export const commentSchema = z.object({
  contentId: z.string().cuid(),
  body: z.string().min(1).max(2000),
});

export const reportSchema = z.object({
  contentId: z.string().cuid(),
  reason: z.enum(["BROKEN_LINK", "WRONG_CONTENT", "COPYRIGHT", "SPAM", "OTHER"]),
  message: z.string().max(1000).optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().max(200).optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  tag: z.string().optional(),
  sort: z.enum(["newest", "popular", "downloads", "title"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(48).default(24),
});
