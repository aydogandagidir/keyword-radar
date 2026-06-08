type TrendyolBridgeRequest = {
  source: "bluedev-keyword-radar";
  type: "TRENDYOL_AUTOCOMPLETE_REQUEST";
  requestId: string;
  query: string;
};

const bridgeStateKey = "__bluedevKeywordRadarTrendyolBridge";
const requestSource = "bluedev-keyword-radar";
const responseSource = "bluedev-keyword-radar-page";
const requestType = "TRENDYOL_AUTOCOMPLETE_REQUEST";
const responseType = "TRENDYOL_AUTOCOMPLETE_RESPONSE";

function buildTrendyolSuggestionUrl(query: string): string {
  const url = new URL("https://apigw.trendyol.com/discovery-sfint-search-service/api/suggestions/");
  url.searchParams.set("query", query);
  url.searchParams.set("searchV2Enabled", "true");
  url.searchParams.set("lastSearchTerms", "");
  url.searchParams.set("channelId", "1");
  url.searchParams.set("storefrontId", "1");
  url.searchParams.set("culture", "tr-TR");
  url.searchParams.set("countryCode", "TR");
  url.searchParams.set("language", "tr");
  return url.toString();
}

async function fetchSuggestions(query: string): Promise<unknown> {
  const response = await fetch(buildTrendyolSuggestionUrl(query), {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Trendyol autocomplete failed with ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

function isBridgeRequest(value: unknown): value is TrendyolBridgeRequest {
  const message = value as Partial<TrendyolBridgeRequest> | null;
  return (
    message?.source === requestSource &&
    message.type === requestType &&
    typeof message.requestId === "string" &&
    typeof message.query === "string"
  );
}

const pageWindow = window as typeof window & Record<string, unknown>;

if (!pageWindow[bridgeStateKey]) {
  pageWindow[bridgeStateKey] = true;

  window.addEventListener("message", (event) => {
    if (event.source !== window || !isBridgeRequest(event.data)) {
      return;
    }

    const { requestId, query } = event.data;
    void fetchSuggestions(query)
      .then((payload) => {
        window.postMessage(
          {
            source: responseSource,
            type: responseType,
            requestId,
            ok: true,
            payload
          },
          window.location.origin
        );
      })
      .catch((error: unknown) => {
        window.postMessage(
          {
            source: responseSource,
            type: responseType,
            requestId,
            ok: false,
            error: error instanceof Error ? error.message : "Trendyol autocomplete request failed."
          },
          window.location.origin
        );
      });
  });
}
