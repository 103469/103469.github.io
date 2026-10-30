// lader.js — laadscherm: de ring van de Q loopt vol terwijl de laptop laadt,
// daarna zoom je door de ring heen de site in
(() => {
    const html = document.documentElement;
    const lader = document.querySelector('.lader');
    if (!lader) return;

    const ring = lader.querySelector('.lader-ring');
    const getal = lader.querySelector('.lader-getal');
    const naam = lader.querySelector('.lader-naam');
    const gat = lader.querySelector('.lader-gat');
    const rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const omtrek = 2 * Math.PI * 14;

    // Naam letter voor letter, zodat ze één voor één kunnen opkomen
    [...'Quinten Löb'].forEach((teken, i) => {
        const s = document.createElement('span');
        s.textContent = teken === ' ' ? ' ' : teken;
        s.style.setProperty('--i', i);
        naam.appendChild(s);
    });

    ring.style.strokeDasharray = omtrek;
    ring.style.strokeDashoffset = omtrek;

    // De ring doet er minstens zo lang over, ook als alles al binnen is
    const MINIMAAL = 3000;
    const begin = performance.now();
    let huidig = 0;
    let doel = 0;
    let weg = false;

    // De ring loopt soepel naar het doel toe in plaats van te springen
    (function loop() {
        if (weg) return;
        const max = Math.min(doel, (performance.now() - begin) / MINIMAAL);
        huidig += (max - huidig) * 0.1;
        ring.style.strokeDashoffset = omtrek * (1 - huidig);
        getal.textContent = Math.round(huidig * 100);
        requestAnimationFrame(loop);
    })();

    function voortgang(deel) {
        doel = Math.max(doel, Math.min(1, deel));
    }

    // Recht door het midden van de Q vliegen: de binnenkant is een raam naar de site,
    // de ring en de staart vliegen langs je heen naar buiten
    const q = lader.querySelector('.lader-q');
    function zoom() {
        const m = { x: 0, y: -6 };
        const duur = 3000;
        const start = performance.now();
        lader.classList.add('door');
        (function stap(nu) {
            const t = Math.min(1, (nu - start) / duur);
            // eerst heel even terugveren, dan steeds harder vooruit
            const e = t < 0.15 ? -0.04 * Math.sin((t / 0.15) * Math.PI) : Math.pow((t - 0.15) / 0.85, 2.6);
            const s = Math.max(0.9, 1 + e * 14);
            const tf = `translate(${m.x} ${m.y}) scale(${s}) translate(${-m.x} ${-m.y})`;
            gat.setAttribute('transform', tf);
            q.setAttribute('transform', tf);
            q.style.opacity = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
            if (t < 1) requestAnimationFrame(stap);
            else html.classList.remove('laden');
        })(start);
    }

    function klaar() {
        if (weg) return;
        voortgang(1);
        // Wachten tot de ring echt rond is, dan de staart erbij en erdoorheen
        const wacht = () => {
            if (huidig < 0.995) return requestAnimationFrame(wacht);
            weg = true;
            ring.style.strokeDashoffset = 0;
            getal.textContent = 100;
            lader.classList.add('vol');
            if (rustig) {
                html.classList.remove('laden');
                return;
            }
            setTimeout(zoom, 450);
        };
        wacht();
    }

    window.lader = { voortgang, klaar };

    // Vangnet: na 10 seconden gaat het laadscherm altijd weg
    setTimeout(klaar, 10000);
})();
