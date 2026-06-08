import { normalizeKeyword } from "@bluedev/core";
import type { KeywordSuggestion, MarketplaceId, MarketplaceSearchControl } from "@bluedev/shared-types";

const extensionHostId = "bluedev-keyword-radar-host";
const searchControlSelector = "input, textarea, [role='searchbox'], [contenteditable]";

export const commonSearchInputSelectors = [
  "input[type='search']",
  "input[name='q']",
  "input[name='query']",
  "input[name='keyword']",
  "input[name='keywords']",
  "input[name='search']",
  "input[aria-label*='search' i]",
  "input[aria-label*='ara' i]",
  "input[placeholder*='search' i]",
  "input[placeholder*='ara' i]",
  "input[class*='search' i]",
  "input[id*='search' i]",
  "textarea[aria-label*='search' i]",
  "textarea[placeholder*='search' i]",
  "textarea[class*='search' i]",
  "textarea[id*='search' i]",
  "[role='searchbox']",
  "[contenteditable][aria-label*='search' i]",
  "[contenteditable][aria-label*='ara' i]",
  "[contenteditable][class*='search' i]",
  "[contenteditable][id*='search' i]",
  "form[role='search'] input[type='text']",
  "form[role='search'] textarea",
  "form[role='search'] [role='searchbox']",
  "form[role='search'] [contenteditable]",
  "form[action*='search' i] input[type='text']",
  "form[action*='search' i] textarea",
  "form[action*='search' i] [role='searchbox']",
  "form[action*='search' i] [contenteditable]"
];

export const commonSuggestionSelectors = [
  "[role='listbox'] [role='option']",
  "[role='option']",
  "[aria-label*='suggest' i]",
  "[class*='suggestion' i] li",
  "[class*='suggestion' i] a",
  "[class*='suggestion' i] button",
  "[class*='suggest' i] li",
  "[class*='suggest' i] a",
  "[class*='autocomplete' i] li",
  "[class*='autocomplete' i] a",
  "[class*='auto-complete' i] li",
  "[class*='autosuggest' i] li",
  "[data-testid*='suggest' i]",
  "[data-test*='suggest' i]",
  "[data-spm*='suggest' i]"
];

export function detectDomain(domains: string[], locationHref?: string): boolean {
  const href = locationHref ?? globalThis.location?.href ?? "";
  try {
    const hostname = new URL(href).hostname.replace(/^www\./, "");
    return domains.some((domain) => hostname === domain.replace(/^www\./, "") || hostname.endsWith(`.${domain.replace(/^www\./, "")}`));
  } catch {
    return false;
  }
}

export function queryInput(root: Document | undefined, selectors: string[]): MarketplaceSearchControl | null {
  const doc = root ?? globalThis.document;
  for (const selector of selectors) {
    const elements = querySelectorAllDeep(doc, selector);
    for (const element of elements) {
      if (isSearchControl(element) && isUsableSearchControl(element)) {
        return element;
      }

      const nestedInput = element instanceof HTMLElement ? querySelectorDeep(element, searchControlSelector) : null;
      if (isSearchControl(nestedInput) && isUsableSearchControl(nestedInput)) {
        return nestedInput;
      }
    }
  }
  return findBestSearchControl(doc);
}

export function extractVisibleSuggestions(
  marketplace: MarketplaceId,
  root: Document | undefined,
  selectors: string[],
  source: string,
  options: { anchor?: HTMLElement | null; maxDistancePx?: number } = {}
): KeywordSuggestion[] {
  const doc = root ?? globalThis.document;
  const seen = new Set<string>();
  const suggestions: KeywordSuggestion[] = [];

  for (const selector of selectors) {
    const elements = querySelectorAllDeep(doc, selector);
    for (const element of elements) {
      const htmlElement = element instanceof HTMLElement ? element : null;
      if (!htmlElement || !isVisible(htmlElement)) {
        continue;
      }
      if (isSearchControlCandidate(htmlElement, options.anchor)) {
        continue;
      }
      if (!isNearAnchor(htmlElement, options.anchor, options.maxDistancePx ?? 520)) {
        continue;
      }
      const keyword = cleanText(htmlElement.textContent ?? "");
      const normalizedKeyword = normalizeKeyword(keyword);
      if (!isPlausibleSuggestion(keyword) || !normalizedKeyword || seen.has(normalizedKeyword)) {
        continue;
      }
      seen.add(normalizedKeyword);
      suggestions.push({
        keyword,
        normalizedKeyword,
        marketplace,
        source,
        position: suggestions.length + 1,
        collectedAt: new Date().toISOString()
      });
    }
  }

  return suggestions;
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isPlausibleSuggestion(value: string): boolean {
  if (!value || value.length > 90) {
    return false;
  }
  if (/https?:\/\//i.test(value) || /\.[a-z]{2,}/i.test(value)) {
    return false;
  }
  if (/^\d+$/.test(value)) {
    return false;
  }
  const normalizedValue = normalizeKeyword(value);
  if (normalizedValue === "magaza" || normalizedValue.endsWith("magaza")) {
    return false;
  }
  const tokenCount = value.split(/\s+/).filter(Boolean).length;
  return tokenCount > 0 && tokenCount <= 8;
}

function isSearchControlCandidate(element: HTMLElement, anchor: HTMLElement | null | undefined): boolean {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    return true;
  }

  if (anchor && (element === anchor || element.contains(anchor))) {
    return true;
  }

  return isEditableSearchControl(element);
}

function findBestSearchControl(doc: Document): MarketplaceSearchControl | null {
  const candidates = querySelectorAllDeep(doc, searchControlSelector).filter((element): element is MarketplaceSearchControl => isSearchControl(element) && isUsableSearchControl(element));
  let bestInput: MarketplaceSearchControl | null = null;
  let bestScore = 0;

  for (const input of candidates) {
    const score = scoreSearchControl(input);
    if (score > bestScore) {
      bestScore = score;
      bestInput = input;
    }
  }

  return bestScore >= 4 ? bestInput : null;
}

function isSearchControl(element: Element | null): element is MarketplaceSearchControl {
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || isEditableSearchControl(element);
}

function isUsableSearchControl(input: MarketplaceSearchControl): boolean {
  if (input instanceof HTMLInputElement) {
    const type = (input.getAttribute("type") || "text").toLowerCase();
    if (["hidden", "password", "checkbox", "radio", "submit", "button", "file", "range", "date", "month", "number"].includes(type)) {
      return false;
    }
  }
  if ((input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) && (input.disabled || input.readOnly)) {
    return false;
  }
  if (input.getAttribute("aria-disabled") === "true" || input.getAttribute("contenteditable") === "false") {
    return false;
  }
  return isVisible(input);
}

function scoreSearchControl(input: MarketplaceSearchControl): number {
  const form = input.closest("form");
  const parent = input.parentElement;
  const haystack = normalizeKeyword(
    [
      getSearchControlType(input),
      getSearchControlName(input),
      input.id,
      input.className,
      getSearchControlPlaceholder(input),
      input.getAttribute("aria-label"),
      input.getAttribute("aria-placeholder"),
      input.getAttribute("role"),
      input.getAttribute("data-testid"),
      input.getAttribute("data-test-id"),
      input.getAttribute("autocomplete"),
      form?.getAttribute("role"),
      form?.getAttribute("action"),
      form?.className,
      form?.id,
      parent?.className,
      parent?.id
    ]
      .filter(Boolean)
      .join(" ")
  );

  let score = 0;

  if (getSearchControlType(input).toLowerCase() === "search") {
    score += 6;
  }
  if (input.getAttribute("role")?.toLowerCase() === "searchbox") {
    score += 6;
  }
  if (form?.getAttribute("role")?.toLowerCase() === "search") {
    score += 6;
  }

  const strongSignals = ["search", "arama", "searchbox", "searchdata", "keyword", "keywords", "query"];
  const marketplaceSignals = ["ara", "urun", "kategori", "category", "marka", "brand", "product", "item"];
  const negativeSignals = ["login", "signin", "sign in", "email", "e mail", "mail", "password", "sifre", "coupon", "kupon", "newsletter", "address", "adres", "phone"];

  for (const signal of strongSignals) {
    if (haystack.includes(normalizeKeyword(signal))) {
      score += 4;
    }
  }
  for (const signal of marketplaceSignals) {
    if (haystack.includes(normalizeKeyword(signal))) {
      score += 2;
    }
  }
  for (const signal of negativeSignals) {
    if (haystack.includes(normalizeKeyword(signal))) {
      score -= 5;
    }
  }

  const rect = input.getBoundingClientRect();
  if (rect.width >= 180) {
    score += 2;
  }
  if (getSearchControlPlaceholder(input).length >= 3) {
    score += 1;
  }
  if (input instanceof HTMLInputElement && input.autocomplete === "off") {
    score += 1;
  }

  return score;
}

function isEditableSearchControl(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  const role = element.getAttribute("role")?.toLowerCase();
  const contentEditable = element.getAttribute("contenteditable");
  return role === "searchbox" || contentEditable === "" || contentEditable === "true" || element.isContentEditable;
}

function getSearchControlType(input: MarketplaceSearchControl): string {
  if (input instanceof HTMLInputElement) {
    return input.getAttribute("type") || input.type || "text";
  }
  if (input instanceof HTMLTextAreaElement) {
    return "textarea";
  }
  return input.getAttribute("role") || (input.getAttribute("contenteditable") !== null ? "contenteditable" : "");
}

function getSearchControlName(input: MarketplaceSearchControl): string {
  if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
    return input.name;
  }
  return input.getAttribute("name") ?? "";
}

function getSearchControlPlaceholder(input: MarketplaceSearchControl): string {
  if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
    return input.placeholder;
  }
  return input.getAttribute("placeholder") ?? input.getAttribute("aria-placeholder") ?? "";
}

function querySelectorDeep(root: Document | ShadowRoot | Element, selector: string): Element | null {
  return querySelectorAllDeep(root, selector)[0] ?? null;
}

function querySelectorAllDeep(root: Document | ShadowRoot | Element, selector: string): Element[] {
  const results: Element[] = [];
  const queue: Array<Document | ShadowRoot | Element> = [root];
  const visited = new Set<Document | ShadowRoot | Element>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }
    visited.add(current);

    try {
      results.push(...Array.from(current.querySelectorAll(selector)));
      const descendants = Array.from(current.querySelectorAll("*"));
      for (const descendant of descendants) {
        if (descendant.id === extensionHostId) {
          continue;
        }
        if (descendant.shadowRoot) {
          queue.push(descendant.shadowRoot);
        }
      }
    } catch {
      // Invalid selectors should fail closed for this traversal.
    }
  }

  return results;
}

function isNearAnchor(element: HTMLElement, anchor: HTMLElement | null | undefined, maxDistancePx: number): boolean {
  if (!anchor) {
    return true;
  }

  const anchorRect = anchor.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  if (isEmptyRect(anchorRect) || isEmptyRect(elementRect)) {
    return true;
  }

  const verticalDistance = Math.min(
    Math.abs(elementRect.top - anchorRect.bottom),
    Math.abs(elementRect.bottom - anchorRect.top)
  );
  const horizontallyOverlaps =
    elementRect.right >= anchorRect.left - 80 &&
    elementRect.left <= anchorRect.right + 80;

  return verticalDistance <= maxDistancePx && horizontallyOverlaps;
}

function isEmptyRect(rect: DOMRect): boolean {
  return rect.width === 0 && rect.height === 0 && rect.top === 0 && rect.left === 0;
}

function isVisible(element: HTMLElement): boolean {
  const style = globalThis.getComputedStyle?.(element);
  if (style && (style.display === "none" || style.visibility === "hidden" || style.opacity === "0")) {
    return false;
  }
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement || isEditableSearchControl(element)) {
    return true;
  }
  return element.offsetParent !== null || element.getClientRects().length > 0 || Boolean(element.textContent?.trim());
}
