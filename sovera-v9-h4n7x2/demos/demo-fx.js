// Sovera demo's: binnenkomen bij scrollen, vaste knoppenbalk, bestelmandje
(function () {
  const root = document.documentElement;
  root.classList.add('fx');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Binnenkomen
  const sel = 'section .w > *, .items > *, .plist > *, .tiles > *, .svc > *, .stats > *, .steps > *, .grid > *';
  const els = [...document.querySelectorAll(sel)].filter((e) => !e.closest('dialog') && !e.matches('.ticker'));
  els.forEach((e) => { e.classList.add('rv'); const sib = [...e.parentElement.children].indexOf(e); e.style.setProperty('--i', Math.min(sib, 8)); });
  if (reduce || !('IntersectionObserver' in window)) els.forEach((e) => e.classList.add('in'));
  else {
    const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    els.forEach((e) => io.observe(e));
  }

  // 2. Knoppenbalk op telefoon: <body data-dock='[["Tekst","#link","main","melding"]]'>
  const dockData = document.body.getAttribute('data-dock');
  if (dockData) {
    const nav = document.createElement('nav');
    nav.className = 'dock'; nav.setAttribute('aria-label', 'Snelle acties');
    JSON.parse(dockData).forEach(([label, href, kind, msg, boek]) => {
      const a = document.createElement('a');
      a.textContent = label; a.href = href || '#';
      if (kind === 'main') a.classList.add('is-main');
      if (msg) a.setAttribute('data-demo', msg);
      if (boek !== undefined) a.setAttribute('data-open-boek', boek);
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
    document.body.classList.add('has-dock');
  }

  // 3. Bestelmandje (alleen als er menu-items zijn)
  const items = [...document.querySelectorAll('.items .item')];
  if (!items.length) return;
  const cart = new Map();
  const eur = (n) => '€' + n.toFixed(2).replace('.', ',');
  const bar = document.createElement('div');
  bar.className = 'cartbar'; bar.setAttribute('role', 'button'); bar.tabIndex = 0;
  document.body.appendChild(bar);
  const dlg = document.createElement('dialog');
  dlg.className = 'cartdlg';
  document.body.appendChild(dlg);

  const total = () => [...cart.values()].reduce((s, x) => s + x.p * x.q, 0);
  const count = () => [...cart.values()].reduce((s, x) => s + x.q, 0);
  function paint() {
    const n = count();
    bar.classList.toggle('is-on', n > 0);
    bar.innerHTML = '<span>' + n + (n === 1 ? ' gerecht' : ' gerechten') + ' · <b>' + eur(total()) + '</b></span><span class="go">Bekijk bestelling</span>';
    if (dlg.open) paintDlg();
  }
  function paintDlg() {
    const rows = [...cart.entries()].map(([name, x]) => '<div class="cartrow"><span>' + name + '</span><span class="q"><button type="button" data-d="-1" data-n="' + name + '" aria-label="Minder ' + name + '">−</button>' + x.q + '<button type="button" data-d="1" data-n="' + name + '" aria-label="Meer ' + name + '">+</button></span><b>' + eur(x.p * x.q) + '</b></div>').join('');
    dlg.innerHTML = '<div class="cartdlg__in"><h2>Jouw bestelling</h2>' + (rows || '<p>Nog niks gekozen.</p>') + '<div class="carttot"><span>Totaal</span><span>' + eur(total()) + '</span></div><button type="button" class="btn" data-demo="Op een echte site gaat dit naar jouw bestelsysteem of WhatsApp. Hier gebeurt niks echts.">Bestellen (demo)</button><button type="button" class="btn btn--w" data-close>Verder kiezen</button><p class="cartnote">Dit is een demo: er wordt niks besteld of betaald.</p></div>';
  }
  items.forEach((it) => {
    const name = it.querySelector('h3').textContent.trim();
    const p = parseFloat(it.querySelector('.p').textContent.replace('€', '').replace(',', '.'));
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'add'; b.textContent = '+ Toevoegen';
    b.setAttribute('aria-label', name + ' toevoegen aan je bestelling');
    b.addEventListener('click', () => {
      const x = cart.get(name) || { p, q: 0 }; x.q++; cart.set(name, x); paint();
      b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    });
    it.appendChild(b);
  });
  const openCart = () => { paintDlg(); if (!dlg.open) dlg.showModal(); };
  bar.addEventListener('click', openCart);
  bar.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCart(); } });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-close]')) { dlg.close(); return; }
    if (e.target.closest('[data-demo]')) { dlg.close(); return; }
    const d = e.target.closest('[data-d]');
    if (!d) return;
    const x = cart.get(d.dataset.n); x.q += +d.dataset.d; if (x.q <= 0) cart.delete(d.dataset.n);
    paint(); if (!cart.size) dlg.close();
  });
})();
