// Dil modeli katmanı.
// Sağlayıcı sırası: OpenRouter ücretsiz modeller → Pollinations (anahtarsız, yavaş).
// Kural motorunun yönlendirmesi kilitlidir; model yalnızca gerekçe/metin/risk/soru üretir.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));

function loadKey() {
  const clean = (v) => v.replace(/^\uFEFF/, "").replace(/[^\x21-\x7E]/g, "").trim();
  const p = join(__dir, "..", ".key");
  if (existsSync(p)) {
    const k = clean(readFileSync(p, "utf8"));
    if (k.startsWith("sk-")) return k;
  }
  if (process.env.OPENROUTER_API_KEY) return clean(process.env.OPENROUTER_API_KEY);
  return "";
}

export const KEY = loadKey();

// Test sonuçlarına göre sıralandı: hız + JSON disiplini. Hepsi ücretsiz (:free).
export const CHAIN = [
  { id: "cohere/north-mini-code:free", short: "North Mini (Cohere)" },
  { id: "poolside/laguna-s-2.1:free", short: "Laguna S (Poolside)" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", short: "Nemotron Ultra (NVIDIA)" },
  { id: "dots-studio/dots-3-note-preview:free", short: "Dots 3 (Dots Studio)" },
];

// Anahtarsız yedek: IP başına 30 sn'de 1 istek. openai-fast en hızlı ve JSON'u düzgün.
const POLLI = {
  url: "https://text.pollinations.ai/openai",
  model: "openai-fast",
  short: "Pollinations (anahtarsız)",
  cooldownMs: 30_000,
};

const CACHE = new Map(); // açıklama → model yanıtı (30 dk)
const STATE = {
  orStrikes: 0,
  orUntil: 0,
  orReason: "",
  polliUntil: 0,
  keyBad: false,
};

const SYS = `Rol: Hastane mevzuat ve form analisti.
Görev: Bir hastane sistemini Statista Smart Hospitals Bölüm 5 (AI) formuna yerleştirmek.
Sana sistem açıklaması ve ÖNCEDEN HESAPLANMIŞ yönlendirme verilecek. Yönlendirmeyi DEĞİŞTİRME; yalnızca gerekçe, taslak metin, riskler ve soruyu yaz.

Kurallar:
- "sertifika", "ISO", "GDPR compliant", "HIPAA", "tam uyumlu" gibi ifadeler kullanma.
- Taslak metin İngilizce ve forma yapıştırılabilir olmalı; 2-3 cümle.
- Gerekçe Türkçe, 2 cümle.
- Riskler en fazla 3 madde, somut ve kanıt odaklı.
- Soru tek ve net olmalı.

SADECE şu JSON'u döndür:
{"gerekce":"...","taslak_metin":"...","riskler":["..."],"sorulacak_soru":"..."}`;

// Yavaş sağlayıcı için kısa istem: aynı çıktı, daha az token.
const SYS_SHORT = `Hastane sistemlerini Statista Bolum 5 (AI) formuna yerlestiren analistsin. Yonlendirme verilir; degistirme.
Taslak metin: kurumsal, ucuncu sahis, simdiki zaman, "we/our/I" KULLANMA. 2-3 cumle Ingilizce.
SADECE JSON: {"gerekce":"2 cumle Turkce","taslak_metin":"2-3 cumle Ingilizce","riskler":["Turkce risk"],"sorulacak_soru":"Turkce soru"}
"sertifika","ISO","GDPR compliant","HIPAA" kullanma.`;

function repairJson(s) {
  const start = s.indexOf("{");
  if (start < 0) return null;
  const str = s.slice(start);
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
      if (p && (p.gerekce || p.taslak_metin)) return p;
    } catch {}
  }
  return null;
}

// Kalite kapısı: form metni kurumsal, üçüncü şahıs ve yeterli uzunlukta olmalı.
// Model serbest konuşmaya kayarsa metin reddedilir, kural metni korunur.
function scoreDraft(s) {
  const t = String(s || "").trim();
  if (t.length < 90 || t.length > 900) return { ok: false, why: "uzunluk" };
  if (/\b(we|our|us|I|my|me|we've|we're)\b/i.test(t)) return { ok: false, why: "birinci şahıs" };
  if (/\b(I think|maybe|possibly|as an AI)\b/i.test(t)) return { ok: false, why: "belirsiz dil" };
  if (!/[.!?]$/.test(t)) return { ok: false, why: "bitmemiş cümle" };
  // Strateji belgesinin söylem sözlüğü: kanıtsız kalite/uyum iddiası yazılmaz
  if (/\b(accurate|accuracy|guarantee[sd]?|fully compliant|certified|AI diagnoses)\b|100\s?%/i.test(t))
    return { ok: false, why: "kanıtsız iddia" };
  return { ok: true };
}

// Alanlar "No / Not yet" diyorsa metin kullanım beyan edemez
function contradictsFields(draft, base) {
  const usage = String(base.alanlar?.[0]?.deger || "");
  if (!/^(No\b|Not yet)/.test(usage)) return false;
  const t = String(draft || "");
  return /\b(is|are) (currently |now )?(used|in (clinical |routine )?use|deployed|acquired)\b/i.test(t) && !/\b(not|no)\b/i.test(t);
}

function gate(data, fallback) {
  const out = { ...data };
  let d = scoreDraft(out.taslak_metin);
  if (d.ok && contradictsFields(out.taslak_metin, fallback)) d = { ok: false, why: "alanlarla çelişki" };
  if (!d.ok) {
    out.taslak_metin = fallback.taslak_metin;
    out._draftRejected = d.why;
  }
  if (!out.gerekce || String(out.gerekce).length < 40) out.gerekce = fallback.gerekce_kural;
  if (!Array.isArray(out.riskler) || !out.riskler.length) out.riskler = fallback.riskler;
  if (!out.sorulacak_soru) out.sorulacak_soru = fallback.sorulacak_soru;
  return out;
}

function userMessage(text, base) {
  const alanOzet = base.alanlar.map((a) => `- ${a.madde}: ${a.deger}`).join("\n");
  return `SİSTEM AÇIKLAMASI:
"""${text}"""

YÖNLENDİRME (değiştirme):
- Bölüm: ${base.ana_madde}
- Karar: ${base.verdict}
- Alanlar:
${alanOzet}
- Görevler: ${base.sinyaller.tasks.join("; ") || "yok"}
- Pilot: ${base.sinyaller.pilot ? "evet" : "hayır"}
- Klinik risk: ${base.sinyaller.clinicalRisk ? "evet" : "hayır"}

Bu yönlendirmeye uygun gerekçe, form metni, riskler ve soru üret.`;
}

function compactMessage(text, base) {
  const tasks = base.sinyaller.tasks.map((t) => t.split("(")[0].trim()).join(", ") || "yok";
  const pilot = base.sinyaller.pilot ? "evet" : "hayir";
  const risk = base.sinyaller.clinicalRisk ? "evet" : "hayir";
  return [
    `Sistem: "${text.slice(0, 500)}"`,
    `Yonlendirme: ${base.ana_madde} | karar: ${base.verdict} | gorevler: ${tasks} | pilot: ${pilot} | klinik risk: ${risk}`,
    `Form alanlari (metin bunlarla celismemeli): ${base.alanlar.map((a) => `${a.madde}=${a.deger}`).join(" | ")}`,
    `Dikkate alinacak riskler: ${base.riskler.join(" / ")}`,
    "riskler ve sorulacak_soru Turkce olmali.",
  ].join("\n");
}

async function callOpenRouter(model, msg, timeoutMs) {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:4173",
        "X-Title": "Statista AI Form Assistant",
      },
      body: JSON.stringify({
        model: model.id,
        temperature: 0.2,
        max_tokens: 1600,
        messages: [
          { role: "system", content: SYS },
          { role: "user", content: msg },
        ],
      }),
    });
    const ms = Date.now() - t0;
    if (res.status === 401) {
      STATE.keyBad = true;
      await res.text();
      return { ok: false, ms, code: 401, err: "anahtar geçersiz" };
    }
    if (!res.ok) {
      await res.text();
      return { ok: false, ms, code: res.status, err: `HTTP ${res.status}` };
    }
    const j = await res.json();
    if (j.error) return { ok: false, ms, code: j.error.code || 0, err: "sağlayıcı hatası" };
    const raw = j.choices?.[0]?.message?.content || "";
    if (!raw.trim()) return { ok: false, ms, code: 0, err: "boş yanıt" };
    const p = repairJson(raw);
    return p ? { ok: true, ms, data: p } : { ok: false, ms, code: 0, err: "json yok" };
  } catch (e) {
    return { ok: false, ms: Date.now() - t0, code: e.name === "AbortError" ? 408 : 0, err: e.name };
  } finally {
    clearTimeout(timer);
  }
}

async function callPollinations(msg, timeoutMs) {
  const t0 = Date.now();
  try {
    const res = await fetch(POLLI.url, {
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: POLLI.model,
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          { role: "system", content: SYS_SHORT },
          { role: "user", content: msg },
        ],
      }),
    });
    const ms = Date.now() - t0;
    if (!res.ok) {
      const body = await res.text();
      const limited = body.includes("FREE_LIMIT");
      if (limited) STATE.polliUntil = Date.now() + POLLI.cooldownMs;
      return { ok: false, ms, code: res.status, err: limited ? "IP limiti (30 sn)" : `HTTP ${res.status}` };
    }
    const j = await res.json();
    const raw = j.choices?.[0]?.message?.content || "";
    if (!raw.trim()) return { ok: false, ms, code: 0, err: "boş yanıt" };
    const p = repairJson(raw);
    if (!p) return { ok: false, ms, code: 0, err: "json yok" };
    STATE.polliUntil = Date.now() + POLLI.cooldownMs;
    return { ok: true, ms, data: p };
  } catch (e) {
    return { ok: false, ms: Date.now() - t0, code: e.name === "TimeoutError" ? 408 : 0, err: "zaman aşımı" };
  }
}

export function providerStatus() {
  const now = Date.now();
  return {
    openrouter: STATE.keyBad
      ? "anahtar geçersiz"
      : now < STATE.orUntil
        ? STATE.orReason || "kota dolu"
        : KEY
          ? "hazır"
          : "anahtar yok",
    pollinations: now < STATE.polliUntil ? "IP bekleme" : "hazır",
  };
}

// İsteğe bağlı: yalnızca metni zenginleştirir (yönlendirme değişmez).
export async function enrich({ text, base, budgetMs = 40_000 }) {
  const cacheKey = text.trim().toLocaleLowerCase("tr");
  const hit = CACHE.get(cacheKey);
  if (hit && Date.now() - hit.at < 30 * 60 * 1000) {
    return { ok: true, used: hit.used, data: hit.data, ms: 0, cached: true, attempts: [] };
  }

  const msg = userMessage(text, base);
  const attempts = [];
  const deadline = Date.now() + budgetMs;

  // 1) OpenRouter ücretsiz zinciri
  if (KEY && !STATE.keyBad && Date.now() > STATE.orUntil) {
    for (const model of CHAIN) {
      if (Date.now() > deadline - 2500) break;
      const r = await callOpenRouter(model, msg, 11_000);
      attempts.push({ provider: "openrouter", model: model.id, ok: r.ok, ms: r.ms, code: r.code || null });
      if (r.ok) {
        const data = gate(r.data, base);
        CACHE.set(cacheKey, { at: Date.now(), used: { provider: "openrouter", short: model.short }, data });
        STATE.orStrikes = 0;
        return { ok: true, used: { provider: "openrouter", short: model.short }, data, ms: r.ms, attempts };
      }
      if (r.code === 401 || r.code === 429) {
        STATE.orStrikes++;
        if (STATE.orStrikes >= 1) {
          STATE.orUntil = Date.now() + 10 * 60 * 1000;
          STATE.orReason = r.code === 401 ? "anahtar geçersiz" : "ücretsiz günlük kota dolu";
        }
        break;
      }
    }
  }

  // 2) Pollinations (anahtarsız)
  if (Date.now() > STATE.polliUntil && Date.now() < deadline - 3000) {
    const remaining = Math.min(deadline - Date.now(), 30_000);
    const r = await callPollinations(compactMessage(text, base), remaining);
    attempts.push({ provider: "pollinations", model: POLLI.model, ok: r.ok, ms: r.ms, code: r.code || null });
    if (r.ok) {
      const data = gate(r.data, base);
      CACHE.set(cacheKey, { at: Date.now(), used: { provider: "pollinations", short: POLLI.short }, data });
      return { ok: true, used: { provider: "pollinations", short: POLLI.short }, data, ms: r.ms, attempts };
    }
  } else if (Date.now() <= STATE.polliUntil) {
    attempts.push({ provider: "pollinations", model: POLLI.model, ok: false, ms: 0, code: 429 });
  }

  return { ok: false, used: null, data: null, attempts };
}
