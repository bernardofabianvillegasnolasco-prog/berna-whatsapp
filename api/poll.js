const BASE = "https://api.whatsapp.com/agent/v1"\;
const MP = "whats" + "app";
let OFFSET = globalThis.__BERNA_OFFSET ?? 0;
let VISTOS = globalThis.__BERNA_VISTOS ?? new Set();
globalThis.__BERNA_OFFSET = OFFSET;
globalThis.__BERNA_VISTOS = VISTOS;

async function llamar(metodo, path, body) {
  const res = await fetch(BASE + path, { method: metodo, headers: { "Authorization": "Bearer " + process.env.BERNA_API_KEY, "Content-Type": "application/json", "User-Agent": "Berna-WhatsApp/1.0" }, body: body ? JSON.stringify(body) : undefined });
  const txt = await res.text();
  try { return JSON.parse(txt || "{}"); } catch { return {}; }
}

async function preguntarIA(pregunta) {
  // Usa IA BF en Vercel, misma llave Groq que ya funciona, sin Gemini
  try {
    const r = await fetch("https://ia-unificada-bf.vercel.app/api/cerebro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: pregunta }) });
    const d = await r.json();
    if (d.text) return d.text.slice(0, 1200);
  } catch {}
  return "Berna, IA BF no respondio. Estoy en modo local en Vercel.";
}

function responder(texto) {
  const m = (texto || "").toLowerCase();
  if (m.includes("comando:")) return "Berna, los comandos solo funcionan en Termux, no en Vercel. En Vercel solo puedo contestarte con IA. Prueba: ia: hola";
  if (m.includes("ia:") || m.includes("copiloto:") || m.includes("pregunta:")) return "__IA__" + texto;
  if (m.includes("hola") || m.includes("activo")) return "Berna, ya estoy aqui, activo en Vercel como proyecto nuevo berna-whatsapp";
  if (m.includes("/start")) return "Berna, ya inicie en Vercel, listo";
  return "Berna, te escuche en Vercel: " + texto;
}

export default async function handler(req, res) {
  if (!process.env.BERNA_API_KEY) return res.status(500).json({ error: "Falta BERNA_API_KEY en Vercel" });
  try {
    const data = await llamar("GET", `/updates?offset=${OFFSET}&limit=50&timeout=5`);
    if (data.next_offset !== undefined) { OFFSET = data.next_offset; globalThis.__BERNA_OFFSET = OFFSET; }
    let enviados = 0;
    for (const e of data.entry || []) {
      for (const ch of e.changes || []) {
        for (const msg of ch.value?.messages || []) {
          if (VISTOS.has(msg.id)) continue;
          VISTOS.add(msg.id);
          const texto = msg.type === "text" ? msg.text?.body || "" : msg.type;
          await llamar("POST", "/statuses", { messaging_product: MP, status: "read", message_id: msg.id });
          let resp = responder(texto);
          if (resp.startsWith("__IA__")) resp = await preguntarIA(texto);
          await llamar("POST", "/messages", { messaging_product: MP, to: msg.from, type: "text", text: { body: resp } });
          enviados++;
        }
      }
    }
    return res.status(200).json({ ok: true, proyecto: "berna-whatsapp", offset: OFFSET, enviados });
  } catch (e) { return res.status(500).json({ error: String(e) }); }
}
