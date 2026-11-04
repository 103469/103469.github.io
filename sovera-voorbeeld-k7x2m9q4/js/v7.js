// Sovera, versie 7: veiligheidsnet voor animaties, terug-naar-boven, prijscalculator,
// interesse vooraf aanvinken en "Laat ons dit fixen" na de websitecheck.
(function () {
  // 1. Veiligheidsnet: alles wat in beeld komt (of al voorbij is) wordt altijd zichtbaar,
  //    ook als de scroll-animatie hapert of iemand heel snel scrollt.
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  let ticking = false;
  function showVisible() {
    ticking = false;
    const limit = window.innerHeight * 1.05;
    for (let i = reveals.length - 1; i >= 0; i--) {
      const el = reveals[i];
      if (el.getBoundingClientRect().top < limit) { el.classList.add('in'); reveals.splice(i, 1); }
    }
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(showVisible); }
    toggleTop();
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  addEventListener('hashchange', () => setTimeout(showVisible, 50));
  setTimeout(showVisible, 400);
  // Laatste redmiddel: na 4 seconden alles tonen wat nog onzichtbaar is boven de huidige positie
  setTimeout(() => { reveals.forEach((el) => { if (el.getBoundingClientRect().top < window.innerHeight * 2) el.classList.add('in'); }); }, 4000);

  // 2. Terug naar boven
  const top = document.querySelector('.totop');
  function toggleTop() { if (top) top.hidden = window.scrollY < window.innerHeight * 1.5; }
  if (top) top.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
  toggleTop();

  // 3. Prijscalculator
  const calc = document.querySelector('[data-calc]');
  if (calc) {
    const q = (s) => calc.querySelector(s);
    let pages = 1;
    const euro = (n) => '€' + n.toLocaleString('nl-NL');
    function update() {
      const base = q('[data-calc-start]').checked ? 299 : 499;
      const once = base + (pages - 1) * 49;
      const month = q('[data-calc-onderhoud]').checked ? 29 : 0;
      q('[data-calc-pages]').textContent = pages;
      q('[data-calc-min]').disabled = pages <= 1;
      q('[data-calc-plus]').disabled = pages >= 4;
      q('[data-calc-once]').textContent = euro(once);
      q('[data-calc-month]').textContent = month ? euro(month) : 'geen';
      q('[data-calc-year]').textContent = euro(once + month * 12);
    }
    q('[data-calc-min]').addEventListener('click', (e) => { e.preventDefault(); pages = Math.max(1, pages - 1); update(); });
    q('[data-calc-plus]').addEventListener('click', (e) => { e.preventDefault(); pages = Math.min(4, pages + 1); update(); });
    q('[data-calc-onderhoud]').addEventListener('change', update);
    q('[data-calc-start]').addEventListener('change', update);
    update();
  }

  // 4. Knoppen met data-interest vinken alvast de juiste interesse aan in het formulier
  function preselect(value) {
    document.querySelectorAll('input[name="interesse"]').forEach((box) => { if (box.value === value) box.checked = true; });
  }
  document.querySelectorAll('[data-interest]').forEach((a) => a.addEventListener('click', () => preselect(a.getAttribute('data-interest'))));

  // 5. Na de websitecheck: "Laat ons dit fixen" zet je adres meteen in het contactformulier
  const result = document.getElementById('check-result');
  const url = document.getElementById('check-url');
  if (result && url && 'MutationObserver' in window) {
    new MutationObserver(() => {
      if (!result.textContent.trim() || result.querySelector('.fixit')) return;
      const box = document.createElement('div');
      box.className = 'fixit';
      const p = document.createElement('p');
      p.textContent = 'Wil je dat wij dit voor je verbeteren? Dan nemen we contact met je op.';
      const a = document.createElement('a');
      a.className = 'btn';
      a.href = '#contact';
      a.innerHTML = 'Laat ons dit fixen <span class="arrow" aria-hidden="true">→</span>';
      a.addEventListener('click', () => {
        const site = document.getElementById('c-site');
        const msg = document.getElementById('c-bericht');
        if (site && !site.value) site.value = url.value.trim();
        if (msg && !msg.value) msg.value = 'Ik heb de websitecheck gedaan en wil graag dat jullie mijn site verbeteren.';
        preselect('Website');
      });
      box.append(p, a);
      result.appendChild(box);
    }).observe(result, { childList: true });
  }
})();
