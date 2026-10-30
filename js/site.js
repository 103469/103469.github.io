// site.js — menu op mobiel en binnenkomende onderdelen
const knop = document.querySelector('.menu-knop');
const menu = document.getElementById('menu');
const rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Menu op mobiel
function sluitMenu() {
    menu.classList.remove('open');
    knop.setAttribute('aria-expanded', false);
}
knop.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    knop.setAttribute('aria-expanded', open);
});
menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', sluitMenu));
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
        sluitMenu();
        knop.focus();
    }
});

// Grote koppen in woorden splitsen, zodat ze een voor een binnenkomen
if (!rustig) {
    document.querySelectorAll('.woord').forEach((kop) => {
        kop.setAttribute('aria-label', kop.textContent);
        kop.innerHTML = kop.textContent.trim().split(/\s+/)
            .map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
        kop.classList.add('gesplitst');
    });
}

// Onderdelen komen een voor een binnen als hun stap in beeld komt
const binnen = new IntersectionObserver((items) => {
    items.forEach((item) => {
        if (!item.isIntersecting) return;
        item.target.querySelectorAll('[data-op]').forEach((el, i) => {
            el.style.transitionDelay = (rustig ? 0 : Math.min(i, 8) * 70) + 'ms';
            el.classList.add('zichtbaar');
        });
        binnen.unobserve(item.target);
    });
}, { threshold: 0.15 });
document.querySelectorAll('.stap').forEach((stap) => binnen.observe(stap));

// E-mailadres kopiëren
const kopieer = document.querySelector('.kopieer');
const melding = document.querySelector('.kopieer-melding');
kopieer.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(kopieer.dataset.adres);
        melding.textContent = 'Gekopieerd!';
    } catch (e) {
        melding.textContent = kopieer.dataset.adres;
    }
    clearTimeout(kopieer.wacht);
    kopieer.wacht = setTimeout(() => { melding.textContent = ''; }, 2500);
});

// Kleur per sectie: de achtergrond vloeit tijdens het scrollen geleidelijk over
// van de ene kleur naar de andere (groen → WK-blauw → Quizzie-petrol → groen)
const BASIS = { vak: '#12291D', accent: '#C4DFA0' };
const KLEUREN = {
    wk:   { vak: '#14213F', accent: '#AFC6FF' },   // marineblauw, zoals de WK 2026-site
    quiz: { vak: '#0F3340', accent: '#92E2E8' },   // diep petrol, zoals Quizzie
};
const wortel = document.documentElement;
const themaKleur = document.querySelector('meta[name="theme-color"]');
const naarRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const meng = (a, b, t) => {
    const x = naarRgb(a), y = naarRgb(b);
    return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
};
const zacht = (t) => t * t * (3 - 2 * t);
const stappen = [...document.querySelectorAll('[data-stap]')];

// Per sectie twee ankerpunten: in het middelste deel blijft de kleur staan,
// daartussen vloeit hij over
let ankers = [];
function meet() {
    ankers = [];
    stappen.forEach((el) => {
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        const k = KLEUREN[el.dataset.stap] || BASIS;
        ankers.push({ y: top + r.height * 0.3, k }, { y: top + r.height * 0.7, k });
    });
    kleur();
}
let bezig = false;
function kleur() {
    bezig = false;
    if (!ankers.length) return;
    const y = window.scrollY + window.innerHeight / 2;
    let a = ankers[0], b = ankers[0];
    for (let i = 0; i < ankers.length; i++) {
        if (ankers[i].y <= y) a = ankers[i];
        if (ankers[i].y >= y) { b = ankers[i]; break; }
        b = ankers[i];
    }
    const t = b.y === a.y ? 0 : zacht(Math.min(1, Math.max(0, (y - a.y) / (b.y - a.y))));
    const vak = meng(a.k.vak, b.k.vak, t);
    wortel.style.setProperty('--vak', vak);
    wortel.style.setProperty('--groen', meng(a.k.accent, b.k.accent, t));
    themaKleur?.setAttribute('content', vak);
}
window.addEventListener('scroll', () => { if (!bezig) { bezig = true; requestAnimationFrame(kleur); } }, { passive: true });
window.addEventListener('resize', meet);
window.addEventListener('load', meet);
new ResizeObserver(meet).observe(document.body);
meet();
