/* script.js — Portfolio Quinten Löb */

// ── XP-BALKEN: vullen zich bij het laden van de pagina ─────────
const balken = document.querySelectorAll('.balk i[data-breedte]');

window.addEventListener('load', () => {
    balken.forEach((balk) => {
        balk.style.width = balk.dataset.breedte;
    });
});
