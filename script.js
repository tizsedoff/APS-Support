/* Centro de soporte · APS Developer
   Búsqueda en secciones, resaltado del menú y envío del formulario.
   Sin dependencias. Las anclas (#seccion) funcionan sin JavaScript. */

(() => {
  /* ---------- Búsqueda: oculta lo que no coincide y las secciones vacías ---------- */
  const buscador = document.getElementById('buscador');
  const secciones = Array.from(document.querySelectorAll('main .doc-section'));
  const detalles = Array.from(document.querySelectorAll('#lista-faq details'));
  const vacio = document.getElementById('vacio');

  function aplicarBusqueda() {
    const q = (buscador ? buscador.value : '').trim().toLowerCase();
    let total = 0;

    secciones.forEach((sec) => {
      if (sec.id === 'preguntas-frecuentes' || sec.id === 'contacto' || sec.id === 'inicio') {
        return; // estas secciones se muestran siempre
      }
      const items = Array.from(sec.querySelectorAll('.doc-item, .table-wrap'));
      let visibles = 0;
      items.forEach((it) => {
        const ok = !q || it.textContent.toLowerCase().includes(q);
        it.hidden = !ok;
        if (ok) visibles++;
      });
      const mostrarSeccion = !q || visibles > 0 || sec.textContent.toLowerCase().includes(q);
      sec.hidden = !mostrarSeccion;
      total += visibles;
    });

    let faqVisibles = 0;
    detalles.forEach((d) => {
      const ok = !q || d.textContent.toLowerCase().includes(q);
      d.hidden = !ok;
      if (ok) faqVisibles++;
    });

    if (vacio) vacio.style.display = q && total === 0 && faqVisibles === 0 ? 'block' : 'none';
  }

  if (buscador) {
    buscador.addEventListener('input', aplicarBusqueda);
  }

  /* ---------- Resaltar la sección actual en el menú ---------- */
  const links = Array.from(document.querySelectorAll('.sidebar nav a'));
  const porId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((en) => {
      if (en.isIntersecting) {
        links.forEach((a) => a.classList.remove('is-active'));
        const a = porId.get(en.target.id);
        if (a) a.classList.add('is-active');
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  document.querySelectorAll('main section[id]').forEach((s) => observador.observe(s));

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
