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
    button.disabled = true;
    setStatus('Bezig met versturen...');
    try {
      const res = await fetch(cfg.formEndpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error();
      form.reset();
      setStatus('Verstuurd. Je hoort binnen een paar werkdagen van me.', 'ok');
    } catch (err) {
      setStatus('Versturen lukte niet. Probeer het later opnieuw' + (cfg.email ? ' of mail naar ' + cfg.email + '.' : '.'), 'err');
    } finally {
      button.disabled = false;
    }
  });
})();
