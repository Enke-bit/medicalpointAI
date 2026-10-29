import { analyze } from "./lib/rules.mjs";

const CASES = [
  "Pusula PRM adlı CRM yazılımı randevu hatırlatma SMS'i gönderiyor ve hasta taleplerini birimlere yönlendiriyor.",
  "Hastaların cep telefonundan laboratuvar sonuçlarını gördüğü hasta portalı.",
  "Çağrı merkezinde geliştirdiğimiz model operatörlerin ortalama görüşme süresini tahmin ediyor ve operatör bazlı skor üretiyor.",
  "Radyoloji için akciğer nodülü tespit eden yapay zeka demosu yapıldı ama henüz satın alınmadı.",
  "Laboratuvar bilgi sisteminde kritik değer uyarıları ve otomatik doğrulama kuralları var.",
  "Patoloji için hücre sayımı yapan bir yapay zeka modülü satın aldık, canlıda kullanıyoruz.",
  "Muayene odasında doktor-hasta görüşmesini dinleyip otomatik klinik not üreten ambient AI pilotu başlatıyoruz.",
  "Chatbotumuz hastaların taleplerini kendi başına yönlendiriyor, randevu oluşturuyor ve son onay insanda.",
  "Vardiya planlaması için makine öğrenmesi modeli kullanıyoruz, hemşire çizelgesini optimize ediyor.",
  "Stok ve malzeme siparişleri için tahmin modeli geliştirdik, depoda canlı çalışıyor.",
  "Tıbbi sekreterlik için ses dikte sistemi var, doktorun söylediğini metne çeviriyor.",
  "Hasta sonuçlarını açıklayan çeviri uygulaması translate.medguide.app kullanıyoruz.",
];

let pass = 0;
for (const [i, c] of CASES.entries()) {
  const r = analyze(c);
  console.log("-".repeat(74));
  console.log(`${i + 1}. ${c}`);
  console.log(`   → ${r.ana_madde} | ${r.verdict}`);
  console.log(`   kural: ${r.gerekce_kural.slice(0, 110)}`);
  console.log(`   alanlar: ${r.alanlar.map((a) => a.madde).join(", ")}`);
  console.log(`   görevler: ${JSON.stringify(r.sinyaller.tasks)}`);
  console.log(`   risk: ${r.riskler[0]}`);
  if (r.verdict) pass++;
}
console.log("\n" + pass + "/" + CASES.length + " üretildi");
