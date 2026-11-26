// Versie 7: in een iframe (telefoon-preview op de homepage) de terugknop verbergen
try { if (window.self !== window.top) document.documentElement.classList.add("in-frame"); } catch (e) { document.documentElement.classList.add("in-frame"); }
// Sovera demo's: gedeelde interactie. Elke functie draait alleen als het onderdeel op de pagina staat.
(function () {
  const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const KORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fromMin = (n) => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');

  // 1. Melding voor knoppen die op een echte site iets zouden doen (bellen, appen, route)
  const toast = document.createElement('div');
  toast.className = 'demo-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  let toastTimer;
  function say(text) {
    toast.textContent = text;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 4500);
  }
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-demo]');
    if (!el) return;
    e.preventDefault();
    say(el.getAttribute('data-demo'));
  });

  // 2. Openingstijden: vandaag markeren en live tonen of de zaak open is
  const hoursEl = document.querySelector('[data-hours]');
  const hours = hoursEl ? JSON.parse(hoursEl.getAttribute('data-hours')) : null; // index 0 = zondag
  if (hours) {
    const word = hoursEl.getAttribute('data-open-word') || 'open';
    const now = new Date();
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    document.querySelectorAll(`[data-day~="${day}"]`).forEach((r) => r.classList.add('is-today'));
    const today = hours[day];
    let text;
    let open = false;
    if (today && mins >= toMin(today[0]) && mins < toMin(today[1])) {
      open = true;
      text = `Nu ${word} · tot ${today[1]}`;
    } else {
      let next = null;
      for (let i = 0; i < 8; i++) {
        const d = (day + i) % 7;
        const h = hours[d];
        if (!h || (i === 0 && mins >= toMin(h[0]))) continue;
        next = { i, d, t: h[0] };
        break;
      }
      const when = !next ? '' : next.i === 0 ? 'vandaag' : next.i === 1 ? 'morgen' : DAGEN[next.d];
      text = 'Nu gesloten' + (next ? ` · ${word} ${when} vanaf ${next.t}` : '');
    }
    document.querySelectorAll('[data-open-status]').forEach((el) => {
      el.textContent = text;
      el.classList.toggle('is-open', open);
    });
  }

  // 3. Filterknoppen (menu, prijslijst)
  document.querySelectorAll('[data-filter-group]').forEach((group) => {
    const target = document.getElementById(group.getAttribute('data-filter-group'));
    if (!target) return;
    const items = target.querySelectorAll('[data-cat]');
    const count = document.querySelector(`[data-filter-count="${target.id}"]`);
    group.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-filter]');
      if (!b) return;
      group.querySelectorAll('button[data-filter]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      const f = b.getAttribute('data-filter');
      let n = 0;
      items.forEach((it) => {
        const show = f === 'alles' || it.getAttribute('data-cat').split(' ').includes(f);
        it.hidden = !show;
        if (show) n++;
      });
      if (count) count.textContent = n + (n === 1 ? ' gerecht' : ' gerechten');
    });
  });

  // 4. Afspraak maken (barbershop): behandeling, dag, tijd, naam
  const dlg = document.getElementById('boek');
  if (dlg && hours) {
    const form = dlg.querySelector('form');
    const sel = form.elements['behandeling'];
    const days = dlg.querySelector('[data-days]');
    const slots = dlg.querySelector('[data-slots]');
    const msg = dlg.querySelector('[data-msg]');
    const steps = dlg.querySelector('[data-steps]');
    const done = dlg.querySelector('[data-done]');
    const doneText = dlg.querySelector('[data-done-text]');

    const dateFor = (i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; };

    function buildDays() {
      days.innerHTML = '';
      let added = 0;
      for (let i = 0; added < 6 && i < 14; i++) {
        const d = dateFor(i);
        const h = hours[d.getDay()];
        if (!h) continue;
        if (i === 0 && new Date().getHours() * 60 + new Date().getMinutes() > toMin(h[1]) - 60) continue;
        const label = i === 0 ? 'Vandaag' : i === 1 ? 'Morgen' : `${KORT[d.getDay()]} ${d.getDate()}`;
        days.insertAdjacentHTML('beforeend', `<label class="chip"><input type="radio" name="dag" value="${i}" ${added === 0 ? 'checked' : ''}><span>${label}</span></label>`);
        added++;
      }
      buildSlots();
    }

    function buildSlots() {
      const i = Number(form.elements['dag'].value || 0);
      const d = dateFor(i);
      const [o, c] = hours[d.getDay()];
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      slots.innerHTML = '';
      let free = 0;
      for (let t = toMin(o), k = 0; t <= toMin(c) - 30; t += 30, k++) {
        if (i === 0 && t < nowMin + 30) continue;
        const busy = (k * 7 + d.getDate() * 3) % 5 === 0; // demo: een paar tijden zijn al bezet
        if (!busy) free++;
        slots.insertAdjacentHTML('beforeend', `<label class="chip chip--time${busy ? ' is-busy' : ''}"><input type="radio" name="tijd" value="${fromMin(t)}" ${busy ? 'disabled' : ''}><span>${fromMin(t)}</span></label>`);
      }
      if (!free) slots.innerHTML = '<p class="slots__empty">Geen tijden meer vrij. Kies een andere dag.</p>';
    }

    function open(preset) {
      steps.hidden = false;
      done.hidden = true;
      msg.textContent = '';
      form.reset();
      if (preset) sel.value = preset;
      buildDays();
      dlg.showModal();
    }

    document.querySelectorAll('[data-open-boek]').forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault();
      open(b.getAttribute('data-open-boek'));
    }));
    days.addEventListener('change', () => { buildSlots(); msg.textContent = ''; });
    slots.addEventListener('change', () => { msg.textContent = ''; });
    dlg.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dlg.close()));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const tijd = form.elements['tijd'] ? form.querySelector('input[name="tijd"]:checked') : null;
      const naam = form.elements['naam'];
      if (!tijd) { msg.textContent = 'Kies een tijd.'; return; }
      if (naam.value.trim().length < 2) { msg.textContent = 'Vul je naam in.'; naam.focus(); return; }
      const i = Number(form.elements['dag'].value);
      const d = dateFor(i);
      const dag = i === 0 ? 'vandaag' : i === 1 ? 'morgen' : `${DAGEN[d.getDay()]} ${d.getDate()}`;
      doneText.textContent = `${sel.options[sel.selectedIndex].text.split(' · ')[0]}, ${dag} om ${tijd.value}, op naam van ${naam.value.trim()}.`;
      steps.hidden = true;
      done.hidden = false;
      done.querySelector('button').focus();
    });
  }

  // 5. Postcodecheck (installateur)
  const pc = document.getElementById('pc-form');
  if (pc) {
    const out = document.getElementById('pc-out');
    pc.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = pc.elements['postcode'].value.replace(/\s/g, '').toUpperCase();
      const m = v.match(/^([1-9]\d{3})([A-Z]{2})?$/);
      if (!m) {
        out.textContent = 'Vul je postcode in, bijvoorbeeld 3011 AB.';
        out.className = 'pc__out is-err';
        return;
      }
      const n = Number(m[1]);
      const ok = n >= 2900 && n <= 3199; // Rotterdam en omliggende gemeenten
      out.className = 'pc__out ' + (ok ? 'is-ok' : 'is-no');
      out.textContent = ok
        ? `Ja, ${m[1]} valt in ons werkgebied. Meestal kunnen we binnen 2 werkdagen langskomen.`
        : `${m[1]} valt buiten ons vaste werkgebied. Bel even, soms kan het toch.`;
      const field = document.getElementById('o-postcode');
      if (field && !field.value) field.value = m[1] + (m[2] ? ' ' + m[2] : '');
    });
  }

  // 6. Offerte in 3 stappen (installateur)
  const of = document.getElementById('offerte-form');
  if (of) {
    const sets = [...of.querySelectorAll('[data-step]')];
    const bar = document.querySelector('[data-progress]');
    const label = document.querySelector('[data-progress-label]');
    const err = of.querySelector('[data-err]');
    const done = document.getElementById('offerte-done');
    let step = 0;

    function show(n) {
      step = n;
      sets.forEach((s, i) => { s.hidden = i !== n; });
      bar.style.setProperty('--p', ((n + 1) / sets.length) * 100 + '%');
      label.textContent = `Stap ${n + 1} van ${sets.length}`;
      err.textContent = '';
      const last = n === sets.length - 1;
      of.querySelector('[data-nav="terug"]').hidden = n === 0;
      of.querySelector('[data-next]').hidden = last;
      of.querySelector('[data-send]').hidden = !last;
      const first = sets[n].querySelector('input, textarea, select');
      if (first && n > 0) first.focus();
    }

    function valid(n) {
      const s = sets[n];
      if (n === 0 && !s.querySelector('input[name="klus"]:checked')) return 'Kies wat voor klus het is.';
      if (n === 1) {
        const p = of.elements['postcode'];
        const ok = /^[1-9]\d{3}\s?[A-Za-z]{2}$/.test(p.value.trim());
        p.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok) { p.focus(); return 'Vul een geldige postcode in, bijvoorbeeld 3011 AB.'; }
      }
      if (n === 2) {
        const naam = of.elements['naam'];
        const tel = of.elements['telefoon'];
        const okN = naam.value.trim().length > 1;
        const okT = tel.value.replace(/\D/g, '').length >= 10;
        naam.setAttribute('aria-invalid', okN ? 'false' : 'true');
        tel.setAttribute('aria-invalid', okT ? 'false' : 'true');
        if (!okN) { naam.focus(); return 'Vul je naam in.'; }
        if (!okT) { tel.focus(); return 'Vul een telefoonnummer van 10 cijfers in.'; }
      }
      return '';
    }

    of.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nav]');
      if (!b) return;
      e.preventDefault();
      if (b.getAttribute('data-nav') === 'terug') return show(Math.max(0, step - 1));
      const problem = valid(step);
      if (problem) { err.textContent = problem; return; }
      show(step + 1);
    });

    of.addEventListener('submit', (e) => {
      e.preventDefault();
      const problem = valid(step);
      if (problem) { err.textContent = problem; return; }
      // Enter (of "Ga" op een telefoon) in stap 1 of 2: naar de volgende stap, niet al versturen
      if (step < sets.length - 1) { show(step + 1); return; }
      of.hidden = true;
      document.querySelector('[data-progress-wrap]').hidden = true;
      done.hidden = false;
      done.focus();
    });

    done.querySelector('button').addEventListener('click', () => {
      of.reset();
      of.hidden = false;
      document.querySelector('[data-progress-wrap]').hidden = false;
      done.hidden = true;
      show(0);
    });
    show(0);
  }

  // 7. Voor/na-schuif (installateur)
  document.querySelectorAll('.ba').forEach((ba) => {
    const r = ba.querySelector('input[type="range"]');
    const set = () => ba.style.setProperty('--pos', r.value + '%');
    r.addEventListener('input', set);
    set();
  });
})();
