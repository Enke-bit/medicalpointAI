const k = process.env.OPENROUTER_API_KEY || "";
console.log("env key:", k ? `${k.slice(0, 12)}…${k.slice(-4)} len=${k.length}` : "yok");
if (!k) process.exit(0);

const r1 = await fetch("https://openrouter.ai/api/v1/key", { headers: { Authorization: `Bearer ${k}` } });
console.log("key endpoint:", r1.status);
console.log((await r1.text()).slice(0, 600));

const r2 = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "cohere/north-mini-code:free",
    max_tokens: 60,
    messages: [{ role: "user", content: 'Sadece {"ok":true} döndür' }],
  }),
});
console.log("\nchat:", r2.status);
console.log((await r2.text()).slice(0, 400));
