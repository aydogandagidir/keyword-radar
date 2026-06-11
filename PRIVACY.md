# Aydınlatma Metni — Keyword Radar

**Privacy Policy / Aydınlatma Metni**
Son güncelleme: 8 Haziran 2026
Sürüm: 0.1.0

> Bu eklenti topladığı hiçbir veriyi sunucuya göndermez, üçüncü taraflarla paylaşmaz, bulut tabanlı bir hizmet kullanmaz. Tüm işlem cihazınızda yereldir. Eklenti yalnızca, pazaryeri arama kutusunda **zaten görünen** otomatik tamamlama önerilerini işler.

---

## 1. Veri Sorumlusu

Bu eklentiyi geliştiren **Bluedev**, eklentinin sizin cihazınızda çalışan bir yazılım parçası olduğunu ve eklenti kullanımında oluşturulan veriler üzerinde hiçbir sunucu işlemesi gerçekleştirmediğini beyan eder. Eklenti yalnızca sizin etkileşimde bulunduğunuz pazaryeri arama sayfasındaki, herkese açık öneri metinlerine erişir.

İletişim: [bluedev.dev](https://bluedev.dev)

## 2. Hangi Veriler İşlenir?

Sizin tetiklediğiniz "Topla" işlemleri sırasında, desteklenen pazaryeri arama kutusunun **görünür otomatik tamamlama önerileri**:

- Önerilen arama terimleri (kelimeler/ifadeler) ve göründükleri sıra
- Bu terimlerden türetilen normalize/skor verileri (frekans, fırsat skoru, kapsam)
- Sizin girdiğiniz tohum kelime ve (opsiyonel "Listing Gap" formunu kullanırsanız) yapıştırdığınız başlık/açıklama metni

Eklenti **şunlara erişmez**: satıcı paneli verileri, hesap/kimlik bilgileri, sipariş/müşteri/ödeme verileri, çerezler veya oturum jetonları.

Bu veriler yalnızca sizin tarayıcınızın `chrome.storage.local` alanında (kaydettiğiniz çalışmalar) ve indirdiğiniz CSV/XLSX dosyasında saklanır.

## 3. Verilerin Nereye Gönderildiği

**Hiçbir yere.** Eklenti dışarıya hiçbir HTTP isteği yapmaz; harici API çağrısı, analitik veya telemetri yoktur. Bunu `chrome://extensions` → "Keyword Radar" → "Site izinleri" üzerinden doğrulayabilirsiniz. Manifestteki `host_permissions` listesi yalnızca temel işlev içindir:

- `https://amazon.com.tr/*`, `https://www.amazon.com.tr/*`
- `https://trendyol.com/*`, `https://www.trendyol.com/*`
- `https://n11.com/*`, `https://www.n11.com/*`
- `https://hepsiburada.com/*`, `https://www.hepsiburada.com/*`

Başka hiçbir alan adına erişim yoktur. Toplanan veriler cihazınızdan ayrılmaz.

## 4. İzinler

- **`activeTab`** — yalnızca aktif pazaryeri sekmesinde paneli göstermek/etkileşim için.
- **`storage`** — ayarlarınızı ve kaydettiğiniz çalışmaları cihazınızda yerel tutmak için.

Geniş izin (`<all_urls>`, arka plan tarama, sekme geçmişi vb.) **istenmez**.

## 5. KVKK / GDPR ve Pazaryeri Şartları

Eklenti yalnızca herkese açık öneri metinlerini işlediğinden kişisel veri toplamayı amaçlamaz. Yine de eklentiyi kullanırken:

- Etkileşimde bulunduğunuz pazaryerinin **hizmet şartlarına** uymak,
- Topladığınız verileri yalnızca meşru amaçlarla kullanmak

**kullanıcının (sizin) sorumluluğunuzdadır.** Bluedev, kullanıcının yetkisiz veya şartlara aykırı kullanımından sorumlu değildir.

## 6. Varsayılanlar ve Kontrol

- Toplama **yalnızca siz "Topla" butonuna bastığınızda** çalışır — arka planda otomatik tarama yoktur.
- Kaydettiğiniz çalışmalar yalnızca yereldir; istediğiniz zaman silebilirsiniz.
- Verileri silmek için: `chrome://extensions` → "Keyword Radar" → "Detaylar" → "Eklenti verilerini sil". İndirdiğiniz dosyalar bilgisayarınızda kalır; onları kendiniz silmelisiniz.

## 7. Pazaryeri / Marka İlişkisi

Bu eklenti; **Amazon, Trendyol, Hepsiburada veya n11'in resmi ürünü değildir**, onlarla ilişkili, onlar tarafından desteklenen veya sponsorluğu yapılan bir yazılım değildir. "Amazon", "Trendyol", "Hepsiburada" ve "n11" ilgili sahiplerinin tescilli markalarıdır. Eklenti, kullanıcının kendi tarayıcısındaki pazaryeri arama sayfasında çalışır.

## 8. İletişim

Bu metin veya eklenti hakkında soru ve görüşleriniz için: [bluedev.dev](https://bluedev.dev)

---

**English summary**: Keyword Radar processes only the **visible autocomplete suggestions** shown on supported marketplace search pages (Amazon.com.tr, Trendyol, Hepsiburada, n11), **locally on your device**. It makes **no external HTTP requests** — no servers, no analytics, no telemetry — and `host_permissions` are limited to those three marketplaces. It never accesses seller-panel, account, order, customer, or payment data. Saved runs live in `chrome.storage.local`; permissions are limited to `activeTab` and `storage`. Collection runs only when you click "Collect". You are responsible for complying with each marketplace's terms of service. Not affiliated with Amazon, Trendyol, Hepsiburada, or n11.
