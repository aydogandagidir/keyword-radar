import { z } from "zod";

export const marketplaceIdSchema = z.enum([
  "amazon-tr",
  "amazon-global",
  "trendyol",
  "hepsiburada",
  "n11",
  "alibaba",
  "aliexpress",
  "ebay",
  "etsy",
  "temu",
  "walmart"
]);
export const expansionModeSchema = z.enum(["original", "suffix-alpha", "prefix-alpha", "suffix-numeric"]);

export const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional()
});

export const createRunSchema = z.object({
  projectId: z.string().optional(),
  seedKeyword: z.string().min(1).max(120),
  marketplaces: z.array(marketplaceIdSchema).min(1),
  expansionModes: z.array(expansionModeSchema).min(1)
});

export const keywordSuggestionSchema = z.object({
  keyword: z.string().min(1),
  normalizedKeyword: z.string().min(1),
  marketplace: marketplaceIdSchema,
  source: z.string().min(1),
  position: z.number().int().positive(),
  bestPosition: z.number().int().positive().optional(),
  occurrenceCount: z.number().int().positive().optional(),
  expansionCount: z.number().int().nonnegative().optional(),
  expansions: z.array(z.string().min(1)).optional(),
  expansion: z.string().optional(),
  collectedAt: z.string().datetime(),
  score: z
    .object({
      frequencyScore: z.number().optional(),
      longTailScore: z.number().optional(),
      marketplaceCoverageScore: z.number().optional(),
      confidenceScore: z.number().optional(),
      opportunityScore: z.number().optional()
    })
    .optional()
});

export const bulkKeywordsSchema = z.object({
  runId: z.string().min(1),
  suggestions: z.array(keywordSuggestionSchema).max(1000)
});

export const listingContentSchema = z.object({
  marketplace: marketplaceIdSchema,
  title: z.string().min(1).max(240),
  description: z.string().max(5000).optional(),
  bullets: z.array(z.string().min(1).max(500)).max(12).optional()
});

export const listingGapSchema = z.object({
  content: listingContentSchema,
  suggestions: z.array(keywordSuggestionSchema).min(1).max(1000)
});
