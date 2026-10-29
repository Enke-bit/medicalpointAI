import { KEY } from "./lib/llm.mjs";
const MODELS = ["poolside/laguna-s-2.1:free", "cohere/north-mini-code:free"];

const SYS = `Rol: Hastane mevzuat ve form analisti. Görev: hastanenin anlattığı sistemi Statista Smart Hospitals Bölüm 5 (AI) maddelerine yerleştirmek.

KARAR MANTIĞI (sırayla uygula):
1) Sistemde gerçekten AI/ML bileşeni var mı? (model, tahmin, skor, sınıflandırma, NLP, görüntü analizi, LLM)
   - Yok ve tamamen kural tabanlıysa → verdict "kosullu": "AI bileşeni eklenirse şu maddeye yazılır" de.
   - Belirsizse → "kosullu" + netleştirme sorusu.
2) Kullanım amacına göre madde seç:
   5.1 Agentic AI = kullanıcı adına çok adımlı otonom işlem
   5.2 Ambient AI = arka planda klinik konuşmayı dinleyip dokümantasyon
   5.3 Administrative = randevu, veri girişi, faturalama, stok/lojistik, vardiya, çağrı merkezi operasyonu, iç süreç
   5.4 Laboratory / 5.5 Imaging / 5.6 Pathology = klinik tanı-analitik
   5.7 Patient Support = hasta portalı, hasta mobil uygulaması, çeviri, ilk hat hasta talebi, taburculuk sonrası takip
   5.8 Other = yukarıdakilere girmeyen operasyonel analitik
   5.9 Support = kurumsal destek/eğitim
3) Aynı sistem birden fazla maddeye girebilir; en güçlü olanı "madde", diğerlerini "diger_maddeler" alanına yaz.
4) Klinik tanı/tedavi iddiası, triyaj, kimlik doğrulama, çalışan performans skoru = risk. Kanıt yoksa "yazilmamali" veya "kosullu".
5) "sertifika", "ISO", "GDPR compliant", "HIPAA" kelimelerini kullanma.

SADECE JSON:
{"verdict":"yazilabilir|kosullu|yazilmamali","madde":"5.3.2","madde_adi":"kisa ad","gerekce":"2 cumle Turkce","kutular":["isaretlenecek kutu veya allanacak cevap"],"taslak_metin":"English text for the form field","riskler":["risk"],"diger_maddeler":["5.3.3"],"sorulacak_soru":"tek soru"}`;

const TESTS = [
  "Pusula PRM adlı CRM yazılımı randevu hatırlatma SMS'i gönderiyor ve hasta taleplerini birimlere yönlendiriyor.",
  "Hastaların cep telefonundan laboratuvar sonuçlarını gördüğü hasta portalı.",
  "Çağrı merkezinde geliştirdiğimiz model operatörlerin ortalama görüşme süresini tahmin ediyor ve operatör bazlı skor üretiyor.",
  "Radyoloji için akciğer nodülü tespit eden yapay zeka demosu yapıldı ama henüz satın alınmadı.",
  "Laboratuvar bilgi sisteminde kritik değer uyarıları ve otomatik doğrulama kuralları var.",
];

function repairJson(s) {
  const start = s.indexOf("{");
  if (start < 0) return null;
  const str = s.slice(start);
  for (let end = str.length; end > 0; end--) {
    if (end < str.length && !/[,}\]"]/.test(str[end - 1])) continue;
    let cand = str.slice(0, end);
    let open = 0, inStr = false, esc = false;
    for (const ch of cand) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') inStr = !inStr;
      else if (!inStr && ch === "{") open++;
      else if (!inStr && ch === "}") open--;
    }
    if (inStr) cand += '"';
    if (open > 0) cand += "}".repeat(open);
    cand = cand.replace(/,\s*$/, "");
    try { const p = JSON.parse(cand); if (p && p.madde) return p; } catch {}
  }
  return null;
}

async function ask(model, text) {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "HTTP-Referer": "http://localhost", "X-Title": "Statista Assistant" },
      body: JSON.stringify({ model, temperature: 0.2, max_tokens: 2600, messages: [{ role: "system", content: SYS }, { role: "user", content: text }] }),
    });
    const dt = Date.now() - t0;
    if (!res.ok) return { dt, ok: false, err: `${res.status}` };
    const j = await res.json();
    if (j.error) return { dt, ok: false, err: String(j.error.code || "err") };
    const raw = j.choices?.[0]?.message?.content || "";
    if (!raw.trim()) return { dt, ok: false, err: "empty" };
    const p = repairJson(raw);
    return p ? { dt, ok: true, p } : { dt, ok: false, err: "nojson" };
  } catch (e) {
    return { dt: Date.now() - t0, ok: false, err: e.name === "AbortError" ? "TIMEOUT" : e.name };
  } finally { clearTimeout(timer); }
}

for (const model of MODELS) {
  console.log("#".repeat(70)); console.log(model);
  let ok = 0; const times = [];
  for (const t of TESTS) {
    const r = await ask(model, t);
    console.log("-".repeat(60));
    console.log(t.slice(0, 65));
    if (r.ok) {
      ok++; times.push(r.dt);
      console.log(`  ${r.dt}ms → ${r.p.madde} [${r.p.verdict}] ${r.p.madde_adi}`);
      console.log("  gerekce:", r.p.gerekce);
      console.log("  diger:", JSON.stringify(r.p.diger_maddeler));
    } else console.log(`  ERR ${r.dt}ms ${r.err}`);
    await new Promise((s) => setTimeout(s, 700));
  }
  console.log(`>>> ${ok}/5, avg ${Math.round(times.reduce((a, b) => a + b, 0) / (times.length || 1))}ms`);
}
