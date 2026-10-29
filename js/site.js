// site.js — menu op mobiel, binnenkomende onderdelen, wisselende foto's en de groepsstand
const knop = document.querySelector('.menu-knop');
const menu = document.getElementById('menu');
const rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Menu op mobiel
knop.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    knop.setAttribute('aria-expanded', open);
});
menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
        menu.classList.remove('open');
        knop.setAttribute('aria-expanded', false);
    });
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        knop.setAttribute('aria-expanded', false);
        knop.focus();
    }
});

// Onderdelen komen een voor een binnen als hun blok in beeld komt
const blokken = document.querySelectorAll('section, .stand, .project, .slot');
const binnen = new IntersectionObserver((items) => {
    items.forEach((item) => {
        if (!item.isIntersecting) return;
        item.target.querySelectorAll(':scope [data-op]:not(.zichtbaar)').forEach((el, i) => {
            el.style.transitionDelay = (rustig ? 0 : Math.min(i, 8) * 75) + 'ms';
            el.classList.add('zichtbaar');
        });
        binnen.unobserve(item.target);
    });
}, { threshold: 0.12 });
blokken.forEach((blok) => binnen.observe(blok));

// Vaste foto rechts wisselt mee met Over mij
const podiumBeelden = document.querySelectorAll('.podium-beelden img');
const bijschrift = document.querySelector('[data-bijschrift]');
const bijschriften = ['Erasmusbrug, Rotterdam', 'Kop van Zuid, Rotterdam'];
const podium = new IntersectionObserver((items) => {
    items.forEach((item) => {
        if (!item.isIntersecting) return;
        const nr = Number(item.target.dataset.beeld);
        podiumBeelden.forEach((img, i) => img.classList.toggle('actief', i === nr));
        bijschrift.textContent = bijschriften[nr];
    });
}, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('.kolom [data-beeld]').forEach((s) => podium.observe(s));

// Skills: de regel in het midden van het scherm (of onder de muis) kiest het beeld
const skillRegels = document.querySelectorAll('.skills dl > div');
const skillBeelden = document.querySelectorAll('.skills-beeld img');
function kiesSkill(regel) {
    skillRegels.forEach((r) => r.classList.toggle('actief', r === regel));
    skillBeelden.forEach((img, i) => img.classList.toggle('actief', i === Number(regel.dataset.beeld)));
}
const skillKijker = new IntersectionObserver((items) => {
    items.forEach((item) => { if (item.isIntersecting) kiesSkill(item.target); });
}, { rootMargin: '-48% 0px -48% 0px' });
skillRegels.forEach((regel) => {
    skillKijker.observe(regel);
    regel.addEventListener('mouseenter', () => kiesSkill(regel));
});

// Groepsstand: dezelfde regels als bracket.php (3 punten voor winst, 1 voor gelijk)
const duels = document.querySelector('.duels');
const tbody = document.querySelector('.stand-tabel tbody');

function rekenStand() {
    const stand = {};
    tbody.querySelectorAll('tr').forEach((tr) => {
        stand[tr.dataset.land] = { gs: 0, w: 0, g: 0, v: 0, voor: 0, tegen: 0, punten: 0 };
    });

    duels.querySelectorAll('.duel').forEach((duel) => {
        const [a, b] = duel.querySelectorAll('input');
        if (a.value === '' || b.value === '') return;   // nog niet gespeeld
        const d1 = Number(a.value), d2 = Number(b.value);
        const t1 = stand[a.dataset.team], t2 = stand[b.dataset.team];
        t1.gs++; t2.gs++;
        t1.voor += d1; t1.tegen += d2;
        t2.voor += d2; t2.tegen += d1;
        if (d1 > d2) { t1.punten += 3; t1.w++; t2.v++; }
        else if (d2 > d1) { t2.punten += 3; t2.w++; t1.v++; }
        else { t1.punten += 1; t2.punten += 1; t1.g++; t2.g++; }
    });

    // Sorteren op punten, bij gelijke punten op doelsaldo
    const rijen = [...tbody.querySelectorAll('tr')];
    const voor = new Map(rijen.map((r) => [r, r.getBoundingClientRect().top]));
    rijen.sort((x, y) => {
        const a = stand[x.dataset.land], b = stand[y.dataset.land];
        return b.punten - a.punten || (b.voor - b.tegen) - (a.voor - a.tegen) || b.voor - a.voor;
    });

    rijen.forEach((tr) => {
        const s = stand[tr.dataset.land];
        const cellen = tr.querySelectorAll('td');
        const oud = cellen[5].textContent;
        [s.gs, s.w, s.g, s.v, s.voor + '–' + s.tegen, s.punten].forEach((waarde, i) => { cellen[i].textContent = waarde; });
        tr.classList.toggle('wissel', oud !== String(s.punten));
        tbody.appendChild(tr);
    });

    // Rijen schuiven naar hun nieuwe plek
    if (rustig) return;
    rijen.forEach((tr) => {
        const verschil = voor.get(tr) - tr.getBoundingClientRect().top;
        if (!verschil) return;
        tr.animate([{ transform: `translateY(${verschil}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
    });
}

duels.addEventListener('input', (e) => {
    const veld = e.target;
    if (veld.value !== '') veld.value = Math.max(0, Math.min(20, Math.floor(Number(veld.value)) || 0));
    rekenStand();
});
duels.addEventListener('reset', () => setTimeout(rekenStand));
duels.addEventListener('submit', (e) => e.preventDefault());
