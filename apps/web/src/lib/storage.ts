import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { KeywordProject, KeywordRun, KeywordSuggestion } from "@bluedev/shared-types";

type StoreFile = {
  projects: KeywordProject[];
  runs: KeywordRun[];
};

type StoreState = {
  projects: Map<string, KeywordProject>;
  runs: Map<string, KeywordRun>;
};

const defaultStorePath = join(process.cwd(), "apps", "web", ".data", "keyword-radar.json");

declare global {
  var __bluedevKeywordRadarStore: { path: string; store: JsonKeywordRadarStore } | undefined;
}

export class JsonKeywordRadarStore {
  private readonly state: StoreState;

  constructor(private readonly filePath: string) {
    this.state = this.load();
  }

  listProjects(): KeywordProject[] {
    return Array.from(this.state.projects.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  createProject(input: { name: string; description?: string }): KeywordProject {
    const now = new Date().toISOString();
    const project: KeywordProject = {
      id: createId("project"),
      name: input.name,
      description: input.description,
      createdAt: now,
      updatedAt: now
    };
    this.state.projects.set(project.id, project);
    this.persist();
    return project;
  }

  listRuns(options: { projectId?: string; limit?: number } = {}): KeywordRun[] {
    const limit = Math.max(1, Math.min(options.limit ?? 50, 200));
    return Array.from(this.state.runs.values())
      .filter((run) => !options.projectId || run.projectId === options.projectId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit);
  }

  createRun(input: Omit<KeywordRun, "id" | "startedAt" | "status" | "suggestions">): KeywordRun {
    const run: KeywordRun = {
      id: createId("run"),
      startedAt: new Date().toISOString(),
      status: "queued",
      suggestions: [],
      ...input
    };
    this.state.runs.set(run.id, run);
    this.persist();
    return run;
  }

  getRun(id: string): KeywordRun | undefined {
    return this.state.runs.get(id);
  }

  addKeywords(runId: string, suggestions: KeywordSuggestion[]): KeywordRun | undefined {
    const run = this.state.runs.get(runId);
    if (!run) {
      return undefined;
    }

    const updated: KeywordRun = {
      ...run,
      status: "completed",
      completedAt: new Date().toISOString(),
      suggestions: [...run.suggestions, ...suggestions]
    };
    this.state.runs.set(runId, updated);
    this.persist();
    return updated;
  }

  private load(): StoreState {
    if (!existsSync(this.filePath)) {
      return { projects: new Map(), runs: new Map() };
    }

    try {
      const parsed = JSON.parse(readFileSync(this.filePath, "utf8")) as Partial<StoreFile>;
      return {
        projects: new Map((parsed.projects ?? []).map((project) => [project.id, project])),
        runs: new Map((parsed.runs ?? []).map((run) => [run.id, run]))
      };
    } catch {
      return { projects: new Map(), runs: new Map() };
    }
  }

  private persist(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    const payload: StoreFile = {
      projects: Array.from(this.state.projects.values()),
      runs: Array.from(this.state.runs.values())
    };
    const tempPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    writeFileSync(tempPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    renameSync(tempPath, this.filePath);
  }
}

function getStore(): JsonKeywordRadarStore {
  const filePath = process.env.KEYWORD_RADAR_STORE_PATH || defaultStorePath;
  if (!globalThis.__bluedevKeywordRadarStore || globalThis.__bluedevKeywordRadarStore.path !== filePath) {
    globalThis.__bluedevKeywordRadarStore = {
      path: filePath,
      store: new JsonKeywordRadarStore(filePath)
    };
  }
  return globalThis.__bluedevKeywordRadarStore.store;
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const projectRepository = {
  list(): KeywordProject[] {
    return getStore().listProjects();
  },
  create(input: { name: string; description?: string }): KeywordProject {
    return getStore().createProject(input);
  }
};

export const runRepository = {
  list(options: { projectId?: string; limit?: number } = {}): KeywordRun[] {
    return getStore().listRuns(options);
  },
  create(input: Omit<KeywordRun, "id" | "startedAt" | "status" | "suggestions">): KeywordRun {
    return getStore().createRun(input);
  },
  get(id: string): KeywordRun | undefined {
    return getStore().getRun(id);
  },
  addKeywords(runId: string, suggestions: KeywordSuggestion[]): KeywordRun | undefined {
    return getStore().addKeywords(runId, suggestions);
  }
};
