// Sovera 6.4: filmische scroll-effecten (hero-parallax, oplichtende tekst, tellers, horizontale demo-show)
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const vh = () => window.innerHeight;

  // 1. Hero: voortgang 0..1 over de hoogte van de hero, gebruikt in CSS (parallax)
  const hero = document.querySelector('main > .night');
  // 2. Oplichtende tekst
  const story = document.querySelector('[data-story]');
  let words = [];
  if (story) {
    const p = story.querySelector('[data-words]');
    (function split(node) {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((t) => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            const w = document.createElement('span'); w.className = 'w'; w.textContent = t; frag.appendChild(w); words.push(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) split(n);
      });
    })(p);
    if (reduce) words.forEach((w) => w.classList.add('on'));
  }
  // 3. Demo-show: echte demo's op telefoons, ze schuiven omhoog terwijl je scrolt
  const show = document.querySelector('[data-show]');
  function fitPhones() {
    document.querySelectorAll('.devc__phone').forEach((ph) => {
      const sc = (ph.clientWidth - 18) / 390, f = ph.querySelector('iframe');
      f.style.setProperty('--sc', sc.toFixed(4));
      f.style.height = Math.round((ph.clientHeight - 18) / sc) + 'px';
    });
  }
  fitPhones();
  addEventListener('resize', fitPhones);
  addEventListener('load', fitPhones);

  // 4. Tellers
  const counters = [...document.querySelectorAll('[data-count]')];
  function countUp(el) {
    const end = +el.dataset.count, pre = el.dataset.prefix || '', t0 = performance.now(), dur = 1400;
    (function tick(t) {
      const k = clamp((t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = pre + Math.round(end * e);
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { countUp(x.target); io.unobserve(x.target); } }), { threshold: 0.6 });
    counters.forEach((c) => { c.textContent = (c.dataset.prefix || '') + '0'; io.observe(c); });
  }

  // 5. Een lichtvlek volgt de muis op de donkere stukken
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.night').forEach((n) => {
      n.addEventListener('pointermove', (e) => {
        const r = n.getBoundingClientRect();
        n.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        n.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  let ticking = false;
  function frame() {
    ticking = false;
    const h = vh();
    if (hero && !reduce) {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--p', clamp(-r.top / Math.max(1, r.height * 0.9)).toFixed(3));
    }
    if (story && !reduce) {
      const r = story.getBoundingClientRect();
      const p = clamp((-r.top + h * 0.15) / Math.max(1, r.height - h * 0.8));
      const lit = p * (words.length + 4);
      words.forEach((w, i) => w.classList.toggle('on', i < lit));
    }
    if (show) {
      const r = show.getBoundingClientRect();
      show.style.setProperty('--sp', (reduce ? 1 : clamp((h - r.top) / (h * 0.9 + r.height * 0.15))).toFixed(3));
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  frame();
})();
