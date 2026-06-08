# Release Checklist

## Build

- [ ] `pnpm install`
- [ ] `pnpm build`
- [ ] `pnpm test`
- [ ] Extension production build generated

## Chrome Extension

- [ ] Manifest V3 valid
- [ ] Minimal permissions
- [ ] Host permissions limited to supported marketplaces
- [ ] Background service worker works
- [ ] Content script injects panel correctly
- [ ] Panel does not appear on unsupported sites

## Functional

- [ ] Marketplace detection works
- [ ] Keyword expansion works
- [ ] Collection throttling works
- [ ] Dedupe works
- [ ] Normalization works
- [ ] Word frequency works
- [ ] CSV export works
- [ ] XLSX export works
- [ ] Marketplace comparison works

## Privacy

- [ ] No credentials collected
- [ ] No seller private data collected
- [ ] No order/customer/payment data accessed
- [ ] Privacy doc included
- [ ] Permissions doc included

## Documentation

- [ ] README complete
- [ ] Setup instructions complete
- [ ] Chrome loading instructions complete
- [ ] Known limitations documented
- [ ] QA plan included
