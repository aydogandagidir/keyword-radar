# Chrome Web Store Submission Notes

## Release Scope

First public package:

- Amazon.com.tr
- Trendyol
- n11

Do not list Hepsiburada or global marketplaces in the first store listing unless their host permissions are added back in a later release.

## Store Listing Draft

Short description:

Marketplace keyword research panel for Amazon.com.tr, Trendyol, and n11.

Full description:

Bluedev Marketplace Keyword Radar helps Turkish marketplace sellers collect autocomplete keyword suggestions directly from supported marketplace search pages. Open Amazon.com.tr, Trendyol, or n11, enter a seed keyword, collect visible suggestions, compare signals, save the run locally, analyze listing gaps, and export CSV/XLSX files.

The extension is user-initiated. It does not crawl in the background, does not connect to seller accounts, does not collect credentials, and does not transmit keyword runs to a Bluedev server. Saved runs are stored in Chrome local extension storage.

## Permission Justification

- `activeTab`: allows the extension action to interact with the currently active supported marketplace tab after the user invokes it.
- `storage`: stores lightweight local extension state, saved keyword runs, panel preferences, and Listing Gap form content.
- Host permissions: limited to Amazon.com.tr, Trendyol, and n11 so content scripts can display the panel and collect visible autocomplete suggestions on those sites.

## Data Practices

- Data collected: seed keywords, generated query expansions, visible autocomplete suggestions, saved runs, and optional Listing Gap text entered by the user.
- Data not collected: seller credentials, account data, orders, customer data, billing data, cookies, browsing history, or private seller panel information.
- Data transfer: no user keyword data is sent to Bluedev servers in the first CWS release.

## Upload Steps

1. Run `pnpm package:extension`.
2. Upload `release/bluedev-marketplace-keyword-radar-cws-0.1.0.zip` in the Chrome Developer Dashboard.
3. Use the listing text and permission justifications above.
4. Complete privacy/data-use disclosures consistently with `docs/privacy.md`.
5. Submit for review after `pnpm test`, `pnpm build`, and manual extension smoke pass.

Official references:

- Publish flow: https://developer.chrome.com/docs/webstore/publish/
- Permission fields and host permission warnings: https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions
- `activeTab` behavior: https://developer.chrome.com/docs/extensions/develop/concepts/activeTab
