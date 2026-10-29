import { KEY } from "./lib/llm.mjs";

const MODELS = [
  "nvidia/nemotron-3.5-lightning:free",
  "recursive/flint-v1.0:free",
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "dots-studio/dots-3-note-preview:free",
  "xingchen-agi/xing4.0-29b-a4b:free",
  "liquid/lfm-2.5-2.6b:free",
];

const SYS = `Sen bir hastane mevzuat analistisin. Hastanenin yazdığı sistem açıklamasını Statista Smart Hospitals formunun Bölüm 5 (AI) maddelerine yerleştirirsin.
Maddeler: 5.1 Agentic AI, 5.2 Ambient AI, 5.3 Administrative Support, 5.4 Laboratory, 5.5 Imaging, 5.6 Pathology, 5.7 Patient Support, 5.8 Other, 5.9 AI Tool Support.
Sadece JSON döndür: {"verdict":"yazilabilir|kosullu|yazilmamali","madde":"5.3.2","madde_adi":"...","gerekce":"...","kutular":["..."],"taslak_metin":"...","riskler":["..."],"sorulacak_soru":"..."}
Türkçe yaz.`;

const USER = `Sistem: "Pusula PRM adlı CRM yazılımı randevu hatırlatma SMS'i gönderiyor, hasta taleplerini ilgili birime yönlendiriyor ve çağrı merkezi operatörlerinin performansını raporluyor." Formda nereye yazılabilir?`;

async function once(model) {
  const t0 = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);
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
        model,
        temperature: 0.2,
        max_tokens: 1200,
        messages: [
          { role: "system", content: SYS },
          { role: "user", content: USER },
        ],
      }),
    });
    clearTimeout(timer);
    const dt = Date.now() - t0;
    if (!res.ok) return { ok: false, dt, err: `${res.status} ${(await res.text()).slice(0, 160)}` };
    const j = await res.json();
    if (j.error) return { ok: false, dt, err: j.error.message?.slice(0, 160) };
    const msg = j.choices?.[0]?.message;
    const text = msg?.content || "";
    return { ok: true, dt, text, reasoning: msg?.reasoning?.slice(0, 120), usage: j.usage };
  } catch (e) {
    return { ok: false, dt: Date.now() - t0, err: e.name === "AbortError" ? "TIMEOUT" : e.message };
  }
}

for (const model of MODELS) {
  console.log("=".repeat(72));
  console.log(model);
  let r;
  for (let i = 0; i < 3; i++) {
    r = await once(model);
    console.log(`  try${i + 1}: ${r.dt}ms ${r.ok ? "OK chars=" + r.text.length : "ERR " + r.err}`);
    if (r.ok && r.text.trim().length > 20) break;
    await new Promise((s) => setTimeout(s, 2500));
  }
  if (r.ok) {
    const m = r.text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        const p = JSON.parse(m[0]);
        console.log("  madde:", p.madde, "| verdict:", p.verdict);
        console.log("  gerekce:", (p.gerekce || "").slice(0, 200));
      } catch (e) {
        console.log("  JSON PARSE FAIL; raw:", r.text.slice(0, 200).replace(/\n/g, " "));
      }
    } else {
      console.log("  no json; raw:", r.text.slice(0, 200).replace(/\n/g, " "));
    }
  }
  await new Promise((s) => setTimeout(s, 1200));
}
