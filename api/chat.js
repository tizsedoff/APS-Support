// Asistente de soporte de APS Developer / APS Intelligence.
// Función serverless (Vercel). La clave de Gemini NUNCA sale del servidor.
//
// Variables de entorno:
//   GEMINI_API_KEY  (obligatoria)  clave de la API de Gemini
//   GEMINI_MODEL    (opcional)     modelo a usar; por defecto "gemini-3.8-flash"
//
// Contrato:
//   POST /api/chat  { messages: [{ role: "user"|"assistant", text: string }, ...] }
//   → 200 { reply: string, handoff: boolean }

const MAX_MESSAGE_CHARS = 600;
const MAX_HISTORY = 8;
const MAX_OUTPUT_TOKENS = 400;
const TIMEOUT_MS = 15000;
const HANDOFF_MARK = '[[DERIVAR]]';

const WHATSAPP = 'https://wa.me/5493755301413';
const EMAIL = 'apsdeveloper.arg@gmail.com';

// Conocimiento del asistente. Mantenerlo corto y fiel a lo que de verdad se ofrece.
const SYSTEM_PROMPT = `
Sos el asistente de soporte de APS Developer. Respondés en español rioplatense, con tono cordial y claro, en pocas frases.

QUÉ ATENDÉS
1. APS Intelligence: plataforma de IA con chat, especialistas y modos MARCA (negocio) y PERSONAL (uso general).
2. Proyectos web de APS Developer: previews gratuitas, cambios en webs publicadas, configuración de web y paneles de gestión.

DATOS QUE PODÉS DAR (solo estos)
- Plan Basic: gratis, 15 usos por día.
- Plan Plus: US$15 por mes, 600 usos por mes.
- Plan Pro: US$55 por mes, 1.200 usos por mes.
- Plan Max: US$60 por mes, 4.000 usos por mes.
- Los cobros con pago pueden no estar habilitados todavía; si el usuario pregunta cómo pagar o cambiar de plan y no lo sabés con certeza, derivá.
- Recuperar contraseña: desde la pantalla de ingreso, opción de recuperar contraseña; revisar spam.
- Un "uso" es cada envío que procesa el sistema.
- MARCA usa los datos del negocio para las tareas autorizadas; PERSONAL es uso general; los datos de MARCA no pasan a PERSONAL salvo que el usuario los comparta de forma explícita.
- La app se usa desde el navegador del celular; la instalación como aplicación está en preparación.
- Para proyectos web: la preview es gratuita; para pedirla hay que contar nombre del negocio, rubro e Instagram si tiene.
- Material para proyectos (logo, fotos, textos, precios) se envía por WhatsApp o al correo ${EMAIL}, con el nombre del negocio en el asunto.

REGLAS
- No inventes precios, plazos, funciones, condiciones, descuentos ni promesas. Si no está en la lista de arriba, no lo afirmes.
- Nunca pidas contraseñas, códigos, números de tarjeta ni datos bancarios.
- Nunca digas que un problema técnico está resuelto; describí pasos posibles y sugerí contactar.
- No des asesoramiento legal, fiscal ni financiero.
- Si la consulta es sobre una cuenta, un pago, un reembolso, una factura, una queja, un pedido de presupuesto o algo que requiera revisión humana, derivá.
- Si no sabés la respuesta, o no estás seguro, derivá. Es mejor derivar que inventar.

CÓMO DERIVAR
Cuando derives, escribí una breve frase de ayuda y terminá la respuesta con la marca exacta ${HANDOFF_MARK} en una línea sola al final. Ejemplo de frase: "No tengo esa información con certeza. Te paso con el equipo para que te respondan."
Solo usás la marca cuando derivás. Nunca la menciones ni la expliques al usuario.
`.trim();

// Limpieza simple del texto de entrada para no reenviar basura ni inyecciones largas.
function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  return value.replace(/\u0000/g, '').trim().slice(0, max);
}

function sanitizeMessages(input) {
  if (!Array.isArray(input)) return [];
  return input
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m && m.role === 'assistant' ? 'assistant' : 'user',
      text: cleanText(m && m.text, MAX_MESSAGE_CHARS),
    }))
    .filter((m) => m.text.length > 0);
}

function handoffReply(message) {
  return {
    reply: message,
    handoff: true,
  };
}

const FALLBACK_HANDOFF = `No pude responder en este momento. Podés escribirnos por WhatsApp (${WHATSAPP}) o por correo a ${EMAIL}.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json(handoffReply(FALLBACK_HANDOFF));
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const messages = sanitizeMessages(body && body.messages);
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') {
    return res.status(400).json({ error: 'Falta el mensaje del usuario' });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      }),
    });

    if (!upstream.ok) {
      return res.status(502).json(handoffReply(FALLBACK_HANDOFF));
    }

    const data = await upstream.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim() || '';

    if (!raw) {
      return res.status(502).json(handoffReply(FALLBACK_HANDOFF));
    }

    const handoff = raw.includes(HANDOFF_MARK);
    const reply = raw.replaceAll(HANDOFF_MARK, '').trim();

    return res.status(200).json({ reply, handoff });
  } catch {
    return res.status(502).json(handoffReply(FALLBACK_HANDOFF));
  } finally {
    clearTimeout(timer);
  }
}
