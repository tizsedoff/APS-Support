/* Centro de soporte · APS Developer
   Interacciones: revelado al hacer scroll, tilt 3D, logo 3D, filtros de FAQ y formulario.
   Todo degrada bien si JavaScript o las animaciones no están disponibles. */

(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Revelado al hacer scroll ---------- */
  const revelables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revelables.forEach((el) => io.observe(el));
  } else {
    revelables.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Barra de progreso y logo 3D según el scroll ---------- */
  const bar = document.getElementById('scroll-progress');
  const logo = document.getElementById('logo3d');
  let ticking = false;

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    if (bar) bar.style.transform = `scaleX(${p})`;
    if (logo && !reduceMotion) {
      logo.style.setProperty('--ry', `${(p * 60 - 30).toFixed(2)}deg`);
      logo.style.setProperty('--rx', `${(Math.sin(p * Math.PI) * 8).toFixed(2)}deg`);
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Logo 3D que sigue el puntero en el hero ---------- */
  const hero = document.querySelector('.hero');
  if (hero && logo && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      logo.style.setProperty('--ry', `${(x * 30).toFixed(2)}deg`);
      logo.style.setProperty('--rx', `${(-y * 20).toFixed(2)}deg`);
    });
  }

  /* ---------- Tilt 3D en tarjetas ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.tilt').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ty', `${((x - 0.5) * 10).toFixed(2)}deg`);
        card.style.setProperty('--tx', `${((0.5 - y) * 8).toFixed(2)}deg`);
        card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tx', '0deg');
        card.style.setProperty('--ty', '0deg');
      });
    });
  }

  /* ---------- Filtros y buscador de FAQ ---------- */
  const buscador = document.getElementById('buscador');
  const detalles = Array.from(document.querySelectorAll('#lista-faq details'));
  const chips = Array.from(document.querySelectorAll('.chip'));
  const vacio = document.getElementById('vacio');
  let filtro = 'all';

  function aplicarFiltros() {
    const q = (buscador ? buscador.value : '').trim().toLowerCase();
    let visibles = 0;
    detalles.forEach((d) => {
      const coincideProd = filtro === 'all' || d.dataset.product === filtro;
      const coincideTxt = !q || d.textContent.toLowerCase().includes(q);
      const mostrar = coincideProd && coincideTxt;
      d.hidden = !mostrar;
      if (mostrar) visibles++;
    });
    if (vacio) vacio.style.display = visibles === 0 ? 'block' : 'none';
  }

  function setFiltro(valor) {
    filtro = valor;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === valor)));
    aplicarFiltros();
  }

  chips.forEach((c) => c.addEventListener('click', () => setFiltro(c.dataset.filter)));
  if (buscador) {
    buscador.addEventListener('input', () => {
      aplicarFiltros();
      if (buscador.value.trim()) {
        document.getElementById('lista-faq').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  /* ---------- Formulario: arma el mensaje y abre WhatsApp (sin backend) ---------- */
  const form = document.getElementById('form-soporte');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const texto = [
        'Consulta de soporte - APS Developer',
        'Nombre: ' + f.get('nombre'),
        'Correo: ' + f.get('correo'),
        'Producto: ' + f.get('producto'),
        '',
        f.get('mensaje'),
      ].join('\n');
      window.open('https://wa.me/5493755301413?text=' + encodeURIComponent(texto), '_blank', 'noopener');
    });
  }
})();
