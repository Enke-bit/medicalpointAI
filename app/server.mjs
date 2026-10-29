// Yerel / klasik sunucu girişi. Vercel'de bu dosya kullanılmaz; api/*.mjs aynı lib/http.mjs'i çağırır.
import { createServer } from "node:http";
import { handle, LLM_ENABLED } from "./lib/http.mjs";
import { CHAIN, KEY } from "./lib/llm.mjs";

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "0.0.0.0";

const server = createServer(handle);

server.requestTimeout = 60_000;
server.headersTimeout = 15_000;
server.on("clientError", (_e, socket) => {
  if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Statista AI Form Asistanı  →  http://localhost:${PORT}`);
  if (!LLM_ENABLED) {
    console.log("  Model katmanı: KAPALI (LLM_ENABLED=false) · yalnızca kural motoru\n");
    return;
  }
  console.log(`  OpenRouter: ${KEY ? "anahtar yüklü" : "anahtar yok"} · yedek: Pollinations (anahtarsız)`);
  console.log(`  Model zinciri: ${CHAIN.map((c) => c.short).join(" → ")}\n`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
