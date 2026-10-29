const SYS = `Hastane mevzuat analisti. Yonlendirme verilir, degistirme.
SADECE JSON: {"gerekce":"2 cumle Turkce","taslak_metin":"2-3 cumle Ingilizce","riskler":["Turkce risk"],"sorulacak_soru":"Turkce soru"}`;

const USER = `Sistem: "Radyoloji icin akciger nodulu tespit eden yapay zeka demosu yapildi, satin alinmadi."
Yonlendirme: 5.5 Imaging | karar: kosullu | pilot: evet`;

async function viaPost(model, maxTokens) {
  const t0 = Date.now();
  const r = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: SYS },
        { role: "user", content: USER },
      ],
    }),
  });
  const txt = await r.text();
  return { ms: Date.now() - t0, status: r.status, len: txt.length, head: txt.slice(0, 120).replace(/\s+/g, " ") };
}

async function viaGet(model) {
  const t0 = Date.now();
  const u = `https://text.pollinations.ai/${encodeURIComponent(`${SYS}\n\n${USER}`)}?model=${model}&json=true`;
  const r = await fetch(u, { signal: AbortSignal.timeout(45000) });
  const txt = await r.text();
  return { ms: Date.now() - t0, status: r.status, len: txt.length, head: txt.slice(0, 120).replace(/\s+/g, " ") };
}

for (const run of [
  () => viaPost("openai-fast", 400),
  () => viaGet("openai-fast"),
]) {
  try {
    const r = await run();
    console.log(`${r.ms}ms ${r.status} len=${r.len} :: ${r.head}`);
  } catch (e) {
    console.log("HATA", e.name);
  }
  await new Promise((s) => setTimeout(s, 32000));
}
