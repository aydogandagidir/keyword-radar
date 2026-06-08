import { describe, expect, it } from "vitest";
import { alibabaAdapter, amazonGlobalAdapter, amazonTrAdapter, getAdapterForUrl, getCwsAdapterForUrl, hepsiburadaAdapter, n11Adapter, trendyolAdapter } from "@bluedev/adapters";

describe("marketplace adapters", () => {
  it("routes supported marketplace URLs", () => {
    expect(getAdapterForUrl("https://www.amazon.com.tr/s?k=kulaklik")?.id).toBe("amazon-tr");
    expect(getAdapterForUrl("https://www.trendyol.com/sr?q=elbise")?.id).toBe("trendyol");
    expect(getAdapterForUrl("https://www.hepsiburada.com/ara?q=telefon")?.id).toBe("hepsiburada");
    expect(getAdapterForUrl("https://www.n11.com/arama?q=kitap")?.id).toBe("n11");
    expect(getAdapterForUrl("https://www.amazon.com/s?k=headphones")?.id).toBe("amazon-global");
    expect(getAdapterForUrl("https://alibaba.com/trade/search?SearchText=bag")?.id).toBe("alibaba");
    expect(getAdapterForUrl("https://www.alibaba.com/trade/search?SearchText=bag")?.id).toBe("alibaba");
    expect(getAdapterForUrl("https://turkish.alibaba.com/trade/search?SearchText=canta")?.id).toBe("alibaba");
    expect(getAdapterForUrl("https://www.aliexpress.com/wholesale?SearchText=bag")?.id).toBe("aliexpress");
    expect(getAdapterForUrl("https://www.ebay.com/sch/i.html?_nkw=bag")?.id).toBe("ebay");
    expect(getAdapterForUrl("https://www.etsy.com/search?q=bag")?.id).toBe("etsy");
    expect(getAdapterForUrl("https://www.temu.com/search_result.html?search_key=bag")?.id).toBe("temu");
    expect(getAdapterForUrl("https://www.walmart.com/search?q=bag")?.id).toBe("walmart");
    expect(getAdapterForUrl("https://example.com")).toBeUndefined();
  });

  it("limits Chrome Web Store routing to the first Turkish marketplace release scope", () => {
    expect(getCwsAdapterForUrl("https://www.amazon.com.tr/s?k=kulaklik")?.id).toBe("amazon-tr");
    expect(getCwsAdapterForUrl("https://www.trendyol.com/sr?q=elbise")?.id).toBe("trendyol");
    expect(getCwsAdapterForUrl("https://www.n11.com/arama?q=kitap")?.id).toBe("n11");
    expect(getCwsAdapterForUrl("https://www.hepsiburada.com/ara?q=telefon")).toBeUndefined();
    expect(getCwsAdapterForUrl("https://www.amazon.com/s?k=headphones")).toBeUndefined();
    expect(getCwsAdapterForUrl("https://www.alibaba.com/trade/search?SearchText=bag")).toBeUndefined();
  });

  it("finds search inputs with fallback selectors", () => {
    document.body.innerHTML = "<form><input name='field-keywords' value='' /></form>";
    expect(amazonTrAdapter.findSearchInput(document)).toBeInstanceOf(HTMLInputElement);

    document.body.innerHTML = "<input placeholder='Aradiginiz urun' />";
    expect(trendyolAdapter.findSearchInput(document)).toBeInstanceOf(HTMLInputElement);

    document.body.innerHTML = "<form role='search'><input type='search' /></form>";
    expect(amazonGlobalAdapter.findSearchInput(document)).toBeInstanceOf(HTMLInputElement);

    document.body.innerHTML = "<header><input placeholder='Urun, kategori veya marka ara' autocomplete='off' /></header>";
    expect(n11Adapter.findSearchInput(document)).toBeInstanceOf(HTMLInputElement);

    document.body.innerHTML = "<header><input placeholder='Ürün, kategori veya marka ara' autocomplete='off' /></header>";
    expect(hepsiburadaAdapter.findSearchInput(document)).toBeInstanceOf(HTMLInputElement);

    document.body.innerHTML = "<form action='/trade/search'><input placeholder='Search products' name='SearchText' /></form>";
    expect(alibabaAdapter.findSearchInput(document)).toBeInstanceOf(HTMLInputElement);

    document.body.innerHTML = "<form action='/trade/search'><textarea placeholder='What are you looking for?' name='SearchText'></textarea></form>";
    expect(alibabaAdapter.findSearchInput(document)).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("finds custom editable searchbox controls", () => {
    document.body.innerHTML = `
      <form role="search">
        <div role="searchbox" contenteditable="true" aria-label="Search products"></div>
      </form>
    `;

    expect(alibabaAdapter.findSearchInput(document)).toBeInstanceOf(HTMLElement);
  });

  it("ignores the extension panel shadow root while scanning marketplace inputs", () => {
    document.body.innerHTML = "<main></main>";
    const host = document.createElement("div");
    host.id = "bluedev-keyword-radar-host";
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = "<input name='search' placeholder='Search products' />";
    document.body.append(host);

    expect(n11Adapter.findSearchInput(document)).toBeNull();
  });

  it("does not pick login or newsletter inputs as search fallbacks", () => {
    document.body.innerHTML = `
      <main>
        <input placeholder="E-mail address" type="email" />
        <input placeholder="Password" type="password" />
        <input placeholder="Newsletter email" />
      </main>
    `;

    expect(n11Adapter.findSearchInput(document)).toBeNull();
  });

  it("extracts visible suggestions and returns empty safely", async () => {
    document.body.innerHTML = "<ul class='autoComplete'><li>Bluetooth Kulaklik</li><li>Bluetooth Kulaklik</li></ul>";
    const suggestions = await n11Adapter.extractSuggestions(document);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.normalizedKeyword).toBe("bluetooth kulaklik");

    document.body.innerHTML = "<main></main>";
    await expect(n11Adapter.extractSuggestions(document)).resolves.toEqual([]);
  });

  it("extracts n11 modal autocomplete chips", async () => {
    document.body.innerHTML = `
      <div class="search-modal">
        <input placeholder="Urun, kategori, marka ara" />
        <div class="search-suggestions">
          <button type="button">telefon kilifi</button>
          <a href="/arama?q=cep%20telefonu">cep telefonu</a>
          <button type="button">telefon kilifi</button>
        </div>
      </div>
    `;

    const suggestions = await n11Adapter.extractSuggestions(document);
    expect(suggestions.map((suggestion) => suggestion.normalizedKeyword).sort()).toEqual(["cep telefonu", "telefon kilifi"]);
  });

  it("ignores Hepsiburada store rows inside autocomplete overlays", async () => {
    document.body.innerHTML = `
      <div>
        <input placeholder="Ara" />
        <ul>
          <li data-test-id="suggestion">penguen celik termos</li>
          <li data-test-id="suggestion">KALE TERMOSMağaza</li>
          <li data-test-id="suggestion">KALE TERMOS Mağaza</li>
        </ul>
      </div>
    `;

    const suggestions = await hepsiburadaAdapter.extractSuggestions(document);
    expect(suggestions.map((suggestion) => suggestion.normalizedKeyword)).toEqual(["penguen celik termos"]);
  });

  it("extracts current Hepsiburada autocomplete link rows", async () => {
    document.body.innerHTML = `
      <div>
        <input placeholder="Ara" />
        <a href="/ara?q=celik%20termos">çelik termos</a>
        <a href="/ara?q=penguen%20celik%20termos">penguen çelik termos</a>
        <a href="/ara?q=karaca%20celik%20termos">karaca çelik termos</a>
      </div>
    `;

    const suggestions = await hepsiburadaAdapter.extractSuggestions(document);
    expect(suggestions.map((suggestion) => suggestion.normalizedKeyword)).toEqual(["celik termos", "penguen celik termos", "karaca celik termos"]);
  });

  it("supports generic international marketplace autocomplete markup", async () => {
    document.body.innerHTML = `
      <form role="search"><input type="search" /></form>
      <ul role="listbox">
        <li role="option">leather travel bag</li>
        <li role="option">leather travel bag</li>
        <li role="option">Alibaba.com</li>
      </ul>
    `;

    const suggestions = await alibabaAdapter.extractSuggestions(document);
    expect(suggestions.map((suggestion) => suggestion.normalizedKeyword)).toEqual(["leather travel bag"]);
  });

  it("extracts Alibaba search suggestion variants", async () => {
    document.body.innerHTML = `
      <div class="searchbar">
        <input name="SearchText" placeholder="Search products" />
        <div class="next-suggest-menu">
          <a>phone case wholesale</a>
          <button type="button">leather bag supplier</button>
          <a>Alibaba.com</a>
        </div>
      </div>
    `;

    const suggestions = await alibabaAdapter.extractSuggestions(document);
    expect(suggestions.map((suggestion) => suggestion.normalizedKeyword).sort()).toEqual(["leather bag supplier", "phone case wholesale"]);
  });

  it("extracts Alibaba current header autocomplete items", async () => {
    document.body.innerHTML = `
      <div class="home-search-online">
        <input name="SearchText" placeholder="Search products" />
        <div class="ife-header-search-bar-popup-wrap">
          <a class="item association-item"><span>çanta wholesale</span></a>
          <a class="item brand-item"><span>leather bag supplier</span></a>
          <a class="item">Alibaba.com</a>
        </div>
      </div>
    `;

    const suggestions = await alibabaAdapter.extractSuggestions(document);
    expect(suggestions.map((suggestion) => suggestion.normalizedKeyword).sort()).toEqual(["canta wholesale", "leather bag supplier"]);
  });

  it("does not treat Trendyol search controls or marketplace links as keyword suggestions", async () => {
    document.body.innerHTML = `
      <div data-testid="suggestion"><input data-testid="suggestion" value="kulaklik" /></div>
      <ul role="listbox">
        <li role="option">kablosuz kulaklik</li>
        <li role="option">Alibaba.com</li>
      </ul>
    `;

    const suggestions = await trendyolAdapter.extractSuggestions(document);
    expect(suggestions.map((suggestion) => suggestion.normalizedKeyword)).toEqual(["kablosuz kulaklik"]);
  });

  it("keeps Trendyol collection DOM-only to avoid extension CORS errors", () => {
    expect(trendyolAdapter.fetchAutocompleteSuggestions).toBeUndefined();
  });
});
