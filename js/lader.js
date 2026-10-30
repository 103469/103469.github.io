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

    let huidig = 0;
    let doel = 0;
    let weg = false;

    // De ring loopt soepel naar het doel toe in plaats van te springen
    (function loop() {
        if (weg) return;
        huidig += (doel - huidig) * 0.12;
        ring.style.strokeDashoffset = omtrek * (1 - huidig);
        getal.textContent = Math.round(huidig * 100);
        requestAnimationFrame(loop);
    })();

    function voortgang(deel) {
        doel = Math.max(doel, Math.min(1, deel));
    }

    // Door de linkerkant van de ring heen zoomen
    function zoom() {
        const p = { x: -14, y: -6 };
        const duur = 1150;
        const start = performance.now();
        lader.classList.add('door');
        (function stap(nu) {
            const t = Math.min(1, (nu - start) / duur);
            const e = t * t * t;                       // langzaam beginnen, steeds sneller
            const s = 1 + e * 110;
            gat.setAttribute('transform', `translate(${p.x} ${p.y}) scale(${s}) translate(${-p.x} ${-p.y})`);
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
