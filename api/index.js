export default function handler(req, res) {
  res.status(200).json({ proyecto: "berna-whatsapp", estado: "activo en Vercel", endpoint: "/api/poll" });
}
