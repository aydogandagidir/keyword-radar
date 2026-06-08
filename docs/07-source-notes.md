# Source Notes and Assumptions

## Chrome Extension

The implementation must use Manifest V3. The architecture should use a background service worker rather than legacy background pages.

## Marketplace APIs

The initial product design must not assume that Trendyol, Hepsiburada, n11, or Amazon.com.tr provide a stable public autocomplete keyword API for this product's purpose.

Marketplace seller APIs generally focus on seller operations such as products, catalog, prices, stock, orders, and listing management. Therefore, the MVP should rely on user-triggered browser-side autocomplete capture.

## Privacy assumption

The MVP processes autocomplete suggestions visible to the user in the browser. It must not collect account credentials, seller dashboard information, customer data, order data, or payment data.

## Search volume assumption

Search volume should not be promised as exact in MVP. Any future search volume feature must be labeled as estimated and include confidence scoring.
