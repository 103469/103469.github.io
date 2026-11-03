# -*- coding: utf-8 -*-
"""Bouwt Sovera versie 5 uit één sjabloon.
Draai: python3 build.py  ->  index.html, branches/*.html, privacy.html, voorwaarden.html, sitemap.xml, QR-code demo
Preview (GitHub Pages, niet in Google): SOVERA_PREVIEW=1 python3 build.py"""
import json
import os
from pathlib import Path

import segno  # pip install segno (alleen nodig voor de QR-code in de snackbar-demo)

ROOT = Path(__file__).parent
SITE = "https://soverastudio.nl"
V = "6.1"  # verhoog bij elke update, dan laden browsers de nieuwe css/js (6.0: nieuw design "Havenstad")
PREVIEW = os.environ.get("SOVERA_PREVIEW") == "1"
PUBLIC = "https://103469.github.io/sovera" if PREVIEW else SITE  # waar de site nu echt staat
STAR_PATH = "M16.00,0.50 L18.30,10.46 L26.96,5.04 L21.54,13.70 L31.50,16.00 L21.54,18.30 L26.96,26.96 L18.30,21.54 L16.00,31.50 L13.70,21.54 L5.04,26.96 L10.46,18.30 L0.50,16.00 L10.46,13.70 L5.04,5.04 L13.70,10.46Z"  # logo: ster met 8 punten
STAR = f'<svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true"><path d="{STAR_PATH}"/></svg>'
# Woordlogo: S + ster als o + vera
WORDMARK = f'<span class="wordmark" aria-hidden="true">S<svg class="wordmark__o" viewBox="0 0 32 32"><path d="{STAR_PATH}"/></svg>vera</span>'

# Nog in te vullen voor livegang (zichtbaar gemarkeerd op de site)
KVK = '<span class="todo">KvK-nummer volgt</span>'
BTW = '<span class="todo">btw-vermelding volgt (KOR of excl. btw)</span>'

BRANCHES = [
    dict(slug="kappers", naam="Kappers en beauty", kort="Prijslijst, behandelingen en direct een afspraak maken.",
         zoek="kapper", titel="Website voor je kapsalon of barbershop",
         sub="Klanten zoeken op hun telefoon naar een kapper in de buurt. Laat ze meteen zien wat je doet, wat het kost en hoe ze een afspraak maken.",
         tekst=["Wie in Rotterdam zoekt naar een kapper of barber, kiest meestal uit de eerste drie zaken die Google Maps laat zien. Daar sta je alleen als je Google-profiel compleet is en je website snel laadt op een telefoon.",
                "Een goede site voor een kapsalon is kort: je behandelingen met prijzen, een paar foto's van je werk, je openingstijden en één knop om een afspraak te maken. Gebruik je al een boekingssysteem, dan koppel ik de knop daaraan."],
         needs=[("Prijslijst per behandeling", "Knippen, kleuren, baard: overzichtelijk, zodat klanten niet hoeven te bellen."),
                ("Afspraak maken met één tik", "Via WhatsApp, bellen of het boekingssysteem dat je al gebruikt."),
                ("Foto's van je werk", "Laat zien wat je kunt. Je eigen foto's werken het best."),
                ("Gevonden worden op Google Maps", "Je Google-profiel compleet, met openingstijden en reviews.")],
         demo=("barbershop", "Barbershop De Kade"),
         faq=[("Ik gebruik al een boekingssysteem. Kan dat erin?", "Ja. De knop op je site stuurt klanten naar het systeem dat je nu al gebruikt."),
              ("Kan ik zelf mijn prijzen aanpassen?", "Met het onderhoudspakket stuur je een berichtje en pas ik het aan, meestal binnen 5 werkdagen.")]),
    dict(slug="horeca", naam="Horeca", kort="Menukaart met QR-code, openingstijden en reserveren.",
         zoek="restaurant", titel="Website voor je restaurant, snackbar of café",
         sub="Gasten willen vooraf je menu zien en weten of je open bent. Zorg dat ze dat in een paar seconden vinden.",
         tekst=["Bij horeca kijken mensen vaak pas op het laatste moment: staand op straat, op hun telefoon. Een menukaart die snel laadt en kloppende openingstijden maken dan het verschil.",
                "Je menu staat op je site en is ook te openen met een QR-code op tafel. Bezorg je via een platform, dan zet ik daar een knop naartoe. Op je eigen site betaal je geen commissie."],
         needs=[("Menukaart online", "Snel te laden op mobiel, ook te openen via een QR-code op tafel."),
                ("Openingstijden die kloppen", "Op je site en op Google, zodat niemand voor een dichte deur staat."),
                ("Reserveren of bestellen", "Een knop naar je reserveringssysteem, WhatsApp of bezorgplatform."),
                ("Sfeerfoto's", "Laat zien hoe het bij jou is. Dat haalt mensen binnen.")],
         demo=("snackbar", "Snackbar Het Hoekje"),
         faq=[("Ik sta al op een bezorgplatform. Heb ik dan nog een site nodig?", "Op je eigen site betaal je geen commissie en vinden mensen je ook via Google."),
              ("Hoe vaak kan het menu veranderen?", "Zo vaak als je wilt. Met onderhoud pas ik het voor je aan.")]),
    dict(slug="winkels", naam="Winkels", kort="Laat zien wat je verkoopt en hoe mensen je vinden.",
         zoek="winkel", titel="Website voor je winkel",
         sub="Ook als mensen in de winkel kopen, zoeken ze eerst online. Laat zien wat je verkoopt en waar ze je vinden.",
         tekst=["Veel mensen checken online of een winkel heeft wat ze zoeken voordat ze de deur uit gaan. Een simpele site met je assortiment, route en openingstijden is dan genoeg.",
                "Het Start-pakket is geen webshop: het brengt klanten naar je winkel. Wil je later online verkopen, dan kan dat er altijd bij."],
         needs=[("Je assortiment in beeld", "De belangrijkste producten en merken, zonder ingewikkelde webshop."),
                ("Route en openingstijden", "Kaartje, parkeren en tijden op één plek."),
                ("Acties en nieuws", "Laat zien wat er nieuw binnen is."),
                ("Sterk Google-profiel", "Foto's, reviews en de juiste categorie, zodat je beter gevonden wordt in de buurt.")],
         faq=[("Wordt het een webshop?", "Nee, het Start-pakket is een site die klanten naar je winkel brengt. Een webshop kan later."),
              ("Kan ik nieuws plaatsen?", "Ja, stuur het door en ik zet het erop.")]),
    dict(slug="bouw", naam="Bouw en installatie", kort="Werkgebied, projecten en een snelle offerteaanvraag.",
         zoek="loodgieter", titel="Website voor je bouw-, klus- of installatiebedrijf",
         sub="Wie een loodgieter of schilder zoekt, belt de eerste die betrouwbaar overkomt. Zorg dat jij dat bent.",
         tekst=["Bij een lekkage of klus zoeken mensen snel en bellen ze het eerste bedrijf dat betrouwbaar overkomt. Foto's van echte projecten, je werkgebied en je KvK-gegevens helpen daarbij.",
                "Een duidelijke offerteknop zorgt ervoor dat je aanvragen krijgt die passen bij wat je doet, zodat je minder tijd kwijt bent aan offertes die niets worden."],
         needs=[("Duidelijk werkgebied", "Rotterdam en omgeving, zodat Google je toont aan de juiste mensen."),
                ("Projecten met foto's", "Voor en na laat beter zien wat je kunt dan elke tekst."),
                ("Offerte aanvragen", "Een kort formulier of een knop om je direct te bellen of te appen."),
                ("Vertrouwen", "Je KvK-gegevens, certificaten en echte reviews op één plek.")],
         demo=("installateur", "Kraan & Ketel"),
         faq=[("Ik heb het al druk. Waarom een site?", "Een goede site levert beter passende klussen op, zodat je minder tijd kwijt bent aan offertes die niets worden."),
              ("Kan ik zelf projecten toevoegen?", "Stuur de foto's, dan zet ik ze erop.")]),
    dict(slug="zzp", naam="Zzp'ers", kort="Coaches, trainers en fotografen: je eigen visitekaartje online.",
         zoek="personal trainer", titel="Website voor zzp'ers",
         sub="Als personal trainer, coach of fotograaf ben jij je bedrijf. Laat zien wie je bent en wat je doet.",
         tekst=["Als zzp'er kiezen klanten voor jou als persoon. Een eigen site met je verhaal, je aanbod en een goede foto maakt het makkelijker om contact op te nemen.",
                "Instagram is goed voor bereik, maar via Google vinden mensen je eigen site. Die is van jou en blijft van jou."],
         needs=[("Over jou", "Een persoonlijk verhaal en een goede foto. Mensen kiezen voor een persoon."),
                ("Je diensten en tarieven", "Duidelijk, zodat mensen weten wat ze kunnen verwachten."),
                ("Afspraak of kennismaking", "Een knop om direct contact op te nemen."),
                ("Portfolio", "Voor fotografen en trainers: laat resultaten zien.")],
         faq=[("Ik heb al een Instagram. Is dat niet genoeg?", "Instagram is goed voor bereik, maar via Google vinden mensen je site. En die is van jou."),
              ("Kan ik later meer pagina's krijgen?", "Ja, dat kan altijd uitgebreid worden.")]),
]

PRIJS_FAQ = ("Wat kost het?", "Website Start kost €495 voor de eerste 3 klanten, daarna €695. Onderhoud is €29 per maand en maandelijks opzegbaar. De domeinnaam komt op jouw naam.")


def head(title, desc, path="", prefix="", extra=""):
    return f'''<!doctype html>
<html lang="nl" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{SITE}/{path}">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{SITE}/{path}">
<meta property="og:locale" content="nl_NL">
<meta name="theme-color" content="#0B0D10">
<link rel="icon" href="{prefix}img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{prefix}img/icon-180.png">
<link rel="manifest" href="{prefix}manifest.webmanifest">
<meta name="apple-mobile-web-app-title" content="Sovera">
<link rel="preload" href="{prefix}fonts/bricolage-grotesque-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{prefix}fonts/dm-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{prefix}css/style.css?v={V}">
{'<meta name="robots" content="noindex">' if PREVIEW else ''}
{extra}
</head>
<body>
<a class="skip" href="#inhoud">Naar de inhoud</a>
{'<p class="preview">Voorbeeldversie: deze site is nog in opbouw.</p>' if PREVIEW else ''}
'''


def header(prefix=""):
    home = f"{prefix}index.html"
    return f'''<header class="top">
  <div class="wrap top__inner">
    <a class="logo" href="{home}" aria-label="Sovera, naar de homepage">{WORDMARK}</a>
    <button class="menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="hoofdmenu"><span></span></button>
    <nav class="nav" id="hoofdmenu" aria-label="Hoofdmenu">
      <a href="{home}#aanbod">Wat je krijgt</a>
      <a href="{home}#branches">Voor wie</a>
      <a href="{home}#voorbeelden">Voorbeelden</a>
      <a href="{home}#prijzen">Prijzen</a>
      <a class="btn btn--small" href="{home}#check">Gratis check <span class="arrow" aria-hidden="true">→</span></a>
    </nav>
  </div>
</header>
'''


def footer(prefix=""):
    links = "".join(f'<a href="{prefix}branches/{b["slug"]}.html">{b["naam"]}</a>' for b in BRANCHES)
    return f'''<footer class="foot">
  <div class="wrap">
    <div class="foot__top">
      <div class="foot__cta">
        <h2>Klaar om gevonden te worden?</h2>
        <div class="hero__cta"><a class="btn" href="{prefix}index.html#check">Doe de gratis check <span class="arrow" aria-hidden="true">→</span></a><a class="btn btn--ghost" href="{prefix}index.html#contact">Kennismaken</a></div>
        <p class="foot__contact" data-email hidden></p>
      </div>
      <nav class="foot__links" aria-label="Branches">{links}<a href="{prefix}index.html#prijzen">Prijzen</a><a href="{prefix}index.html#voorbeelden">Voorbeelden</a></nav>
    </div>
    <div class="foot__big" aria-hidden="true">S<svg viewBox="0 0 32 32"><path d="{STAR_PATH}"/></svg>vera</div>
    <div class="foot__legal">
      <span>© Sovera, Rotterdam</span>
      <span>{KVK}</span>
      <a href="{prefix}privacy.html">Privacy</a>
      <a href="{prefix}voorwaarden.html">Voorwaarden</a>
    </div>
  </div>
</footer>
<script src="{prefix}js/config.js?v={V}"></script>
<script src="{prefix}js/contact.js?v={V}"></script>
<script src="{prefix}js/check.js?v={V}"></script>
<script src="{prefix}js/ui.js?v={V}"></script>
</body>
</html>
'''


CHECK = '''<section id="check" class="section">
  <div class="wrap"><div class="check reveal">
    <div class="check__text">
      <p class="label" style="color:var(--lime)">Gratis websitecheck</p>
      <h2>Hoe scoort jouw website?</h2>
      <p>Vul je website in. Je ziet hoe snel hij is op mobiel en hoe goed Google hem kan lezen. Gratis en zonder verplichtingen.</p>
      <p class="check__note">De check gebruikt Google PageSpeed. Het adres dat je invult gaat naar Google; ik bewaar niets.</p>
    </div>
    <div>
      <form class="check__form" id="check-form" novalidate>
        <label class="label" for="check-url">Jouw website</label>
        <div class="check__row">
          <input id="check-url" name="url" type="text" inputmode="url" placeholder="jouwzaak.nl" autocomplete="url" aria-describedby="check-hint">
          <button class="btn" type="submit">Check mijn site</button>
        </div>
        <p class="check__hint" id="check-hint" aria-live="polite"></p>
      </form>
      <div class="check__result" id="check-result" tabindex="-1" aria-live="polite"></div>
      <p class="check__alt">Nog geen eigen website? <a href="#contact">Laat je bedrijfsnaam achter</a>, dan check ik je Google-profiel gratis.</p>
    </div>
  </div></div>
</section>
'''


def contact(prefix=""):
    return f'''<section id="contact" class="section section--tint">
  <div class="wrap contact">
    <div class="contact__text reveal">
      <p class="label">Contact</p>
      <h2>Even kennismaken?</h2>
      <p>Laat je gegevens achter. Ik neem contact op om te kijken wat jouw zaak nodig heeft. Een gesprek kan telefonisch of op afspraak in Rotterdam.</p>
      <div class="contact__direct">
        <a class="btn btn--wa" href="#contact" data-wa="Hoi Quinten, ik wil graag kennismaken over een website." target="_blank" rel="noopener" hidden>Stuur een WhatsApp</a>
        <p class="foot__contact" data-email hidden></p>
      </div>
    </div>
    <form class="form reveal" id="contact-form" novalidate>
      <div class="form__row">
        <div class="field"><label for="c-naam">Je naam</label><input id="c-naam" name="naam" autocomplete="name"></div>
        <div class="field"><label for="c-zaak">Naam van je zaak</label><input id="c-zaak" name="zaak" autocomplete="organization"></div>
      </div>
      <div class="field"><label for="c-bereik">Telefoon of e-mail</label><input id="c-bereik" name="bereik" autocomplete="tel"><small>Zo kan ik je bereiken.</small></div>
      <div class="field"><label for="c-site">Je website (als je die hebt)</label><input id="c-site" name="website" inputmode="url" placeholder="jouwzaak.nl"></div>
      <div class="field"><label for="c-bericht">Waar kan ik mee helpen?</label><textarea id="c-bericht" name="bericht" placeholder="Bijvoorbeeld: ik heb nog geen site, of mijn site is verouderd."></textarea></div>
      <p class="form__privacy">Ik gebruik je gegevens alleen om contact met je op te nemen. Lees de <a href="{prefix}privacy.html">privacyverklaring</a>.</p>
      <div><button class="btn btn--dark" type="submit">Verstuur <span class="arrow" aria-hidden="true">→</span></button></div>
      <p class="form__status" id="c-status" aria-live="polite"></p>
    </form>
  </div>
</section>
'''


DEMOS = [
    dict(slug="barbershop", naam="Barbershop De Kade", branche="kappers", titel="Afspraak maken met één tik",
         tekst="Prijslijst per behandeling, live openingstijden en een afspraak kiezen in een paar tikken."),
    dict(slug="snackbar", naam="Snackbar Het Hoekje", branche="horeca", titel="Menu en openingstijden direct in beeld",
         tekst="Menu filteren op friet, snacks of vega, plus een QR-code die je op tafel zet."),
    dict(slug="installateur", naam="Kraan & Ketel", branche="bouw en installatie", titel="Snel een offerte aanvragen",
         tekst="Postcodecheck voor het werkgebied, voor-en-na-schuif en een offerte in 3 stappen."),
]


def demo_cards():
    return "".join(f'''
      <a class="demo reveal" style="--i:{i}" href="demos/{d["slug"]}.html">
        <div class="browser"><div class="browser__bar"><i></i><i></i><i></i><span>demo · {d["slug"]}</span></div>
          <div class="browser__img"><img src="img/demo-{d["slug"]}.jpg" alt="Voorbeeld: de demosite van {d["naam"].replace("&", "&amp;")}" width="640" height="400" loading="lazy"></div></div>
        <p class="demo__note">Demo · {d["branche"]}</p>
        <h3>{d["titel"]}</h3>
        <p>{d["tekst"]}</p>
        <span class="demo__go">Probeer de demo</span>
      </a>''' for i, d in enumerate(DEMOS))


def ld_business():
    return {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": "Sovera",
        "description": "Websites en Google-bedrijfsprofielen voor ondernemers in Rotterdam.",
        "url": SITE + "/",
        "areaServed": {"@type": "City", "name": "Rotterdam"},
        "priceRange": "€€",
    }


ICONS = {
    "kappers": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/></svg>',
    "horeca": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2v8a2 2 0 0 0 4 0V2M9 10v12M17 2c-1.7 1.3-2.5 3.3-2.5 6v4H17v10"/></svg>',
    "winkels": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14l-1.2 13H6.2L5 7Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>',
    "bouw": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6Z"/></svg>',
    "zzp": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    "meer": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
}
I = {
    "bolt": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
    "pin": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    "phone": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/></svg>',
    "globe": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z"/></svg>',
    "chat": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4V5Z"/></svg>',
    "lock": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
}


def citymap():
    # Abstracte plattegrond: stratenraster + de Maas als stippellijn
    lines = []
    for i in range(-2, 26):
        x = i * 52
        lines.append(f'<path class="street" d="M{x} -40 L{x + 160} 760"/>')
    for j in range(-1, 16):
        y = j * 52
        lines.append(f'<path class="street" d="M-40 {y} L1240 {y - 120}"/>')
    river = '<path class="river" d="M-60 560 C 180 500, 320 640, 520 580 S 860 420, 1000 470 S 1180 560, 1280 520"/>'
    return f'<svg class="citymap" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">{"".join(lines)}{river}</svg>'


HOME_FAQ = [
    ("Wat kost het?", "Website Start kost €495 voor de eerste 3 klanten, daarna €695. Onderhoud is €29 per maand en maandelijks opzegbaar. De domeinnaam komt op jouw naam."),
    ("Hoe lang duurt het?", "Meestal staat je site 2 tot 3 weken nadat jij je foto's en teksten hebt gestuurd online."),
    ("Moet ik zelf iets technisch doen?", "Nee. Jij levert foto's, teksten, prijzen en openingstijden aan, ik regel de rest. De verificatie bij Google doen we samen."),
    ("Wat als ik later iets wil veranderen?", "Met onderhoud stuur je een berichtje en pas ik het aan, meestal binnen 5 werkdagen. Zonder onderhoud kan het ook, los per wijziging."),
    ("Is de site van mij?", "Ja. De domeinnaam staat op jouw naam. Stop je met onderhoud, dan blijft het domein van jou."),
]


def index():
    branch_cards = "".join(f'''
        <a class="branch reveal" style="--i:{n}" href="branches/{b["slug"]}.html"><span class="branch__icon">{ICONS[b["slug"]]}</span><h3>{b["naam"]}</h3><p>{b["kort"]}</p><span class="branch__go">Bekijk wat je krijgt</span></a>''' for n, b in enumerate(BRANCHES))
    words = ["kapsalon", "snackbar", "barbershop", "bouwbedrijf", "winkel", "praktijk"]
    on = ' class="is-on"'
    rot = "".join(f'<span{on if k == 0 else ""}>{w}</span>' for k, w in enumerate(words))
    marquee = "".join(f"<span>{w}</span>" for w in ["Kappers", "Barbershops", "Snackbars", "Restaurants", "Cafés", "Installateurs", "Schilders", "Klusbedrijven", "Winkels", "Personal trainers", "Coaches", "Fotografen"])
    faq = "".join(f'<details class="reveal"><summary>{q}</summary><p>{a}</p></details>' for q, a in HOME_FAQ)
    ld_faq = {"@context": "https://schema.org", "@type": "FAQPage",
              "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in HOME_FAQ]}
    ld = (f'<script type="application/ld+json">{json.dumps(ld_business(), ensure_ascii=False)}</script>'
          f'<script type="application/ld+json">{json.dumps(ld_faq, ensure_ascii=False)}</script>')
    return head("Website laten maken in Rotterdam | Sovera",
                "Sovera maakt websites en Google-profielen voor ondernemers in Rotterdam. Vaste prijs vanaf €495 en een gratis websitecheck.",
                "", "", ld) + header() + f'''
<main id="inhoud">
<section class="night">
  {citymap()}
  <div class="hero">
    <div class="wrap hero__grid">
      <div class="hero__text">
        <a class="pill reveal" href="#prijzen"><b>Nieuw</b> Introductieprijs €495 voor de eerste 3 klanten</a>
        <h1 class="reveal" style="--i:1">Jouw <span class="rotator" aria-hidden="true">{rot}</span><span class="sr">zaak</span><br>in Rotterdam online, goed geregeld.</h1>
        <p class="lead reveal" style="--i:2">Een snelle website en een compleet Google-profiel voor een vaste prijs. Jij runt je zaak, ik zorg dat klanten je vinden.</p>
        <div class="hero__cta reveal" style="--i:3">
          <a class="btn" href="#check">Doe de gratis websitecheck <span class="arrow" aria-hidden="true">→</span></a>
          <a class="btn btn--ghost" href="#voorbeelden">Bekijk voorbeelden</a>
        </div>
        <ul class="facts reveal" style="--i:4" aria-label="Kort overzicht">
          <li><strong>€495</strong><span>vaste prijs, geen verrassingen</span></li>
          <li><strong>1 maker</strong><span>je spreekt mij direct</span></li>
          <li><strong>010</strong><span>gewoon uit Rotterdam</span></li>
        </ul>
      </div>
      <div class="stage reveal" style="--i:2" aria-label="Voorbeeld van een website op een telefoon" role="img">
        <div class="phone">
          <div class="phone__screen">
            <div class="mini__bar"><i></i></div>
            <div class="mini__hero"><small>Kapsalon · Noord</small><strong>Knippen zonder gedoe.</strong><span class="mini__open">Nu open · tot 18:00</span></div>
            <div class="mini__list">
              <div class="mini__row"><span>Knippen heren</span><b>€ 25</b></div>
              <div class="mini__row"><span>Knippen dames</span><b>€ 35</b></div>
              <div class="mini__row"><span>Baard trimmen</span><b>€ 15</b></div>
              <div class="mini__row"><span>Kleuren</span><b>v.a. € 45</b></div>
            </div>
            <div class="mini__cta">Maak een afspraak</div>
          </div>
        </div>
        <div class="chip chip--maps"><span class="chip__icon">{I["pin"]}</span><span>Gevonden in Google Maps<small>“kapper in de buurt”</small></span></div>
        <div class="chip chip--score"><span class="chip__ring"></span><span>Snelheid op mobiel<small>doel: groen in PageSpeed</small></span></div>
        <div class="chip chip--call"><span class="chip__icon">{I["phone"]}</span><span>Bellen of appen<small>met één tik</small></span></div>
      </div>
    </div>
  </div>
  <div class="marquee" aria-hidden="true"><div class="marquee__track">{marquee}{marquee}</div></div>
</section>

<section id="aanbod" class="section">
  <div class="wrap">
    <div class="section__head reveal">
      <p class="label">Wat je krijgt</p>
      <h2>Alles wat een lokale zaak online nodig heeft. <span class="hl">Niet meer, niet minder.</span></h2>
    </div>
    <div class="bento">
      <article class="card card--a reveal">
        <span class="card__icon">{I["bolt"]}</span>
        <h3>Snel op mobiel, waar je klanten zoeken</h3>
        <p>De meeste mensen zoeken een zaak op hun telefoon. Een trage site betekent dat ze doorklikken naar de buren. Daarom bouw ik licht en snel, zonder zware bouwpakketten.</p>
        <div class="speed" aria-label="Voorbeeld: laadtijd van een gemiddelde verouderde site tegenover een nieuwe">
          <div class="speed__row"><span>Verouderde site</span><span class="speed__bar"><i style="--w:88%"></i></span><b>6,8 s</b></div>
          <div class="speed__row speed__row--new"><span>Nieuwe site</span><span class="speed__bar"><i style="--w:18%"></i></span><b>1,4 s</b></div>
          <p class="speed__legend">Voorbeeld van laadtijd op mobiel. Met de gratis check zie je jouw eigen cijfers.</p>
        </div>
      </article>
      <article class="card card--b card--dark reveal" style="--i:1">
        <span class="card__icon" style="color:var(--lime)">{I["pin"]}</span>
        <h3>Google-profiel compleet</h3>
        <p>Openingstijden, foto's, categorie en route. Zo kom je naar voren in Google Maps.</p>
      </article>
      <article class="card card--c reveal" style="--i:2">
        <span class="card__icon">{I["phone"]}</span>
        <h3>Eén tik om te bellen of boeken</h3>
        <div class="mapcard" aria-hidden="true"><strong>Jouw zaak</strong><span class="mapcard__meta">Nu open · Rotterdam</span><span class="mapcard__btns"><span>Bellen</span><span>WhatsApp</span><span>Route</span></span></div>
      </article>
      <article class="card card--d reveal">
        <span class="card__icon">{I["globe"]}</span>
        <h3>Domein op jouw naam</h3>
        <p>Jouwzaak.nl is van jou en blijft van jou.</p>
      </article>
      <article class="card card--e reveal" style="--i:1">
        <span class="card__icon">{I["chat"]}</span>
        <h3>Eén vast aanspreekpunt</h3>
        <p>Geen accountmanagers of tickets. Je appt of mailt gewoon met mij.</p>
      </article>
      <article class="card card--f reveal" style="--i:2">
        <span class="card__icon">{I["lock"]}</span>
        <h3>Veilig en onderhouden</h3>
        <p>Beveiligde verbinding, en met onderhoud pas ik prijzen en tijden voor je aan.</p>
      </article>
    </div>
  </div>
</section>

<section id="branches" class="section section--tint">
  <div class="wrap">
    <div class="section__head reveal">
      <p class="label">Voor wie</p>
      <h2>Voor elke zaak in de stad</h2>
      <p class="sub">Elke branche heeft andere klanten. Daarom krijgt jouw site precies wat jouw klanten zoeken.</p>
    </div>
    <div class="branches">{branch_cards}
        <a class="branch branch--more reveal" style="--i:5" href="#contact"><span class="branch__icon">{ICONS["meer"]}</span><h3>Iets anders?</h3><p>Laat je gegevens achter, dan kijk ik wat jouw zaak nodig heeft.</p><span class="branch__go">Neem contact op</span></a>
    </div>
  </div>
</section>

<section id="voorbeelden" class="section">
  <div class="wrap">
    <div class="section__head reveal">
      <p class="label">Voorbeelden</p>
      <h2>Zo kan jouw site eruitzien</h2>
      <p class="sub">Drie demo's van verzonnen zaken, geen echte klanten. Klik erop en probeer ze uit: menu filteren, afspraak kiezen, offerte aanvragen. Jouw site krijgt jouw kleuren, foto's en teksten.</p>
    </div>
    <div class="demos">{demo_cards()}
    </div>
  </div>
</section>

<section id="over" class="section section--tint">
  <div class="wrap about about--duo">
    <div class="duo reveal">
      <figure class="photo">
        <!-- Vervang door: <img src="img/quinten.jpg" alt="Quinten van Sovera" width="560" height="700"> -->
        <div class="photo__placeholder">{STAR}<span class="todo">Foto Quinten volgt</span></div>
        <figcaption class="photo__tag">Quinten · bouwt de site</figcaption>
      </figure>
      <figure class="photo">
        <!-- Vervang door: <img src="img/jayden.jpg" alt="Jayden van Sovera" width="560" height="700"> -->
        <div class="photo__placeholder">{STAR}<span class="todo">Foto Jayden volgt</span></div>
        <figcaption class="photo__tag">Jayden · jouw aanspreekpunt</figcaption>
      </figure>
    </div>
    <div class="about__text reveal" style="--i:1">
      <p class="label">Wie zijn wij</p>
      <h2>Quinten bouwt. Jayden praat met je.</h2>
      <p>Wij zijn twee jonge Rotterdammers die websites maken voor ondernemers in de stad. Jayden komt langs of belt en bespreekt wat je nodig hebt. Quinten, student Software Development, bouwt de site. Geen groot bureau met accountmanagers: je spreekt de mensen die het ook echt doen.</p>
      <ul class="ticks">
        <li>Vaste prijs, vooraf duidelijk</li>
        <li>Gesprek bij jou in de zaak, telefonisch of via WhatsApp</li>
        <li>Eerst een demo zien, dan pas beslissen</li>
      </ul>
      <p class="about__contact">Jayden bereik je op <span class="todo">06-nummer volgt</span> of mail naar <a href="mailto:soverawebdesign@gmail.com" data-email-link>soverawebdesign@gmail.com</a>.</p>
    </div>
  </div>
</section>

<section id="prijzen" class="section">
  <div class="wrap">
    <div class="section__head section__head--center reveal">
      <p class="label">Prijzen</p>
      <h2>Duidelijke prijzen</h2>
      <p class="sub">Geen uurtje-factuurtje. Je weet vooraf wat het kost.</p>
    </div>
    <div class="plans">
      <article class="plan plan--main reveal">
        <span class="plan__badge">Voor de eerste 3 klanten</span>
        <p class="label plan__name">Website Start</p>
        <p class="plan__price">€495 <small>eenmalig</small></p>
        <p class="plan__note">Introductieprijs. Daarna €695.</p>
        <ul class="ticks">
          <li>Website van 1 pagina, gemaakt voor mobiel</li>
          <li>Prijzen, openingstijden, foto's en route</li>
          <li>Knop om te bellen, appen of te boeken</li>
          <li>Google-profiel compleet ingericht</li>
          <li>Domeinnaam op jouw naam</li>
        </ul>
        <p class="plan__year">Jij levert foto's en teksten aan, ik doe de rest. Meestal online binnen 2 tot 3 weken nadat alles binnen is.</p>
        <a class="btn" href="#contact">Plan een kennismaking <span class="arrow" aria-hidden="true">→</span></a>
      </article>
      <article class="plan reveal" style="--i:1">
        <p class="label plan__name">Onderhoud</p>
        <p class="plan__price">€29 <small>per maand</small></p>
        <p class="plan__note">Maandelijks opzegbaar, niet verplicht.</p>
        <ul class="ticks"><li>Hosting en beveiliging</li><li>Prijzen en tijden aanpassen als jij dat vraagt</li><li>Kleine wijzigingen, meestal binnen 5 werkdagen</li></ul>
        <p class="plan__year">Eerste jaar met onderhoud: €495 + 12 × €29 = €843.</p>
      </article>
      <article class="plan plan--soon reveal" style="--i:2">
        <p class="label plan__name">AI-assistent</p>
        <p class="plan__price">Binnenkort</p>
        <p class="plan__note">Een chat op je site die vragen over prijzen en tijden beantwoordt. Bezoekers zien duidelijk dat het AI is.</p>
        <a class="btn btn--ghost" href="#contact">Laat weten dat je interesse hebt</a>
      </article>
    </div>
    <p class="price-note">{BTW}</p>
  </div>
</section>

<section id="werkwijze" class="section section--tint">
  <div class="wrap">
    <div class="section__head reveal">
      <p class="label">Werkwijze</p>
      <h2>In vier stappen online</h2>
    </div>
    <ol class="steps">
      <li><h3>Gratis check</h3><p>Je vult je website in en ziet meteen wat beter kan. Geen site? Dan kijk ik naar je Google-profiel.</p></li>
      <li><h3>Kennismaking</h3><p>Een kort gesprek, telefonisch of op afspraak. Ik vraag wat jouw klanten willen weten.</p></li>
      <li><h3>Ontwerp</h3><p>Jij stuurt foto's en teksten. Daarna zie je een eerste versie en mag je twee keer feedback geven.</p></li>
      <li><h3>Online</h3><p>Ik zet je site live en richt je Google-profiel in. De verificatie bij Google doe je samen met mij.</p></li>
    </ol>
  </div>
</section>

{CHECK}

<section id="faq" class="section">
  <div class="wrap">
    <div class="section__head section__head--center reveal"><p class="label">FAQ</p><h2>Veelgestelde vragen</h2></div>
    <div class="faq">{faq}</div>
  </div>
</section>

{contact()}
</main>
''' + footer()


def branch_page(b):
    p = "../"
    needs = "".join(f'<div class="need reveal"><h3>{t}</h3><p>{d}</p></div>' for t, d in b["needs"])
    faqs = b["faq"] + [PRIJS_FAQ]
    faq = "".join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in faqs)
    tekst = "".join(f"<p>{t}</p>" for t in b["tekst"])
    demo_link = ""
    if b.get("demo"):
        slug, naam = b["demo"]
        demo_link = f'<a class="demo-link" href="{p}demos/{slug}.html"><span class="label">Voorbeeld</span><strong>Bekijk de demo van {naam.replace("&", "&amp;")}</strong><span>Een verzonnen zaak, zodat je kunt zien en uitproberen hoe het werkt.</span></a>'
    ld_faq = {"@context": "https://schema.org", "@type": "FAQPage",
              "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]}
    ld = f'<script type="application/ld+json">{json.dumps(ld_faq, ensure_ascii=False)}</script>'
    title = f'{b["titel"]} in Rotterdam | Sovera'
    return head(title, f'{b["titel"]} in Rotterdam. Vaste prijs vanaf €495 en een gratis websitecheck.',
                f'branches/{b["slug"]}.html', p, ld) + header(p) + f'''
<main id="inhoud">
<section class="page-hero night">
  {citymap()}
  <div class="wrap">
    <p class="crumbs"><a href="{p}index.html">Sovera</a> / {b["naam"]}</p>
    <h1>{b["titel"]} <span class="hl">in Rotterdam</span></h1>
    <p>{b["sub"]}</p>
    <div class="hero__cta"><a class="btn" href="#check">Doe de gratis websitecheck <span class="arrow" aria-hidden="true">→</span></a><a class="btn btn--ghost" href="{p}index.html#prijzen">Bekijk prijzen</a></div>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="section__head reveal"><p class="label">{b["naam"]}</p><h2>Gevonden worden als {b["zoek"]} in Rotterdam</h2></div>
    <div class="prose reveal">{tekst}</div>
    <div class="needs">{needs}</div>
    {demo_link}
  </div>
</section>
<section class="section section--tint">
  <div class="wrap">
    <div class="section__head section__head--center"><p class="label">FAQ</p><h2>Veelgestelde vragen</h2></div>
    <div class="faq">{faq}</div>
  </div>
</section>
{CHECK}
{contact(p)}
</main>
''' + footer(p)


def legal(slug, title, body):
    return head(f"{title} | Sovera", f"{title} van Sovera.", f"{slug}.html") + header() + f'''
<main id="inhoud">
<section class="page-hero night">{citymap()}<div class="wrap"><p class="crumbs"><a href="index.html">Sovera</a> / {title}</p><h1>{title}</h1></div></section>
<section class="section"><div class="wrap legal">{body}</div></section>
</main>
''' + footer()


PRIVACY = '''
<p class="concept"><strong>Concept.</strong> Laat deze tekst controleren voordat de site live gaat, bijvoorbeeld met de voorbeelden van de Autoriteit Persoonsgegevens of de KvK.</p>
<h2>Wie is verantwoordelijk</h2><p>Sovera, Quinten, Rotterdam. KvK-nummer en contactgegevens volgen.</p>
<h2>Welke gegevens</h2><ul><li>Wat je invult in het contactformulier: naam, naam van je zaak, telefoon of e-mail, website en je bericht.</li><li>Het adres dat je invult bij de websitecheck. Dat gaat naar Google PageSpeed om de check uit te voeren. Sovera bewaart dit niet.</li></ul>
<h2>Waarvoor</h2><p>Alleen om contact met je op te nemen over je vraag. Niet voor nieuwsbrieven en niet voor verkoop aan anderen.</p>
<h2>Hoe lang</h2><p>Word je geen klant, dan worden je gegevens binnen 12 maanden verwijderd. Word je wel klant, dan bewaar ik wat nodig is voor de administratie (7 jaar).</p>
<h2>Cookies</h2><p>Deze site gebruikt geen tracking- of advertentiecookies. Lettertypes worden vanaf deze site zelf geladen.</p>
<h2>Je rechten</h2><p>Je mag je gegevens inzien, laten aanpassen of laten verwijderen. Stuur daarvoor een bericht.</p>
'''
VOORWAARDEN = '''
<p class="concept"><strong>Concept.</strong> Dit zijn de belangrijkste afspraken in gewone taal. Laat ze nalezen voordat de site live gaat.</p>
<h2>Prijs</h2><p>De prijs staat vooraf vast in de offerte. Website Start kost €495 voor de eerste 3 klanten, daarna €695.</p>
<h2>Wat jij aanlevert</h2><p>Foto's, teksten, openingstijden en prijzen. De planning start als alles binnen is.</p>
<h2>Feedback</h2><p>Je mag twee keer feedback geven op het ontwerp. Grote wijzigingen daarna gaan in overleg.</p>
<h2>Domein</h2><p>De domeinnaam komt op jouw naam. Stop je met onderhoud, dan blijft de domeinnaam van jou.</p>
<h2>Onderhoud</h2><p>€29 per maand, maandelijks opzegbaar. Kleine wijzigingen worden meestal binnen 5 werkdagen gedaan.</p>
<h2>Betalen</h2><p>Na oplevering ontvang je een factuur met een betaaltermijn van 14 dagen.</p>
'''

(ROOT / "index.html").write_text(index(), encoding="utf-8")
for b in BRANCHES:
    (ROOT / "branches" / f'{b["slug"]}.html').write_text(branch_page(b), encoding="utf-8")
(ROOT / "privacy.html").write_text(legal("privacy", "Privacyverklaring", PRIVACY), encoding="utf-8")
(ROOT / "voorwaarden.html").write_text(legal("voorwaarden", "Voorwaarden", VOORWAARDEN), encoding="utf-8")
(ROOT / "demos" / "img").mkdir(exist_ok=True)
segno.make(f"{PUBLIC}/demos/snackbar.html#menu", error="m").save(
    str(ROOT / "demos" / "img" / "qr-hoekje.svg"), kind="svg", scale=1, border=2, dark="#2B1B10", light="#FFFFFF", xmldecl=False, omitsize=True)
(ROOT / "img" / "favicon.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0B0D10"/><path transform="translate(4 4) scale(.75)" fill="#C6F25A" d="{STAR_PATH}"/></svg>', encoding="utf-8")
(ROOT / "manifest.webmanifest").write_text(json.dumps({
    "name": "Sovera", "short_name": "Sovera", "description": "Websites voor ondernemers in Rotterdam",
    "start_url": "./index.html", "scope": "./", "display": "standalone", "lang": "nl",
    "background_color": "#0B0D10", "theme_color": "#0B0D10",
    "icons": [{"src": "img/icon-192.png", "sizes": "192x192", "type": "image/png"},
              {"src": "img/icon-512.png", "sizes": "512x512", "type": "image/png"},
              {"src": "img/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}, ensure_ascii=False, indent=1), encoding="utf-8")
urls = [""] + [f'branches/{b["slug"]}.html' for b in BRANCHES] + ["privacy.html", "voorwaarden.html"]
(ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"  <url><loc>{SITE}/{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
(ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8")
print("gebouwd:", 3 + len(BRANCHES), "pagina's + favicon, sitemap, robots, QR", "(PREVIEW, noindex)" if PREVIEW else "")
