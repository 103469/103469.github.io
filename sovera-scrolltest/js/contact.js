// Sovera, versie 3: contactformulier, WhatsApp-knop en e-mailadres uit config.js
(function () {
  const cfg = window.SOVERA || {};

  // WhatsApp-knoppen en e-mailadressen alleen tonen als ze zijn ingevuld
  document.querySelectorAll('[data-wa]').forEach((el) => {
    if (!cfg.whatsapp) { el.hidden = true; return; }
    el.href = 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(el.getAttribute('data-wa'));
    el.hidden = false;
  });
  document.querySelectorAll('[data-email]').forEach((el) => {
    if (!cfg.email) { el.hidden = true; return; }
    el.textContent = cfg.email;
    el.hidden = false;
  });

  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('c-status');
  const button = form.querySelector('button[type="submit"]');

  // Nog geen formulieradres: meteen laten zien, niet pas nadat iemand alles heeft ingevuld
  if (!cfg.formEndpoint) {
    const note = document.createElement('p');
    note.className = 'form__privacy';
    const tag = document.createElement('span');
    tag.className = 'todo';
    tag.textContent = 'Dit formulier werkt nog niet: de site is nog in opbouw.';
    note.appendChild(tag);
    form.prepend(note);
  }

  function setStatus(text, kind) {
    status.textContent = text;
    status.className = 'form__status ' + (kind || '');
  }

  function check(field, ok) {
    field.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  }

  if (location.hash === '#bedankt') {
    setStatus('Bedankt, je bericht is binnen! Jayden neemt binnen 2 werkdagen contact met je op. Liever sneller? Bel of app 06 30743596.', 'ok');
    const sec = document.getElementById('contact');
    if (sec) sec.scrollIntoView();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.elements['naam'];
    const reach = form.elements['bereik'];
    const okName = check(name, name.value.trim().length > 1);
    const okReach = check(reach, reach.value.trim().length > 5);
    if (!okName || !okReach) {
      setStatus('Vul je naam en een telefoonnummer of e-mailadres in.', 'err');
      (okName ? reach : name).focus();
      return;
    }
    if (!cfg.formEndpoint) {
      setStatus('Het formulier is nog niet gekoppeld. Deze site is nog in opbouw.', 'err');
      return;
    }
    // Gewoon versturen via FormSubmit: de browser gaat even naar FormSubmit en komt daarna terug met #bedankt
    if (form.querySelector('[name="_honey"]') && form.querySelector('[name="_honey"]').value) return;
    const add = (name, value) => {
      let el = form.querySelector('input[name="' + name + '"]');
      if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.name = name; form.appendChild(el); }
      el.value = value;
    };
    const zaak = form.elements['zaak'] ? form.elements['zaak'].value.trim() : '';
    // Versie 7: aangevinkte interesses samenvoegen tot één veld (FormSubmit neemt anders alleen de laatste mee)
    const boxes = Array.from(form.querySelectorAll('input[name="interesse"]'));
    const picked = boxes.filter((b) => b.checked).map((b) => b.value);
    add('Interesse', picked.length ? picked.join(', ') : 'Niet aangegeven');
    boxes.forEach((b) => { b.disabled = true; });
    add('_subject', 'Nieuwe aanvraag via de Sovera-site' + (zaak ? ': ' + zaak : '') + (picked.length ? ' (' + picked.join(', ') + ')' : ''));
    add('_template', 'table');
    add('_captcha', 'false');
    add('_next', location.href.split('#')[0] + '#bedankt');
    form.action = cfg.formEndpoint;
    form.method = 'POST';
    button.disabled = true;
    setStatus('Bezig met versturen...');
    HTMLFormElement.prototype.submit.call(form);
  });
})();
