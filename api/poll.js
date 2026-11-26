const BASE = "https://api.whatsapp.com/agent/v1"\;
let OFFSET = globalThis.__BERNA_OFFSET ?? 0;
let VISTOS = globalThis.__BERNA_VISTOS ?? new Set();
globalThis.__BERNA_OFFSET = OFFSET;
globalThis.__BERNA_VISTOS = VISTOS;
function responder(texto) {
  const m = (texto || "").toLowerCase();
  if (m.includes("hola") || m.includes("estas") || m.includes("activo")) return "Berna, ya estoy aqui, ya estoy activo en Vercel con Copiloto";
  if (m.includes("copiloto")) return "Berna, si, ya estoy conectado con Copiloto y ahora vivo en Vercel";
  if (m.includes("/start")) return "Berna, ya inicie, ya estoy activo en Vercel y listo para ayudarte";
  return "Berna, te escuche en WhatsApp: " + texto + ". Ya estoy conectado contigo desde Vercel";
}
async function llamar(metodo, path, body) {
  const res = await fetch(BASE + path, { method: metodo, headers: { "Authorization": "Bearer " + process.env.BERNA_API_KEY, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const txt = await res.text();
  try { return JSON.parse(txt || "{}"); } catch { return {}; }
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
          await llamar("POST", "/statuses", { messaging_product: "【entity-whatsapp¦canonical_name=WhatsApp】", status: "read", message_id: msg.id });
          const resp = responder(texto);
          await llamar("POST", "/messages", { messaging_product: "whatsapp", to: msg.from, type: "text", text: { body: resp } });
          enviados++;
        }
      }
    }
    return res.status(200).json({ ok: true, offset: OFFSET, enviados });
  } catch (e) { return res.status(500).json({ error: String(e) }); }
}
