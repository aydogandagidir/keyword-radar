# QA Test Plan

## 1. Automated tests

### Core

Test:
- `normalizeKeyword`
- `generateKeywordExpansions`
- `dedupeKeywords`
- `calculateWordFrequency`
- `compareMarketplaceCoverage`
- scoring functions

### Adapters

Test:
- adapter routing by hostname
- search input fallback selectors using DOM fixtures
- empty suggestion handling

### Export

Test:
- CSV headers
- CSV escaping
- XLSX workbook generation
- Turkish character support

## 2. Manual QA

### Extension load

- Open Chrome Extensions.
- Enable developer mode.
- Load unpacked extension build.
- Confirm no manifest errors.

### Marketplace detection

Test URLs:
- `https://www.amazon.com.tr/`
- `https://www.trendyol.com/`
- `https://www.n11.com/`

Expected:
- Panel appears.
- Correct marketplace name displayed.

### Keyword collection

Seed examples:
- `kablosuz kulaklık`
- `erkek ayakkabı`
- `robot süpürge`
- `laptop standı`

Expected:
- Collection starts.
- Progress updates.
- Suggestions appear or graceful empty state appears.
- Extension does not crash.

### Export

Expected:
- CSV downloads.
- XLSX downloads.
- Turkish characters display correctly.
- Columns are correct.

### Privacy

Verify:
- No seller account pages are required.
- No credential prompts.
- No private customer/order data.
