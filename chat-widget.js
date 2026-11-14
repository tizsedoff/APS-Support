/* Asistente de soporte (cliente).
   Llama a /api/chat. Si falla o no sabe, muestra opciones para WhatsApp o correo.
   No guarda conversaciones: el historial vive solo en la pestaña. */

(() => {
  const WHATSAPP = 'https://wa.me/5493755301413';
  const EMAIL = 'apsdeveloper.arg@gmail.com';
  const MAX_HISTORY = 8;

  const launcher = document.getElementById('chat-launcher');
  const panel = document.getElementById('chat-panel');
  if (!launcher || !panel) return;

  const log = panel.querySelector('.chat-log');
  const form = panel.querySelector('.chat-form');
  const input = panel.querySelector('.chat-input');
  const sendBtn = panel.querySelector('.chat-send');
  const closeBtn = panel.querySelector('.chat-close');

  const history = []; // { role: 'user' | 'assistant', text }
  let busy = false;

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) setTimeout(() => input.focus(), 50);
  }

  function addMsg(role, text) {
    const el = document.createElement('div');
    el.className = 'chat-msg ' + (role === 'user' ? 'from-user' : 'from-bot');
    el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function addHandoff() {
    const box = document.createElement('div');
    box.className = 'chat-handoff';
    const wa = document.createElement('a');
    wa.href = WHATSAPP;
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.className = 'btn btn-wa btn-sm';
    wa.textContent = 'Escribir por WhatsApp';
    const mail = document.createElement('a');
    mail.href = 'mailto:' + EMAIL;
    mail.className = 'btn btn-ghost btn-sm';
    mail.textContent = 'Enviar correo';
    box.append(wa, mail);
    log.appendChild(box);
    log.scrollTop = log.scrollHeight;
  }

  function addTyping() {
    const el = document.createElement('div');
    el.className = 'chat-msg from-bot typing';
    el.setAttribute('aria-label', 'Escribiendo');
    el.innerHTML = '<span></span><span></span><span></span>';
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  async function send(text) {
    if (busy || !text) return;
    busy = true;
    sendBtn.disabled = true;

    addMsg('user', text);
    history.push({ role: 'user', text });

    const typing = addTyping();
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-MAX_HISTORY) }),
      });
      const data = await res.json().catch(() => ({}));
      typing.remove();

      const reply = (data && data.reply) || 'No pude responder en este momento.';
      addMsg('bot', reply);
      history.push({ role: 'assistant', text: reply });

      if (!res.ok || data.handoff) addHandoff();
    } catch {
      typing.remove();
      const msg = `No pude conectarme. Podés escribirnos por WhatsApp o a ${EMAIL}.`;
      addMsg('bot', msg);
      addHandoff();
    } finally {
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  launcher.addEventListener('click', () => setOpen(panel.hidden));
  closeBtn.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) setOpen(false);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim().slice(0, 600);
    if (!text) return;
    input.value = '';
    send(text);
  });

  // Saludo inicial, sin llamar a la API
  if (!log.children.length) {
    addMsg('bot', 'Hola, soy el asistente de APS. Preguntame sobre APS Intelligence o sobre tu proyecto web. Si no tengo la respuesta, te paso con el equipo.');
  }
})();
