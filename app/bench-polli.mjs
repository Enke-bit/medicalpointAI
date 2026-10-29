const SYS = `Hastane sistemlerini Statista Bölüm 5 (AI) formuna yerleştiren analistsin. Yönlendirme verilir, değiştirme.
SADECE JSON: {"gerekce":"2 cumle Turkce","taslak_metin":"2-3 cumle Ingilizce form metni","riskler":["risk"],"sorulacak_soru":"1 soru"}
"sertifika", "ISO", "GDPR compliant", "HIPAA" kullanma.`;

const USER = `Sistem: "Pusula PRM adlı CRM yazılımı randevu hatırlatma SMS'i gönderiyor, hasta taleplerini birimlere yönlendiriyor ve çağrı merkezi operatörlerinin performansını raporluyor."
Yönlendirme: 5.3 Administrative Support, karar: yazilabilir, görevler: patient services + data entry.`;

for (const model of ["openai", "openai-fast", "openai-large"]) {
  const t0 = Date.now();
  try {
    const r = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(60000),
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 600,
        messages: [
          { role: "system", content: SYS },
          { role: "user", content: USER },
        ],
      }),
    });
    const ms = Date.now() - t0;
    const txt = await r.text();
    console.log(`\n${model}: ${r.status} ${ms}ms len=${txt.length}`);
    console.log("  ", txt.slice(0, 400).replace(/\s+/g, " "));
  } catch (e) {
    console.log(`\n${model}: HATA ${Date.now() - t0}ms ${e.name}`);
  }
  await new Promise((s) => setTimeout(s, 32000));
}
