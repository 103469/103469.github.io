// Sovera, versie 6: interactie (header, mobiel menu, binnenkomen bij scrollen, wisselend woord)
(function () {
  const root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header krijgt een achtergrond zodra je scrolt
  const top = document.querySelector('.top');
  const onScroll = () => top && top.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobiel menu
  const btn = document.querySelector('.menu-btn');
  if (btn) {
    const close = () => { document.body.classList.remove('menu-open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  // Binnenkomen bij scrollen
  const items = document.querySelectorAll('.reveal, .steps, .speed');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach((el) => io.observe(el));
  }

  // Wisselend woord in de kop: "Jouw kapsalon / snackbar / ..."
  const rot = document.querySelector('.rotator');
  if (rot && !reduce) {
    const words = [...rot.children];
    let i = 0;
    setInterval(() => {
      const cur = words[i];
      i = (i + 1) % words.length;
      const next = words[i];
      cur.classList.remove('is-on');
      cur.classList.add('is-out');
      next.classList.remove('is-out');
      next.classList.add('is-on');
      setTimeout(() => cur.classList.remove('is-out'), 600);
    }, 2400);
  }

  // Telefoon in de hero kantelt een beetje mee met de muis (alleen op desktop)
  const stage = document.querySelector('.stage');
  const phone = stage && stage.querySelector('.phone');
  if (phone && !reduce && window.matchMedia('(pointer: fine)').matches) {
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      phone.style.animation = 'none';
      phone.style.transform = `rotateY(${-14 + x * 14}deg) rotateX(${6 - y * 10}deg)`;
    });
    stage.addEventListener('pointerleave', () => { phone.style.transform = ''; phone.style.animation = ''; });
  }
})();
