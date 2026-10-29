// Model zinciri teşhisi: her ücretsiz modele tek bir kısa istek atar.
// Kullanım:  node app/check-models.mjs
import { CHAIN, KEY } from "./lib/llm.mjs";

if (!KEY) {
  console.log("API anahtarı yok: app/.key dosyasına OpenRouter anahtarını yazın.");
  process.exit(1);
}

const probe = `Sadece şu JSON'u döndür: {"ok":true,"dil":"tr","madde":"5.3.2"}`;

console.log(`Anahtar: ${KEY.slice(0, 12)}…${KEY.slice(-4)}`);
console.log(`Zincir: ${CHAIN.length} ücretsiz model\n`);

let alive = 0;
for (const m of CHAIN) {
  const t0 = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:4173",
        "X-Title": "Statista AI Form Assistant",
      },
      body: JSON.stringify({
        model: m.id,
        temperature: 0,
        max_tokens: 600,
        messages: [{ role: "user", content: probe }],
      }),
    });
    const ms = Date.now() - t0;
    const txt = await res.text();
    if (!res.ok) {
      let hint = txt.slice(0, 110).replace(/\s+/g, " ");
      if (res.status === 429) hint = "ücretsiz günlük kota dolu (429)";
      console.log(`✗ ${m.short.padEnd(26)} ${String(ms).padStart(6)}ms  ${res.status}  ${hint}`);
      continue;
    }
    const j = JSON.parse(txt);
    const content = j.choices?.[0]?.message?.content || "";
    const ok = /\{[\s\S]*"ok"[\s\S]*\}/.test(content);
    console.log(`${ok ? "✓" : "~"} ${m.short.padEnd(26)} ${String(ms).padStart(6)}ms  ${j.usage?.total_tokens ?? "?"} token  ${ok ? "JSON geçerli" : "yanıt var, JSON zayıf"}`);
    if (ok) alive++;
  } catch (e) {
    console.log(`✗ ${m.short.padEnd(26)} ${String(Date.now() - t0).padStart(6)}ms  ${e.name}`);
  }
}

console.log(`\nSağlıklı model: ${alive}/${CHAIN.length}`);
if (alive === 0) {
  console.log("Hepsi yanıt vermediyse: günlük ücretsiz kota dolmuş olabilir (00:00 UTC'de yenilenir).");
  console.log("Uygulama bu durumda kural modunda çalışmaya devam eder.");
}
