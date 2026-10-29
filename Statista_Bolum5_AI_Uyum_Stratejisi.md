# Statista "World's Best Smart Hospitals" – Bölüm 5 (Artificial Intelligence)
## Madde Bazlı Mevzuat Analizi ve Cevap Stratejisi

**Kapsam:** 5.1 – 5.9, toplam 39 alt madde (formun 7 sayfası).
**Cevaplama ilkesi:** Her madde, beyan edilen kullanımın **doğrulanabilirliği** ve **mevzuat statüsü** üzerinden değerlendirilir. Hastane KVKK (6698), Sağlık Bakanlığı Sağlıkta Bilgi Güvenliği Rehberi, erişim yetkilendirmesi, ağ segmentasyonu/firewall, loglama ve veri maskeleme kontrolleriyle çalışmaktadır; metinler bu fiilî kontrolleri anlatır.

**Üç sabit cümle (gerekli yerlerde tekrar kullanılacak):**

- **A – Güvenlik:** "AI tools run in segmented network zones behind the hospital firewall; access is role-based, minimum-privilege and logged; production data is masked in non-production environments; vendors act as data processors under written KVKK-compliant contracts."
- **B – Yönetişim:** "Each AI use case is reviewed before deployment by a multidisciplinary committee (clinical, IT, legal/KVKK, quality) with a documented intended use, named owner, risk classification and human-oversight arrangement."
- **C – Değerlendirme:** "Implementation and efficacy are monitored against pre-defined KPIs and reviewed at defined intervals by the owning department and the governance committee; findings are logged and turned into corrective actions."

---

## 0. GÖNDERİM ÖNCESİ KONTROL LİSTESİ

| # | Konu | Formdaki mevcut durum | Risk | Aksiyon |
|---|------|----------------------|------|---------|
| 1 | 5.1.3 triyaj + kimlik doğrulama | İşaretli | Klinik triyaj = yüksek riskli tıbbi yazılım alanı; kanıt istenir | İki kutuyu kaldır, operasyonel görevlerde kal |
| 2 | 5.7.1 "within hospital only" + 5.7.4 "portal: Yes" | Çelişkili | Doğrudan tutarsızlık | Uzaktan erişim varsa 5.7.1 = "both"; yoksa portalı iç istasyon olarak tanımla |
| 3 | 5.8.2 çalışan verisi analizi | "analyze operator efficiency" | KVKK çalışan verisi + otomatik karar algısı | "Agregat operasyonel analiz, bireysel performans kararı yok" diline çevir |
| 4 | 5.3.2 kütüphane adları | Sci-Kit Learn / All Forest / DeepLearn | Kütüphane ≠ ürün; yazım hatası olgunluk algısını düşürür | Ürün + amaç + geliştirme modeli olarak yeniden yaz |
| 5 | 5.1.6 / 5.2.7 kanıt dosyası | Dashboard eklenecek | PII, ham ses, serbest metin = başvuru reddi | Agregat metrik + tek sayfa yöntem notu |
| 6 | 5.5 / 5.6 "No" | Doğru | Düşük risk | Alt maddeleri boş bırak, gerekçe yazma |
| 7 | 5.2 / 5.4 "Planned" | Doğru | Düşük risk | Alt maddeleri boş bırak |

**Söylem sözlüğü:** "Tam uyumlu / %100 güvenli / sertifikalı" yerine → "protected by role-based access control, network segmentation and audit logging"; "anonim" yerine (gerçekten anonim değilse) → "de-identified / aggregated"; "AI diagnoses" yerine → "AI-assisted, final decision with the clinician".

---

# 5.1 AGENTIC AI

## [5.1.1] Does the hospital use agentic AI?

**1. ANLAM:** "Otonom ajan" tanımının gerçekten karşılanıp karşılanmadığı ölçülür: sistem kullanıcı adına **çok adımlı işlem** yapıyor ve **araç çağırıyor** mu? HIMSS olgunluk mantığı (pilot → departman → hastane geneli) ve yeni teknoloji yönetişimi beklentisi test edilir.

**2. YAZILMALI MI?** Koşullu. "Partially implemented", en az bir sistem kullanıcı adına birden fazla adımı kendi tamamlıyorsa (randevu oluşturma, talebi yönlendirme, sipariş tetikleme) savunulabilir. Pusula PRM ve medguide.app ağırlıklı olarak kural tabanlı/CRM işlevi görüyorsa iddia kanıt aşamasında çöker; "planned / early stages" daha güvenli. "Hospital-wide" hiçbir koşulda işaretlenmemeli.

**3. CEVAP TASLAĞI:**
> "Agentic AI is used on a pilot basis in selected operational areas, always with a human-in-the-loop control: any action affecting a patient record or a resource decision requires authorised staff confirmation. All agent actions are logged and reviewable. [A + B]"

**4. KONTROL SORUSU:** "Hangi sistemimiz kullanıcı adına birden fazla adımı kendi başına tamamlıyor ve son onay insanda mı?"

---

## [5.1.2] What tool(s) or supplier(s) does the hospital use for agentic AI?

**1. ANLAM:** Tedarik zinciri şeffaflığı ve satın alma olgunluğu. Hangi ürün, hangi rol, hangi sözleşme? KVKK m.8/9 (aktarım) ve veri işleyen ilişkisi sorgulanır.

**2. YAZILMALI MI?** Yazılmalı — ürün ve rol diliyle. "Development ongoing" ifadesi iddiayı zayıflatır; "in internal R&D, not in clinical use" olarak netleştirilmeli. Sözleşmesi olmayan tedarikçi adı yazılmamalı.

**3. CEVAP TASLAĞI:**
> "Pusula PRM (patient relationship management/CRM); medguide.app (patient-facing digital guidance and translation); and internally developed AI components maintained by the hospital's own software team, currently in internal R&D. All vendors act as data processors under KVKK-compliant contracts covering confidentiality, security, audit and data return/deletion; no vendor uses hospital data for model training."

**4. KONTROL SORUSU:** "Pusula ve medguide ile imzalı veri işleyen sözleşmesi var mı; veri yurt dışına çıkıyorsa KVKK m.9 dayanağı belgelendi mi?"

---

## [5.1.3] For what tasks is agentic AI used? (multiple)

**1. ANLAM:** Kullanım genişliği ve **klinik/operasyonel ayrımı**. Klinik kullanım daha yüksek puan getirir; ancak triyaj ve kimlik doğrulama yüksek riskli tıbbi yazılım alanına girer ve hasta güvenliği gözetimi gerektirir.

**2. YAZILMALI MI?** Daraltılmalı. İşaretli 5 alandan **"Patient intake and discharge (identity verification)"** ve **"Patient engagement (triaging symptoms)"** en riskli ikisidir; yazılı iş akışı ve doğrulama testi yoksa kaldırılmalı. Güvenli çekirdek: *IT support, Resource management, Time management* (+ varsa post-discharge idari takip). Bu dörtlü hem puan getirir hem klinik cihaz yükümlülüğü doğurmaz.

**3. CEVAP TASLAĞI:**
> *İşaretlenecekler:* IT support tasks; Resource management; Time management; Patient engagement (yalnızca idari taburculuk sonrası takip).
> "Agentic AI is applied to administrative and operational workflows — first-line IT support routing, bed/inventory-related resource requests and appointment scheduling — always with human confirmation before commitment. Clinical triage and identity verification are not delegated to autonomous systems."

**4. KONTROL SORUSU:** "Triyaj ve kimlik doğrulama iddiamızı destekleyen yazılı iş akışı veya doğrulama testi var mı; yoksa bu iki kutu kaldırılabilir mi?"

---

## [5.1.4] What percentage of patient visits use agentic AI?

**1. ANLAM:** Penetrasyon ölçümü; "pilot" beyanının sayısal tutarlılığı test edilir.

**2. YAZILMALI MI?** Yazılmalı — **"Less than 10%"** doğru ve tutarlı. 5.1.1'de "partially" denildiği sürece oran düşük kalmalıdır. Oran büyüdükçe kanıt ve denetim beklentisi artar.

**3. CEVAP TASLAĞI:** "Less than 10% of patient visits currently involve agentic AI; use is limited to selected operational workflows."

**4. KONTROL SORUSU:** "Bu yüzde çağrı merkezi/randevu kayıtlarından doğrulanabiliyor mu, yoksa tahmini mi?"

---

## [5.1.5] Does the hospital perform evaluations of the implementation and efficacy of agentic AI?

**1. ANLAM:** Yönetişim ve izleme olgunluğu; kalite iyileştirme döngüsü ve piyasa sonrası izleme mantığı.

**2. YAZILMALI MI?** "Yes, regularly" — ancak yazılı KPI seti ve toplantı tutanağı varsa. Değerlendirme, operasyonel metriklerin yanında erişim logu ve olay kayıtlarını da kapsamalı.

**3. CEVAP TASLAĞI:**
> "Yes, regularly. Evaluations cover operational KPIs (response and resolution time, scheduling accuracy, rework rate) and control indicators such as access-log reviews and incident records. Results are reviewed by the owning department and the governance committee at defined intervals. [C]"

**4. KONTROL SORUSU:** "Agentic AI için tanımlı KPI listesi ve son 6 aya ait değerlendirme tutanağı var mı?"

---

## [5.1.6] Please provide evidence (e.g., dashboards) of agentic AI implementation.

**1. ANLAM:** Beyanın doğrulanabilirliği. Pazarlama sunumu değil, işleyen ölçüm mekanizması aranır. "Kişisel veri içermeyen kanıt" uyarısı veri koruma farkındalığını test eder.

**2. YAZILMALI MI?** Yazılmalı, kontrollü. Çağrı merkezi analizi uygundur; yalnızca agregat metrik, tarih aralığı ve yöntem notu içermeli. Ekran görüntülerinde hasta adı, MRN, operatör adı, ham ses kaydı ve serbest metin bulunmamalı.

**3. CEVAP TASLAĞI (üst yazı):**
> "Attached is an aggregated call-centre performance dashboard (period: …). All direct identifiers have been removed; no patient or employee-level data, audio recordings or free-text notes are included. The dashboard illustrates volume, handling time and routing accuracy only."

**4. KONTROL SORUSU:** "Paylaşacağımız dashboard'da hasta/çalışan kimliği veya ham ses kaydı var mı; anonimleştirmeyi kim onayladı?"

---

# 5.2 AMBIENT AI

## [5.2.1] Does the hospital use ambient AI?

**1. ANLAM:** Arka planda dinleme ve otomatik klinik dokümantasyon. Hasta rızası, ses verisi ve bulut işleme boyutlarıyla en hassas AI kategorisi (KVKK m.6 özel nitelikli veri).

**2. YAZILMALI MI?** **"Not yet, but planned / early stages" doğru; korunmalı.** "Pilot" diyebilmek için imzalı PoC ve etki değerlendirmesi kaydı gerekir. Erken aşama beyanı en koruyucu seçenektir.

**3. CEVAP TASLAĞI:**
> "Ambient AI is not yet in clinical use. A pilot is in the planning/early stage; no patient audio is processed outside the hospital's controlled environment at this time."

**4. KONTROL SORUSU:** "Ambient AI için imzalı PoC/pilot sözleşmesi veya onaylı proje planı var mı; herhangi bir tedarikçiyle ses verisi paylaşıldı mı?"

---

## [5.2.2] Tool(s) / supplier(s) for ambient AI

**1. ANLAM:** Tedarikçi şeffaflığı. Kullanılmayan teknoloji için isim verilmesi, mevcut bir veri işleme ilişkisi varmış izlenimi yaratır.

**2. YAZILMALI MI?** **Boş bırakılmalı.** "Değerlendirme aşamasında" bir isim, 5.2.1 ile çelişki ve sözleşmesiz veri paylaşımı algısı doğurur.

**3. CEVAP TASLAĞI:** *(boş)* — İstenirse: "Not applicable – no ambient AI supplier contracted."

**4. KONTROL SORUSU:** "Herhangi bir ambient AI firmasıyla demo/PoC yapıldı mı; gerçek hasta verisi kullanıldı mı?"

---

## [5.2.3] In which settings is ambient AI used? (multiple)

**1. ANLAM:** Kapsam ölçümü (poliklinik, yataklı, uzak klinik). Uygulama olmadığı için bu bir tutarlılık testidir.

**2. YAZILMALI MI?** **Boş.** Pilot kesinleşmişse yalnızca o birim işaretlenir.

**3. CEVAP TASLAĞI:** *(boş / N/A)*

**4. KONTROL SORUSU:** "Pilot planlanıyorsa hangi birimde ve hangi tarih aralığında?"

---

## [5.2.4] % of ambulatory visits using ambient AI

**1. ANLAM:** Penetrasyon. Uygulama yoksa oran yoktur.

**2. YAZILMALI MI?** **Boş. "0%" yazılmamalı** — "denendi ama kullanılmıyor" izlenimi verir.

**3. CEVAP TASLAĞI:** *(boş / N/A)*

**4. KONTROL SORUSU:** "Poliklinikte ambient AI kullanan tek bir birim dahi var mı?"

---

## [5.2.5] % of inpatient visits using ambient AI

**1. ANLAM:** Yataklı hasta penetrasyonu; ses verisi ve rıza yönetimi açısından en hassas alan.

**2. YAZILMALI MI?** **Boş.** Yataklı serviste ses kaydı ayrı etki değerlendirmesi, aydınlatma ve açık rıza gerektirir.

**3. CEVAP TASLAĞI:** *(boş / N/A)*

**4. KONTROL SORUSU:** "Yataklı servislerde ses kaydı yapan herhangi bir sistem var mı?"

---

## [5.2.6] Evaluations of ambient AI

**1. ANLAM:** Uygulama olmadığında bu soru değerlendirme kapasitesini ölçer.

**2. YAZILMALI MI?** **Boş (N/A).** "No" işaretlemek "değerlendirme kültürü yok" algısı yaratabilir; soru yalnızca ambient AI'a özgüdür.

**3. CEVAP TASLAĞI:** *(boş)* — "Not applicable – no ambient AI deployment to evaluate."

**4. KONTROL SORUSU:** "Ambient AI devreye alındığında hangi KPI ve validasyon protokolüyle değerlendirilecek?"

---

## [5.2.7] Evidence for ambient AI

**1. ANLAM:** Doğrulanabilirlik. Uygulama yoksa kanıt da yoktur.

**2. YAZILMALI MI?** **Boş.** Tanıtım sunumu, broşür veya demo videosu yüklenmemeli; bunlar kanıt değildir.

**3. CEVAP TASLAĞI:** *(boş / N/A)*

**4. KONTROL SORUSU:** "Ambient AI için üretilmiş herhangi bir dashboard veya pilot raporu var mı?"

---

# 5.3 ADMINISTRATIVE SUPPORT

## [5.3.1] Are AI tools used for administrative support tasks?

**1. ANLAM:** Operasyonel AI olgunluğu; veri girişi, planlama, stok, faturalama. Operasyonel analitik olgunluğu ve kaynak yönetimi verimliliği ölçülür.

**2. YAZILMALI MI?** **"Partially implemented" korunmalı.** Kurumun en savunulabilir AI iddiasıdır. Finans/İK verisi de kişisel veridir; erişim ayrımı ve maskeleme anlatılmalı.

**3. CEVAP TASLAĞI:**
> "Yes, partially implemented in selected administrative units (scheduling, inventory-related planning, financial reporting support). Use is limited to decision support; no automated decision affecting patients or employees is taken without human review. [A + B]"

**4. KONTROL SORUSU:** "İdari AI sistemleri hangi birimlerde canlıda; finans ve İK verisine erişim rol bazlı ayrılmış mı?"

---

## [5.3.2] AI tools / platforms for administrative support

**1. ANLAM:** Teknoloji envanteri ve olgunluk algısı. Burada ürün adı beklenir; kütüphane adı teknik olarak yanlıştır.

**2. YAZILMALI MI?** **Yeniden yazılmalı.** "Sci-Kit Learn Library", "All Forest Algorithm Models" (muhtemelen *Random Forest*) ve "DeepLearn" birer kütüphane/yöntemdir, ürün değildir. Öneri: sistem + amaç + geliştirme modeli. Açık kaynak kütüphane kullanımı "kontrollü, erişimi kısıtlı iç geliştirme ortamı" olarak çerçevelenmeli.

**3. CEVAP TASLAĞI:**
> "Internally developed predictive models (random-forest and gradient-boosted tree based) integrated into administrative planning and reporting workflows; CTrial for clinical-trial administration; and an internal R&D environment using standard open-source ML libraries. Models are developed and maintained by the hospital's own team within a controlled, access-restricted environment."

**4. KONTROL SORUSU:** "'DeepLearn' ve 'CTrial' canlı ürün mü, prototip mi; Random Forest modelleri hangi sistemin içinde çalışıyor?"

---

## [5.3.3] Administrative tasks supported by AI (multiple)

**1. ANLAM:** Kullanım yelpazesi. Beş kutunun tümünün işaretli olması "her alanda AI" izlenimi verir ve kanıt baskısını artırır.

**2. YAZILMALI MI?** **Seçici işaretleme.** Canlı olan 3–4 alan yeterli. "Financial tasks" ve "Staff time management" İK/finans verisi içerdiğinden ayrı gerekçe ve erişim ayrımı gerektirir.

**3. CEVAP TASLAĞI:**
> *İşaretlenecekler:* Data entry/transcription; Logistics; Patient services; Staff scheduling (canlı ise).
> "AI supports structured data entry, inventory/logistics planning and appointment-related patient services; financial and workforce data are processed in segregated systems with role-based access."

**4. KONTROL SORUSU:** "İşaretli her görev için canlı bir örnek gösterebilir miyiz; hangileri yalnızca pilot?"

---

## [5.3.4] Proportion of administrative work assisted by AI

**1. ANLAM:** Yaygınlık; 5.3.1'deki "partial" beyanıyla tutarlılık.

**2. YAZILMALI MI?** **Korunmalı ("Less than 20%").** Oranı büyütmek puan getirmez, kanıt yükü getirir.

**3. CEVAP TASLAĞI:** "Less than 20% of administrative work is currently AI-assisted."

**4. KONTROL SORUSU:** "Bu oran hangi birim/yıl bazında hesaplandı; ölçüm yöntemi yazılı mı?"

---

# 5.4 CLINICAL – LABORATORY

## [5.4.1] AI for diagnostic/analytic purposes with laboratory data

**1. ANLAM:** Laboratuvar AI olgunluğu. Bu alan yüksek riskli tıbbi yazılım kapsamına yaklaşır; doğrulama ve kalite kontrol gerektirir.

**2. YAZILMALI MI?** **"Not yet, but planned" korunmalı.** Kritik ayrım: LIS'teki **kural tabanlı otomatik doğrulama ve kritik değer uyarıları AI değildir**; AI olarak sunulmamalı.

**3. CEVAP TASLAĞI:**
> "Laboratory AI is not yet in diagnostic use. Rule-based autoverification and critical-value alerts in the LIS are conventional clinical decision rules, not AI, and are therefore not reported as such. AI-assisted laboratory analytics is in the planning stage."

**4. KONTROL SORUSU:** "LIS'teki otomatik doğrulama/uyarı kuralları AI olarak mı etiketleniyor; laboratuvarda canlı bir ML modeli var mı?"

---

## [5.4.2] Tool(s) for laboratory AI

**1. ANLAM:** Tedarikçi/ürün beyanı. Uygulama olmadığı için tutarlılık testidir.

**2. YAZILMALI MI?** **Boş.** "Planned" beyanı varken ürün adı yazmak çelişki yaratır.

**3. CEVAP TASLAĞI:** *(boş / N/A)*

**4. KONTROL SORUSU:** "Laboratuvar AI'ı için değerlendirilen bir tedarikçi var mı; hangi aşamada?"

---

## [5.4.3] Laboratory AI tasks (multiple)

**1. ANLAM:** Kullanım amacı. Uygulama yoksa işlevsiz.

**2. YAZILMALI MI?** **Boş.**

**3. CEVAP TASLAĞI:** *(boş / N/A)*

**4. KONTROL SORUSU:** "Planlanan kullanım tanı desteği mi, yoksa operasyonel (TAT, triyaj) mi?"

---

## [5.4.4] Proportion of laboratory work assisted by AI

**1. ANLAM:** Penetrasyon. Oran işaretlemek "kullanılıyor" anlamına gelir.

**2. YAZILMALI MI?** **Boş.** 5.4.1 ile doğrudan çelişki riski taşır.

**3. CEVAP TASLAĞI:** *(boş / N/A)*

**4. KONTROL SORUSU:** "Laboratuvar iş yükünün herhangi bir kısmı algoritmik olarak önceliklendiriliyor mu?"

---

# 5.5 CLINICAL – IMAGING

## [5.5.1] AI for diagnostic/analytic purposes with imaging and pathology data

**1. ANLAM:** Radyoloji AI olgunluğu. En yüksek puanlı ama en yüksek mevzuat yükü olan kategori: tıbbi cihaz sınıfı, CE işaretleme, klinik validasyon.

**2. YAZILMALI MI?** **"No" korunmalı.** "Analytics only" seçeneği görüntü üzerinde çalışan bir model olduğu izlenimi yaratır ve CE/validasyon kanıtı ister.

**3. CEVAP TASLAĞI:** "No AI tools are currently used for diagnostic or analytic purposes with imaging data."

**4. KONTROL SORUSU:** "PACS/RIS içinde görüntü üzerinde çalışan herhangi bir algoritma (önceliklendirme, ölçüm, kalite kontrol) var mı; CE işaretli mi?"

---

## [5.5.2] Tool(s) for imaging AI

**1. ANLAM:** Tedarikçi beyanı; "No" sonrası işlevsiz.

**2. YAZILMALI MI?** **Boş.**

**3. CEVAP TASLAĞI:** *(boş / N/A)*

**4. KONTROL SORUSU:** "Radyoloji AI'ı için değerlendirilen tedarikçi var mı?"

---

## [5.5.3] Imaging AI tasks (multiple)

**1. ANLAM:** Kullanım amacı. "No" beyanıyla tutarlılık.

**2. YAZILMALI MI?** **Boş.** Herhangi bir kutu işaretlemek 5.5.1 ile çelişir.

**3. CEVAP TASLAĞI:** *(boş / N/A)*

**4. KONTROL SORUSU:** "Tümör/serebrovasküler olay tespiti gibi bir modül herhangi bir cihazda gömülü mü?"

---

## [5.5.4] Proportion of imaging work assisted by AI

**1. ANLAM:** Penetrasyon.

**2. YAZILMALI MI?** **Boş.** "Less than 20%" seçmek görüntülemede AI kullanıldığı anlamına gelir.

**3. CEVAP TASLAĞI:** *(boş / N/A)*

**4. KONTROL SORUSU:** "Radyolog iş akışında algoritmik önceliklendirme var mı?"

---

# 5.6 CLINICAL – PATHOLOGY

## [5.6.1] AI for diagnostic/analytic purposes with pathology data

**1. ANLAM:** Patoloji AI olgunluğu; whole-slide imaging, hücre sayımı, segmentasyon. Mevzuat yükü görüntüleme ile aynı.

**2. YAZILMALI MI?** **"No" korunmalı.** "Analytics only" dahi patoloji görüntüsü işleyen yazılım anlamına gelir; validasyon ve CE kanıtı gerektirir.

**3. CEVAP TASLAĞI:** "No AI tools are currently used for diagnostic or analytic purposes with pathology data."

**4. KONTROL SORUSU:** "Patoloji tarayıcı/yazılımında hücre sayımı veya segmentasyon yapan modül var mı; tıbbi cihaz kaydı var mı?"

---

## [5.6.2] Tool(s) for pathology AI

**2. YAZILMALI MI?** **Boş.**
**3. CEVAP TASLAĞI:** *(boş / N/A)*
**4. KONTROL SORUSU:** "Patoloji AI'ı için imzalı değerlendirme veya pilot anlaşması var mı?"

---

## [5.6.3] Pathology AI tasks (multiple)

**2. YAZILMALI MI?** **Boş.**
**3. CEVAP TASLAĞI:** *(boş / N/A)*
**4. KONTROL SORUSU:** "Patoloji raporlamasında otomatik ölçüm/segmentasyon kullanılıyor mu?"

---

## [5.6.4] Proportion of pathology work assisted by AI

**2. YAZILMALI MI?** **Boş.**
**3. CEVAP TASLAĞI:** *(boş / N/A)*
**4. KONTROL SORUSU:** "Patoloji iş yükünde algoritmik destek payı ölçülüyor mu?"

---

# 5.7 PATIENT SUPPORT

## [5.7.1] Are AI tools used for patient support tasks?

**1. ANLAM:** Hasta etkileşimi olgunluğu ve erişim kanalı (hastane içi / uzaktan). Uzaktan kanal, veri aktarımı ve hasta kimlik doğrulaması boyutlarını devreye sokar.

**2. YAZILMALI MI?** **Tutarlılık kritik.** Mevcut formda "within the hospital only" işaretli iken 5.7.4'te portal "Yes" denmiş — bu doğrudan çelişkidir. medguide.app/translate hasta erişimli bir kanal ise 5.7.1 **"both within the hospital and remotely"** olmalıdır. Uzaktan erişim yoksa portal "iç istasyon" olarak tanımlanmalı.

**3. CEVAP TASLAĞI:**
> "Yes – both within the hospital and remotely, through the patient portal and translation service. Remote access is authenticated, session-logged and limited to non-clinical support content. [A]"

**4. KONTROL SORUSU:** "Hasta portalına hastalar kendi cihazlarından erişiyor mu; erişim hangi kimlik doğrulama yöntemiyle yapılıyor?"

---

## [5.7.2] Tool(s) for patient support

**1. ANLAM:** Ürün envanteri. Belirsiz/doğrulanamayan adlar güvenilirliği düşürür.

**2. YAZILMALI MI?** **Yeniden yazılmalı.** "Machine Learn Systems" ve "DeepLearn Models" ürün adı değil, teknik tanımdır. Yalnızca gerçek ürünler (medguide.app, translate.medguide.app) ve net fonksiyon tanımı kalmalı.

**3. CEVAP TASLAĞI:**
> "medguide.app (patient guidance and wayfinding) and translate.medguide.app (multilingual translation), supported by internally developed ML components for first-line enquiry handling."

**4. KONTROL SORUSU:** "'Machine Learn Systems' ve 'DeepLearn Models' gerçek bir ürün mü, yoksa iç bileşen mi; canlıda kullanılıyor mu?"

---

## [5.7.3] Patient support tasks (multiple)

**1. ANLAM:** Kullanım amacı; klinik iddiaya kayma riski en yüksek maddelerden biri (mental health, semptom yönetimi).

**2. YAZILMALI MI?** **İki kutu yeterli:** "Patient administration tasks" ve "Language tasks". "Patient education" yalnızca içerik gerçekten varsa. "Mental health" işaretlenmemeli — klinik müdahale alanıdır, ayrı validasyon ve mevzuat yükü getirir.

**3. CEVAP TASLAĞI:**
> "First-line patient enquiries and administrative routing; multilingual translation and plain-language support. No diagnostic, triage or mental-health advice is provided by these tools."

**4. KONTROL SORUSU:** "Çeviri/guidance içeriği klinik tavsiye içeriyor mu; içerik onayı kimde?"

---

## [5.7.4] Patient support AI available via patient portal?

**1. ANLAM:** Erişim kanalı ve hasta tarafı kimlik doğrulaması. 5.7.1 ile birlikte okunur.

**2. YAZILMALI MI?** **"Yes"** — ancak 5.7.1 "both" olarak düzeltildikten sonra. Aksi halde iki madde birbirini yalanlar.

**3. CEVAP TASLAĞI:** "Yes. Portal access requires individual authentication; sessions are logged and no clinical data is exposed to the AI support layer beyond what the patient initiates."

**4. KONTROL SORUSU:** "Portal girişi bireysel kullanıcı adı/şifre + ikinci faktör ile mi yapılıyor?"

---

## [5.7.5] Proportion of patients using AI patient-support tools

**1. ANLAM:** Benimseme oranı; kanalın gerçekten kullanıldığının göstergesi.

**2. YAZILMALI MI?** **"Less than 20%"** — portal/çeviri kullanımı genellikle düşük başlar; bu oran 5.7.1 ile tutarlıdır.

**3. CEVAP TASLAĞI:** "Less than 20% of patients currently use AI-supported patient-support tools."

**4. KONTROL SORUSU:** "Portal ve çeviri hizmetinin aylık aktif kullanıcı sayısı nedir?"

---

# 5.8 OTHER PURPOSES

## [5.8.1] AI tools used for other purposes?

**1. ANLAM:** Kapsam dışı kullanımların beyanı; çağrı merkezi analitiği buraya düşer.

**2. YAZILMALI MI?** **"Yes"** — mevcut beyan doğru ve desteklenebilir. Ancak açıklama metni yeniden yazılmalı.

**3. CEVAP TASLAĞI:** "Yes – internally developed predictive models supporting call-centre operations."

**4. KONTROL SORUSU:** "Bu modeller üretimde mi, yoksa raporlama amaçlı mı çalışıyor?"

---

## [5.8.2] Tool names and purposes

**1. ANLAM:** Kullanım amacı beyanı. **En yüksek KVKK riski buradadır:** çalışan verisi analizi ve otomatik karar algısı.

**2. YAZILMALI MI?** **Yeniden yazılmalı.** Mevcut "analyze operator efficiency and support decision-making mechanisms aimed at improving operator performance" ifadesi, bireysel performans değerlendirmesi ve otomatik karar çağrışımı yapar (KVKK m.11, otomatik karara itiraz hakkı). Şu üç unsuru ekle: **agregat analiz**, **bireysel karar yok**, **insan değerlendirmesi**.

**3. CEVAP TASLAĞI:**
> "Internally developed predictive models used in call-centre operations to forecast call volume and analyse aggregate service metrics (waiting time, abandonment rate, routing accuracy). Outputs are aggregated at team/period level; they are not used to make automated decisions about individual employees, and any workforce decision remains with human managers. Models are built and maintained by the hospital's own team in a controlled environment. [A]"

**4. KONTROL SORUSU:** "Model çıktısı bireysel operatör skoru üretiyor mu; bu çıktı İK kararlarında kullanılıyor mu?"

---

## [5.8.3] Other purposes (multiple)

**1. ANLAM:** Kullanım sınıflandırması. Burada işaretlenecek kutu, kurumun AI portföyünü tanımlar.

**2. YAZILMALI MI?** **Yalnızca "Other"** — çağrı merkezi operasyon analitiği. "Clinical decision support", "Monitoring of clinical parameters" ve "AI-assisted surgery planning" kesinlikle işaretlenmemeli; bunlar klinik AI iddiasıdır ve 5.4–5.6'daki "No" beyanlarıyla çelişir.

**3. CEVAP TASLAĞI:** *Other:* "Operational analytics in call-centre management (call-volume forecasting and aggregate service metrics)."

**4. KONTROL SORUSU:** "Klinik parametre izleme veya tedavi önerisi üreten herhangi bir modül var mı?"

---

# 5.9 AI TOOL SUPPORT

## [5.9.1] Official support for AI tools within the hospital?

**1. ANLAM:** Kurumsal sahiplenme ve yönetişim kapasitesi. "Power user" kavramı, eğitimli süper kullanıcı ağı ve yaygınlaştırma modelini ölçer.

**2. YAZILMALI MI?** **"Yes, official support and power users"** — mevcut beyan güçlü ve doğru; korunmalı. Ancak desteklenebilir olması için power user listesi ve eğitim kaydı bulunmalı.

**3. CEVAP TASLAĞI:**
> "Yes. A dedicated IT team provides first- and second-line support for AI tools, and a network of trained power users in clinical and administrative departments supports daily use, onboarding and issue escalation. [B]"

**4. KONTROL SORUSU:** "Power user listesi ve eğitim kayıtları güncel mi; destek talepleri tek bir kanaldan mı yönetiliyor?"

---

## [5.9.2] Categories of AI tools with support available (multiple)

**1. ANLAM:** Desteğin kapsamı. İşaretlenen kategori, fiilen desteklenen AI portföyünü beyan eder.

**2. YAZILMALI MI?** **Yalnızca gerçekten desteklenen kategoriler:** "Administrative support", "Patient support" ve "Other" (operasyon analitiği). **"Laboratory", "Imaging" ve "Pathology" işaretlenmemeli** — bu kategorilerde AI kullanılmadığı beyan edildi (5.4–5.6); destek vermek için kullanım olması gerekir.

**3. CEVAP TASLAĞI:** *İşaretlenecekler:* Administrative support; Patient support; Other (call-centre operational analytics).

**4. KONTROL SORUSU:** "Laboratuvar/radyoloji/patoloji ekiplerine verilen herhangi bir AI aracı desteği var mı?"

---

# EK A – KANIT DOSYASI PROTOKOLÜ (5.1.6 ve 5.2.7)

1. **Sadece agregat veri.** Hasta, çalışan, operatör düzeyinde satır yok.
2. **Doğrudan tanımlayıcı yok.** Ad, MRN, TCKN, telefon, tarih-saat + lokasyon kombinasyonu çıkarılmalı.
3. **Ham ses/transkript yok.** Çağrı merkezi analitiğinde bile ses dosyası veya serbest metin paylaşılmamalı.
4. **Tek sayfa yöntem notu.** Dönem, metrik tanımları, veri kaynağı ve anonimleştirme adımı yazılmalı.
5. **Onay.** Paylaşım öncesi veri sahibi birim + hukuk/KVKK onayı alınmalı.

# EK B – 30 GÜNLÜK AKSİYON PLANI

| Hafta | Aksiyon | Sorumlu |
|-------|---------|---------|
| 1 | 5.7.1 / 5.7.4 çelişkisini kapat; 5.8.2 metnini yeniden yaz | IT + Hukuk/KVKK |
| 1 | 5.1.3'te triyaj ve kimlik doğrulama kutularını kaldır | Klinik + IT |
| 2 | 5.3.2 ve 5.7.2 ürün envanterini netleştir | IT |
| 2 | 5.9.2 kategori işaretlemelerini portföyle eşleştir | IT |
| 3 | Çağrı merkezi dashboard'unu anonimleştir, yöntem notunu yaz | Veri analitiği |
| 3 | Power user listesi ve eğitim kayıtlarını derle | İK + IT |
| 4 | Tüm formu tutarlılık kontrolünden geçir (EK C) ve gönder | Proje sahibi |

# EK C – TUTARLILIK MATRİSİ

| Beyan | Bağlı olduğu maddeler | Kural |
|-------|----------------------|-------|
| Agentic AI = partial | 5.1.2, 5.1.4, 5.1.5, 5.1.6 | Oran < %10; en az bir KPI seti ve kanıt |
| Ambient AI = planned | 5.2.2 – 5.2.7 | Hepsi boş / N/A |
| Administrative AI = partial | 5.3.2, 5.3.3, 5.3.4 | Oran < %20; ürün adları gerçek |
| Laboratory = planned | 5.4.2 – 5.4.4 | Hepsi boş |
| Imaging = No | 5.5.2 – 5.5.4 | Hepsi boş |
| Pathology = No | 5.6.2 – 5.6.4 | Hepsi boş |
| Patient support = both/in-hospital | 5.7.4, 5.7.5 | 5.7.1 ile aynı kanal tanımı |
| Other = call-centre analytics | 5.8.3, 5.9.2 | "Other" işaretli; klinik kutu yok |
| Support = official + power users | 5.9.2 | Yalnızca desteklenen kategoriler |
