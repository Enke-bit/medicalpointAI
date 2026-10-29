import { KEY } from "./lib/llm.mjs";

const MODELS = ["cohere/north-mini-code:free", "poolside/laguna-s-2.1:free", "nvidia/nemotron-3-ultra-550b-a55b:free"];

const SYS = `Hastane sistemlerini Statista Bölüm 5 AI maddelerine yerleştiren bir analistsin.
Maddeler: 5.1 Agentic, 5.2 Ambient, 5.3 Administrative Support, 5.4 Laboratory, 5.5 Imaging, 5.6 Pathology, 5.7 Patient Support, 5.8 Other, 5.9 AI Tool Support.
Kural: AI olmayan sistem (CRM, LIS, PACS, kural motoru) AI maddesine yazılmaz.
SADECE JSON döndür:
{"verdict":"yazilabilir|kosullu|yazilmamali","madde":"5.3.2","madde_adi":"kisa ad","gerekce":"2 cumle","kutular":["kutu"],"taslak_metin":"English form text","riskler":["risk"],"sorulacak_soru":"1 soru"}`;

const TESTS = [
  "Pusula PRM adlı CRM yazılımı randevu hatırlatma SMS'i gönderiyor ve hasta taleplerini birimlere yönlendiriyor.",
  "Hastaların cep telefonundan laboratuvar sonuçlarını gördüğü hasta portalı.",
  "Çağrı merkezinde geliştirilen model operatör bazlı performans skoru üretiyor.",
  "Radyoloji için akciğer nodülü tespit eden AI demosu yapıldı ama satın alınmadı.",
];

function repairJson(s) {
  const start = s.indexOf("{");
  if (start < 0) return null;
  let str = s.slice(start);
  const lastClose = str.lastIndexOf("}");
  // try progressively shorter prefixes closing braces
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
    try {
      const p = JSON.parse(cand);
      if (p && p.madde) return p;
    } catch {}
    if (end < str.length - 4000) break;
  }
  return null;
}

async function ask(model, text) {
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
        model,
        temperature: 0.1,
        max_tokens: 2600,
        messages: [
          { role: "system", content: SYS },
          { role: "user", content: text },
        ],
      }),
    });
    const dt = Date.now() - t0;
    if (!res.ok) return { dt, ok: false, err: `${res.status}` };
    const j = await res.json();
    if (j.error) return { dt, ok: false, err: String(j.error.code || "err") };
    const msg = j.choices?.[0]?.message || {};
    const raw = msg.content || "";
    if (!raw.trim()) return { dt, ok: false, err: "empty:finish=" + j.choices?.[0]?.finish_reason };
    const p = repairJson(raw);
    if (!p) return { dt, ok: false, err: "nojson" };
    return { dt, ok: true, p, finish: j.choices?.[0]?.finish_reason };
  } catch (e) {
    return { dt: Date.now() - t0, ok: false, err: e.name === "AbortError" ? "TIMEOUT" : e.name };
  } finally {
    clearTimeout(timer);
  }
}

for (const model of MODELS) {
  let ok = 0; const times = []; const out = [];
  for (const t of TESTS) {
    const r = await ask(model, t);
    if (r.ok) { ok++; times.push(r.dt); out.push(`    ✓ ${r.dt}ms ${r.finish} ${r.p.madde} ${r.p.verdict} | ${String(r.p.gerekce).slice(0, 70)}`); }
    else out.push(`    ✗ ${r.dt}ms ${r.err}`);
    await new Promise((s) => setTimeout(s, 600));
  }
  console.log(`${model} → ${ok}/4 ok, avg ${times.length ? Math.round(times.reduce((a, b) => a + b) / times.length) : "-"}ms`);
  console.log(out.join("\n"));
}
