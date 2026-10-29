const $ = (s) => document.querySelector(s);
const el = (tag, cls, txt) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt !== undefined) n.textContent = txt;
  return n;
};

const VERDICT = {
  yazilabilir: { cls: "v-ok", label: "YAZILABİLİR", note: "Bu sistemi formda bu maddeye yazabilirsiniz." },
  kosullu: { cls: "v-warn", label: "KOŞULLU", note: "Yazılabilir, ancak kapsamı daraltılmalı veya bir bilgi netleşmeli." },
  yazilmamali: { cls: "v-stop", label: "YAZILMAMALI", note: "Bu haliyle AI maddesine yazılmamalı. Alternatif aşağıda." },
};

const EXAMPLES = {
  "CRM / randevu sistemi":
    "Pusula PRM adlı CRM yazılımı randevu hatırlatma SMS'i gönderiyor, hasta taleplerini ilgili birimlere yönlendiriyor ve çağrı merkezi operatörlerinin performansını raporluyor.",
  "Radyoloji AI demosu":
    "Radyoloji için akciğer nodülü tespit eden bir yapay zeka firmasıyla demo yaptık; henüz satın almadık ve PACS'e bağlamadık.",
  "Ambient AI pilotu":
    "Muayene odasında doktor-hasta görüşmesini arka planda dinleyip otomatik klinik not üreten ambient AI pilotunu başlatıyoruz.",
  "Hasta portalı":
    "Hastalar cep telefonundan girip laboratuvar sonuçlarını görüntüleyebiliyor; sonuç açıklamaları için çeviri de var.",
  "Çağrı merkezi modeli":
    "Çağrı merkezinde kendi ekibimizin geliştirdiği model çağrı hacmini tahmin ediyor ve operatör bazlı performans skoru üretiyor.",
};

let current = null; // { d, text }

/* ---------------- sağlık ---------------- */
function refreshHealth() {
  fetch("/api/health")
    .then((r) => r.json())
    .then((h) => {
      const s = h.saglayici || {};
      const orReady = s.openrouter === "hazır";
      const polliReady = s.pollinations === "hazır";
      $("#statusDot").classList.toggle("off", !orReady && !polliReady);

      const parts = [];
      if (orReady && h.kota?.remaining != null) parts.push(`Model hazır · kota ${h.kota.remaining}/${h.kota.limit}`);
      else if (orReady) parts.push("Model hazır");
      else if (h.kota?.remaining === 0) parts.push("Ücretsiz kota dolu");
      else if (s.openrouter) parts.push(s.openrouter);

      if (!orReady && polliReady) parts.push("yedek model açık (yavaş)");
      else if (!orReady && !polliReady && s.pollinations === "IP bekleme") parts.push("yedek model beklemede");
      if (!parts.length) parts.push("Kural modu");

      $("#statusText").textContent = parts.join(" · ");
    })
    .catch(() => {
      $("#statusDot").classList.add("off");
      $("#statusText").textContent = "Sunucuya ulaşılamıyor";
    });
}
refreshHealth();

/* ---------------- giriş ---------------- */
const sys = $("#sys");
sys.addEventListener("input", () => {
  $("#counter").textContent = `${sys.value.length} / 4000`;
});

$("#chips").addEventListener("click", (e) => {
  const b = e.target.closest(".chip");
  if (!b) return;
  sys.value = EXAMPLES[b.textContent] || "";
  sys.dispatchEvent(new Event("input"));
  sys.focus();
});

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") run();
});

/* ---------------- çalıştır ---------------- */
let busy = false;
$("#run").addEventListener("click", run);

async function run() {
  const text = sys.value.trim();
  if (busy) return;
  if (text.length < 10) {
    toast("En az 10 karakterlik bir açıklama yazın.");
    sys.focus();
    return;
  }
  busy = true;
  const btn = $("#run");
  btn.classList.add("loading");
  btn.disabled = true;
  $("#runLabel").textContent = "Yerleştiriliyor…";

  try {
    // 1. aşama: anında kural yönlendirmesi
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Analiz başarısız");

    current = { d, text };
    render(d, text, { pending: true });

    // 2. aşama: model metni (arka planda, sonucu bloke etmez)
    const mine = current;
    fetch("/api/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
      .then((r) => r.json())
      .then((m) => {
        if (current !== mine) return; // kullanıcı yeni analiz başlattı
        if (m.ok) {
          mine.d.gerekce = m.gerekce || mine.d.gerekce;
          mine.d.taslak_metin = m.taslak_metin || mine.d.taslak_metin;
          if (m.riskler?.length) mine.d.riskler = m.riskler;
          mine.d.sorulacak_soru = m.sorulacak_soru || mine.d.sorulacak_soru;
          mine.d.kaynak = "model";
          mine.d.model = m.model;
          mine.d.provider = m.provider;
          mine.d.model_ms = m.ms;
          mine.d.taslak_reddedildi = m.taslak_reddedildi;
          render(mine.d, text, { pending: false, enriched: true });
        } else {
          mine.d.kaynak = "kural";
          render(mine.d, text, { pending: false, enriched: false, reason: m.reason });
        }
        refreshHealth();
      })
      .catch(() => {
        if (current !== mine) return;
        render(mine.d, text, { pending: false, enriched: false });
      });
  } catch (err) {
    $("#resultWrap").innerHTML = `<div class="card"><div class="empty"><h3>Sonuç alınamadı</h3><p>${escapeHtml(err.message)}</p></div></div>`;
  } finally {
    busy = false;
    btn.classList.remove("loading");
    btn.disabled = false;
    $("#runLabel").textContent = "Bu sistemi nereye yazabilirim?";
  }
}

/* ---------------- sonuç ---------------- */
function render(d, text, opts = {}) {
  const v = VERDICT[d.verdict] || VERDICT.kosullu;
  const card = el("div", "card");

  const head = el("div", "verdict " + v.cls);
  const targetWrap = el("div");
  targetWrap.style.flex = "1";
  targetWrap.style.minWidth = "0";
  targetWrap.appendChild(el("div", "target", d.ana_madde));
  targetWrap.appendChild(el("div", "reason", v.note));
  head.append(el("span", "badge", v.label), targetWrap);

  // 1 — nereye yazılır
  const blockFields = el("div", "block");
  const hFields = el("h4");
  hFields.append(el("span", "", "1 · Nereye ve ne yazılır"));
  const tbl = el("table");
  const thead = el("thead");
  const trh = el("tr");
  ["Madde", "Alan", "Yazılacak değer"].forEach((x, i) => {
    trh.appendChild(el("th", i === 1 ? "col-alan" : "", x));
  });
  thead.appendChild(trh);
  const tbody = el("tbody");
  for (const a of d.alanlar) {
    const tr = el("tr");
    if (String(a.deger).toUpperCase().startsWith("BOŞ")) tr.className = "blank";
    tr.appendChild(el("td", "code", a.madde));
    tr.appendChild(el("td", "col-alan", a.alan));
    tr.appendChild(el("td", "val", a.deger));
    tbody.appendChild(tr);
  }
  tbl.append(thead, tbody);
  const tblbox = el("div", "tblbox");
  tblbox.appendChild(tbl);
  blockFields.append(hFields, tblbox);

  // 2 — form metni
  const draftText = d.taslak_metin || "";
  const draftSource = d.kaynak === "model" ? "Model metni" : "Kural metni (kart güvenliği için)";
  const blockDraft = el("div", "block");
  const hDraft = el("h4");
  const lbl = el("span", "", "2 · Form metni (İngilizce) — " + draftSource);
  hDraft.appendChild(lbl);
  if (opts.pending) {
    const s = el("span", "writing", "model yazıyor…");
    hDraft.appendChild(s);
  } else {
    const cp = el("button", "copy", "Kopyala");
    cp.onclick = () => copy(d.taslak_metin);
    hDraft.appendChild(cp);
  }
  blockDraft.append(hDraft, el("div", "draft" + (opts.pending ? " muted" : ""), d.taslak_metin));

  // 3 — gerekçe + riskler
  const blockWhy = el("div", "block");
  blockWhy.appendChild(el("h4", "", "3 · Gerekçe"));
  const g = el("div", "body-text", d.gerekce);
  blockWhy.appendChild(g);

  if (d.riskler?.length) {
    const hRisk = el("h4", "", "Dikkat edilmesi gerekenler");
    hRisk.style.marginTop = "16px";
    const ul = el("ul", "risks");
    d.riskler.forEach((r) => ul.appendChild(el("li", "", r)));
    blockWhy.append(hRisk, ul);
  }

  // 4 — soru
  const blockQ = el("div", "block");
  blockQ.appendChild(el("h4", "", "4 · Ekibe sorulacak soru"));
  const q = el("div", "q");
  q.appendChild(el("span", "mark", "?"));
  q.appendChild(el("span", "", d.sorulacak_soru));
  const qc = el("button", "copy", "Kopyala");
  qc.style.marginLeft = "auto";
  qc.onclick = () => copy(d.sorulacak_soru);
  q.appendChild(qc);
  blockQ.appendChild(q);

  card.append(head, blockFields, blockDraft, blockWhy, blockQ);

  if (d.alternatif) {
    const blockAlt = el("div", "block");
    blockAlt.appendChild(el("h4", "", "Alternatif konum"));
    blockAlt.appendChild(el("div", "alt", d.alternatif));
    card.appendChild(blockAlt);
  }

  // alt bilgi
  const foot = el("div", "foot");
  const left = el("div", "tags");
  if (opts.pending) left.appendChild(el("span", "tag", "Model çağrılıyor…"));
  else if (d.kaynak === "model") left.appendChild(el("span", "tag", `Model · ${d.model}`));
  else left.appendChild(el("span", "tag", "Kural motoru" + (opts.reason ? " · model yanıtsız" : "")));
  left.appendChild(el("span", "tag", `${d.kaynak === "model" ? d.model_ms ?? d.toplam_ms ?? 0 : d.toplam_ms ?? 0} ms`));
  if (d.kaynak === "model" && d.taslak_reddedildi) {
    left.appendChild(el("span", "tag", `metin kuraldan · model taslağı reddedildi (${d.taslak_reddedildi})`));
  }

  const right = el("div", "acts");
  const save = el("button", "btn-ghost", "Kaydet");
  save.onclick = () => saveRecord(d, text);
  const all = el("button", "btn-ghost", "Tümünü kopyala");
  all.onclick = () => copy(plain(d, text));
  right.append(save, all);
  foot.append(left, right);
  card.appendChild(foot);

  $("#resultWrap").innerHTML = "";
  $("#resultWrap").appendChild(card);
}

function plain(d, text) {
  return [
    `Sistem: ${text}`,
    `Madde: ${d.ana_madde}`,
    `Karar: ${d.verdict}`,
    "",
    "Nereye yazılır:",
    ...d.alanlar.map((a) => `- ${a.madde} | ${a.alan}: ${a.deger}`),
    "",
    "Form metni:",
    d.taslak_metin,
    "",
    `Gerekçe: ${d.gerekce}`,
    d.riskler?.length ? `Riskler:\n- ${d.riskler.join("\n- ")}` : "",
    `Soru: ${d.sorulacak_soru}`,
    d.alternatif ? `Alternatif: ${d.alternatif}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/* ---------------- kayıtlar ---------------- */
const STORE = "statista-ai-records";

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || "[]");
  } catch {
    return [];
  }
}

function saveRecord(d, text) {
  const recs = getRecords();
  recs.unshift({
    id: Date.now(),
    text,
    madde: d.ana_madde,
    verdict: d.verdict,
    alanlar: d.alanlar,
    taslak: d.taslak_metin,
    gerekce: d.gerekce,
    riskler: d.riskler || [],
    soru: d.sorulacak_soru,
    alternatif: d.alternatif,
  });
  localStorage.setItem(STORE, JSON.stringify(recs.slice(0, 60)));
  renderRecords();
  toast("Kaydedildi.");
}

function renderRecords() {
  const recs = getRecords();
  const list = $("#recList");
  $("#recCount").textContent = recs.length ? `· ${recs.length} kayıt` : "";
  list.innerHTML = "";
  if (!recs.length) {
    list.appendChild(el("div", "recs-empty", "Henüz kayıt yok. Bir sonucu kaydettiğinizde burada birikir ve CSV olarak indirilebilir."));
    return;
  }
  for (const r of recs) {
    const row = el("div", "rec");
    const left = el("div");
    left.style.minWidth = "0";
    left.appendChild(el("div", "t", r.text));
    left.appendChild(el("div", "m", r.madde));
    const b = el("div", "b", r.verdict === "yazilabilir" ? "YAZILABİLİR" : r.verdict === "kosullu" ? "KOŞULLU" : "YAZILMAMALI");
    b.style.background = r.verdict === "yazilabilir" ? "var(--ok-soft)" : r.verdict === "kosullu" ? "var(--warn-soft)" : "var(--stop-soft)";
    b.style.color = r.verdict === "yazilabilir" ? "var(--ok)" : r.verdict === "kosullu" ? "var(--warn)" : "var(--stop)";
    row.append(left, b);
    row.onclick = () => {
      sys.value = r.text;
      sys.dispatchEvent(new Event("input"));
      current = { d: r, text: r.text };
      render({ ...r, toplam_ms: 0, kaynak: "kural" }, r.text, {});
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    list.appendChild(row);
  }
}

$("#clear").onclick = () => {
  if (!getRecords().length) return;
  if (!confirm("Tüm kayıtlar silinsin mi?")) return;
  localStorage.removeItem(STORE);
  renderRecords();
  toast("Kayıtlar silindi.");
};

$("#export").onclick = () => {
  const recs = getRecords();
  if (!recs.length) return toast("İndirilecek kayıt yok.");
  const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const rows = [["Sistem", "Madde", "Karar", "Alanlar", "Form metni", "Gerekçe", "Riskler", "Soru"].map(esc).join(",")];
  for (const r of recs) {
    rows.push(
      [
        r.text,
        r.madde,
        r.verdict,
        (r.alanlar || []).map((a) => `${a.madde}: ${a.deger}`).join(" | "),
        r.taslak,
        r.gerekce,
        (r.riskler || []).join(" | "),
        r.soru,
      ]
        .map(esc)
        .join(",")
    );
  }
  const blob = new Blob(["\uFEFF" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "statista-ai-sistem-kayitlari.csv";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("CSV indirildi.");
};

/* ---------------- yardımcı ---------------- */
function copy(t) {
  navigator.clipboard.writeText(t).then(
    () => toast("Kopyalandı."),
    () => toast("Kopyalanamadı.")
  );
}

let toastTimerId;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toastTimerId);
  toastTimerId = setTimeout(() => t.classList.remove("on"), 1900);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

renderRecords();
