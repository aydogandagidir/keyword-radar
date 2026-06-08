import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { getCwsAdapterForUrl } from "@bluedev/adapters";
import { KeywordRadarPanel } from "../panel/KeywordRadarPanel";
import panelCss from "../styles/panel.css?inline";

function ContentApp() {
  const [locationHref, setLocationHref] = useState(window.location.href);
  const adapter = getCwsAdapterForUrl(locationHref);

  useEffect(() => {
    const updateLocation = () => setLocationHref(window.location.href);
    const intervalId = window.setInterval(updateLocation, 1000);
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args);
      updateLocation();
      return result;
    };

    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      updateLocation();
      return result;
    };

    window.addEventListener("popstate", updateLocation);
    window.addEventListener("hashchange", updateLocation);

    return () => {
      window.clearInterval(intervalId);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", updateLocation);
      window.removeEventListener("hashchange", updateLocation);
    };
  }, []);

  return adapter ? <KeywordRadarPanel key={adapter.id} adapter={adapter} /> : null;
}

if (getCwsAdapterForUrl(window.location.href) && !document.getElementById("bluedev-keyword-radar-host")) {
  const host = document.createElement("div");
  host.id = "bluedev-keyword-radar-host";
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  const panelFontUrl = chrome.runtime.getURL("assets/fonts/bluedev-geist-latin-ext.woff2");
  style.textContent = panelCss.replace('local("__BLUDEV_RADAR_FONT_SRC__")', `url("${panelFontUrl}") format("woff2")`);
  const mount = document.createElement("div");
  shadow.append(style, mount);
  document.documentElement.appendChild(host);

  createRoot(mount).render(<ContentApp />);
}
