# Statista AI Form Asistanı

Hastane yöneticisinin bir sistemi (CRM, radyoloji AI, ambient AI, portal, çağrı merkezi modeli…)
tarif ettiği, uygulamanın da **Statista Smart Hospitals Bölüm 5 (AI)** formunda hangi maddeye,
hangi kutuya ve hangi metinle yazılabileceğini söylediği tek sayfalık araç.

## Çalıştırma

```powershell
cd app
node server.mjs
```

→ http://localhost:4173

## Vercel'e yayınlama

1. Vercel'de **Add New → Project** ile `statista-ai-form-asistani` reposunu içe aktarın.
2. **Root Directory: `app`** seçin (zorunlu — fonksiyonlar `app/api/` altında).
   Framework Preset: **Other**; Build / Install komutları boş kalır.
3. **Environment Variables** bölümüne ekleyin:

   | Değişken | Değer |
   |---|---|
   | `OPENROUTER_API_KEY` | OpenRouter anahtarı (`sk-or-v1-…`) |
   | `LLM_ENABLED` | `true` (KVKK gereği dış modele veri gitmesin isteniyorsa `false`) |

4. **Deploy**. `public/` statik olarak, `api/analyze`, `api/enrich`, `api/health` fonksiyon olarak yayınlanır.
   Güvenlik başlıkları `vercel.json`'dan gelir; `.vercelignore` anahtar dosyasını ve geliştirme betiklerini dışarıda bırakır.

Not: İstek sınırı, model önbelleği ve devre kesici bellek içidir; Vercel'de her fonksiyon örneği kendi
sayacını tutar, yani sınır yaklaşık değerdir. Model yanıtı en fazla ~40 sn sürer (`maxDuration: 60`).

## Canlıya alma (kendi sunucunuzda)

Harici paket yok; yalnızca Node.js ≥ 18.17 gerekir (`npm install` adımı yoktur).

1. Sunucuya yalnızca `server.mjs`, `package.json`, `lib/` ve `public/` kopyalanır.
   `.key`, `bench*.mjs`, `check-*.mjs`, `test-*.mjs` kopyalanmaz.
2. Ayarlar ortam değişkenleriyle verilir (`.env.example`'a bakın):

   | Değişken | Varsayılan | Açıklama |
   |---|---|---|
   | `PORT` | `4173` | Dinlenen port |
   | `HOST` | `0.0.0.0` | Yalnızca ters vekil kullanılacaksa `127.0.0.1` yapın |
   | `LLM_ENABLED` | `true` | `false` → açıklamalar hiçbir dış servise gitmez, yalnızca kural motoru |
   | `TRUST_PROXY` | `0` | Ters vekil arkasında `1` (istek sınırı gerçek istemci IP'sini görsün) |
   | `OPENROUTER_API_KEY` | — | `.key` dosyası yerine canlıda bu kullanılmalı |

   Node ≥ 20.6 ile dosyadan okutmak için: `node --env-file=.env server.mjs`
3. Önüne HTTPS sonlandıran bir ters vekil (Nginx / IIS ARR / Caddy) konur; uygulama düz HTTP konuşur
   ve kendi kimlik doğrulaması yoktur — erişimi iç ağ, VPN veya vekildeki kimlik doğrulamasıyla sınırlayın.
4. Süreç bir servis yöneticisiyle çalıştırılır (PM2, systemd, NSSM / Windows Service) ki yeniden
   başlatma ve açılışta otomatik başlama sağlansın.

**KVKK notu:** `LLM_ENABLED=true` iken kullanıcının yazdığı açıklama OpenRouter'ın ücretsiz
modellerine ve Pollinations'a gönderilir; ücretsiz katmanlarda sağlayıcılar istemleri kaydedebilir.
Açıklamalara hasta/personel bilgisi yazılmamalı ya da model katmanı kapatılmalıdır.

**Yerleşik korumalar:** IP başına istek sınırı (analiz 60/dk, model 10/dk), güvenlik başlıkları (CSP,
nosniff, frame engelleme), yalnızca `public/` içindeki düz dosyaların sunulması, her istekte hata
yakalama (tek bir hatalı istek süreci düşürmez).

API anahtarı `app/.key` dosyasında (OpenRouter). Anahtar yoksa da çalışır, sadece kural moduna düşer.

## Mimari — neden iki katman

Ücretsiz modeller tek başına yönlendirme için güvenilir değil: testte aynı sistem için
`5.3.2`, `5.7.1`, `5.5.2` gibi farklı maddeler önerdiler; bazıları boş yanıt döndürdü,
bazıları kotaya takıldı. Bu yüzden karar ile metin ayrıldı:

| Katman | Ne yapar | Neden |
|---|---|---|
| `lib/rules.mjs` | Madde seçimi, kutu işaretleme, karar (yazılabilir / koşullu / yazılmamalı), risk kuralları | Deterministik. Aynı girdi her zaman aynı maddeyi verir. |
| `lib/llm.mjs` | Gerekçe, İngilizce form metni, netleştirme sorusu | Dil üretimi. Yönlendirmeyi değiştiremez, sadece metni yazar. |

Model çağrısı başarısız olursa sonuç yine üretilir ve "kural motoru" olarak işaretlenir —
kullanıcı hiçbir zaman boş ekranla kalmaz.

## Model zinciri (hepsi ücretsiz)

1. `cohere/north-mini-code:free` — en hızlı, JSON disiplini en iyi
2. `poolside/laguna-s-2.1:free` — yedek
3. `nvidia/nemotron-3-ultra-550b-a55b:free` — yedek
4. `dots-studio/dots-3-note-preview:free` — yedek

Test edilip elenenler: aşağıdaki tabloya bakın.

## Ücretsiz kota notu

OpenRouter'da `:free` modeller için günlük ücretsiz istek limiti **50**. Bu limit
anahtarda dolduğunda uygulama otomatik olarak kural moduna geçer (10 dk devre kesici +
30 dk yanıt önbelleği). Kota **00:00 UTC**'de yenilenir.

Test sırasında bu limit doldu (53/50). Bu yüzden şu an uygulama kural modunda çalışıyor:
yönlendirme, kutular, karar, riskler ve soru üretiliyor; yalnızca gerekçe/metin cilası
modelden gelmiyor. Model yolunu doğrulamak için kotası yenilendikten sonra:

```powershell
node check-models.mjs
```

Hesaba 10 $ kredi yüklendiğinde aynı ücretsiz modeller için limit 1000/gün olur; kod değişmez.

## Test edilen ve elenen ücretsiz modeller

| Model | Sonuç |
|---|---|
| `cohere/north-mini-code:free` | 4/4 geçerli JSON, ~530 ms → zincirin başı |
| `poolside/laguna-s-2.1:free` | 4/4 geçerli JSON, ~860 ms → yedek |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 3/4, ~360 ms (çok hızlı ama JSON'u kesiyor) |
| `dots-studio/dots-3-note-preview:free` | JSON iyi, düşünme bloğu yavaş |
| `google/gemma-4-*:free` | sürekli 429, kullanılamaz |
| `thinkingmachines/inkling*:free` | 403 — yalnızca agent harness |
| `nvidia/nemotron-3.5-*:free`, `recursive/flint:free` | token bütçesini düşünmede tüketip boş içerik döndürüyor |
| `liquid/lfm-2.5-2.6b`, `xingchen-agi/xing4.0` | 429 |

## API

`POST /api/analyze` — `{ "text": "sistem açıklaması" }`

Dönen alanlar: `verdict`, `ana_madde`, `alanlar[]` (madde + alan + yazılacak değer),
`taslak_metin`, `gerekce`, `riskler[]`, `sorulacak_soru`, `alternatif`, `kaynak`, `model`.

`POST /api/enrich` — `{ "text": "..." }` → model metni (gerekçe, taslak, riskler, soru). Model kapalıysa `ok: false`.

`GET /api/health` — model açık/kapalı, kota (60 sn önbellekli), sağlayıcı durumu.
