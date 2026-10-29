const text = "Pusula PRM adlı CRM yazılımı randevu hatırlatma SMS'i gönderiyor, hasta taleplerini birimlere yönlendiriyor ve çağrı merkezi operatörlerinin performansını raporluyor.";

const t0 = Date.now();
const a = await fetch("http://localhost:4173/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text }),
}).then((r) => r.json());
console.log(`ANALYZE ${Date.now() - t0}ms → ${a.ana_madde} | ${a.verdict}`);
console.log("  alanlar:", a.alanlar.map((x) => `${x.madde}=${x.deger}`).join(" | "));

const t1 = Date.now();
const e = await fetch("http://localhost:4173/api/enrich", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text }),
}).then((r) => r.json());
console.log(`\nENRICH ${Date.now() - t1}ms ok=${e.ok} kaynak=${e.kaynak} model=${e.model || "-"} provider=${e.provider || "-"}`);
console.log("  denemeler:", JSON.stringify(e.denemeler || []));
if (e.ok) {
  console.log("  gerekce:", e.gerekce);
  console.log("  taslak:", e.taslak_metin);
  console.log("  riskler:", JSON.stringify(e.riskler));
  console.log("  soru:", e.sorulacak_soru);
} else {
  console.log("  reason:", e.reason);
}
