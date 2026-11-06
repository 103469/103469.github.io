// Sovera-assistent: gratis chatbot zonder AI-kosten. Antwoorden komen uit een vaste lijst (de teksten van de site),
// aanvragen gaan via hetzelfde formulier-adres als het contactformulier (js/config.js).
(function () {
  'use strict';
  var cfg = window.SOVERA || {};
  var script = document.currentScript;
  var ROOT = '/';
  try { ROOT = new URL('../', script.src).href; } catch (e) { /* blijft '/' */ }
  var home = (location.origin + location.pathname).replace(/index\.html$/, '') === ROOT.replace(/index\.html$/, '');
  var TEL = '06 30743596', TELHREF = 'tel:+31630743596';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function href(p) { return p.charAt(0) === '#' ? (home ? p : ROOT + 'index.html' + p) : ROOT + p; }
  function act(label, h, extra) {
    var ext = /^https?:/.test(h) && h.indexOf(location.origin) !== 0;
    return '<a class="sc-act" href="' + h + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + (extra || '') + '>' + label + '</a>';
  }
  function wa(text) { return cfg.whatsapp ? 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(text) : ''; }
  function contactActs() {
    var s = act('Bellen: ' + TEL, TELHREF);
    if (cfg.whatsapp) s += act('WhatsApp', wa('Hallo Jayden, ik heb een vraag over een website van Sovera.'));
    if (cfg.email) s += act('Mail', 'mailto:' + cfg.email);
    return s;
  }
  function norm(s) {
    return ' ' + String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9@ ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  }

  // Veelgebruikte vervolgknoppen: [tekst, intent]
  var C = {
    prijs: ['Wat kost het?', 'prijs'], krijg: ['Wat krijg ik?', 'krijg'], duur: ['Hoe lang duurt het?', 'duur'],
    betaal: ['Hoe betaal ik?', 'betalen'], plan: ['Plan een kennismaking', 'lead'], vb: ['Voorbeelden bekijken', 'voorbeeld'],
    onderhoud: ['Wat is onderhoud?', 'onderhoud'], contact: ['Bellen of appen', 'contact'], check: ['Gratis websitecheck', 'bestaand']
  };

  // Antwoorden: k = zoekwoorden (voorvoegsel; "woord$" = exact woord), a = antwoord (HTML), c = vervolgknoppen.
  // Specifieke onderwerpen staan vóór de algemene, bij gelijke score wint de eerste.
  var KB = [
    { id: 'lead', k: ['kennismaking', 'afspraak', 'offerte', 'aanvragen', 'aanvraag', 'interesse', 'contact opnemen', 'terugbellen', 'bel mij', 'bel me', 'gegevens achterlaten', 'laat mijn gegevens', 'wil een website', 'wil graag een website', 'starten', 'beginnen'], a: '' },
    { id: 'betalen', k: ['betaal', 'betaling', 'betalen', 'factuur', 'ideal', 'termijn', 'aanbetaling', 'voorschot', 'vooraf betalen'], a: 'Je betaalt in twee delen: de helft als je akkoord geeft op de offerte en de andere helft bij oplevering. Voor beide krijg je een factuur. Onderhoud betaal je per maand.', c: [C.prijs, C.duur, C.plan] },
    { id: 'onderhoud', k: ['onderhoud', 'wijzig', 'aanpassen', 'veranderen', 'hosting', 'beveiliging', 'opzeggen', 'opzegbaar', 'jaarcontract', 'maandelijks', 'per maand', 'updates'], a: '<b>Onderhoud: €29 per maand</b> met een jaarcontract (of €39 per maand als je maandelijks wilt kunnen opzeggen). Daarin zit hosting en beveiliging, prijzen en openingstijden aanpassen op verzoek en kleine wijzigingen, doorgaans binnen 5 werkdagen. Na een jaar kies je opnieuw: nog een jaar, maandelijks opzegbaar of stoppen. Zonder onderhoud kan ook, dan betaal je per wijziging.', c: [C.prijs, C.betaal, C.plan] },
    { id: 'uitgebreid', k: ['uitgebreid', 'meerdere pagina', 'meer pagina', 'extra pagina', 'pagina erbij', 'paginas', 'portfolio', 'menukaart', 'grotere website', 'grote website', 'groter bedrijf', 'meer dan 1 pagina', 'een pagina genoeg'], a: 'Een <b>extra pagina kost €149</b> (bijvoorbeeld een menu of portfolio). Heb je er veel nodig, dan is <b>Website Uitgebreid vanaf €999</b> slimmer: meerdere pagina\'s, eigen ontwerp in jouw huisstijl, advies en hulp bij de teksten, drie feedbackrondes en je Google-profiel erbij. Je krijgt vooraf een offerte met een vaste prijs, en hij staat meestal online binnen 4 tot 6 weken. Voor de meeste lokale bedrijven is één pagina genoeg.', c: [C.prijs, C.betaal, C.plan] },
    { id: 'intro', k: ['korting', 'introductie', 'eerste 3', 'eerste drie', 'aanbieding', 'actie', 'voordeel'], a: 'Website Start kost <b>€299 als je een van de eerste 3 klanten bent</b>, daarna €499. Je betaalt de helft bij de start en de helft bij oplevering.', c: [C.krijg, C.betaal, C.plan] },
    { id: 'prijs', k: ['prijs', 'prijzen', 'kost', 'kosten', 'tarief', 'hoeveel', 'te duur', 'budget', 'euro'], a: '<b>Website Start</b> (1 pagina, gemaakt voor mobiel): <b>€299</b> voor de eerste 3 klanten, daarna €499. Een extra pagina kost €149 en Website Uitgebreid begint bij €999. <b>Onderhoud</b> is €29 per maand met een jaarcontract. De domeinnaam komt op jouw naam. Eerste jaar met onderhoud: €299 + 12 × €29 = €647.', c: [C.krijg, C.onderhoud, C.betaal, C.plan] },
    { id: 'krijg', k: ['krijg', 'zit erin', 'inbegrepen', 'inclusief', 'pakket', 'website start', 'wat doen jullie', 'wat bieden', 'diensten', 'aanbod', 'wat is sovera', 'wat maken'], a: 'Met <b>Website Start</b> krijg je één overzichtelijke pagina, gemaakt voor mobiel, met je prijzen, openingstijden, foto\'s en route. Verder een knop om te bellen, appen of te boeken, knoppen naar je Instagram, TikTok of Facebook, een <b>volledig ingericht Google-profiel</b> en een domeinnaam op jouw naam.', c: [C.prijs, C.duur, C.vb, C.plan] },
    { id: 'duur', k: ['hoe lang', 'duurt', 'levertijd', 'oplevering', 'wanneer klaar', 'wanneer online', 'weken', 'snel online', 'deadline', 'spoed'], a: 'Doorgaans staat je website <b>2 tot 3 weken</b> nadat je foto\'s en teksten zijn aangeleverd online, binnen 3 weken in totaal. Website Uitgebreid duurt meestal 4 tot 6 weken.', c: [C.krijg, C.prijs, C.plan] },
    { id: 'werkwijze', k: ['werkwijze', 'traject', 'stappen', 'hoe werkt', 'proces', 'feedback', 'hoe gaat', 'hoe verloopt'], a: 'In vier stappen: <b>1. Kennismaken</b> (gratis gesprek op locatie, telefonisch of via WhatsApp). <b>2. Ontwerp</b>: jij levert foto\'s, prijzen en teksten aan, wij maken een eerste versie. <b>3. Feedback</b>: je geeft twee keer feedback en pas na jouw akkoord gaat de website live. <b>4. Online</b>: je website staat online en je Google-profiel is ingericht.', c: [C.duur, C.prijs, C.plan] },
    { id: 'eigendom', k: ['eigenaar', 'van mij', 'van ons', 'domein', 'domeinnaam', 'mijn naam', 'wie bezit', 'eigen naam'], a: 'Ja, <b>de website is van jou</b>. De domeinnaam staat op jouw naam. Stop je met onderhoud, dan blijft het domein van jou.', c: [C.onderhoud, C.prijs, C.plan] },
    { id: 'google', k: ['google', 'bedrijfsprofiel', 'maps', 'vindbaar', 'gevonden', 'ranking', 'hoger komen', 'seo', 'bovenaan', 'zoekresultaat'], a: 'We richten je <b>Google-profiel volledig in</b>: openingstijden, foto\'s, categorie en route. Samen met een snelle website help je daarmee om beter gevonden te worden in Google Maps. Een bepaalde positie in Google kan niemand garanderen. De verificatie bij Google doen we samen met jou.', c: [C.krijg, C.check, C.plan] },
    { id: 'bestaand', k: ['bestaande', 'al een website', 'heb al een', 'verbeter', 'huidige site', 'huidige website', 'oude site', 'oude website', 'websitecheck', 'check', 'score', 'pagespeed', 'snelheid', 'trage', 'traag'], a: 'Ja, dat kan. Doe eerst de <b>gratis websitecheck</b>: je ziet hoe snel je website is op mobiel en hoe goed Google hem kan lezen. In een kort gesprek bepalen we daarna of verbeteren volstaat of dat een nieuwe website slimmer en voordeliger is.', acts: function () { return act('Naar de websitecheck', href('#check')); }, c: [C.prijs, C.plan] },
    { id: 'technisch', k: ['technisch', 'moeilijk', 'zelf doen', 'ingewikkeld', 'kennis nodig', 'wat moet ik doen', 'wat moet ik aanleveren', 'aanleveren', 'foto', 'teksten'], a: 'Nee, je hoeft <b>niets technisch</b> te doen. Je levert foto\'s, teksten, prijzen en openingstijden aan, wij regelen de rest. Heb je nog geen goede foto\'s of teksten, dan helpen we je daar bij het kennismaken mee op weg.', c: [C.duur, C.krijg, C.plan] },
    { id: 'betaalbaar', k: ['goedkoop', 'waarom zo', 'goedkoper', 'te mooi', 'te goed', 'waarom is het zo'], a: 'Wij zijn een compact team met lage vaste kosten en bouwen overzichtelijke websites op één pagina in plaats van grote websites die je niet nodig hebt. Daardoor blijft de prijs laag, zonder concessies aan snelheid of kwaliteit.', c: [C.prijs, C.krijg, C.plan] },
    { id: 'voorbeeld', k: ['voorbeeld', 'demo', 'laten zien', 'zien hoe', 'referentie', 'eerder werk', 'gemaakt'], a: 'Op de site staan <b>drie demowebsites</b> voor fictieve bedrijven: een kapper, een snackbar/restaurant en een installateur. Open er een en probeer hem uit op de telefoon. Jouw website krijgt jouw eigen huisstijl, foto\'s en teksten.', acts: function () { return act('Naar de voorbeelden', href('#voorbeelden')); }, c: [C.krijg, C.prijs, C.plan] },
    { id: 'reviews', k: ['review', 'ervaring', 'klanten van jullie', 'klantverhalen', 'getuigenis', 'recensie'], a: 'Wij zijn net begonnen, dus er zijn nog geen klantverhalen. De voorbeelden op de site zijn demo\'s met fictieve bedrijven. Juist daarom is er een introductieprijs voor de eerste 3 klanten.', c: [C.vb, C.prijs, C.plan] },
    { id: 'branche', k: ['branche', 'sector', 'voor wie', 'welke bedrijven', 'welke zaken', 'soort bedrijf', 'kapper', 'barber', 'snackbar', 'restaurant', 'horeca', 'caf', 'installateur', 'schilder', 'winkel', 'zzp', 'coach', 'fotograaf', 'personal trainer', 'klusbedrijf', 'aannemer', 'bouw', 'beauty', 'nagel'], a: 'Wij maken websites voor kappers en beauty, horeca, winkels, bouw en installatie en zzp\'ers. Kijk op de pagina voor jouw branche:', acts: function () { return act('Kappers', ROOT + 'branches/kappers.html') + act('Horeca', ROOT + 'branches/horeca.html') + act('Winkels', ROOT + 'branches/winkels.html') + act('Bouw', ROOT + 'branches/bouw.html') + act('Zzp', ROOT + 'branches/zzp.html'); }, c: [C.prijs, C.plan] },
    { id: 'regio', k: ['regio', 'rotterdam', 'waar zitten', 'waar zijn jullie', 'locatie', 'buiten rotterdam', 'omgeving', 'gebied', 'op locatie', 'langskomen'], a: 'Wij zitten in <b>Rotterdam</b> en werken met ondernemers daar. Een gesprek kan op locatie in Rotterdam of telefonisch. Zit je ergens anders? Laat je gegevens achter, dan kijken we of het past.', c: [C.plan, C.contact] },
    { id: 'social', k: ['instagram', 'facebook', 'tiktok', 'social media', 'socials', 'sociale media'], a: 'In je website zitten knoppen naar je Instagram, TikTok of Facebook. Wil je daarnaast hulp met je socials? Bespreek dat gerust in het kennismakingsgesprek.', c: [C.krijg, C.plan] },
    { id: 'wie', k: ['wie zijn', 'wie ben', 'quinten', 'jayden', 'over jullie', 'team', 'wie bouwt', 'wie maakt'], a: 'Wij zijn <b>twee jongens uit Rotterdam</b>: Quinten bouwt de website en Jayden is jouw vaste aanspreekpunt. Eén van ons bouwt, één van ons praat met jou.', c: [C.contact, C.plan] },
    { id: 'tevreden', k: ['tevreden', 'niet goed', 'annuleren', 'geld terug', 'garantie', 'bevalt', 'niet mooi'], a: 'Je geeft <b>twee keer feedback</b> en pas na jouw akkoord gaat de website live. Over verdere afspraken (bijvoorbeeld bij annuleren) kun je het beste even met Jayden praten.', acts: contactActs, c: [C.plan] },
    { id: 'voorwaarden', k: ['voorwaarden', 'privacy', 'gegevens', 'avg', 'btw', 'kvk', 'bedrijfsgegevens'], a: 'Onze voorwaarden en privacyverklaring staan onderaan de site. Vragen over btw, KvK of facturen? Dat bespreken we in het gesprek, vraag het gerust aan Jayden.', acts: function () { return act('Privacyverklaring', ROOT + 'privacy.html') + act('Voorwaarden', ROOT + 'voorwaarden.html') + contactActs(); } },
    { id: 'contact', k: ['telefoon', 'bellen', 'bel$', 'nummer', 'mail', 'email', 'whatsapp', 'appen', 'app$', 'bereiken', 'bereikbaar', 'contact', 'echt persoon', 'mens$', 'medewerker', 'iemand spreken', 'praten met'], a: 'Jayden is je aanspreekpunt. <b>Bel of app 06 30743596</b>, of mail ons. Je krijgt doorgaans binnen 2 werkdagen een reactie.', acts: contactActs, c: [C.plan, C.prijs] },
    { id: 'bot', k: ['chatbot', 'assistent', 'ai$', 'bot$', 'robot', 'kunstmatig', 'ben jij echt', 'ben je echt'], a: 'Ik ben een <b>automatische assistent</b>, geen mens, en ik beantwoord vragen over prijzen, doorlooptijd en wat je krijgt. Zo\'n assistent kan ook op jouw eigen website komen: dat is binnenkort beschikbaar. Wil je als eerste weten wanneer? Laat je interesse achter.', c: [C.plan, C.contact] },
    { id: 'groet', k: ['hoi', 'hallo', 'hey', 'hi$', 'goedemorgen', 'goedemiddag', 'goedenavond', 'dag$'], a: 'Hoi! Waar kan ik je mee helpen? Je kunt een vraag typen of een van de knoppen kiezen.', c: [C.prijs, C.krijg, C.duur, C.plan] },
    { id: 'dank', k: ['bedankt', 'dank je', 'dankje', 'dankjewel', 'thanks', 'top$', 'super$', 'helder', 'duidelijk'], a: 'Graag gedaan! Heb je nog een vraag, of zal ik een kennismaking voor je inplannen?', c: [C.plan, C.prijs] }
  ];

  var FALLBACK = { a: 'Daar kom ik zo niet uit, ik ben maar een automatische assistent. Jayden kan het je zo vertellen: bel of app hem, of laat je gegevens achter dan nemen wij contact met je op.', acts: contactActs, c: [C.plan, C.prijs, C.krijg] };

  function find(text) {
    var t = norm(text), best = null, top = 0;
    KB.forEach(function (it) {
      var s = 0;
      it.k.forEach(function (key) {
        var exact = key.charAt(key.length - 1) === '$';
        var k = norm(exact ? key.slice(0, -1) : key).trim();
        var hit = exact ? t.indexOf(' ' + k + ' ') > -1 : t.indexOf(' ' + k) > -1;
        if (hit) s += (k.indexOf(' ') > -1 ? 3 : 2);
      });
      if (s > top) { top = s; best = it; }
    });
    return top >= 2 ? best : null;
  }

  // ---------- opbouw ----------
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.7A8 8 0 1 1 21 12Z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01"/></svg>';
  var box = document.createElement('div');
  box.className = 'sc';
  box.innerHTML =
    '<button class="sc-launch" type="button" aria-expanded="false" aria-controls="sc-panel">' + ICON + '<span>Vraag het ons</span></button>' +
    '<div class="sc-teaser" hidden><button type="button" class="sc-teaser__t">Vragen over prijs of doorlooptijd? Vraag het hier.</button><button type="button" class="sc-teaser__x" aria-label="Sluiten">×</button></div>' +
    '<section class="sc-panel" id="sc-panel" role="dialog" aria-label="Sovera-assistent" hidden>' +
      '<header class="sc-head"><span class="sc-av" aria-hidden="true">S</span><div class="sc-ttl"><b>Sovera-assistent</b><small>Automatische antwoorden, geen mens</small></div><button class="sc-x" type="button" aria-label="Chat sluiten">×</button></header>' +
      '<div class="sc-log" role="log" aria-live="polite"></div>' +
      '<div class="sc-chips" role="group" aria-label="Snelle vragen"></div>' +
      '<form class="sc-form" autocomplete="off"><input class="sc-in" type="text" maxlength="300" placeholder="Typ je vraag" aria-label="Typ je vraag"><button class="sc-send" type="submit" aria-label="Versturen">→</button></form>' +
    '</section>';
  document.body.appendChild(box);
  document.body.classList.add('sc-on');

  var launch = box.querySelector('.sc-launch'), panel = box.querySelector('.sc-panel'), log = box.querySelector('.sc-log');
  var chipsEl = box.querySelector('.sc-chips'), form = box.querySelector('.sc-form'), input = box.querySelector('.sc-in');
  var teaser = box.querySelector('.sc-teaser');

  var hist = [], lastChips = [], lead = null, sent = false, busy = false;
  function save() { try { sessionStorage.setItem('sc', JSON.stringify({ h: hist.slice(-40), c: lastChips, s: sent })); } catch (e) { /* geen opslag */ } }
  function load() { try { return JSON.parse(sessionStorage.getItem('sc') || 'null'); } catch (e) { return null; } }
  function scroll() { log.scrollTop = log.scrollHeight; }

  function bubble(who, html, isHtml) {
    var d = document.createElement('div');
    d.className = 'sc-m sc-m--' + who;
    if (isHtml) d.innerHTML = html; else d.textContent = html;
    log.appendChild(d); scroll();
    return d;
  }
  function setChips(list) {
    lastChips = list || [];
    chipsEl.innerHTML = '';
    lastChips.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sc-chip'; b.textContent = c[0];
      b.addEventListener('click', function () { user(c[0], c[1]); });
      chipsEl.appendChild(b);
    });
  }
  function bot(html, chips, delay) {
    hist.push({ r: 'b', t: html });
    var typing = bubble('bot', '<span class="sc-dots" aria-label="De assistent typt"><i></i><i></i><i></i></span>', true);
    typing.classList.add('is-typing');
    setChips([]);
    busy = true;
    var wait = reduce ? 0 : (delay != null ? delay : Math.min(900, 380 + html.length * 1.4));
    setTimeout(function () {
      typing.classList.remove('is-typing');
      typing.innerHTML = html;
      busy = false; setChips(chips); scroll(); save();
    }, wait);
  }
  function answer(it) {
    var html = it.a + (it.acts ? '<div class="sc-acts">' + it.acts() + '</div>' : '');
    bot(html, it.c || [C.prijs, C.krijg, C.plan]);
  }

  // ---------- aanvraag in de chat ----------
  function say(q, chips) { bot(q, chips); }
  function startLead() {
    lead = { step: 'naam', d: {} };
    say('Leuk! Dan heb ik een paar gegevens nodig, zodat Jayden contact met je kan opnemen. Je kunt altijd "stop" typen. <b>Hoe heet je?</b>', [['Stop', 'stop']]);
  }
  function summary() {
    var d = lead.d;
    return 'Controleer even:<br><b>Naam:</b> ' + esc(d.naam) + '<br><b>Zaak:</b> ' + esc(d.zaak) + '<br><b>Bereikbaar op:</b> ' + esc(d.bereik) + '<br><b>Interesse:</b> ' + esc(d.interesse) +
      '<br><br>Door te versturen ga je akkoord met de <a href="' + ROOT + 'privacy.html" target="_blank" rel="noopener">privacyverklaring</a>. We gebruiken je gegevens alleen om contact met je op te nemen.';
  }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function leadStep(text, forced) {
    var t = text.trim();
    if (forced === 'stop' || /^(stop|annuleer|annuleren|laat maar|nee laat)\b/i.test(t)) {
      lead = null; bot('Geen probleem, ik heb niets verstuurd. Heb je nog een andere vraag?', [C.prijs, C.krijg, C.contact]); return;
    }
    var d = lead.d;
    if (lead.step === 'naam') {
      if (t.length < 2 || t.length > 60) { say('Wil je je naam even invullen? Dat is mijn enige verzoek hierbij.', [['Stop', 'stop']]); return; }
      d.naam = t; lead.step = 'zaak';
      say('Prettig kennis te maken, ' + esc(t.split(' ')[0]) + '. <b>Wat voor zaak heb je, en hoe heet die?</b>', [['Nog geen zaak', 'zaak:Nog geen zaak'], ['Stop', 'stop']]);
    } else if (lead.step === 'zaak') {
      if (forced && forced.indexOf('zaak:') === 0) t = forced.slice(5);
      if (t.length < 2 || t.length > 100) { say('Vertel in een paar woorden wat voor zaak je hebt, bijvoorbeeld "kapperszaak in Charlois".', [['Stop', 'stop']]); return; }
      d.zaak = t; lead.step = 'bereik';
      say('<b>Op welk telefoonnummer of e-mailadres kunnen we je bereiken?</b>', [['Stop', 'stop']]);
    } else if (lead.step === 'bereik') {
      var digits = t.replace(/\D/g, '');
      var ok = (/@/.test(t) && /\.[a-z]{2,}$/i.test(t) && t.length < 120) || (digits.length >= 9 && digits.length <= 13);
      if (!ok) { say('Dat lijkt nog geen telefoonnummer of e-mailadres te zijn. Probeer het zo: 06 12345678 of naam@voorbeeld.nl.', [['Stop', 'stop']]); return; }
      d.bereik = t; lead.step = 'interesse';
      say('<b>Waar heb je interesse in?</b>', [['Website', 'int:Website'], ['Google-profiel', 'int:Google-profiel'], ['Allebei', 'int:Website en Google-profiel'], ['Weet ik nog niet', 'int:Weet ik nog niet'], ['Stop', 'stop']]);
    } else if (lead.step === 'interesse') {
      var m = forced && forced.indexOf('int:') === 0 ? forced.slice(4) : null;
      if (!m) {
        var n = norm(t);
        m = /website|site/.test(n) && /google|profiel/.test(n) ? 'Website en Google-profiel' : /google|profiel/.test(n) ? 'Google-profiel' : /website|site/.test(n) ? 'Website' : 'Weet ik nog niet';
      }
      d.interesse = m; lead.step = 'bevestig';
      say(summary(), [['Versturen', 'verstuur'], ['Opnieuw invullen', 'lead'], ['Stop', 'stop']]);
    } else if (lead.step === 'bevestig') {
      if (forced === 'verstuur' || /^(ja|versturen|verstuur|ok|oke|prima|klopt|goed)\b/i.test(t)) { submit(); }
      else if (forced === 'lead' || /opnieuw|aanpassen|wijzig/i.test(t)) { startLead(); }
      else { say('Zal ik het zo versturen? Kies hieronder, of typ "stop".', [['Versturen', 'verstuur'], ['Opnieuw invullen', 'lead'], ['Stop', 'stop']]); }
    }
  }
  function endpoint() {
    var e = cfg.formEndpoint || '';
    if (/formsubmit\.co\//.test(e) && !/\/ajax\//.test(e)) e = e.replace('formsubmit.co/', 'formsubmit.co/ajax/');
    return e;
  }
  function fallbackMsg(d) {
    var txt = 'Hallo Jayden, ik ben ' + d.naam + ' (' + d.zaak + '). Ik heb interesse in: ' + d.interesse + '. Bereikbaar op: ' + d.bereik + '.';
    var acts = '';
    if (cfg.whatsapp) acts += act('Stuur via WhatsApp', wa(txt));
    acts += act('Bellen: ' + TEL, TELHREF);
    return acts;
  }
  function submit() {
    var d = lead.d, ep = endpoint();
    if (sent) { lead = null; bot('Je aanvraag is al verstuurd. Jayden neemt contact met je op.', [C.contact]); return; }
    var fb = fallbackMsg(d);
    lead = null;
    if (!ep) { bot('Het formulier is nog niet gekoppeld. Neem direct contact op, dan helpt Jayden je meteen:<div class="sc-acts">' + fb + '</div>', []); return; }
    var typing = bubble('bot', '<span class="sc-dots"><i></i><i></i><i></i></span>', true); typing.classList.add('is-typing'); setChips([]); busy = true;
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    var payload = { naam: d.naam, zaak: d.zaak, bereik: d.bereik, Interesse: d.interesse, bericht: 'Aanvraag via de chatassistent op de site.',
      _subject: 'Nieuwe aanvraag via de Sovera-chat: ' + d.zaak, _template: 'table', _captcha: 'false', _honey: '' };
    fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        clearTimeout(timer); log.removeChild(typing); busy = false;
        if (res.ok && res.j.success !== 'false' && res.j.success !== false) {
          sent = true;
          bot('Gelukt! Je aanvraag is verstuurd. <b>Jayden neemt binnen 2 werkdagen contact met je op.</b> Liever sneller? Bel of app 06 30743596.', [C.prijs, C.vb]);
        } else { throw new Error('mislukt'); }
      })
      .catch(function () {
        clearTimeout(timer); if (typing.parentNode) log.removeChild(typing); busy = false;
        bot('Versturen lukte niet. Dat spijt me. Je kunt je gegevens ook rechtstreeks naar Jayden sturen:<div class="sc-acts">' + fb + '</div>', [['Opnieuw proberen', 'lead']]);
      });
  }

  // ---------- gesprek ----------
  function user(text, forced) {
    if (busy) return;
    hist.push({ r: 'u', t: text });
    bubble('user', text, false);
    setChips([]);
    if (lead) { leadStep(text, forced); save(); return; }
    var it = null;
    if (forced === 'lead') { startLead(); save(); return; }
    if (forced === 'stop') { bot('Prima. Waar kan ik je nog mee helpen?', [C.prijs, C.krijg, C.duur]); return; }
    if (forced) { it = KB.filter(function (k) { return k.id === forced; })[0]; }
    if (!it) it = find(text);
    if (it && it.id === 'lead') { startLead(); save(); return; }
    answer(it || FALLBACK);
    save();
  }
  function greet() {
    bot('Hoi! Ik ben de <b>automatische assistent</b> van Sovera. Ik vertel je wat een website kost, hoe lang het duurt en wat je krijgt. Voor al het andere pak ik Jayden erbij.', [C.prijs, C.krijg, C.duur, C.plan], 250);
  }
  function restore() {
    var s = load();
    if (!s || !s.h || !s.h.length) return false;
    sent = !!s.s;
    s.h.forEach(function (m) { hist.push(m); bubble(m.r === 'u' ? 'user' : 'bot', m.t, m.r === 'b'); });
    setChips(s.c || []);
    return true;
  }

  var opened = false;
  function open() {
    box.classList.add('is-open'); panel.hidden = false; launch.setAttribute('aria-expanded', 'true'); teaser.hidden = true;
    try { sessionStorage.setItem('sc-open', '1'); } catch (e) { /* geen opslag */ }
    if (!opened) { opened = true; if (!restore()) greet(); }
    scroll();
    if (!matchMedia('(max-width: 760px)').matches) setTimeout(function () { input.focus(); }, 50);
  }
  function close(focus) {
    box.classList.remove('is-open'); panel.hidden = true; launch.setAttribute('aria-expanded', 'false');
    try { sessionStorage.removeItem('sc-open'); } catch (e) { /* geen opslag */ }
    if (focus !== false) launch.focus();
  }
  launch.addEventListener('click', function () { if (panel.hidden) open(); else close(); });
  box.querySelector('.sc-x').addEventListener('click', function () { close(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value.trim();
    if (!v) return;
    input.value = '';
    user(v);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });
  log.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a) close(false);
  });
  window.addEventListener('sovera:chat', function () { open(); });

  // Kleine uitnodiging na een paar seconden (eenmalig per bezoek)
  var seen = false;
  try { seen = !!sessionStorage.getItem('sc-seen'); } catch (e) { /* geen opslag */ }
  try { if (sessionStorage.getItem('sc-open')) { open(); } } catch (e) { /* geen opslag */ }
  if (!seen && !reduce) {
    setTimeout(function () {
      if (!panel.hidden) return;
      teaser.hidden = false;
      setTimeout(function () { teaser.hidden = true; }, 12000);
    }, 8000);
  }
  teaser.querySelector('.sc-teaser__x').addEventListener('click', function () { teaser.hidden = true; try { sessionStorage.setItem('sc-seen', '1'); } catch (e) { /* geen opslag */ } });
  teaser.querySelector('.sc-teaser__t').addEventListener('click', function () { try { sessionStorage.setItem('sc-seen', '1'); } catch (e) { /* geen opslag */ } open(); });
})();
