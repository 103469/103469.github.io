/* cv.js — knoppen "Vraag mijn CV aan" openen een venster in plaats van meteen een mail-app */
(function () {
    const venster = document.querySelector('.cv-venster');
    if (!venster || typeof venster.showModal !== 'function') return;   // oude browser: dan gewoon de mail-link

    document.querySelectorAll('[data-cv]').forEach((knop) => {
        knop.addEventListener('click', (e) => {
            e.preventDefault();
            venster.showModal();
        });
    });

    venster.querySelector('.cv-sluit').addEventListener('click', () => venster.close());
    // klik naast het venster = sluiten
    venster.addEventListener('click', (e) => { if (e.target === venster) venster.close(); });

    const kopieer = venster.querySelector('.cv-kopieer');
    kopieer.addEventListener('click', async () => {
        const adres = 'quintenlob6@gmail.com';
        try {
            await navigator.clipboard.writeText(adres);
        } catch (err) {
            // geen toegang tot het klembord: selecteer de tekst, dan kan je hem zelf kopiëren
            const r = document.createRange();
            r.selectNodeContents(venster.querySelector('.cv-adres strong'));
            const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        }
        kopieer.textContent = 'Gekopieerd!';
        setTimeout(() => { kopieer.textContent = 'Kopieer'; }, 1800);
    });
})();
