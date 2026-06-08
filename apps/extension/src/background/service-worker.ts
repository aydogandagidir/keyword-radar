import type { ExtensionMessage } from "../messaging/types";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    keywordRadarInstalledAt: new Date().toISOString()
  });
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message?.type === "KEYWORD_RADAR_PING") {
    sendResponse({ ok: true });
    return false;
  }

  return false;
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) {
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "KEYWORD_RADAR_TOGGLE_PANEL" } satisfies ExtensionMessage, () => {
    // A missing receiver simply means the current tab is not a supported marketplace page.
    void chrome.runtime.lastError;
  });
});
