import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { bulkKeywordsSchema, createProjectSchema, createRunSchema, listingGapSchema } from "../apps/web/src/lib/schemas";
import { JsonKeywordRadarStore, projectRepository, runRepository } from "../apps/web/src/lib/storage";

describe("backend skeleton", () => {
  it("validates project payloads", () => {
    expect(createProjectSchema.safeParse({ name: "Demo" }).success).toBe(true);
    expect(createProjectSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("creates projects and runs in the repository abstraction", () => {
    process.env.KEYWORD_RADAR_STORE_PATH = tempStorePath();
    const project = projectRepository.create({ name: "Agency account" });
    const run = runRepository.create({
      projectId: project.id,
      seedKeyword: "kulaklık",
      marketplaces: ["amazon-tr"],
      expansionModes: ["original"]
    });

    expect(runRepository.get(run.id)?.seedKeyword).toBe("kulaklık");
  });

  it("validates bulk keyword payloads", () => {
    process.env.KEYWORD_RADAR_STORE_PATH = tempStorePath();
    const parsedRun = createRunSchema.parse({
      seedKeyword: "termos",
      marketplaces: ["n11", "alibaba"],
      expansionModes: ["original"]
    });
    const run = runRepository.create(parsedRun);
    const payload = {
      runId: run.id,
      suggestions: [
        {
          keyword: "çelik termos",
          normalizedKeyword: "celik termos",
          marketplace: "alibaba",
          source: "alibaba-autocomplete",
          position: 1,
          bestPosition: 1,
          occurrenceCount: 2,
          expansionCount: 2,
          expansions: ["termos", "termos c"],
          collectedAt: "2026-05-06T12:00:00.000Z"
        }
      ]
    };
    const parsedPayload = bulkKeywordsSchema.parse(payload);
    const updatedRun = runRepository.addKeywords(run.id, parsedPayload.suggestions);
    expect(updatedRun?.suggestions).toHaveLength(1);
    expect(updatedRun?.suggestions[0]?.marketplace).toBe("alibaba");
    expect(updatedRun?.suggestions[0]?.occurrenceCount).toBe(2);
  });

  it("persists projects and runs in a JSON store", () => {
    const path = tempStorePath();
    const firstStore = new JsonKeywordRadarStore(path);
    const project = firstStore.createProject({ name: "TR launch" });
    const run = firstStore.createRun({
      projectId: project.id,
      seedKeyword: "telefon kilifi",
      marketplaces: ["trendyol"],
      expansionModes: ["original"]
    });
    firstStore.addKeywords(run.id, [
      {
        keyword: "telefon kilifi",
        normalizedKeyword: "telefon kilifi",
        marketplace: "trendyol",
        source: "trendyol-autocomplete",
        position: 1,
        collectedAt: "2026-05-06T12:00:00.000Z"
      }
    ]);

    const reloadedStore = new JsonKeywordRadarStore(path);
    expect(reloadedStore.listProjects()[0]?.name).toBe("TR launch");
    expect(reloadedStore.getRun(run.id)?.suggestions).toHaveLength(1);
  });

  it("validates listing gap payloads", () => {
    const payload = {
      content: {
        marketplace: "trendyol",
        title: "Celik termos",
        description: "Sicak soguk matara"
      },
      suggestions: [
        {
          keyword: "celik termos",
          normalizedKeyword: "celik termos",
          marketplace: "trendyol",
          source: "trendyol-autocomplete",
          position: 1,
          collectedAt: "2026-05-06T12:00:00.000Z"
        }
      ]
    };

    expect(listingGapSchema.safeParse(payload).success).toBe(true);
    expect(listingGapSchema.safeParse({ ...payload, suggestions: [] }).success).toBe(false);
  });
});

function tempStorePath(): string {
  const dir = mkdtempSync(join(tmpdir(), "keyword-radar-"));
  process.on("exit", () => rmSync(dir, { recursive: true, force: true }));
  return join(dir, "store.json");
}
