# Sovera, versie 6 ("Havenstad")

Volledig nieuw design (3 nov 2026): inkt-zwart bovenstuk met limoengroen accent, de rest warm wit.
Koppen in Bricolage Grotesque, tekst in DM Sans, labels in JetBrains Mono (allemaal zelf gehost).

## Nieuw in versie 6
- Nieuwe homepage: wisselend woord in de kop, 3D-telefoon met voorbeeldsite, doorlopende branchebalk,
  blok "Wat je krijgt", branchekaarten met icoontjes, nieuwe prijzen, stappen, veelgestelde vragen, grote footer.
- Branchepagina's, privacy en voorwaarden in dezelfde stijl. Demobalk van de 3 demo's in de nieuwe kleuren.
- `js/ui.js`: header bij scrollen, mobiel menu, rustige animaties bij scrollen. Geen animaties als iemand
  "minder beweging" heeft ingesteld.
- Getest op 320 tot 1920 px breed: geen fouten in de console, geen horizontaal scrollen, alle 51 links werken,
  websitecheck getest met nep-antwoorden van Google (goed, te druk, site niet bereikbaar, ongeldig, profiel).


Statische website met 3 klikbare demo's. Openen: dubbelklik op `index.html`.

**Online preview:** https://103469.github.io/sovera/ (staat op `noindex`, dus niet in Google)

## Nieuw in versie 5
- Nieuw logo: S + ster als o + vera (ster met 8 punten).
- Installeerbaar als app: manifest + app-iconen (img/icon-*.png). Op iPhone: Delen → Zet op beginscherm.

## Nieuw in versie 4
- 3 echte demosites in `demos/`, elk met een eigen stijl en een groene balk "Demo van Sovera, verzonnen bedrijf":
  - `barbershop.html`: Barbershop De Kade. Prijslijst met filter, live "nu open", afspraak kiezen (dag, tijd, naam).
  - `snackbar.html`: Snackbar Het Hoekje. Menu met filter (friet, snacks, vega...), QR-code voor op tafel, bestelknoppen.
  - `installateur.html`: Kraan & Ketel. Postcodecheck voor het werkgebied, voor/na-schuif, offerte in 3 stappen.
- De kaarten bij "Zo kan jouw site eruitzien" zijn nu klikbaar, met een echte screenshot.
- Branchepagina's kappers, horeca en bouw linken naar de passende demo.
- Preview-modus: `SOVERA_PREVIEW=1 python3 build.py` zet `noindex` en een gele balk "nog in opbouw" op elke pagina.
- `?v=4` achter css/js, zodat browsers na een update de nieuwe versie laden.

## Eerlijk blijven
- Demo's hebben verzonnen namen en adressen ("Voorbeeldkade 8"), geen echte telefoonnummers en staan altijd op `noindex`.
- Geen verzonnen reviews: op die plek staat "Hier komen je echte Google-reviews".
- Knoppen als Bellen, WhatsApp en Route tonen alleen een melding wat ze op een echte site zouden doen.

## Bestanden
- `build.py`: maakt alle pagina's en de QR-code. Draai `python3 build.py` (nodig: `pip install segno`).
- `css/style.css`: opmaak hoofdsite. `demos/demo.css` + `demos/demo.js`: gedeeld voor de demo's.
- `js/config.js`: **instellingen** (e-mail, WhatsApp, formulier, API-sleutel).
- `js/check.js`: de gratis websitecheck (Google PageSpeed). `js/contact.js`: formulier en WhatsApp-knop.
- `fonts/`: lettertypes, zelf gehost.
- `privacy.html`, `voorwaarden.html`: **concepten**, laten nalezen.

## Online zetten (preview)
1. `SOVERA_PREVIEW=1 python3 build.py`
2. Kopieer alles behalve `build.py`, `README.md` en `screens/` naar de map `sovera/` in de repo `103469.github.io`.
3. Commit en push naar `main`. Na ongeveer een minuut staat het online.

## Checklist voor livegang op soverastudio.nl
- [ ] Domein soverastudio.nl gekocht (vrij op 2 nov 2026)
- [ ] E-mailadres aangemaakt en ingevuld in `js/config.js`
- [ ] WhatsApp-nummer ingevuld in `js/config.js` (of leeg laten)
- [ ] Formulier gekoppeld (bijv. gratis Formspree) en `formEndpoint` ingevuld
- [ ] KvK-inschrijving gedaan, nummer in `build.py` bij `KVK`
- [ ] Btw-keuze gemaakt (KOR of excl. btw), tekst in `build.py` bij `BTW`
- [ ] Foto van Quinten in `img/quinten.jpg` en placeholder vervangen in build.py
- [ ] Privacyverklaring en voorwaarden laten nalezen
- [ ] PageSpeed API-sleutel aangemaakt (gratis) met referrer-beperking op soverastudio.nl
- [ ] Websitecheck live getest met echte sites
- [ ] Google-bedrijfsprofiel voor Sovera zelf aangemaakt
- [ ] Bouwen zonder `SOVERA_PREVIEW`, zodat `noindex` en de gele balk weg zijn (demo's blijven `noindex`)

Gele markeringen op de site (`.todo`) laten zien wat nog ingevuld moet worden.
