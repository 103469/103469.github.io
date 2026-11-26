// Sovera versie 9: hero-voorbeelden wisselen, diepte met de muis, portfolio scrolt op touchscreens.
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // 1. Hero: drie voorbeelden in laptop en telefoon, met tabbladen
  const hero = document.querySelector('.hx');
  const vis = hero && hero.querySelector('[data-hx]');
  if (vis) {
    const tabs = [...vis.querySelectorAll('[data-hx-tab]')];
    const groups = [...vis.querySelectorAll('.hx__slides')];
    const link = vis.querySelector('[data-hx-link]');
    const url = vis.querySelector('[data-hx-url]');
    let cur = 0;
    function show(i, focus) {
      cur = (i + tabs.length) % tabs.length;
      groups.forEach((g) => [...g.children].forEach((img, k) => img.classList.toggle('is-on', k === cur)));
      tabs.forEach((t, k) => {
        t.setAttribute('aria-selected', k === cur ? 'true' : 'false');
        t.tabIndex = k === cur ? 0 : -1;
        // progressbalk opnieuw starten
        const bar = t.querySelector('i');
        if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      });
      const t = tabs[cur];
      url.textContent = t.dataset.url;
      link.href = t.dataset.href;
      if (focus) t.focus();
    }
    tabs.forEach((t, k) => t.addEventListener('click', () => show(k)));
    vis.querySelector('.hx__tabs').addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1, true); }
    });
    if (reduce) {
      hero.classList.add('no-auto');
    } else {
      // als de balk vol is: volgende voorbeeld
      vis.querySelector('.hx__tabs').addEventListener('animationend', (e) => {
        if (e.animationName === 'hxprog') show(cur + 1);
      });
      const pause = (on) => hero.classList.toggle('is-paused', on);
      vis.addEventListener('pointerenter', () => pause(true));
      vis.addEventListener('pointerleave', () => pause(false));
      vis.addEventListener('focusin', () => pause(true));
      vis.addEventListener('focusout', () => pause(false));
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([en]) => hero.classList.toggle('is-paused', !en.isIntersecting)).observe(vis);
      }
      // laat de volgende afbeeldingen alvast laden
      addEventListener('load', () => groups.forEach((g) => [...g.children].forEach((img) => { img.loading = 'eager'; })));
    }

    // diepte: laptop en telefoon bewegen licht mee met de muis
    const stage = vis.querySelector('[data-hx-stage]');
    const laptop = stage.querySelector('.lp--hero');
    const phone = stage.querySelector('.mph--hero');
    if (!reduce && fine && matchMedia('(min-width: 1101px)').matches) {
      let raf = 0, x = 0, y = 0;
      stage.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect();
        x = (e.clientX - r.left) / r.width - 0.5;
        y = (e.clientY - r.top) / r.height - 0.5;
        if (!raf) raf = requestAnimationFrame(() => {
          raf = 0;
          laptop.style.transform = `rotateY(${-4 + x * 5}deg) rotateX(${1 - y * 3}deg)`;
          phone.style.transform = `translateZ(80px) rotate(-3deg) translate(${x * -16}px, ${y * -12}px)`;
        });
      });
      stage.addEventListener('pointerleave', () => { laptop.style.transform = ''; phone.style.transform = ''; });
    }
  }

  // 2. Portfolio: op touchscreens scrolt de laptop vanzelf als de case in beeld is
  if (!fine && !reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        en.target.classList.toggle('is-play', en.isIntersecting);
      });
    }, { threshold: 0.55 });
    document.querySelectorAll('.case').forEach((c) => io.observe(c));
  }
  // 3. Werkwijze: de lijn vult zich als de tijdlijn in beeld komt
  const tl = document.querySelector('[data-tl]');
  if (tl) {
    if (reduce || !('IntersectionObserver' in window)) tl.classList.add('is-on');
    else new IntersectionObserver((en, io) => { if (en[0].isIntersecting) { tl.classList.add('is-on'); io.disconnect(); } }, { threshold: 0.3 }).observe(tl);
  }

  // 4. Stijlkiezer: stappen afvinken en keuzes meenemen naar het contactformulier
  const cfg = document.querySelector('.cfg');
  if (cfg) {
    const steps = [...cfg.querySelectorAll('.cfg__step')];
    steps.forEach((st) => {
      const done = () => st.classList.add('is-done');
      st.addEventListener('click', (e) => { if (e.target.closest('button')) done(); });
      st.addEventListener('input', done);
    });
    const cta = cfg.querySelector('[data-cfg-cta]');
    if (cta) cta.addEventListener('click', () => {
      const pick = (sel) => { const b = cfg.querySelector(sel + ' .is-on'); return b ? (b.textContent.trim() || b.getAttribute('aria-label')) : ''; };
      const name = (cfg.querySelector('[data-c-name]').value || '').trim();
      const msg = document.getElementById('c-bericht');
      const zaak = document.getElementById('c-zaak');
      if (zaak && name && !zaak.value) zaak.value = name;
      if (msg && !msg.value) msg.value = 'Ik heb de stijlkiezer geprobeerd: ' + pick('[data-c-type]').toLowerCase() + ', kleur ' + pick('[data-c-color]').toLowerCase() + ', stijl ' + pick('[data-c-font]').toLowerCase() + '. Ik wil graag kennismaken.';
      document.querySelectorAll('input[name="interesse"]').forEach((b) => { if (b.value === 'Website') b.checked = true; });
    });
  }

  // 5. Calculator: bedragen lichten kort op als ze veranderen
  if (!reduce && 'MutationObserver' in window) {
    document.querySelectorAll('[data-calc-once],[data-calc-month],[data-calc-year]').forEach((el) => {
      new MutationObserver(() => { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('flash'), 500); })
        .observe(el, { childList: true, characterData: true, subtree: true });
    });
  }
})();
