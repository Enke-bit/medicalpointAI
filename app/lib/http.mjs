// HTTP katmanı: hem yerel sunucu (server.mjs) hem Vercel fonksiyonları (api/*.mjs) bunu kullanır.
import { readFile, stat } from "node:fs/promises";
import { extname, join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { analyze } from "./rules.mjs";
import { enrich, providerStatus, KEY } from "./llm.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dir, "..", "public");
// KVKK: kapatılırsa sistem açıklamaları hiçbir dış modele gönderilmez, uygulama kural modunda çalışır.
export const LLM_ENABLED = !/^(0|false|no|off)$/i.test(process.env.LLM_ENABLED || "true");
// Ters vekil arkasındaysa istemci IP'si X-Forwarded-For'dan okunur. Vercel bu başlığı kendisi koyar.
const TRUST_PROXY = !!process.env.VERCEL || /^(1|true|yes|on)$/i.test(process.env.TRUST_PROXY || "");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

const send = (res, code, headers, body) => {
  if (res.headersSent) return res.end();
  res.writeHead(code, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
};

const json = (res, code, obj) =>
  send(res, code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, JSON.stringify(obj));

const text = (res, code, msg) => send(res, code, { "Content-Type": "text/plain; charset=utf-8" }, msg);

class HttpError extends Error {
  constructor(code, msg) {
    super(msg);
    this.code = code;
  }
}

const MAX_BODY = 24000;

async function body(req) {
  // Vercel gövdeyi önceden ayrıştırıp req.body'ye koyar; geçersiz JSON'da bu erişim hata fırlatır.
  let pre;
  try {
    pre = req.body;
  } catch {
    throw new HttpError(400, "Geçersiz JSON.");
  }
  if (pre !== undefined) {
    if (pre === null || pre === "") return {};
    if (Buffer.isBuffer(pre) || typeof pre === "string") return parse(String(pre));
    if (JSON.stringify(pre).length > MAX_BODY) throw new HttpError(413, "İstek çok büyük.");
    return pre;
  }
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) throw new HttpError(413, "İstek çok büyük.");
  }
  return parse(raw);
}

function parse(raw) {
  if (raw.length > MAX_BODY) throw new HttpError(413, "İstek çok büyük.");
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new HttpError(400, "Geçersiz JSON.");
  }
}

function validate(text) {
  const clean = String(text || "").trim();
  if (clean.length < 10) return { error: "Sistem açıklaması en az 10 karakter olmalı." };
  if (clean.length > 4000) return { error: "Açıklama çok uzun (en fazla 4000 karakter)." };
  return { clean };
}

// Basit IP başına sabit pencere sınırı (bellek içi; Vercel'de her fonksiyon örneği kendi sayacını tutar).
const LIMITS = { analyze: 60, enrich: 10 }; // dakikada
const hits = new Map();
function clientIp(req) {
  if (TRUST_PROXY) {
    const fwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    if (fwd) return fwd;
  }
  return req.socket?.remoteAddress || "?";
}
function limited(req, bucket) {
  const key = bucket + "|" + clientIp(req);
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.start > 60_000) {
    hits.set(key, { start: now, n: 1 });
    return false;
  }
  return ++h.n > LIMITS[bucket];
}
setInterval(() => {
  const now = Date.now();
  for (const [k, h] of hits) if (now - h.start > 60_000) hits.delete(k);
}, 60_000).unref();

// OpenRouter kota sorgusu her sağlık kontrolünde dışarı çıkmasın
let kotaCache = { at: 0, value: null };
async function kota() {
  if (!KEY || !LLM_ENABLED) return null;
  if (Date.now() - kotaCache.at < 60_000) return kotaCache.value;
  let value = null;
  try {
    const r = await fetch("https://openrouter.ai/api/v1/key", {
      headers: { Authorization: `Bearer ${KEY}` },
      signal: AbortSignal.timeout(4000),
    });
    if (r.ok) {
      const j = await r.json();
      const f = j.data?.free_model_daily_requests;
      value = f ? { used: f.used, limit: f.limit, remaining: f.remaining } : null;
    }
  } catch {
    value = null;
  }
  kotaCache = { at: Date.now(), value };
  return value;
}

async function serveStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") return text(res, 405, "İzin verilmeyen yöntem");
  // public/ yalnızca düz dosyalar içerir: alt dizin ve gizli dosya sunulmaz
  const name = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!name || name !== basename(name) || name.startsWith(".") || !MIME[extname(name)]) {
    return text(res, 404, "Bulunamadı");
  }
  const file = join(PUBLIC, name);
  const st = await stat(file).catch(() => null);
  if (!st || !st.isFile()) return text(res, 404, "Bulunamadı");
  const data = await readFile(file);
  send(res, 200, { "Content-Type": MIME[extname(name)], "Cache-Control": "no-cache" }, req.method === "HEAD" ? undefined : data);
}

async function route(req, res) {
  let url;
  try {
    url = new URL(req.url, "http://localhost");
  } catch {
    return text(res, 400, "Geçersiz adres");
  }

  // 1) Anında yönlendirme (kural motoru) — model beklemez
  if (url.pathname === "/api/analyze") {
    if (req.method !== "POST") return json(res, 405, { error: "Yalnızca POST" });
    if (limited(req, "analyze")) return json(res, 429, { error: "Çok fazla istek. Bir dakika sonra tekrar deneyin." });
    const { text: input } = await body(req);
    const v = validate(input);
    if (v.error) return json(res, 400, { error: v.error });
    const t0 = Date.now();
    const base = analyze(v.clean);
    return json(res, 200, { ...base, kaynak: "kural", toplam_ms: Date.now() - t0 });
  }

  // 2) Model zenginleştirmesi — yönlendirme gelmez, yalnızca metin
  if (url.pathname === "/api/enrich") {
    if (req.method !== "POST") return json(res, 405, { error: "Yalnızca POST" });
    if (!LLM_ENABLED) return json(res, 200, { ok: false, kaynak: "kural", reason: "Model katmanı kapalı; kural metni kullanılıyor." });
    if (limited(req, "enrich")) return json(res, 429, { ok: false, kaynak: "kural", reason: "Model istek sınırı doldu; kural metni kullanılıyor." });
    const { text: input } = await body(req);
    const v = validate(input);
    if (v.error) return json(res, 400, { error: v.error });
    const t0 = Date.now();
    const base = analyze(v.clean);
    const r = await enrich({ text: v.clean, base });
    if (!r.ok) {
      return json(res, 200, {
        ok: false,
        kaynak: "kural",
        reason: "Model şu an yanıt vermedi; kural metni kullanılıyor.",
        denemeler: r.attempts,
        toplam_ms: Date.now() - t0,
      });
    }
    return json(res, 200, {
      ok: true,
      kaynak: "model",
      provider: r.used.provider,
      model: r.used.short,
      ms: r.ms,
      cached: !!r.cached,
      gerekce: r.data.gerekce,
      taslak_metin: r.data.taslak_metin,
      taslak_reddedildi: r.data._draftRejected || null,
      riskler: Array.isArray(r.data.riskler) ? r.data.riskler.slice(0, 3) : null,
      sorulacak_soru: r.data.sorulacak_soru,
      toplam_ms: Date.now() - t0,
    });
  }

  if (url.pathname === "/api/health") {
    if (req.method !== "GET") return json(res, 405, { error: "Yalnızca GET" });
    return json(res, 200, {
      ok: true,
      model: LLM_ENABLED ? "açık" : "kapalı",
      kota: await kota(),
      saglayici: LLM_ENABLED ? providerStatus() : {},
      saat: new Date().toISOString(),
    });
  }

  if (url.pathname.startsWith("/api/")) return json(res, 404, { error: "Bulunamadı" });
  return serveStatic(req, res, url.pathname);
}

// Hiçbir istek süreci düşürmez: her hata burada yanıta çevrilir.
export function handle(req, res) {
  return route(req, res).catch((e) => {
    if (e instanceof HttpError) return json(res, e.code, { error: e.message });
    console.error(new Date().toISOString(), req.method, req.url, e);
    json(res, 500, { error: "Sunucu hatası" });
  });
}
