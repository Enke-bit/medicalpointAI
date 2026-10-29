import { KEY } from "./lib/llm.mjs";

const MODELS = [
  "dots-studio/dots-3-note-preview:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3.5-lightning:free",
  "recursive/flint-v1.0:free",
  "poolside/laguna-s-2.1:free",
  "cohere/north-mini-code:free",
  "thinkingmachines/inkling-small:free",
  "nvidia/nemotron-3.5-super-vl:free",
  "google/gemma-4-31b-it:free",
];

const SYS = `Hastane sistemlerini Statista Bölüm 5 AI maddelerine yerleştiren bir analistsin.
Maddeler: 5.1 Agentic, 5.2 Ambient, 5.3 Administrative, 5.4 Laboratory, 5.5 Imaging, 5.6 Pathology, 5.7 Patient Support, 5.8 Other, 5.9 Support.
Sadece JSON: {"verdict":"yazilabilir|kosullu|yazilmamali","madde":"5.3.2","madde_adi":"kisa","gerekce":"2 cumle","kutular":["..."],"taslak_metin":"English form text","riskler":["..."],"sorulacak_soru":"1 soru"}`;

const TESTS = [
  "Pusula PRM adlı CRM yazılımı randevu hatırlatma SMS'i gönderiyor ve hasta taleplerini birimlere yönlendiriyor.",
  "Hastaların cep telefonundan laboratuvar sonuçlarını gördüğü hasta portalı.",
  "Çağrı merkezinde geliştirilen model operatör bazlı performans skoru üretiyor.",
];

async function ask(model, text) {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 50000);
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
        model,
        temperature: 0.1,
        max_tokens: 900,
        messages: [
          { role: "system", content: SYS },
          { role: "user", content: text },
        ],
      }),
    });
    const dt = Date.now() - t0;
    if (!res.ok) return { dt, ok: false, err: `${res.status}`, body: (await res.text()).slice(0, 150) };
    const j = await res.json();
    if (j.error) return { dt, ok: false, err: j.error.code || "err", body: (j.error.message || "").slice(0, 150) };
    const msg = j.choices?.[0]?.message || {};
    const raw = msg.content || "";
    if (!raw.trim()) return { dt, ok: false, err: "empty", body: `finish=${j.choices?.[0]?.finish_reason} reasoning=${(msg.reasoning || "").slice(0, 80)}` };
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return { dt, ok: false, err: "nojson", body: raw.slice(0, 150) };
    try {
      const p = JSON.parse(m[0]);
      if (!p.madde) return { dt, ok: false, err: "schema", body: raw.slice(0, 150) };
      return { dt, ok: true, p };
    } catch {
      return { dt, ok: false, err: "parse", body: raw.slice(-150) };
    }
  } catch (e) {
    return { dt: Date.now() - t0, ok: false, err: e.name === "AbortError" ? "TIMEOUT" : e.name, body: e.message.slice(0, 100) };
  } finally {
    clearTimeout(timer);
  }
}

for (const model of MODELS) {
  let ok = 0;
  let times = [];
  const lines = [];
  for (const t of TESTS) {
    const r = await ask(model, t);
    if (r.ok) {
      ok++;
      times.push(r.dt);
      lines.push(`    ✓ ${r.dt}ms ${r.p.madde} ${r.p.verdict}`);
    } else {
      lines.push(`    ✗ ${r.dt}ms ${r.err} | ${r.body}`);
    }
    await new Promise((s) => setTimeout(s, 700));
  }
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : "-";
  console.log(`${model}  →  ${ok}/3 ok, avg ${avg}ms`);
  console.log(lines.join("\n"));
}
