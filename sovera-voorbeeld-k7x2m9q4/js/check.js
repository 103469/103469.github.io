// Sovera, versie 3: gratis websitecheck
// Meet via de Google PageSpeed Insights API: snelheid op mobiel, laadtijd, mobielvriendelijk, SEO en https.
(function () {
  const form = document.getElementById('check-form');
  if (!form) return;
  const cfg = window.SOVERA || {};
  const input = document.getElementById('check-url');
  const hint = document.getElementById('check-hint');
  const button = form.querySelector('button');
  const result = document.getElementById('check-result');

  const API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
  const TIMEOUT_MS = 90000;
  const PROFILE_HOSTS = ['facebook.com', 'instagram.com', 'linktr.ee', 'tiktok.com', 'google.com', 'maps.app.goo.gl', 'g.page'];

  function normalize(raw) {
    let v = raw.trim();
    if (!v) return null;
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    try {
      const u = new URL(v);
      // Alleen gewone domeinnamen (ook IDN als xn--). Chrome laat spaties (%20) en tekens als " ' = ( )
      // anders gewoon toe in de hostnaam, en die komt later in de HTML terecht.
      if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname)) return null;
      return u;
    } catch (e) {
      return null;
    }
  }

  function isProfile(u) {
    const h = u.hostname.replace(/^www\./, '');
    return PROFILE_HOSTS.some((p) => h === p || h.endsWith('.' + p));
  }

  function level(score) {
    if (score >= 90) return { cls: 'ok', color: '#3CC48A' };
    if (score >= 50) return { cls: 'warn', color: '#E3A23A' };
    return { cls: 'bad', color: '#EC6A55' };
  }

  // Tekst veilig in HTML zetten (de hostnaam komt uit de invoer of uit het Google-antwoord)
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function seconds(ms) {
    return (ms / 1000).toFixed(1).replace('.', ',') + ' s';
  }

  function setHint(text, invalid) {
    hint.textContent = text;
    input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  }

  function waLink(text) {
    if (!cfg.whatsapp) return '';
    return 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(text);
  }

  // Na de check: altijd een duidelijke volgende stap
  function nextStep(host, perf) {
    const msg = perf === null
      ? 'Hoi Quinten, ik heb de websitecheck gedaan voor ' + host + '. Kun je meekijken?'
      : 'Hoi Quinten, mijn site ' + host + ' scoorde ' + perf + '/100 in de websitecheck. Kun je meekijken?';
    const wa = waLink(msg);
    return `
      <div class="check__after">
        <p>${perf !== null && perf >= 90 ? 'Je site is snel. Wil je ook beter gevonden worden in Google Maps? Daar help ik graag mee.' : 'Hier valt winst te halen. Laat je gegevens achter, dan laat ik je gratis zien wat ik zou verbeteren.'}</p>
        <div class="check__cta">
          <a class="btn" href="#contact" data-prefill="${esc(host)}">Laat me terugbellen</a>
          ${wa ? `<a class="btn btn--wa" href="${esc(wa)}" target="_blank" rel="noopener">Stuur via WhatsApp</a>` : ''}
        </div>
      </div>`;
  }

  function renderReport(u, lh) {
    const perfRaw = lh.categories?.performance?.score;
    const seoRaw = lh.categories?.seo?.score;
    const finalUrl = lh.finalDisplayedUrl || lh.finalUrl || u.href;
    const host = new URL(finalUrl).hostname;
    const perf = Math.round(perfRaw * 100);
    const seo = seoRaw == null ? null : Math.round(seoRaw * 100);
    const lcp = lh.audits?.['largest-contentful-paint']?.numericValue;
    // Lighthouse 12: audit 'viewport'. Lighthouse 13 (PageSpeed sinds okt 2025): vervangen door 'viewport-insight'.
    const viewportScore = lh.audits?.['viewport']?.score ?? lh.audits?.['viewport-insight']?.score;
    const https = finalUrl.startsWith('https://');
    const lv = level(perf);

    const rows = [
      { label: 'Snelheid op mobiel', value: perf + '/100', cls: level(perf).cls },
      lcp ? { label: 'Laadtijd hoofdinhoud', value: seconds(lcp), cls: lcp < 2500 ? 'ok' : lcp < 4000 ? 'warn' : 'bad' } : null,
      viewportScore == null ? null : { label: 'Gemaakt voor mobiel', value: viewportScore === 1 ? 'Ja' : 'Nee', cls: viewportScore === 1 ? 'ok' : 'bad' },
      seo == null ? null : { label: 'Vindbaar in Google (SEO)', value: seo + '/100', cls: level(seo).cls },
      { label: 'Beveiligde verbinding', value: https ? 'Ja' : 'Nee', cls: https ? 'ok' : 'bad' },
    ].filter(Boolean);

    result.innerHTML = `
      <div class="report">
        <div class="report__head"><span class="label report__label">Jouw websitecheck</span><span class="report__tag">Mobiel</span></div>
        <p class="report__site"></p>
        <div class="report__score">
          <svg viewBox="0 0 120 120" class="gauge" aria-hidden="true"><circle cx="60" cy="60" r="50" class="gauge__track"/><circle cx="60" cy="60" r="50" class="gauge__value" style="--pct:0;--gauge:${lv.color}"/></svg>
          <div class="report__num"><span>${perf}</span><small>/100</small></div>
        </div>
        <ul class="report__list">${rows.map((r) => `<li class="${r.cls}"><span>${r.label}</span><b>${r.value}</b></li>`).join('')}</ul>
        <p class="report__foot">Momentopname van Google. Scores kunnen per keer iets verschillen.</p>
      </div>` + nextStep(host, perf);
    result.querySelector('.report__site').textContent = host;
    requestAnimationFrame(() => {
      const g = result.querySelector('.gauge__value');
      if (g) g.style.setProperty('--pct', perf / 100);
    });
  }

  function renderProfile(u) {
    const host = u.hostname.replace(/^www\./, '');
    result.innerHTML = `
      <div class="check__after">
        <p><strong>Dit is een profiel op ${esc(host)}, geen eigen website.</strong> Daar heb je zelf weinig invloed op, en in Google kom je er minder goed mee naar voren. Een eigen site vanaf €299 lost dat op.</p>
      </div>` + nextStep(host, null);
  }

  function fail(text) {
    setHint(text, false);
    result.innerHTML = '';
  }

  // Knoppen "Laat me terugbellen" vullen het contactformulier alvast in
  result.addEventListener('click', (e) => {
    const a = e.target.closest('[data-prefill]');
    if (!a) return;
    const site = document.getElementById('c-site');
    if (site && !site.value) site.value = a.getAttribute('data-prefill');
  });

  input.addEventListener('input', () => input.setAttribute('aria-invalid', 'false'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = normalize(input.value);
    if (!u) {
      setHint('Vul een website in, bijvoorbeeld jouwzaak.nl.', true);
      input.focus();
      return;
    }
    if (isProfile(u)) {
      setHint('', false);
      renderProfile(u);
      result.focus();
      return;
    }

    button.disabled = true;
    button.textContent = 'Bezig met checken...';
    setHint('Dit duurt meestal minder dan een minuut.', false);
    result.innerHTML = '';

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const params = new URLSearchParams({ url: u.href, strategy: 'mobile' });
      params.append('category', 'performance');
      params.append('category', 'seo');
      if (cfg.pagespeedKey) params.set('key', cfg.pagespeedKey);
      const res = await fetch(`${API}?${params}`, { signal: ctrl.signal });

      if (res.status === 429 || res.status === 403) throw new Error('druk');
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error('niet-bereikbaar');

      const lh = data.lighthouseResult;
      // Google kon de site niet laden: geen score geven, wel eerlijk melden
      if (!lh || lh.runtimeError || lh.categories?.performance?.score == null) throw new Error('niet-bereikbaar');

      renderReport(u, lh);
      setHint('Klaar.', false);
      result.focus();
    } catch (err) {
      if (err.name === 'AbortError') fail('Dit duurt te lang. Probeer het later nog eens.');
      else if (err.message === 'druk') fail('Het is even te druk. Probeer het over een paar minuten opnieuw.');
      else fail('Google kon deze site niet openen. Klopt het adres? Probeer het met of zonder www.');
    } finally {
      clearTimeout(timer);
      button.disabled = false;
      button.textContent = 'Check mijn site';
    }
  });
})();
