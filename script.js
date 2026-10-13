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
