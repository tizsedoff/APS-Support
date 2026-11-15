/* Centro de soporte · APS Developer
   Interacciones: revelado al hacer scroll, tilt 3D, logo 3D, filtros de FAQ y formulario.
   Todo degrada bien si JavaScript o las animaciones no están disponibles. */

(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Menú para celular ---------- */
  const menuBtn = document.querySelector('.menu-toggle');
  const menuNav = document.getElementById('nav-principal');
  if (menuBtn && menuNav) {
    const setMenu = (abierto) => {
      menuNav.classList.toggle('is-open', abierto);
      menuBtn.setAttribute('aria-expanded', String(abierto));
      menuBtn.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    };
    menuBtn.addEventListener('click', () => setMenu(!menuNav.classList.contains('is-open')));
    menuNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- Marcado automático de bloques para animar al hacer scroll ---------- */
  // Cada grupo de hermanos (tarjetas, pasos, planes, preguntas) entra escalonado.
  const AUTO = [
    '.page-hero > *',
    '.section-head',
    'main > section.wrap > h2',
    '.cards > .card',
    '.steps > .step',
    '.plans > .plan',
    '.faq > details',
    '.products > .product',
    '.cta-row',
    '.channels',
    '.support-form',
    '.contact > div',
  ];
  const grupos = new Map();
  document.querySelectorAll(AUTO.join(',')).forEach((el) => {
    if (el.closest('.chat-panel') || el.classList.contains('reveal')) return;
    const padre = el.parentElement;
    if (!grupos.has(padre)) grupos.set(padre, []);
    grupos.get(padre).push(el);
  });
  grupos.forEach((items) => items.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.setProperty('--i', String(i));
  }));
  // Dirección alternada en secciones de dos columnas
  document.querySelectorAll('.hero-copy').forEach((el) => el.classList.add('reveal--left'));
  document.querySelectorAll('.hero-visual').forEach((el) => el.classList.add('reveal--right'));

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


  /* ---------- 3D ligado al scroll ----------
     Cada tarjeta gira en el eje X según qué tan lejos está del centro de la pantalla,
     y se acerca al frente al llegar al centro. Usa las propiedades rotate y translate,
     así no pisa las animaciones de entrada. */
  const en3d = !reduceMotion && window.matchMedia('(hover: hover) and (min-width: 821px)').matches;
  const tarjetas3d = Array.from(document.querySelectorAll('.cards > .card, .steps > .step, .plans > .plan, .products > .product'));
  function actualizar3d() {
    if (!en3d) return;
    const vh = window.innerHeight;
    tarjetas3d.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const centro = r.top + r.height / 2;
      const t = Math.max(-1, Math.min(1, (centro - vh / 2) / (vh / 2)));
      const grados = (t * 30).toFixed(2);
      const z = ((1 - Math.abs(t)) * 80 - 40).toFixed(1);
      el.style.rotate = `1 0 0 ${grados}deg`;
      el.style.translate = `0 0 ${z}px`;
      el.style.scale = String((1 - Math.abs(t) * 0.08).toFixed(3));
    });
  }

  /* ---------- Barra de progreso y logo 3D según el scroll ---------- */
  const bar = document.getElementById('scroll-progress');
  const logo = document.getElementById('logo3d');
  let ticking = false;

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    if (bar) bar.style.transform = `scaleX(${p})`;
    actualizar3d();
    // Parallax suave: usa la propiedad translate, así no pisa las transformaciones de las animaciones
    if (!reduceMotion) {
      document.querySelectorAll('[data-parallax]').forEach((el) => {
        const k = parseFloat(el.dataset.parallax) || 0;
        const r = el.getBoundingClientRect();
        const centro = r.top + r.height / 2 - window.innerHeight / 2;
        el.style.translate = `0 ${(centro * k).toFixed(1)}px`;
      });
    }
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
