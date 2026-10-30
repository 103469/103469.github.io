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

// Kleur per sectie: bij elk project kleurt de achtergrond mee met de kleuren van die site
const KLEUREN = {
    wk:   { vak: '#14213F', accent: '#AFC6FF' },   // marineblauw, zoals de WK 2026-site
    quiz: { vak: '#0F3340', accent: '#92E2E8' },   // diep petrol, zoals Quizzie
};
const wortel = document.documentElement;
const themaKleur = document.querySelector('meta[name="theme-color"]');
const kleurWissel = new IntersectionObserver((items) => {
    items.forEach((item) => {
        if (!item.isIntersecting) return;
        const k = KLEUREN[item.target.dataset.stap];
        if (k) {
            wortel.style.setProperty('--vak', k.vak);
            wortel.style.setProperty('--groen', k.accent);
        } else {
            wortel.style.removeProperty('--vak');
            wortel.style.removeProperty('--groen');
        }
        themaKleur?.setAttribute('content', k ? k.vak : '#12291D');
    });
}, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('[data-stap]').forEach((stap) => kleurWissel.observe(stap));
