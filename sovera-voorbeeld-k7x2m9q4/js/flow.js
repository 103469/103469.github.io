// Sovera scrolltest: zachte scroll (desktop), overal dezelfde rustige fade, stapelende kaartjes.
// Geladen vóór ui.js en v7.js, zodat die de extra .reveal-blokken ook oppakken.
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const root = document.documentElement;

  // 1. Overal dezelfde fade: blokken die nog geen animatie hebben krijgen er een,
  //    broertjes en zusjes komen kort na elkaar in beeld.
  const groups = [
    '#gevonden .gfind > *',
    '#prijzen .plans > *', '#prijzen .calc', '#prijzen .price-note',
    '#over .about > *',
    '#faq .faq > details',
    '#check .check',
    '#contact .contact > *', '#contact .wrap > *',
    '.foot__top > *'
  ];
  groups.forEach((sel) => {
    let i = 0;
    document.querySelectorAll(sel).forEach((el) => {
      if (el.classList.contains('reveal') || el.closest('.reveal') || el.querySelector('.reveal')) return;
      el.classList.add('reveal');
      el.style.setProperty('--i', Math.min(i++, 5));
    });
  });
  // FAQ: korte stapjes, anders duurt het te lang bij 11 vragen
  document.querySelectorAll('#faq .faq > details').forEach((el, i) => el.style.setProperty('--i', (i % 4) * 0.6));

  // 2. Stapelende kaartjes: werkwijze altijd, "wat je krijgt" alleen op telefoon (daar staan ze onder elkaar)
  const flow = document.querySelector('#werkwijze .flow');
  if (flow) {
    flow.classList.add('flow--stack');
    flow.querySelectorAll('li').forEach((li, i) => { li.classList.remove('reveal'); li.style.setProperty('--n', i); });
  }
  const bento = document.querySelector('#aanbod .bento');
  if (bento) {
    bento.classList.add('bento--stack');
    bento.querySelectorAll(':scope > .card').forEach((c, i) => c.style.setProperty('--n', i));
  }
  const stackMobile = matchMedia('(max-width: 620px)');

  function stack(cards) {
    // Hoe ver de volgende kaartjes over dit kaartje heen liggen → klein beetje kleiner en donkerder
    for (let i = 0; i < cards.length; i++) {
      const a = cards[i].getBoundingClientRect();
      let depth = 0;
      for (let j = i + 1; j < cards.length; j++) {
        const b = cards[j].getBoundingClientRect();
        depth += clamp(1 - (b.top - a.top) / Math.max(a.height, 1));
      }
      cards[i].style.setProperty('--s', (1 - depth * 0.045).toFixed(4));
      cards[i].style.setProperty('--d', clamp(depth * 0.5, 0, 0.6).toFixed(3));
    }
  }
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (flow) stack(flow.querySelectorAll('li'));
      if (bento && stackMobile.matches) stack(bento.querySelectorAll(':scope > .card'));
    });
  }
  if (!reduce) {
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  // 3. Zachte scroll: alleen met muis op een groot scherm, niet bij "minder beweging"
  const fine = matchMedia('(pointer: fine) and (min-width: 900px)');
  if (reduce || !fine.matches) return;

  root.style.scrollBehavior = 'auto';
  root.classList.add('smooth');
  let target = scrollY, current = scrollY, running = false, ours = false;
  const max = () => document.documentElement.scrollHeight - innerHeight;
  const ease = 0.11;

  function loop() {
    current += (target - current) * ease;
    if (Math.abs(target - current) < 0.5) current = target;
    ours = true;
    scrollTo(0, Math.round(current));
    if (current !== target) requestAnimationFrame(loop); else running = false;
  }
  function go(y) {
    target = clamp(y, 0, max());
    if (!running) { running = true; current = scrollY; requestAnimationFrame(loop); }
  }
  function scrollable(el) {
    // Laat binnen-scrollers (lijstjes, formulier-tekstvak) gewoon zelf scrollen
    for (; el && el !== document.body; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight + 2) {
        const o = getComputedStyle(el).overflowY;
        if (o === 'auto' || o === 'scroll') return true;
      }
    }
    return false;
  }
  addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.defaultPrevented) return;            // inzoomen
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;    // zijwaarts (demo-show)
    if (scrollable(e.target)) return;
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    go((running ? target : scrollY) + d);
  }, { passive: false });

  // Toetsenbord, scrollbalk of iets anders scrollt: meebewegen in plaats van terugtrekken
  addEventListener('scroll', () => {
    if (ours) { ours = false; return; }
    if (!running) { target = current = scrollY; }
  }, { passive: true });

  // Ankerlinks (menu, knoppen): zacht naar het blok, onder de vaste bovenbalk
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    const bar = document.querySelector('.top');
    go(scrollY + el.getBoundingClientRect().top - (bar ? bar.offsetHeight : 0) + 1);
    history.pushState(null, '', url.hash);
    setTimeout(() => dispatchEvent(new HashChangeEvent('hashchange')), 700);
  });
})();
