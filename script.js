/* script.js — Portfolio Quinten Löb */

// ── REIS MODAL (alleen op de Over mij-pagina) ─────────────────
const journeyBtn = document.getElementById('journeyBtn');
const journeyOverlay = document.getElementById('journeyOverlay');
const journeyClose = document.getElementById('journeyClose');

function openJourney() {
    journeyOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeJourney() {
    journeyOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

if (journeyBtn && journeyOverlay) {
    journeyBtn.addEventListener('click', openJourney);
    journeyClose.addEventListener('click', closeJourney);
    journeyOverlay.addEventListener('click', (e) => {
        if (e.target === journeyOverlay) closeJourney();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeJourney();
    });
}

// ── GLIMPLAATJE: kaart kantelt en glanst mee met de muis ───────
const kaart = document.querySelector('.spelerskaart');
const rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (kaart && !rustig) {
    kaart.addEventListener('mousemove', (e) => {
        const r = kaart.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;   // 0 tot 1
        const y = (e.clientY - r.top) / r.height;   // 0 tot 1
        kaart.style.setProperty('--x', (x * 100) + '%');
        kaart.style.setProperty('--y', (y * 100) + '%');
        kaart.style.setProperty('--ry', ((x - 0.5) * 16) + 'deg');
        kaart.style.setProperty('--rx', ((0.5 - y) * 16) + 'deg');
        kaart.classList.add('beweegt');
    });
    kaart.addEventListener('mouseleave', () => {
        kaart.classList.remove('beweegt');
        kaart.style.setProperty('--x', '50%');
        kaart.style.setProperty('--y', '50%');
    });
}
