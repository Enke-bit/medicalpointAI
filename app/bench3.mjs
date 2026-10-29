import { KEY } from "./lib/llm.mjs";
const MODEL = "dots-studio/dots-3-note-preview:free";

const SYS = `Sen bir hastane mevzuat analistisin. Görev: hastanenin yazdığı sistem açıklamasını Statista Smart Hospitals Bölüm 5 (Artificial Intelligence) maddelerine yerleştirmek ve "buraya yazılabilir mi" sorusunu yanıtlamak.

MADDE TAKSONOMİSİ:
5.1 Agentic AI — otonom/yarı otonom ajan, kullanıcı adına çok adımlı işlem ve araç çağırma
5.2 Ambient AI — arka planda klinik görüşmeyi dinleyip otomatik dokümantasyon
5.3 Administrative Support — veri girişi, faturalama, lojistik/stok, randevu, vardiya, çağrı merkezi
5.4 Laboratory — lab verisiyle tanı/analitik
5.5 Imaging — görüntüleme tanı/analitik
5.6 Pathology — patoloji tanı/analitik
5.7 Patient Support — hasta portalı, çeviri, ilk hat talep, taburculuk sonrası takip
5.8 Other — kapsam dışı operasyonel analitik
5.9 AI Tool Support — kurumsal destek, power user

KURALLAR:
- "AI" etiketi taşımayan sistem (kural motoru, CRM, LIS, PACS, ERP) AI maddesine yazılmamalı.
- Klinik tanı/tedavi iddiası yüksek risklidir; kanıt yoksa "yazilmamali" veya "kosullu".
- Çalışan performansı izleyen sistemlerde bireysel karar riski işaretlenmeli.
- ISO veya sertifika kelimelerini kullanma.

SADECE şu JSON şemasıyla cevap ver:
{"verdict":"yazilabilir|kosullu|yazilmamali","madde":"5.3.2","madde_adi":"...","gerekce":"2-3 cümle","kutular":["işaretlenecek kutu"],"taslak_metin":"İngilizce form metni","riskler":["..."],"sorulacak_soru":"..."}
Türkçe gerekçe, İngilizce taslak.`;

const CASES = [
  "Pusula PRM adlı CRM yazılımı randevu hatırlatma SMS'i gönderiyor ve hasta taleplerini birimlere yönlendiriyor.",
  "Radyoloji için bir yapay zeka firmasıyla görüşüyoruz; akciğer nodülü tespiti için demo yapıldı ama henüz satın almadık.",
  "Laboratuvar bilgi sisteminde kritik değer uyarıları ve otomatik doğrulama kuralları var.",
  "Hastaların kendi cep telefonundan girip laboratuvar sonuçlarını gördüğü bir hasta portalımız var.",
  "Çağrı merkezinde geliştirdiğimiz model operatörlerin ortalama görüşme süresini tahmin ediyor ve operatör bazlı skor üretiyor.",
];

async function ask(text) {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Statista Assistant",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 1100,
        messages: [
          { role: "system", content: SYS },
          { role: "user", content: `Sistem: "${text}"\nBu sistem formda nereye yazılabilir?` },
        ],
      }),
    });
    const dt = Date.now() - t0;
    if (!res.ok) return { dt, err: `${res.status} ${(await res.text()).slice(0, 120)}` };
    const j = await res.json();
    const raw = j.choices?.[0]?.message?.content || "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return { dt, err: "no json", raw: raw.slice(0, 150) };
    try {
      return { dt, p: JSON.parse(m[0]) };
    } catch {
      return { dt, err: "parse fail", raw: raw.slice(0, 200) };
    }
  } catch (e) {
    return { dt: Date.now() - t0, err: e.name === "AbortError" ? "TIMEOUT" : e.message };
  } finally {
    clearTimeout(timer);
  }
}

for (const [i, c] of CASES.entries()) {
  const r = await ask(c);
  console.log("-".repeat(72));
  console.log(`CASE ${i + 1} (${r.dt}ms): ${c.slice(0, 70)}`);
  if (r.err) {
    console.log("  ERR:", r.err, r.raw || "");
  } else {
    console.log(`  MADDE ${r.p.madde} | ${r.p.verdict} | ${r.p.madde_adi}`);
    console.log("  gerekce:", r.p.gerekce);
    console.log("  kutular:", JSON.stringify(r.p.kutular));
    console.log("  risk:", JSON.stringify(r.p.riskler));
    console.log("  soru:", r.p.sorulacak_soru);
  }
  await new Promise((s) => setTimeout(s, 800));
}
