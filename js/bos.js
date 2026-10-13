/* bos.js — de vuurvliegjes van Quinten Löb
   ------------------------------------------------------------------
   Duizenden vuurvliegjes (three.js Points) vliegen door een donker bos.
   Elke sectie op de pagina heeft een "vorm" (data-vorm). Zodra je bij
   die sectie bent, vliegt een deel van de vuurvliegjes naar die vorm.
   De rest blijft vrij rondvliegen zodat het bos levend blijft.
   ------------------------------------------------------------------ */
import * as THREE from './three.module.min.js';

const html = document.documentElement;
const rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Kan deze browser WebGL? Zo niet: stille versie ───────────────
function heeftWebGL() {
    try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) { return false; }
}
if (rustig || !heeftWebGL()) {
    html.classList.add('statisch');
} else {
    start();
}

function start() {
    html.classList.add('levend');

    // Teksten komen zacht tevoorschijn als je ernaartoe scrolt
    const kijker = new IntersectionObserver((items) => {
        items.forEach((it) => { if (it.isIntersecting) it.target.classList.add('zichtbaar'); });
    }, { threshold: 0.2 });
    document.querySelectorAll('.verschijn').forEach((el) => kijker.observe(el));

    // ── Basis: scène, camera in pixels, renderer ───────────────────
    const canvas = document.getElementById('vuurvliegjes');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    const scene = new THREE.Scene();
    let W = window.innerWidth, H = window.innerHeight;
    const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -1000, 1000);
    const mobiel = () => W < 860;
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr);
    renderer.setSize(W, H, false);

    // ── Hoeveel vuurvliegjes ───────────────────────────────────────
    const N = mobiel() ? 1300 : 3200;
    // welk deel van de vuurvliegjes de vorm maakt; de rest vliegt vrij
    const AANDEEL = { naam: 0.9, open: 0.85, skills: 0.62 };
    const aandeel = (naam) => Math.floor(N * (AANDEEL[naam] || 0.72));

    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 2);
    const doel = new Float32Array(N * 2);
    const thuis = new Float32Array(N * 2);   // vrije plek in het bos
    const maat = new Float32Array(N);
    const fase = new Float32Array(N);
    const groep = new Float32Array(N);

    // Willekeurige volgorde, zodat steeds andere vuurvliegjes de vorm maken
    const volgorde = Array.from({ length: N }, (_, i) => i).sort(() => Math.random() - 0.5);

    function nieuweThuis(i) {
        thuis[i * 2] = (Math.random() - 0.5) * W * 1.1;
        thuis[i * 2 + 1] = (Math.random() - 0.5) * H * 1.1;
    }
    for (let i = 0; i < N; i++) {
        nieuweThuis(i);
        pos[i * 3] = thuis[i * 2];
        pos[i * 3 + 1] = thuis[i * 2 + 1] - H;   // ze komen van onderen het bos in
        pos[i * 3 + 2] = 0;
        maat[i] = mobiel() ? 1.6 + Math.pow(Math.random(), 3) * 5.5 : 2.2 + Math.pow(Math.random(), 3) * 9;   // veel kleintjes, een paar grote (= dichtbij)
        fase[i] = Math.random() * 100;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aMaat', new THREE.BufferAttribute(maat, 1));
    geo.setAttribute('aFase', new THREE.BufferAttribute(fase, 1));
    geo.setAttribute('aGroep', new THREE.BufferAttribute(groep, 1));

    // ── Shader: een zacht gloeiend lichtje dat knippert ────────────
    const uniforms = {
        uTijd: { value: 0 },
        uPr: { value: pr },
        uLicht: { value: -1 },     // welk skill-groepje licht op (-1 = geen)
        uDageraad: { value: 0 },   // 0 = nacht, 1 = dageraad bij contact
        uAan: { value: 0 },        // vuurvliegjes gaan langzaam aan bij het laden
        uDiepte: { value: new THREE.Vector2(0, 0) },
    };
    const mat = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
            uniform float uTijd, uPr, uLicht, uAan;
            uniform vec2 uDiepte;
            attribute float aMaat, aFase, aGroep;
            varying float vSterk;
            varying float vTint;
            void main() {
                float snel = 0.7 + fract(aFase * 0.618) * 1.6;
                float knipper = 0.5 + 0.5 * sin(uTijd * snel + aFase);
                float sterk = 0.28 + 0.72 * knipper * knipper;
                float grootte = aMaat;

                // groepjes: 1-7 skills, 30-37 gehaalde stops, 38 nu (knippert), 39 nog niet
                if (aGroep > 29.5 && aGroep < 37.5) { sterk = max(sterk, 0.85); grootte *= 1.25; }
                if (abs(aGroep - 38.0) < 0.5) { sterk = 0.15 + 0.85 * (0.5 + 0.5 * sin(uTijd * 5.0)); grootte *= 1.4; }
                if (abs(aGroep - 39.0) < 0.5) { sterk *= 0.22; }
                if (aGroep > 0.5 && abs(aGroep - uLicht) < 0.5) { sterk = 1.0; grootte *= 1.7; }

                // langzaam aangaan, elk vuurvliegje op een eigen moment
                float aan = clamp(uAan * 3.0 - fract(aFase * 0.37) * 2.0, 0.0, 1.0);
                vSterk = sterk * aan;
                vTint = fract(aFase * 0.913);
                gl_PointSize = grootte * uPr * (0.75 + 0.5 * knipper);
                // diepte: grote (dichtbij) lichtjes verschuiven meer als je de muis beweegt
                vec3 p = position;
                p.xy += uDiepte * (aMaat / 6.0) * 18.0;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            }`,
        fragmentShader: /* glsl */`
            uniform float uDageraad;
            varying float vSterk;
            varying float vTint;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                if (d > 0.5) discard;
                float kern = pow(smoothstep(0.5, 0.0, d), 4.0);
                float gloed = exp(-d * d * 18.0) * 0.55;
                vec3 geel = vec3(1.0, 0.86, 0.42);
                vec3 groen = vec3(0.78, 1.0, 0.45);
                vec3 kleur = mix(geel, groen, vTint);
                kleur = mix(kleur, vec3(1.0, 0.78, 0.55), uDageraad * 0.5);
                float a = (kern * 1.4 + gloed) * vSterk;
                gl_FragColor = vec4(kleur * a, a);
            }`,
    });
    scene.add(new THREE.Points(geo, mat));

    // ── Vormen maken: tekenen op een los canvas en de pixels uitlezen ──
    const vormen = {};
    function bemonster(teken, breed = 512, hoog = 512, dichtheid = 3, alleenRand = 0) {
        const c = document.createElement('canvas');
        c.width = breed; c.height = hoog;
        const x = c.getContext('2d');
        x.fillStyle = '#fff'; x.strokeStyle = '#fff';
        x.lineCap = 'round'; x.lineJoin = 'round';
        teken(x, breed, hoog);
        const data = x.getImageData(0, 0, breed, hoog).data;
        const punten = [];
        for (let yy = 0; yy < hoog; yy += dichtheid) {
            for (let xx = 0; xx < breed; xx += dichtheid) {
                const a = (px, py) => (px < 0 || py < 0 || px >= breed || py >= hoog) ? 0 : data[(py * breed + px) * 4 + 3];
                if (a(xx, yy) > 140 && (!alleenRand ||
                    a(xx - alleenRand, yy) < 140 || a(xx + alleenRand, yy) < 140 ||
                    a(xx, yy - alleenRand) < 140 || a(xx, yy + alleenRand) < 140)) {
                    // genormaliseerd: breedte = 1, midden = 0, y omhoog
                    punten.push([(xx - breed / 2) / breed, -(yy - hoog / 2) / breed, 0]);
                }
            }
        }
        return hussel(punten);
    }
    function hussel(lijst) {
        for (let i = lijst.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lijst[i], lijst[j]] = [lijst[j], lijst[i]];
        }
        return lijst;
    }

    function maakVormen() {
        // De naam
        vormen.naam = bemonster((x, b, h) => {
            let grootte = h * 0.8;
            x.font = `800 ${grootte}px Bricolage, sans-serif`;
            const breedte = x.measureText('Quinten').width;
            if (breedte > b * 0.94) grootte *= (b * 0.94) / breedte;
            x.font = `800 ${grootte}px Bricolage, sans-serif`;
            x.textAlign = 'center'; x.textBaseline = 'middle';
            x.fillText('Quinten', b / 2, h * 0.54);
        }, 1200, 320, mobiel() ? 4 : 2, mobiel() ? 0 : 5);   // groot scherm: alleen de rand van de letters

        // Voetbal (keepen)
        vormen.bal = bemonster((x, b) => {
            const m = b / 2, r = b * 0.42;
            x.lineWidth = b * 0.035;
            x.beginPath(); x.arc(m, m, r, 0, Math.PI * 2); x.stroke();
            const vijf = [];
            for (let i = 0; i < 5; i++) {
                const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
                vijf.push([m + Math.cos(a) * r * 0.36, m + Math.sin(a) * r * 0.36]);
            }
            x.beginPath(); vijf.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill();
            vijf.forEach((p) => {
                const a = Math.atan2(p[1] - m, p[0] - m);
                x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(m + Math.cos(a) * r, m + Math.sin(a) * r); x.stroke();
            });
        });

        // Halter (fitness)
        vormen.halter = bemonster((x, b) => {
            const m = b / 2;
            x.fillRect(b * 0.22, m - b * 0.025, b * 0.56, b * 0.05);
            [[0.08, 0.3], [0.18, 0.42], [0.74, 0.42], [0.86, 0.3]].forEach(([l, hh], i) => {
                const breedte = i === 0 || i === 3 ? 0.06 : 0.08;
                x.fillRect(b * l, m - b * hh / 2, b * breedte, b * hh);
            });
        });

        // Controller (gamen)
        vormen.controller = bemonster((x, b) => {
            const m = b / 2;
            x.lineWidth = b * 0.035;
            x.beginPath();
            x.moveTo(b * 0.3, m - b * 0.16);
            x.lineTo(b * 0.7, m - b * 0.16);
            x.bezierCurveTo(b * 0.9, m - b * 0.16, b * 0.98, m + b * 0.2, b * 0.86, m + b * 0.24);
            x.bezierCurveTo(b * 0.78, m + b * 0.27, b * 0.7, m + b * 0.08, b * 0.62, m + b * 0.06);
            x.lineTo(b * 0.38, m + b * 0.06);
            x.bezierCurveTo(b * 0.3, m + b * 0.08, b * 0.22, m + b * 0.27, b * 0.14, m + b * 0.24);
            x.bezierCurveTo(b * 0.02, m + b * 0.2, b * 0.1, m - b * 0.16, b * 0.3, m - b * 0.16);
            x.stroke();
            x.fillRect(b * 0.22, m - b * 0.075, b * 0.15, b * 0.045);
            x.fillRect(b * 0.2725, m - b * 0.125, b * 0.045, b * 0.145);
            [[0.66, -0.085], [0.76, -0.03]].forEach(([l, t]) => { x.beginPath(); x.arc(b * l, m + b * t, b * 0.04, 0, Math.PI * 2); x.fill(); });
        });

        // Wereldbol (WK 2026)
        vormen.wereld = bemonster((x, b) => {
            const m = b / 2, r = b * 0.42;
            x.lineWidth = b * 0.028;
            x.beginPath(); x.arc(m, m, r, 0, Math.PI * 2); x.stroke();
            [0.35, 0.72].forEach((s) => { x.beginPath(); x.ellipse(m, m, r * s, r, 0, 0, Math.PI * 2); x.stroke(); });
            [-0.5, 0, 0.5].forEach((t) => {
                const y = m + t * r, half = Math.sqrt(1 - t * t) * r;
                x.beginPath(); x.moveTo(m - half, y); x.lineTo(m + half, y); x.stroke();
            });
        });

        // Vraagteken (Quizzie)
        vormen.vraag = bemonster((x, b, h) => {
            x.font = `800 ${h * 0.9}px Bricolage, sans-serif`;
            x.textAlign = 'center'; x.textBaseline = 'middle';
            x.fillText('?', b / 2, h * 0.53);
        }, 512, 512, 2, 10);

        // Skills: 7 groepjes in een losse kring
        vormen.skills = [];
        for (let g = 0; g < 7; g++) {
            const a = -Math.PI / 2 + g * Math.PI * 2 / 7;
            const cx = Math.cos(a) * 0.34, cy = Math.sin(a) * 0.34;
            for (let k = 0; k < 120; k++) {
                const r = Math.sqrt(Math.random()) * 0.075, h = Math.random() * Math.PI * 2;
                vormen.skills.push([cx + Math.cos(h) * r, cy + Math.sin(h) * r, g + 1]);
            }
        }
        hussel(vormen.skills);

        // Pad met 10 stops (mijn reis)
        vormen.pad = [];
        const padPunt = (t) => [(-0.42 + t * 0.84), -0.42 + t * 0.84 + Math.sin(t * Math.PI * 3) * 0.12];
        for (let k = 0; k < 500; k++) {
            const [px, py] = padPunt(Math.random());
            vormen.pad.push([px + (Math.random() - 0.5) * 0.012, py + (Math.random() - 0.5) * 0.012, 0]);
        }
        for (let s = 0; s < 10; s++) {
            const [sx, sy] = padPunt(s / 9);
            const g = 30 + s;   // stop 1 = groep 30 … stop 10 = groep 39
            for (let k = 0; k < 60; k++) {
                const r = Math.sqrt(Math.random()) * 0.03, h = Math.random() * Math.PI * 2;
                vormen.pad.push([sx + Math.cos(h) * r, sy + Math.sin(h) * r, g]);
            }
        }
        hussel(vormen.pad);

        // Open plek bij dageraad (contact): een brede kring laag in beeld
        vormen.open = [];
        for (let k = 0; k < 1600; k++) {
            const h = Math.random() * Math.PI * 2;
            const r = 0.5 + (Math.random() - 0.5) * 0.06;
            vormen.open.push([Math.cos(h) * r, Math.sin(h) * r * 0.22, 0]);
        }
    }

    // ── Waar en hoe groot komt een vorm op het scherm ──────────────
    function plek(naam) {
        if (mobiel()) {
            if (naam === 'naam') return { x: 0, y: H * 0.1, s: W * 0.92 };
            if (naam === 'open') return { x: 0, y: -H * 0.32, s: W * 1.1 };
            return { x: 0, y: H * 0.26, s: Math.min(W * 0.64, H * 0.3) };
        }
        if (naam === 'naam') return { x: 0, y: H * 0.06, s: Math.min(W * 0.82, 1250) };
        if (naam === 'open') return { x: 0, y: -H * 0.3, s: Math.min(W * 0.9, 1300) };
        return { x: W * 0.24, y: 0, s: Math.min(W * 0.4, H * 0.72) };
    }

    let huidigeVorm = null;
    function zetVorm(naam) {
        huidigeVorm = naam;
        const punten = naam && vormen[naam];
        uniforms.uLicht.value = -1;
        for (let k = 0; k < N; k++) {
            const i = volgorde[k];
            if (punten && k < aandeel(naam)) {
                const p = punten[k % punten.length];
                const pl = plek(naam);
                doel[i * 2] = pl.x + p[0] * pl.s + (Math.random() - 0.5) * 3;
                doel[i * 2 + 1] = pl.y + p[1] * pl.s + (Math.random() - 0.5) * 3;
                groep[i] = p[2] || 0;
            } else {
                doel[i * 2] = NaN;   // vrij vliegen
                groep[i] = 0;
            }
        }
        geo.attributes.aGroep.needsUpdate = true;
    }

    // ── Muis en vinger ─────────────────────────────────────────────
    let mx = 99999, my = 99999, vorigeX = 0, vorigeY = 0, muisSnel = 0;
    let roepen = false, roepTijd = 0, knal = null;
    const lichtje = document.querySelector('.lichtje');
    let dieptX = 0, dieptY = 0;
    function beweeg(cx, cy) {
        mx = cx - W / 2; my = H / 2 - cy;
        if (lichtje) lichtje.style.transform = `translate(${cx}px, ${cy}px)`;
    }
    window.addEventListener('pointermove', (e) => {
        beweeg(e.clientX, e.clientY);
        if (e.pointerType === 'mouse') html.classList.add('muis');
    }, { passive: true });
    document.addEventListener('pointerleave', () => { mx = my = 99999; html.classList.remove('muis'); });
    window.addEventListener('touchend', () => { mx = my = 99999; roepen = false; }, { passive: true });

    // Ingedrukt houden op een lege plek: de vrije vuurvliegjes komen naar je toe.
    // Kort klikken: ze schieten weg vanaf die plek.
    const opKnop = (el) => el.closest('a, button, input, textarea, .skill, .stops li');
    window.addEventListener('pointerdown', (e) => {
        if (opKnop(e.target)) return;
        beweeg(e.clientX, e.clientY);
        roepen = true; roepTijd = performance.now();
        html.classList.add('roept');
    });
    window.addEventListener('pointercancel', () => { roepen = false; html.classList.remove('roept'); });
    window.addEventListener('scroll', () => { if (roepen && performance.now() - roepTijd > 120) { roepen = false; html.classList.remove('roept'); } }, { passive: true });
    window.addEventListener('pointerup', (e) => {
        if (!roepen) return;
        if (performance.now() - roepTijd < 220) knal = { x: e.clientX - W / 2, y: H / 2 - e.clientY, kracht: 1 };
        roepen = false;
        html.classList.remove('roept');
    });

    // ── Welke sectie is in beeld ───────────────────────────────────
    const secties = [...document.querySelectorAll('[data-vorm]')];
    const menuLinks = [...document.querySelectorAll('.menu a')];
    function kijkWelkeSectie() {
        let beste = null, besteAfstand = Infinity;
        secties.forEach((s) => {
            const r = s.getBoundingClientRect();
            const afstand = Math.abs((r.top + r.bottom) / 2 - H / 2);
            if (r.bottom > 0 && r.top < H && afstand < besteAfstand) { beste = s; besteAfstand = afstand; }
        });
        if (!beste) return;
        if (huidigeVorm === 'start' && performance.now() < 1500) return;
        const vorm = beste.dataset.vorm || null;
        if (vorm !== huidigeVorm) zetVorm(vorm === 'vrij' ? null : vorm);
        huidigeVorm = vorm;
        const hoofd = beste.closest('[data-menu]')?.dataset.menu;
        document.querySelectorAll('.voortgang a').forEach((a) => a.classList.toggle('actief', a.getAttribute('href') === '#' + hoofd));
        menuLinks.forEach((a) => a.classList.toggle('actief', a.getAttribute('href') === '#' + hoofd));

        // Dageraad: hoe ver ben je in de contact-sectie
        const contact = document.getElementById('contact');
        const cr = contact.getBoundingClientRect();
        const d = Math.min(1, Math.max(0, 1 - cr.top / H));
        html.style.setProperty('--dageraad', d.toFixed(3));
        uniforms.uDageraad.value = d;
        html.style.setProperty('--scroll', String(window.scrollY));
    }
    window.addEventListener('scroll', kijkWelkeSectie, { passive: true });

    // Skills oplichten als je eroverheen gaat
    document.querySelectorAll('[data-groep], [data-stop]').forEach((el) => {
        if (el.dataset.stop !== undefined) el.dataset.groep = String(30 + Number(el.dataset.stop));
        const aan = () => { uniforms.uLicht.value = Number(el.dataset.groep); };
        const uit = () => { uniforms.uLicht.value = -1; };
        el.addEventListener('pointerenter', aan); el.addEventListener('focus', aan);
        el.addEventListener('pointerleave', uit); el.addEventListener('blur', uit);
    });

    // ── Formaat van het scherm verandert ───────────────────────────
    window.addEventListener('resize', () => {
        const nieuwW = window.innerWidth, nieuwH = window.innerHeight;
        const alleenAdresbalk = nieuwW === W && Math.abs(nieuwH - H) < 140;
        W = nieuwW; H = nieuwH;
        camera.left = -W / 2; camera.right = W / 2; camera.top = H / 2; camera.bottom = -H / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H, false);
        if (alleenAdresbalk) return;
        for (let i = 0; i < N; i++) nieuweThuis(i);
        maakVormen();
        zetVorm(huidigeVorm === 'vrij' ? null : huidigeVorm);
    });

    // ── Elke frame: vuurvliegjes bewegen ───────────────────────────
    const klok = new THREE.Clock();
    let vorigeScroll = window.scrollY;
    let tegoed = 0;
    function frame() {
        const dt = Math.min(klok.getDelta(), 0.07);
        // hoeveel stapjes van 1/60 seconde: zo gaat het op elk scherm even snel
        tegoed += dt * 60;
        const stappen = Math.min(4, Math.floor(tegoed));
        tegoed -= stappen;
        const t = klok.elapsedTime;
        uniforms.uTijd.value = t;
        uniforms.uAan.value = Math.min(1, uniforms.uAan.value + dt * 0.45);

        // hoe snel beweegt de muis (snel = vuurvliegjes schrikken)
        const dx = mx - vorigeX, dy = my - vorigeY;
        muisSnel = muisSnel * 0.85 + Math.min(Math.hypot(dx, dy), 200) * 0.15;
        vorigeX = mx; vorigeY = my;

        // diepte: zacht meeschuiven met de muis
        const doelDX = mx > 9999 ? 0 : mx / W, doelDY = my > 9999 ? 0 : my / H;
        dieptX += (doelDX - dieptX) * 0.05; dieptY += (doelDY - dieptY) * 0.05;
        uniforms.uDiepte.value.set(-dieptX, -dieptY);

        // scrollen laat het hele bos een beetje meebewegen
        const scrollDelta = window.scrollY - vorigeScroll;
        vorigeScroll = window.scrollY;

        for (let stap = 0; stap < stappen; stap++)
        for (let i = 0; i < N; i++) {
            const ix = i * 3, iv = i * 2;
            let x = pos[ix], y = pos[ix + 1];
            let tx = doel[iv], ty = doel[iv + 1], kracht;
            const f = fase[i];

            if (Number.isNaN(tx) && roepen && mx < 9999) {
                // geroepen: in een zwerm om je muis heen draaien
                const hoek = t * (0.8 + (f % 1)) + f;
                const r = 30 + (f * 7.3) % 110;
                tx = mx + Math.cos(hoek) * r;
                ty = my + Math.sin(hoek) * r;
                kracht = 0.012;
            } else if (Number.isNaN(tx)) {
                // vrij vliegen: rond een eigen plek zweven
                tx = thuis[iv] + Math.sin(t * 0.3 + f) * 60 + Math.sin(t * 0.13 + f * 2.1) * 40;
                ty = thuis[iv + 1] + Math.cos(t * 0.27 + f * 1.3) * 50;
                kracht = 0.004;
            } else {
                // in een vorm: een klein beetje blijven trillen
                tx += Math.sin(t * 1.7 + f) * 2.2;
                ty += Math.cos(t * 1.3 + f * 1.7) * 2.2;
                kracht = 0.03;
            }

            let vx = vel[iv] + (tx - x) * kracht;
            let vy = vel[iv + 1] + (ty - y) * kracht + (stap === 0 ? scrollDelta * 0.02 * (maat[i] / 6) : 0);

            // muis: rustig = nieuwsgierig erheen, snel = wegschieten
            const mdx = x - mx, mdy = y - my;
            const md2 = mdx * mdx + mdy * mdy;
            const straal = 170;
            if (md2 < straal * straal) {
                const md = Math.sqrt(md2) || 1;
                const invloed = 1 - md / straal;
                if (muisSnel > 18) {
                    vx += (mdx / md) * invloed * 3.2;
                    vy += (mdy / md) * invloed * 3.2;
                } else if (Number.isNaN(doel[iv])) {
                    vx -= (mdx / md) * invloed * 0.18;
                    vy -= (mdy / md) * invloed * 0.18;
                }
            }

            // klik: een golf die de vuurvliegjes wegduwt
            if (knal && stap === 0) {
                const kx = x - knal.x, ky = y - knal.y;
                const kd = Math.hypot(kx, ky) || 1;
                if (kd < 320) {
                    const duw = (1 - kd / 320) * 14 * knal.kracht;
                    vx += (kx / kd) * duw; vy += (ky / kd) * duw;
                }
            }

            vx *= 0.9; vy *= 0.9;
            vel[iv] = vx; vel[iv + 1] = vy;
            pos[ix] = x + vx; pos[ix + 1] = y + vy;
        }
        knal = null;
        geo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
        requestAnimationFrame(frame);
    }

    // Wacht op het lettertype, anders klopt de vorm van je naam niet
    const klaar = document.fonts && document.fonts.load ? document.fonts.load('800 100px Bricolage') : Promise.resolve();
    klaar.catch(() => {}).finally(() => {
        maakVormen();
        const bovenaan = window.scrollY < H * 0.4;
        if (bovenaan) {
            // eerst even vrij rondvliegen, dan komen ze samen tot je naam
            zetVorm(null); huidigeVorm = 'start';
            setTimeout(() => { if (huidigeVorm === 'start') kijkWelkeSectie(); }, 1600);
        } else {
            kijkWelkeSectie();
        }
        requestAnimationFrame(frame);
    });
}
