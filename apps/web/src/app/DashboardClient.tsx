"use client";

import { useMemo, useState } from "react";
import { calculateWordFrequency, compareMarketplaceCoverage } from "@bluedev/core";
import { analyzeListingGap } from "@bluedev/scoring";
import type { KeywordProject, KeywordRun, ListingGapAnalysis } from "@bluedev/shared-types";

export function DashboardClient({ projects, runs }: { projects: KeywordProject[]; runs: KeywordRun[] }) {
  const [selectedRunId, setSelectedRunId] = useState(runs[0]?.id ?? "");
  const [listingTitle, setListingTitle] = useState("");
  const [listingDescription, setListingDescription] = useState("");
  const [gapAnalysis, setGapAnalysis] = useState<ListingGapAnalysis | null>(null);
  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? runs[0];
  const wordFrequency = useMemo(() => calculateWordFrequency(selectedRun?.suggestions ?? []).slice(0, 12), [selectedRun]);
  const coverage = useMemo(() => compareMarketplaceCoverage(selectedRun?.suggestions ?? []).slice(0, 12), [selectedRun]);

  function analyzeSelectedRun() {
    if (!selectedRun || !listingTitle.trim() || selectedRun.suggestions.length === 0) {
      return;
    }
    setGapAnalysis(
      analyzeListingGap(
        {
          marketplace: selectedRun.marketplaces[0] ?? "trendyol",
          title: listingTitle,
          description: listingDescription
        },
        selectedRun.suggestions
      )
    );
  }

  function exportSelectedRunCsv() {
    if (!selectedRun) {
      return;
    }
    const header = ["keyword", "normalized_keyword", "marketplace", "hits", "opportunity_score", "collected_at"];
    const rows = selectedRun.suggestions.map((suggestion) =>
      [
        suggestion.keyword,
        suggestion.normalizedKeyword,
        suggestion.marketplace,
        suggestion.occurrenceCount ?? 1,
        suggestion.score?.opportunityScore ?? "",
        suggestion.collectedAt
      ]
        .map(csvEscape)
        .join(",")
    );
    const blob = new Blob(["\uFEFF", [header.join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "keyword-radar-dashboard-export.csv";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p>Keyword Radar</p>
          <h1>Marketplace research workspace</h1>
        </div>
        <div className="dashboard-metrics">
          <span>{projects.length} projects</span>
          <span>{runs.length} runs</span>
          <span>{runs.reduce((sum, run) => sum + run.suggestions.length, 0)} keywords</span>
        </div>
      </header>

      <section className="dashboard-grid">
        <aside className="sidebar">
          <h2>Projects</h2>
          {projects.length ? projects.map((project) => <p key={project.id}>{project.name}</p>) : <p>No saved projects yet</p>}
          <h2>Runs</h2>
          <div className="run-list">
            {runs.length ? (
              runs.map((run) => (
                <button key={run.id} type="button" className={run.id === selectedRun?.id ? "active" : ""} onClick={() => setSelectedRunId(run.id)}>
                  <strong>{run.seedKeyword}</strong>
                  <span>{run.marketplaces.join(", ")} | {run.suggestions.length} keywords</span>
                </button>
              ))
            ) : (
              <p>Save a run from the extension to populate the dashboard.</p>
            )}
          </div>
        </aside>

        <section className="workspace">
          {selectedRun ? (
            <>
              <div className="section-header">
                <div>
                  <p>Selected run</p>
                  <h2>{selectedRun.seedKeyword}</h2>
                </div>
                <button type="button" onClick={exportSelectedRunCsv} disabled={selectedRun.suggestions.length === 0}>
                  Export CSV
                </button>
              </div>

              <div className="insight-grid">
                <div>
                  <h3>Word Frequency</h3>
                  {wordFrequency.length ? wordFrequency.map((item) => <p key={item.word}>{item.word}: {item.count}</p>) : <p>No words yet</p>}
                </div>
                <div>
                  <h3>Marketplace Coverage</h3>
                  {coverage.length ? coverage.map((item) => <p key={item.normalizedKeyword}>{item.normalizedKeyword}: {item.marketplaces.join(", ")}</p>) : <p>No coverage yet</p>}
                </div>
              </div>

              <div className="gap-panel">
                <h3>Listing Gap Analyzer</h3>
                <input value={listingTitle} onChange={(event) => setListingTitle(event.target.value)} placeholder="Product title" />
                <textarea value={listingDescription} onChange={(event) => setListingDescription(event.target.value)} placeholder="Description or bullet points" />
                <button type="button" onClick={analyzeSelectedRun} disabled={!listingTitle.trim() || selectedRun.suggestions.length === 0}>
                  Analyze listing
                </button>
                <div className="gap-results">
                  {gapAnalysis ? (
                    gapAnalysis.missingHighValueKeywords.length ? (
                      gapAnalysis.missingHighValueKeywords.slice(0, 8).map((item) => (
                        <p key={item.normalizedKeyword}>
                          <strong>{item.keyword}</strong>
                          <span>{item.reason}</span>
                        </p>
                      ))
                    ) : (
                      <p>No high-value gaps found.</p>
                    )
                  ) : (
                    <p>Enter listing copy to compare it with saved keyword signals.</p>
                  )}
                </div>
              </div>

              <div className="keyword-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Keyword</th>
                      <th>Marketplace</th>
                      <th>Hits</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRun.suggestions.slice(0, 200).map((suggestion) => (
                      <tr key={`${suggestion.marketplace}-${suggestion.normalizedKeyword}`}>
                        <td>
                          <strong>{suggestion.keyword}</strong>
                          <small>{suggestion.normalizedKeyword}</small>
                        </td>
                        <td>{suggestion.marketplace}</td>
                        <td>{suggestion.occurrenceCount ?? 1}</td>
                        <td>{suggestion.score?.opportunityScore ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>No saved runs</h2>
              <p>Open a supported marketplace, collect keywords, then use Save run in the extension panel.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function csvEscape(value: unknown): string {
  const raw = value == null ? "" : String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, "\"\"")}"`;
  }
  return raw;
}
