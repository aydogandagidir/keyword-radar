# Chrome Permissions Explanation

## Required permissions

### activeTab

Used to allow the extension to interact with the current supported marketplace tab after the user opens it.

### storage

Used to store local extension preferences and optional recent keyword results.

### scripting

Use only if needed for injection. If the content script is statically declared in manifest, avoid this permission.

## Host permissions

The extension should only request access to:

- `https://www.amazon.com.tr/*`
- `https://www.trendyol.com/*`
- `https://www.n11.com/*`

Hepsiburada is not requested in the first Chrome Web Store package. Add it only after its live autocomplete surface is reliable without broader permissions.

## Privacy boundary

The extension must not access:

- account credentials
- seller panel private data
- customer data
- order data
- payment information
