// Sovera 6.6: speelse onderdelen op de homepage (stijlkiezer, Google-voorbeeld, knoppenbalk op mobiel)
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 1. Stijlkiezer ----------
  const cs = document.querySelector('[data-cs]');
  if (cs) {
    const phone = cs.closest('.phone');
    const TYPES = {
      kapper: { tag: 'Kapsalon · Rotterdam', head: 'Knippen zonder gedoe.', open: 'Nu open · tot 18:00', cta: 'Maak een afspraak',
        rows: [['Knippen heren', '€ 25'], ['Knippen dames', '€ 35'], ['Baard trimmen', '€ 15'], ['Kleuren', 'v.a. € 45']] },
      snackbar: { tag: 'Snackbar · Rotterdam', head: 'Vers uit de friteuse.', open: 'Nu open · tot 23:00', cta: 'Bestel of bel ons',
        rows: [['Friet klein', '€ 3,20'], ['Kapsalon', '€ 9,90'], ['Kroket', '€ 2,80'], ['Burger', '€ 8,50']] },
      installateur: { tag: 'Installatie · Rotterdam', head: 'Lekkage? Vandaag nog geregeld.', open: 'Bereikbaar · tot 18:00', cta: 'Vraag een offerte aan',
        rows: [['Storing verhelpen', 'v.a. € 85'], ['Cv-onderhoud', '€ 99'], ['Nieuwe cv-ketel', 'offerte'], ['Badkamer', 'offerte']] },
      winkel: { tag: 'Winkel · Rotterdam', head: 'Gezellig winkelen in de buurt.', open: 'Nu open · tot 18:00', cta: 'Plan je route',
        rows: [['Ma t/m za', '10:00 – 18:00'], ['Koopavond', 'donderdag'], ['Parkeren', 'voor de deur'], ['Cadeaubon', 'verkrijgbaar']] },
      coach: { tag: 'Personal training · Rotterdam', head: 'Train met een plan.', open: 'Plekken vrij deze week', cta: 'Plan een proefles',
        rows: [['Proefles', 'gratis'], ['1-op-1 training', '€ 55'], ['Duo training', '€ 35 p.p.'], ['Voedingsadvies', '€ 40']] }
    };
    const FONTS = {
      modern: { f: '"Bricolage", "Archivo", system-ui, sans-serif', w: 800, up: 'none', ls: '-.03em' },
      stoer: { f: '"Oswald", "Arial Narrow", Impact, sans-serif', w: 700, up: 'uppercase', ls: '.02em' },
      klassiek: { f: 'Georgia, "Iowan Old Style", "Times New Roman", serif', w: 700, up: 'none', ls: '-.01em' }
    };
    const st = { name: 'Jouw Zaak', type: 'kapper', color: '#C6F25A', font: 'modern' };
    const $ = (sel) => cs.querySelector(sel);
    function lum(hex) {
      const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    }
    function render() {
      const t = TYPES[st.type], f = FONTS[st.font];
      phone.style.setProperty('--c', st.color);
      phone.style.setProperty('--on', lum(st.color) > 0.35 ? '#11180A' : '#FFFFFF');
      phone.style.setProperty('--cf', f.f);
      phone.style.setProperty('--cw', f.w);
      phone.style.setProperty('--cup', f.up);
      phone.style.setProperty('--cls', f.ls);
      $('[data-cs-tag]').textContent = t.tag;
      $('[data-cs-name]').textContent = st.name.trim() || 'Jouw Zaak';
      $('[data-cs-head]').textContent = t.head;
      $('[data-cs-open]').textContent = t.open;
      $('[data-cs-cta]').textContent = t.cta;
      const rows = $('[data-cs-rows]');
      rows.innerHTML = '';
      t.rows.forEach(([a, b]) => {
        const r = document.createElement('div'); r.className = 'cs__row';
        const x = document.createElement('span'); x.textContent = a;
        const y = document.createElement('b'); y.textContent = b;
        r.append(x, y); rows.appendChild(r);
      });
    }
    function group(sel, key) {
      const g = document.querySelector(sel);
      if (!g) return;
      g.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-v]');
        if (!b) return;
        g.querySelectorAll('button').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        st[key] = b.dataset.v;
        render();
        cs.classList.remove('pop'); void cs.offsetWidth; cs.classList.add('pop');
      });
    }
    group('[data-c-type]', 'type'); group('[data-c-color]', 'color'); group('[data-c-font]', 'font');
    const nm = document.querySelector('[data-c-name]');
    if (nm) nm.addEventListener('input', () => { st.name = nm.value; render(); });
    render();
  }

  // ---------- 2. Google-voorbeeld ----------
  const card = document.querySelector('[data-gcard]');
  if (card) {
    const list = card.querySelector('[data-gres]');
    const me = list.querySelector('.gres__me');
    const btns = document.querySelectorAll('[data-g]');
    let state = 'zonder', touched = false;
    function set(next) {
      if (next === state) return;
      state = next;
      btns.forEach((b) => { const on = b.dataset.g === next; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      const items = [...list.children];
      const first = new Map(items.map((li) => [li, li.getBoundingClientRect().top]));
      if (next === 'met') list.prepend(me); else list.appendChild(me);
      me.classList.toggle('is-full', next === 'met');
      if (reduce) return;
      items.forEach((li) => {
        const dy = first.get(li) - li.getBoundingClientRect().top;
        if (!dy) return;
        li.style.transition = 'none'; li.style.transform = 'translateY(' + dy + 'px)';
        requestAnimationFrame(() => requestAnimationFrame(() => { li.style.transition = 'transform .8s cubic-bezier(.2,.8,.2,1)'; li.style.transform = ''; }));
      });
    }
    btns.forEach((b) => b.addEventListener('click', () => { touched = true; set(b.dataset.g); }));
    if ('IntersectionObserver' in window) {
      let timer;
      const io = new IntersectionObserver((en) => en.forEach((x) => {
        clearTimeout(timer);
        if (x.isIntersecting && !touched && state === 'zonder') timer = setTimeout(() => { if (!touched) { set('met'); io.disconnect(); } }, 2400);
      }), { threshold: 0.7 });
      io.observe(card);
    }
  }

  // ---------- 4. Knoppenbalk op telefoon ----------
  const dock = document.querySelector('[data-dock]');
  if (dock) {
    document.body.classList.add('has-dock');
    const upd = () => dock.classList.toggle('is-on', scrollY > 520);
    upd(); addEventListener('scroll', upd, { passive: true });
  }
})();
