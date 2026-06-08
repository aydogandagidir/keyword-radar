# Chrome Permissions

The extension uses minimal Manifest V3 permissions.

## `activeTab`

Used so the extension can operate on the currently active supported marketplace tab after user interaction.

## `storage`

Reserved for lightweight local extension state such as installation metadata or future user preferences. It is not used to store credentials or private marketplace account data.

## Host Permissions

- `https://amazon.com.tr/*`
- `https://www.amazon.com.tr/*`
- `https://trendyol.com/*`
- `https://www.trendyol.com/*`
- `https://n11.com/*`
- `https://www.n11.com/*`

Marketplace hosts are required so the content script can detect supported search pages, populate the visible search input from user-initiated keyword expansion, and capture visible autocomplete suggestions.

Saved runs are written to Chrome local extension storage. No localhost/backend host permission is needed for normal user workflows.

## Not Requested

The MVP does not request cookies, history, webRequest, tabs, or broad all-site access.

The first Chrome Web Store package does not request Hepsiburada, global Amazon, Alibaba, AliExpress, eBay, Etsy, Temu, Walmart, localhost, or all-site permissions.
