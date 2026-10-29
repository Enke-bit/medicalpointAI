// Deterministik yönlendirme motoru.
// Amaç: ücretsiz dil modellerinin tutarsızlığından bağımsız, her zaman aynı
// maddeye aynı kararı veren bir çekirdek. Model yalnızca metni cilalar.

const fold = (s) =>
  String(s)
    .toLocaleLowerCase("tr")
    .replace(/[İI]/g, "i")
    .replace(/[ı]/g, "i")
    .replace(/\s+/g, " ");

const norm = (s) => fold(s).trim();

// Anahtar kelimeler kırpılmaz: " ml ", " bt " gibi kenar boşlukları kelime sınırı görevi görür.
const kw = (s) => fold(s);

const has = (t, words) => words.some((w) => t.includes(w));

const AI_WORDS = [
  "yapay zeka", "yapay zekâ", " ai ", "ai-", "ai.", "(ai", "ai)", "yapay-zeka",
  "makine ogrenmesi", "makine öğrenmesi", "machine learning", " ml ", "derin ogrenme",
  "derin öğrenme", "deep learning", "model", "algoritma", "tahmin", "ongoru", "öngörü",
  "skor", "siniflandir", "sınıflandır", "nlp", "llm", "gpt", "chatbot", "otomatik karar",
  "veri madenciligi", "veri madenciliği", "bilgisayarli goru", "bilgisayarlı görü",
  "ceviri", "çeviri", "translate", "dikte", "konusma tanima", "konuşma tanıma",
  "metne cevir", "metne çevir", "ses tanima", "ses tanıma", "otomatik not", "transkript",
];

const AMBIENT = ["ambient", "arka planda dinle", "ses kaydi", "ses kaydı", "sesi dinle",
  "dikte", "transkript", "konusmayi metne", "konuşmayı metne", "ortam dinleme",
  "muayene sirasinda dinleyen", "not uret", "otomatik dokumantasyon", "otomatik dokümantasyon"];

const LAB = ["laboratuvar", "laboratory", " lis ", "lts", "biyokimya", "mikrobiyoloji",
  "kan tahlili", "tahlil", "test sonucu", "test sonuç", "numune", "preanalitik"];

const IMAGING = ["radyoloji", "goruntuleme", "görüntüleme", "pacs", "tomografi", " bt ",
  " mr ", "mamografi", "rontgen", "röntgen", "ultrason", "nodul", "nodül", "akciger filmi",
  "akciğer filmi", "x-ray", "mri", " ct ", "goruntu analiz", "görüntü analiz"];

const PATHOLOGY = ["patoloji", "patology", "doku", "biyopsi", "hucre sayim", "hücre sayım",
  "slide", "wsi", "immunohistokimya", "immünohistokimya", "histoloji", "sitolojik"];

const PATIENT = ["hasta portal", "hasta uygulama", "mobil uygulama", "hastaların cep",
  "hastalarin cep", "hasta erisim", "hasta erişim", "cebinden", "telefonundan giren",
  "ceviri", "çeviri", "translate", "taburcu", "hasta egitim", "hasta eğitim",
  "hasta anket", "hasta geri bildirim", "sonuc goruntule", "sonuç görüntüle",
  "hasta talep", "hasta soru", "hasta mesaj", "randevu portal", "e-nabiz"];

const ADMIN = ["randevu", "sms", "hatirlat", "hatırlat", "fatura", "faturalama",
  "stok", "lojistik", "sevk", "vardiya", "cagri merkezi", "çağrı merkezi", "crm",
  "veri giris", "veri giriş", "bordro", "satin alma", "satın alma", "insan kaynak",
  " ik ", "personel", "raporlama", "is zekasi", "iş zekası", "operasyon", "depo",
  "malzeme", "muhasebe", "tahsilat", "sigorta", "provizyon"];

const AGENTIC = ["ajan", "agentic", "otonom", "chatbot", "bot ", "kendi basina",
  "kendi başına", "talebi yonlendir", "talebi yönlendir", "arac cagir", "araç çağır",
  "is akisini kendi", "iş akışını kendi", "otomatik yonlendir", "otomatik yönlendir",
  "insan mudahalesi olmadan", "insan müdahalesi olmadan"];

const SUPPORT = ["power user", "egitim", "eğitim", "destek ekibi", "lisans", "premium",
  "hesap tanimlama", "hesap tanımlama"];

const PILOT = ["demo", "poc", "pilot", "gorusuyoruz", "görüşüyoruz", "satin almadik",
  "satın almadık", "degerlendir", "değerlendir", "planliyor", "planlıyor", "henuz kurmad",
  "henüz kurmad", "test asama", "test aşama", "yakinda", "yakında", "devreye alinacak",
  "devreye alınacak", "teklif", "ihale", "arastirma asama", "araştırma aşama"];

const CLINICAL_RISK = ["tani", "tanı", "teshis", "teşhis", "triyaj", "triaj",
  "tedavi oner", "tedavi öner", "karar destek", "kimlik dogrula", "kimlik doğrula",
  "operator bazli", "operatör bazlı", "calisan bazli", "çalışan bazlı",
  "performans skor", "performans degerlendir", "performans değerlendir",
  "ise alim", "işe alım", "disiplin", "otomatik karar", "saglik tavsiye", "sağlık tavsiye"];

const SECTIONS = [
  { code: "5.2", key: "ambient", label: "5.2 Ambient AI", words: AMBIENT, weight: 3 },
  { code: "5.6", key: "pathology", label: "5.6 Clinical – Pathology", words: PATHOLOGY, weight: 3 },
  { code: "5.5", key: "imaging", label: "5.5 Clinical – Imaging", words: IMAGING, weight: 3 },
  { code: "5.4", key: "lab", label: "5.4 Clinical – Laboratory", words: LAB, weight: 3 },
  { code: "5.7", key: "patient", label: "5.7 Patient Support", words: PATIENT, weight: 2 },
  { code: "5.1", key: "agentic", label: "5.1 Agentic AI", words: AGENTIC, weight: 2 },
  { code: "5.3", key: "admin", label: "5.3 Administrative Support", words: ADMIN, weight: 1 },
  { code: "5.9", key: "support", label: "5.9 AI Tool Support", words: SUPPORT, weight: 1 },
];

// Bölüm bazlı alan haritası: hangi maddeye ne yazılır
const FIELDS = {
  "5.1": [
    { alan: "Kullanım düzeyi", madde: "5.1.1", deger: () => "Yes, partially implemented (selected departments/piloting)" },
    { alan: "Araç / tedarikçi adı", madde: "5.1.2", deger: (c) => c.toolNames || "buraya ürün adı + ne yaptığı yazılmalı" },
    { alan: "Görev kutuları", madde: "5.1.3", deger: () => "IT support; Resource management; Time management" },
    { alan: "Hasta ziyareti oranı", madde: "5.1.4", deger: () => "Less than 10%" },
    { alan: "Kanıt (dashboard)", madde: "5.1.6", deger: () => "agregat dashboard, kimlik bilgisi içermez" },
  ],
  "5.2": [
    { alan: "Kullanım düzeyi", madde: "5.2.1", deger: () => "Not yet, but this is planned or in early stages of implementation" },
    { alan: "Araç / tedarikçi adı", madde: "5.2.2", deger: () => "BOŞ BIRAK" },
    { alan: "Ortam, oran ve kanıt", madde: "5.2.3–5.2.7", deger: () => "BOŞ BIRAK / N/A" },
  ],
  "5.3": [
    { alan: "Kullanım düzeyi", madde: "5.3.1", deger: () => "Yes, partially implemented (selected departments/piloting)" },
    { alan: "Araç / platform adı", madde: "5.3.2", deger: (c) => c.toolNames || "buraya ürün adı + ne yaptığı yazılmalı" },
    { alan: "Görev kutuları", madde: "5.3.3", deger: (c) => c.tasks.join("; ") || "canlı olan görevleri işaretle" },
    { alan: "İdari iş oranı", madde: "5.3.4", deger: () => "Less than 20%" },
  ],
  "5.4": [
    { alan: "Kullanım düzeyi", madde: "5.4.1", deger: () => "Not yet, but this is planned or in early stages of implementation" },
    { alan: "Araç, görev ve oran", madde: "5.4.2–5.4.4", deger: () => "BOŞ BIRAK" },
  ],
  "5.5": [
    { alan: "Kullanım düzeyi", madde: "5.5.1", deger: (c) => (c.pilot ? "No — demo yapıldı, satın alınmadı (Other alanına yaz)" : "No") },
    { alan: "Araç, görev ve oran", madde: "5.5.2–5.5.4", deger: () => "BOŞ BIRAK" },
  ],
  "5.6": [
    { alan: "Kullanım düzeyi", madde: "5.6.1", deger: (c) => (c.pilot ? "No — yalnızca demo/değerlendirme (Other alanına yaz)" : "No") },
    { alan: "Araç, görev ve oran", madde: "5.6.2–5.6.4", deger: () => "BOŞ BIRAK" },
  ],
  "5.7": [
    { alan: "Kullanım kanalı", madde: "5.7.1", deger: (c) => (c.remote ? "Yes, both within the hospital and remotely" : "Yes, within the hospital only") },
    { alan: "Araç / platform adı", madde: "5.7.2", deger: (c) => c.toolNames || "buraya ürün adı yazılmalı" },
    { alan: "Görev kutuları", madde: "5.7.3", deger: (c) => c.tasks.join("; ") || "canlı olan görevleri işaretle" },
    { alan: "Hasta portalı", madde: "5.7.4", deger: (c) => (c.portal ? "Yes" : "No") },
    { alan: "Hasta kullanım oranı", madde: "5.7.5", deger: () => "Less than 20%" },
  ],
  "5.8": [
    { alan: "Diğer kullanım", madde: "5.8.1", deger: () => "Yes" },
    { alan: "Araç ve amaç metni", madde: "5.8.2", deger: (c) => c.toolNames || "buraya araç adı + amaç yazılmalı" },
    { alan: "Amaç kutuları", madde: "5.8.3", deger: () => "Other" },
  ],
  "5.9": [
    { alan: "Kurumsal destek", madde: "5.9.1", deger: () => "Yes, there is official support and \u201cpower users\u201d" },
    { alan: "Destek kategorileri", madde: "5.9.2", deger: () => "Administrative support; Patient support; Other" },
  ],
};

// Klinik bölümde AI gerçekten canlıdaysa (pilot değil) "No" yerine dolu alanlar.
// 5.4.1'in seçenekleri 5.5.1/5.6.1'den farklıdır.
function clinicalLiveFields(code, c) {
  const usage =
    code === "5.4"
      ? "Yes, partially implemented (selected departments/piloting)"
      : c.diagnostic
        ? "Yes, for diagnosis and analytics"
        : "Yes, for analytics only";
  return [
    { alan: "Kullanım düzeyi", madde: `${code}.1`, deger: usage },
    { alan: "Araç / platform adı", madde: `${code}.2`, deger: c.toolNames || "buraya ürün adı + tıbbi cihaz kaydı yazılmalı" },
    { alan: "Görev kutuları", madde: `${code}.3`, deger: c.tasks.join("; ") || "canlı olan görevleri işaretle" },
    { alan: "Klinik iş oranı", madde: `${code}.4`, deger: "Less than 20%" },
  ];
}

const TASK_MAP = {
  "5.3": [
    { words: ["randevu", "sms", "hatirlat", "hatırlat", "taburcu", "kabul", "yatis", "yatış", "hasta talep", "hasta soru"], label: "Patient services (appointment reminders, admission, discharge letters)" },
    { words: ["veri giris", "veri giriş", "transkript", "kayit", "kayıt", "form"], label: "Data entry and transcription of results" },
    { words: ["fatura", "faturalama", "muhasebe", "sigorta", "provizyon", "tahsilat", "bordro"], label: "Financial tasks (billing, invoicing, reimbursement, insurance)" },
    { words: ["stok", "lojistik", "sevk", "depo", "malzeme", "satin alma", "satın alma"], label: "Logistics (materials planning, inventory, patient transport)" },
    { words: ["vardiya", "insan kaynak", " ik ", "cizelge", "çizelge", "shift", "personel planlama"], label: "Staff time management (scheduling, shifts)" },
  ],
  "5.7": [
    { words: ["ceviri", "çeviri", "translate", "dil", "tercume", "tercüme"], label: "Language tasks (translation, plain language)" },
    { words: ["portal", "uygulama", "ilk hat", "talep", "soru", "yonlendir", "yönlendir", "randevu"], label: "Patient administration tasks (first-line enquiries)" },
    { words: ["taburcu", "takip", "anksiyete", "psikolojik", "egitim", "eğitim"], label: "Patient education (symptom management, post-discharge)" },
  ],
  "5.5": [
    { words: ["nodul", "nodül", "tumor", "tümör", "kitle"], label: "Detecting tumors/foreign bodies" },
    { words: ["inme", "stroke", "kanama", "iskemi"], label: "Detecting hemorrhagic/ischemic stroke" },
    { words: ["olcum", "ölçüm", "hacim", "boyut"], label: "Measuring tumor size/volume" },
    { words: ["kalite", "qc"], label: "Quality control" },
  ],
  "5.6": [
    { words: ["hucre", "hücre", "sayim", "sayım"], label: "Cell-counting" },
    { words: ["segment", "doku"], label: "Image segmentation (by cell-type)" },
    { words: ["marker", "boya", "immun", "immün"], label: "Quantification of markers" },
    { words: ["tumor", "tümör"], label: "Detecting tumors/foreign bodies" },
  ],
  "5.4": [
    { words: ["erken uyari", "erken uyarı", "sepsis"], label: "Early warning alerts" },
    { words: ["risk", "skor"], label: "Risk prediction/scoring" },
    { words: ["enfeksiyon", "infeksiyon"], label: "Identifying infection patterns" },
    { words: ["rapor"], label: "Automated reporting" },
  ],
};

const DRAFTS = {
  "5.1": (c) =>
    `Agentic AI is used on a pilot basis in selected operational areas (${c.areaText}). A human-in-the-loop control applies to every action affecting a patient record or a resource decision; all agent actions are logged and reviewable.`,
  "5.2": () =>
    `Ambient AI is not yet in clinical use. A pilot is in the planning/early evaluation stage; no patient audio is processed outside the hospital's controlled environment.`,
  "5.3": (c) =>
    `Internally developed and procured AI tools support administrative workflows, including ${c.areaText}. Outputs are used as decision support only; no automated decision affecting patients or employees is taken without human review.`,
  "5.4": (c) =>
    c.live
      ? `AI-assisted laboratory analytics (${c.areaText}) is used in selected laboratory workflows. Outputs support laboratory specialists; results are validated and released by authorised staff, and the tool's performance is monitored against defined quality indicators.`
      : `Laboratory AI is not yet in diagnostic use. Rule-based autoverification and critical-value alerts in the LIS are conventional clinical decision rules, not AI, and are therefore not reported as such. AI-assisted laboratory analytics is in the planning stage.`,
  "5.5": (c) =>
    c.live
      ? `An AI tool supports imaging workflows (${c.areaText}). Findings are AI-assisted; the final report and clinical decision remain with the radiologist, and use is limited to the tool's documented intended purpose.`
      : c.pilot
        ? `Imaging AI is not in routine clinical use. One solution (${c.areaText}) has been evaluated in a demonstration environment only and has not been procured or connected to the clinical workflow.`
        : `No AI tools are currently used for diagnostic or analytic purposes with imaging data.`,
  "5.6": (c) =>
    c.live
      ? `An AI module supports pathology workflows (${c.areaText}). Outputs are AI-assisted; the pathologist reviews every result and remains responsible for the final report, and use is limited to the tool's documented intended purpose.`
      : c.pilot
        ? `Pathology AI is not in routine clinical use. Evaluation is limited to a demonstration environment; no clinical workflow integration exists.`
        : `No AI tools are currently used for diagnostic or analytic purposes with pathology data.`,
  "5.7": (c) =>
    `AI supports patient-facing services including ${c.areaText}. Access is authenticated and session-logged; no diagnostic, triage or mental-health advice is provided by these tools.`,
  "5.8": (c) =>
    `Internally developed predictive models support call-centre operations (${c.areaText}). Outputs are aggregated at team/period level and are not used to make automated decisions about individual employees.`,
  "5.9": () =>
    `A dedicated IT team provides first- and second-line support for AI tools, and trained power users in clinical and administrative departments support daily use, onboarding and issue escalation.`,
};

const QUESTIONS = {
  "5.1": "Hangi sistem kullanıcı adına birden fazla adımı kendi tamamlıyor ve son onay insanda mı?",
  "5.2": "Ambient AI için imzalı pilot sözleşmesi var mı; herhangi bir tedarikçiyle ses verisi paylaşıldı mı?",
  "5.3": "Bu sistemde gerçek bir ML modeli mi çalışıyor, yoksa kural tabanlı akış mı; hangi birimde canlıda?",
  "5.4": "LIS'teki otomatik doğrulama kuralları statik mi, makine öğrenmesi modeli mi?",
  "5.5": "Bu çözüm satın alındı mı, yoksa yalnızca demo mu; CE işaretli ve PACS'e bağlı mı?",
  "5.6": "Patoloji yazılımında hücre sayımı/segmentasyon yapan modül var mı; tıbbi cihaz kaydı var mı?",
  "5.7": "Hastalar portal/mobil uygulamaya kendi cihazlarından mı erişiyor; kimlik doğrulama nasıl yapılıyor?",
  "5.8": "Model çıktısı bireysel çalışan skoru üretiyor mu; İK kararlarında kullanılıyor mu?",
  "5.9": "Power user listesi ve eğitim kayıtları güncel mi?",
};

// Ürün/sistem adı çıkarımı: büyük harfle başlayan bilinen kalıplar
function extractToolNames(text) {
  const names = new Set();
  const GENERIC = new Set(["CRM", "SMS", "AI", "ML", "HIS", "LIS", "PACS", "RIS", "ERP", "API", "PRM", "URL"]);
  // 1) dosya/alan adı biçimindeki ürünler: medguide.app, translate.medguide.app
  for (const m of text.match(/[a-z0-9-]+(?:\.[a-z0-9-]+)+\.(?:app|com|net|org|io|ai)\b/gi) || []) {
    names.add(m);
  }
  // 2) Büyük harfle başlayan, ürün olduğu belli olan adlar (marka + kısaltma)
  const known = text.match(/\b[A-ZÇĞİÖŞÜ][\w.-]*(?:\s+(?:PRM|CRM|HIS|LIS|PACS|RIS|ERP))?\b/g) || [];
  const STOP = /^(Bu|Bir|Biz|Hasta|Hastalar|Hastane|Laboratuvar|Radyoloji|Patoloji|Yapay|Model|Sistem|Çağrı|Cagri|Ama|Ancak|Ayrıca|Ayrica|Ve|Ile|İle|Muayene|Tıbbi|Tibbi|Stok|Vardiya|Chatbot|Kendi|Bizim|Henüz|Henuz)$/i;
  for (const k of known) {
    const w = k.trim();
    if (w.length < 3 || w.length > 40 || STOP.test(w)) continue;
    const isBrand = /[a-zçğıöşü][A-ZÇĞİÖŞÜ]/.test(w) || /\d/.test(w) || /\b(PRM|CRM|HIS|LIS|PACS|RIS|ERP)\b/.test(w);
    if (isBrand && !GENERIC.has(w.toUpperCase())) names.add(w);
  }
  return [...names];
}

export function analyze(text) {
  // Noktalama boşluğa çevrilir ki " ml ", " bt " gibi sınırlı kelimeler "ML," veya "BT." yazımını da yakalasın.
  const t = " " + norm(text).replace(/[,;:!?()"/]|\.(?=\s|$)/g, " ").replace(/\s+/g, " ") + " ";
  const raw = String(text);
  const found = SECTIONS.map((s) => ({
    ...s,
    score: s.words.reduce((acc, w) => (t.includes(kw(w)) ? acc + s.weight : acc), 0),
  })).filter((s) => s.score > 0);

  found.sort((a, b) => b.score - a.score);

  let section = found[0]?.code || "5.3";
  let sectionLabel = found[0]?.label || "5.3 Administrative Support";

  // Klinik bölüm varsa idari bölümü geçersiz kılar
  const clinical = found.find((s) => ["lab", "imaging", "pathology"].includes(s.key));
  if (clinical) {
    section = clinical.code;
    sectionLabel = clinical.label;
  }
  // Açıkça otonom ajan dili varsa agentic öncelik kazanır
  const agentic = found.find((s) => s.key === "agentic");
  if (agentic && !clinical) {
    section = "5.1";
    sectionLabel = "5.1 Agentic AI";
  }

  const patientChannel = has(t, ["portal", "mobil", "uygulama", "cebinden", "telefonundan", "web"].map(kw));
  const patientSignal = found.find((s) => s.key === "patient");
  // Hasta kanalı (sonuç görüntüleme, portal) laboratuvar analitiği değildir
  if (patientChannel && patientSignal && !has(t, ["analiz", "tahmin", "skor", "erken uyar"].map(kw))) {
    section = "5.7";
    sectionLabel = "5.7 Patient Support";
  }
  // Dikte/transkripsiyon idari veri girişidir; ambient yalnızca klinik konuşmayı
  // arka planda dinleyip kendiliğinden not üretiyorsa geçerlidir.
  const passiveListening = has(t, ["arka planda", "otomatik not", "otomatik klinik not", "konusmayi metne", "konuşmayı metne", "muayene sirasinda dinleyen", "muayene sırasında dinleyen", "ambient"].map(kw));
  if (section === "5.2" && !passiveListening) {
    section = "5.3";
    sectionLabel = "5.3 Administrative Support";
  }
  // Çağrı merkezi operasyon analitiği formda 5.8 Other altındadır —
  // ancak sistemin ana işi idari akışsa (randevu, SMS, talep) 5.3 korunur.
  const adminTask = has(t, ["randevu", "sms", "hatirlat", "hatırlat", "fatura", "stok", "vardiya", "lojistik", "kayit", "kayıt"].map(kw));
  if (section === "5.3" && has(t, ["cagri merkezi", "çağrı merkezi"].map(kw)) && has(t, ["operator", "operatör", "performans"].map(kw)) && !adminTask) {
    section = "5.8";
    sectionLabel = "5.8 Other Purposes";
  }
  // Yalnızca analitik/ölçüm işi yapan model de 5.8'e gider
  if (section === "5.3" && has(t, ["tahmin", "ongoru", "öngörü", "analitik", "skor"].map(kw)) && !adminTask && has(t, ["merkezi", "operasyon", "cagri", "çağrı"].map(kw))) {
    section = "5.8";
    sectionLabel = "5.8 Other Purposes";
  }

  const hasAI = has(t, AI_WORDS.map(kw));
  const pilot = has(t, PILOT.map(kw));
  const clinicalRisk = has(t, CLINICAL_RISK.map(kw));
  const remote = has(t, ["portal", "mobil", "uygulama", "uzaktan", "internet", "web", "cebinden", "telefonundan"].map(kw));
  const portal = has(t, ["portal", "hasta uygulama", "mobil uygulama", "hasta mobil", "cebinden", "telefonundan"].map(kw));
  const toolNames = extractToolNames(raw);
  // Klinik bölümde canlı AI: form "No" bırakılamaz, alanlar doldurulmalı
  const clinicalLive = ["5.4", "5.5", "5.6"].includes(section) && hasAI && !pilot;
  const diagnostic = clinicalRisk || has(t, ["tespit", "detect", "diagnos", "tani koy", "tanı koy"].map(kw));

  // Görev kutuları
  const tasks = [];
  for (const sec of ["5.3", "5.7", "5.5", "5.6", "5.4"]) {
    if (!section.startsWith(sec)) continue;
    for (const m of TASK_MAP[sec] || []) {
      if (m.words.some((w) => t.includes(kw(w))) && !tasks.includes(m.label)) tasks.push(m.label);
    }
  }

  // Karar
  let verdict;
  let why;
  if (!hasAI) {
    verdict = "yazilmamali";
    why = "Metinde AI/ML bileşeni tanımlanmamış. Kural tabanlı bir sistem AI maddesine yazılırsa kanıt istendiğinde çelişki doğar.";
  } else if (clinicalLive) {
    verdict = "kosullu";
    why = "Klinik bölümde canlı AI beyanı yüksek risklidir: tıbbi cihaz kaydı ve klinisyenin son onayı kanıtlanabilmeli. Bu beyan formdaki diğer 'No' cevaplarıyla da tutarlı hâle getirilmeli.";
  } else if (clinicalRisk) {
    verdict = "kosullu";
    why = "Klinik karar veya bireysel performans etkisi var. Bu alan yüksek risklidir; yalnızca daraltılmış kapsam ve insan gözetimi ile yazılmalı.";
  } else if (pilot) {
    verdict = "kosullu";
    why = "Sistem henüz canlı kullanımda değil (demo/pilot/değerlendirme). Bu, kullanım maddesine değil planlama seçeneğine yazılmalı.";
  } else {
    verdict = "yazilabilir";
    why = "Kullanım amacı ve AI bileşeni form maddesiyle örtüşüyor; operasyonel/idari kapsamda kalındığı sürece yazılabilir.";
  }

  // Bölüm kodu (5.1 vb.)
  const secCode = section;
  const ctx = { toolNames: toolNames.join("; "), tasks, remote, portal, pilot, diagnostic };
  const fields = clinicalLive
    ? clinicalLiveFields(secCode, ctx)
    : (FIELDS[secCode] || []).map((f) => ({ ...f, deger: f.deger(ctx) }));

  const areaText =
    tasks.length > 0
      ? tasks.map((x) => x.split("(")[0].trim().toLowerCase()).join(", ")
      : section === "5.7"
        ? "patient enquiries and multilingual support"
        : section === "5.5" || section === "5.6"
          ? "diagnostic image analysis"
          : "operational workflows";

  const draft = (DRAFTS[secCode] || DRAFTS["5.3"])({ areaText, toolNames: toolNames.join("; "), pilot, live: clinicalLive });

  const risks = [];
  if (clinicalRisk) risks.push("Klinik/triyaj/performans iddiası doğrulama ve insan gözetimi olmadan yazılırsa kanıt aşamasında çelişki doğar.");
  if (!hasAI) risks.push("Kural tabanlı sistemi AI olarak sunmak, formun bütünlüğünü riske atar.");
  if (clinicalLive) {
    risks.push("Klinik AI canlı beyan edilince tıbbi cihaz kaydı/CE işareti ve validasyon kanıtı istenebilir; 'accurate', 'AI diagnoses' gibi kanıtsız iddialar yazılmamalı.");
    risks.push("Bu beyan 5.8.3 ve 5.9.2'deki klinik kutularla ve formdaki önceki 'No' cevaplarıyla tutarlı olmalı.");
  }
  if (pilot) risks.push("Demo/pilot aşamasındaki çözümü 'kullanılıyor' gibi yazmak, alt maddelerde oran sorulduğunda tutarsızlık yaratır.");
  if (section === "5.7" && portal) risks.push("Portal varsa 5.7.1 'within hospital only' seçilemez; uzaktan erişim beyanı ile çelişir.");
  if (section === "5.8" && has(t, ["operator", "operatör", "calisan", "çalışan", "personel"].map(kw)))
    risks.push("Çalışan verisi analizi bireysel performans değerlendirmesi gibi okunabilir; agregat analiz ve insan kararı vurgulanmalı.");
  if (risks.length === 0) risks.push("Kanıt dosyasında kimlik, ham ses veya serbest metin bulunmamalı.");

  // Alternatif konum
  let alternatif = null;
  if (!hasAI) {
    const alt = section.startsWith("5.5") || section.startsWith("5.6") || section.startsWith("5.4")
      ? "Klinik bölümde 'No' bırakılmalı; sistem IT envanterinde anılmalı, AI formuna yazılmamalı."
      : "AI formuna yazılmamalı. AI bileşeni eklenirse 5.3.2 (araç) + 5.3.3 (görev) alanlarına yazılabilir.";
    alternatif = alt;
  } else if (pilot) {
    alternatif = `${sectionLabel} → kullanım maddesinde "Not yet, but this is planned or in early stages" seçilmeli; alt madde adı/oran alanları boş bırakılmalı.`;
  } else if (clinicalLive) {
    alternatif = `Klinik kapsam: ${secCode}.1 (düzey) + ${secCode}.2 (araç adı) + ${secCode}.3 (görev kutuları) + ${secCode}.4 (oran). 5.9.2'de ilgili klinik kategori de işaretlenmeli.`;
  } else if (section === "5.7") {
    alternatif = "Hasta kanalıdır: 5.7.1 (kanal) + 5.7.2 (araç) + 5.7.3 (görev) + 5.7.4 (portal). İdari tarafı varsa 5.3.3'e de yazılır.";
  } else if (section === "5.3") {
    alternatif = "İdari kapsam: 5.3.1 (düzey) + 5.3.2 (araç adı) + 5.3.3 (görev kutuları) + 5.3.4 (oran).";
  }

  return {
    verdict,
    gerekce_kural: why,
    ana_madde: sectionLabel,
    madde_kodu: secCode,
    alanlar: fields,
    taslak_metin: draft,
    riskler: risks.slice(0, 3),
    sorulacak_soru: QUESTIONS[secCode] || QUESTIONS["5.3"],
    alternatif,
    sinyaller: { hasAI, pilot, clinicalRisk, tasks, toolNames, section },  };
}

export { norm };
