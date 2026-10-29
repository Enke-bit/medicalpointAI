import { KEY } from "./lib/llm.mjs";

const res = await fetch("https://openrouter.ai/api/v1/models", {
  headers: { Authorization: `Bearer ${KEY}` },
});
const data = await res.json();
const free = data.data
  .filter((m) => m.id.endsWith(":free"))
  .map((m) => ({ id: m.id, ctx: m.context_length, created: m.created }))
  .sort((a, b) => b.created - a.created);
console.log("total models:", data.data.length, "free:", free.length);
for (const m of free.slice(0, 60)) console.log(m.ctx.toString().padStart(8), m.id);
