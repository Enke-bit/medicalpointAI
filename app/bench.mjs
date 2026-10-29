import { KEY } from "./lib/llm.mjs";

const MODELS = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3.5-lightning:free",
  "thinkingmachines/inkling:free",
  "recursive/flint-v1.0:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
];

const SYS = `Sen bir hastane mevzuat analistisin. Görev: hastanenin yazdığı sistem açıklamasını, Statista Smart Hospitals formunun Bölüm 5 (AI) maddelerine yerleştirmek.

Madde taksonomisi:
5.1.1-5.1.6 Agentic AI (otonom çok adımlı ajan)
5.2.1-5.2.7 Ambient AI (arka planda dinleyip dokümantasyon)
5.3.1-5.3.4 Administrative Support (veri girişi, faturalama, lojistik, randevu, vardiya)
5.4.1-5.4.4 Laboratory
5.5.1-5.5.4 Imaging
5.6.1-5.6.4 Pathology
5.7.1-5.7.5 Patient Support (portal, çeviri, ilk hat talep)
5.8.1-5.8.3 Other
5.9.1-5.9.2 AI Tool Support

Sadece şu JSON şemasıyla cevap ver, başka metin yazma:
{"verdict":"yazilabilir|kosullu|yazilmamali","madde":"5.3.2","madde_adi":"...","gerekce":"...","kutular":["..."],"taslak_metin":"...","riskler":["..."],"sorulacak_soru":"..."}
Türkçe yaz. "sertifika" veya "ISO" kelimelerini kullanma.`;

const USER = `Hastane sistemi: "Pusula PRM adlı CRM yazılımı randevu hatırlatma SMS'i gönderiyor, hasta taleplerini ilgili birime yönlendiriyor ve çağrı merkezi operatörlerinin performansını raporluyor." Bu sistem formda nereye yazılabilir?`;

async function test(model) {
  const t0 = Date.now();
  let ttft = null;
  let text = "";
  let err = null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 90000);
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Statista AI Form Assistant",
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: 0.2,
        max_tokens: 900,
        messages: [
          { role: "system", content: SYS },
          { role: "user", content: USER },
        ],
      }),
    });
    if (!res.ok) {
      err = `${res.status} ${(await res.text()).slice(0, 200)}`;
    } else {
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          const l = line.trim();
          if (!l.startsWith("data:")) continue;
          const payload = l.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const j = JSON.parse(payload);
            if (j.error) err = j.error.message;
            const d = j.choices?.[0]?.delta?.content;
            if (d) {
              if (ttft === null) ttft = Date.now() - t0;
              text += d;
            }
          } catch {}
        }
      }
    }
    clearTimeout(timer);
  } catch (e) {
    err = e.name === "AbortError" ? "TIMEOUT 90s" : e.message;
  }
  const total = Date.now() - t0;
  let jsonOk = false;
  let parsed = null;
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      parsed = JSON.parse(m[0]);
      jsonOk = !!parsed.madde && !!parsed.verdict;
    } catch {}
  }
  return { model, ttft, total, chars: text.length, jsonOk, err, parsed, raw: text.slice(0, 300) };
}

const results = await Promise.all(MODELS.map(test));
for (const r of results) {
  console.log("=".repeat(70));
  console.log(r.model);
  console.log(
    `  ttft=${r.ttft ?? "-"}ms total=${r.total}ms chars=${r.chars} json=${r.jsonOk}${r.err ? " ERR=" + r.err : ""}`
  );
  if (r.parsed) {
    console.log("  madde:", r.parsed.madde, "| verdict:", r.parsed.verdict);
    console.log("  gerekce:", (r.parsed.gerekce || "").slice(0, 160));
    console.log("  riskler:", JSON.stringify(r.parsed.riskler || []).slice(0, 160));
  } else {
    console.log("  raw:", r.raw.replace(/\n/g, " ").slice(0, 200));
  }
}
