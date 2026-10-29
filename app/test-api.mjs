const cases = [
  "Pusula PRM adlı CRM yazılımı randevu hatırlatma SMS'i gönderiyor, hasta taleplerini birimlere yönlendiriyor ve çağrı merkezi operatörlerinin performansını raporluyor.",
  "Radyoloji için akciğer nodülü tespit eden yapay zeka demosu yapıldı ama henüz satın alınmadı.",
  "Muayene odasında doktor-hasta görüşmesini arka planda dinleyip otomatik klinik not üreten ambient AI pilotu başlatıyoruz.",
  "Hastalar cep telefonundan laboratuvar sonuçlarını görüntüleyebiliyor, çeviri desteği de var.",
];

for (const [i, text] of cases.entries()) {
  const t0 = Date.now();
  const res = await fetch("http://localhost:4173/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const d = await res.json();
  console.log("=".repeat(74));
  console.log(`CASE ${i + 1} (${Date.now() - t0}ms sunucu:${d.toplam_ms}ms) kaynak=${d.kaynak} model=${d.model || "-"} model_ms=${d.model_ms || "-"}`);
  console.log(`  ${d.ana_madde} | ${d.verdict}`);
  console.log(`  gerekce: ${d.gerekce}`);
  console.log(`  taslak: ${d.taslak_metin.slice(0, 150)}`);
  console.log(`  riskler: ${JSON.stringify(d.riskler)}`);
  console.log(`  alanlar: ${d.alanlar.map((a) => a.madde + "=" + String(a.deger).slice(0, 32)).join(" | ")}`);
  console.log(`  denemeler: ${JSON.stringify((d.denemeler || []).map((x) => `${x.model.split("/")[0]}:${x.ok ? "ok" : x.code || x.err}`))}`);
  await new Promise((s) => setTimeout(s, 500));
}
