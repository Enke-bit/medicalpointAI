const tests = [
  {
    name: "pollinations/openai",
    url: "https://text.pollinations.ai/openai",
    body: {
      model: "openai",
      messages: [{ role: "user", content: 'Sadece {"ok":true,"dil":"tr"} döndür' }],
      max_tokens: 50,
    },
  },
  {
    name: "pollinations/mistral",
    url: "https://text.pollinations.ai/openai",
    body: {
      model: "mistral",
      messages: [{ role: "user", content: 'Sadece {"ok":true,"dil":"tr"} döndür' }],
      max_tokens: 50,
    },
  },
  {
    name: "pollinations/openai-fast",
    url: "https://text.pollinations.ai/openai",
    body: {
      model: "openai-fast",
      messages: [{ role: "user", content: 'Sadece {"ok":true,"dil":"tr"} döndür' }],
      max_tokens: 50,
    },
  },
];

for (const t of tests) {
  const t0 = Date.now();
  try {
    const r = await fetch(t.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t.body),
      signal: AbortSignal.timeout(30000),
    });
    const ms = Date.now() - t0;
    const txt = await r.text();
    console.log(`${t.name}: ${r.status} ${ms}ms`);
    console.log("  ", txt.slice(0, 300).replace(/\s+/g, " "));
  } catch (e) {
    console.log(`${t.name}: HATA ${Date.now() - t0}ms ${e.name} ${e.message.slice(0, 80)}`);
  }
}
