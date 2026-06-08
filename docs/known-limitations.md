# Known Limitations

- Marketplace autocomplete DOM structures can change without notice.
- The MVP captures visible suggestions only and does not use marketplace private APIs.
- Saved runs use Chrome local extension storage, so they are browser-profile local and not team-synced.
- The first Chrome Web Store package supports Amazon.com.tr, Trendyol, and n11 only.
- Hepsiburada support remains in development until its live autocomplete surface can be controlled reliably from a content script without adding risky permissions.
- AI clustering and listing generation are deterministic placeholders.
- Full automated Chrome extension E2E coverage is deferred; a manual smoke checklist is included.
- Suggestion volume is intentionally limited by user-initiated expansion and throttling.
