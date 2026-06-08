# Release Checklist

- `pnpm install` succeeds.
- `pnpm build` succeeds.
- `pnpm test` succeeds.
- `pnpm package:extension` creates `release/bluedev-marketplace-keyword-radar-cws-0.1.0.zip`.
- `apps/extension/dist/manifest.json` exists.
- Manifest permissions are limited to `activeTab`, `storage`, and the three first-release Turkish marketplace hosts.
- Extension loads unpacked in Chrome.
- Panel appears on Amazon.com.tr, Trendyol, and n11.
- Panel does not appear on unsupported hosts.
- At least one marketplace can collect visible autocomplete suggestions.
- CSV export opens with Turkish characters.
- XLSX export opens with Turkish characters.
- Backend endpoints validate payloads.
- CWS user flow does not expose backend URL, localhost setup, account connection, or external API key controls.
- Privacy and permissions docs are reviewed.
- No seller credentials or private marketplace account data are collected.
- No remote code execution or remotely hosted extension UI assets are used.
