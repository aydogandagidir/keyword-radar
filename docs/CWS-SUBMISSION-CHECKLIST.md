# Chrome Web Store Submission Checklist — Keyword Radar

A step-by-step guide for submitting the extension. Tick each box before clicking "Submit for review".

## Phase 0 — Developer account
- [ ] Chrome Web Store developer account active (one-time $5 fee paid).
- [ ] Identity / contact email verified.

## Phase 1 — Build the package
- [ ] `pnpm install && pnpm build && pnpm test` all pass.
- [ ] `pnpm package:extension` produces `release/bluedev-marketplace-keyword-radar-cws-0.1.0.zip`.
- [ ] Manifest scope check passed (the packaging script rejects any non-TR host / `localhost` / global fragment).
- [ ] Loaded `apps/extension/dist` unpacked and walked through `docs/08-release-checklist.md` once.

## Phase 2 — Listing (per language: English + Türkçe)
For each locale, from `docs/store-listing-en.md` / `docs/store-listing-tr.md`:
- [ ] Title (≤45 chars)
- [ ] Short description (≤132 chars)
- [ ] Full description
- [ ] Category: **Productivity**
- [ ] Language added (English, Türkçe)

## Phase 3 — Media (per locale)
- [ ] 3–5 screenshots, **1280×800** PNG — from `docs/screenshots/{en,tr}/` (see `scripts/take-screenshots.mjs`).
- [ ] Small promo tile **440×280** (required) — `marketing/promotional/`.
- [ ] Large tile **920×680** (recommended), Marquee **1400×560** (optional).
- [ ] (Optional) demo video, unlisted on YouTube.

## Phase 4 — Privacy
- [ ] Privacy policy URL is **live and public** (e.g. `https://bluedev.dev/keyword-radar/privacy`; content from `PRIVACY.md` / `landing/privacy.html`).
- [ ] Single-purpose statement pasted (from the listing docs).

## Phase 5 — Permissions & data
- [ ] Permission justifications filled for `activeTab`, `storage`, and the three host permissions (from `docs/permission-justifications.md`).
- [ ] Data-usage disclosure completed: reads website content, processed locally, **no transmission**.
- [ ] Three data certifications checked (no selling, no unrelated use, no creditworthiness).

## Phase 6 — Distribution
- [ ] Visibility: **Public**
- [ ] Regions: **All**
- [ ] Pricing: **Free**

## Phase 7 — Submit
- [ ] Submit for review (first review typically 3–7 business days).
- [ ] If rejected, record the violation code + fix in `CHANGELOG.md` (per Bluedev convention), amend, resubmit.

## Post-approval
- [ ] Tag the release on GitHub (`v0.1.0`), keep `manifest.json` + root `package.json` + `CHANGELOG.md` versions in sync.
- [ ] Add the CWS listing URL to the README and landing page.
