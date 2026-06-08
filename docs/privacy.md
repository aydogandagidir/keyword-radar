# Privacy

Bluedev Marketplace Keyword Radar is designed to process only keyword data needed for marketplace keyword research.

## Data Processed

- Seed keywords entered by the user.
- Query expansions derived from the seed keyword.
- Autocomplete suggestions visible on supported marketplace pages.
- Saved keyword runs and optional Listing Gap form content stored in Chrome local extension storage.

## Data Not Collected

- No private seller data is collected.
- No account credentials are collected.
- No order, customer, billing, seller panel, or marketplace account data is collected.
- No background crawling is performed.

## Storage

The Chrome Web Store extension stores saved runs in Chrome local extension storage. Users do not need to configure a backend URL, local server, or external account. The extension does not transmit collected keyword data to a Bluedev server.

The optional developer backend in this repository may store projects, runs, and bulk keyword suggestions in `apps/web/.data/keyword-radar.json`, but it is not part of the normal extension workflow or the first CWS user experience.

## AI Providers

The MVP includes deterministic placeholder interfaces for future AI clustering and listing suggestions. It does not call OpenAI or other paid AI providers by default.
