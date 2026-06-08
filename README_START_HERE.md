# Bluedev Marketplace Keyword Radar — Codex Development Package

Bu paket, masaüstünde unzip edildikten sonra doğrudan Codex'e verilecek şekilde hazırlanmıştır.

## Hızlı kullanım

1. ZIP dosyasını masaüstüne çıkarın.
2. Klasörü açın: `bluedev-marketplace-keyword-radar`
3. Codex'e ilk olarak şu dosyanın içeriğini verin: `CODEX_MASTER_PROMPT.md`
4. Sonrasında sırayla `codex-tasks/` klasöründeki task dosyalarını uygulatın.

## Ürün hedefi

Amazon.com.tr, Trendyol, Hepsiburada ve n11 için çalışan; kullanıcı tetiklemeli autocomplete keyword önerilerini toplayan, normalize eden, karşılaştıran, CSV/XLSX export veren ve AI-ready analiz katmanı olan bir Chrome Extension + hafif backend MVP geliştirmek.

## Kritik prensip

Bu ürün aggressive scraping veya private seller data toplama ürünü değildir. MVP, kullanıcının tarayıcıda zaten görebildiği autocomplete önerilerini kullanıcı aksiyonu ile yakalar, işler ve export eder.

## Definition of Done kısa özeti

- `pnpm install` çalışmalı.
- `pnpm build` çalışmalı.
- `pnpm test` çalışmalı.
- Chrome Extension unpacked olarak yüklenebilmeli.
- Amazon.com.tr, Trendyol, Hepsiburada, n11 domainleri algılanmalı.
- Keyword expansion, dedupe, normalization, word frequency, CSV/XLSX export çalışmalı.
- Privacy ve permissions dokümanları hazır olmalı.
