# Extension UI Smoke Test Placeholder

Full browser extension automation is intentionally deferred for the MVP. Manual smoke coverage:

1. Run `pnpm --filter @bluedev/extension build`.
2. Load `apps/extension/dist` as an unpacked Chrome extension.
3. Open each supported marketplace.
4. Confirm the panel appears only on supported hosts.
5. Collect a small keyword run with a seed such as `kulaklık`.
