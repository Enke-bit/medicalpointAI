const KEY = (await import("node:fs")).readFileSync(".key", "utf8").trim();
const res = await fetch("https://openrouter.ai/api/v1/key", { headers: { Authorization: `Bearer ${KEY}` } });
console.log(res.status, await res.text());
