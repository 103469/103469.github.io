// laptop.js — één 3D-laptop die meedraait met het scrollen; op het scherm verschijnen de projecten
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const html = document.documentElement;
const canvas = document.querySelector('.buhne');
const rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isKlein = () => window.matchMedia('(max-width: 767px)').matches;
const fijneMuis = window.matchMedia('(pointer: fine)').matches;

// Zonder 3D: de screenshots verschijnen als kleine kaartjes bij de projecten
function zonder3d(reden) {
    html.classList.add('geen-3d');
    console.info('3D staat uit:', reden);
}

function webglWerkt() {
    try {
        const c = document.createElement('canvas');
        return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
    } catch (e) {
        return false;
    }
}

// De schermen op de laptop, in volgorde van de pagina
const SCHERMEN = [
    { soort: 'start' },
    { soort: 'foto', src: 'img/scherm/wk-home.jpg', tekst: ['wk', 'de voorpagina'] },
    { soort: 'foto', src: 'img/scherm/wk-landen.jpg', tekst: ['wk', 'alle 48 landen, met zoeken en filter per groep'] },
    { soort: 'foto', src: 'img/scherm/wk-bracket.jpg', tekst: ['wk', 'de groepsstanden, uitgerekend uit de database'] },
    { soort: 'foto', src: 'img/scherm/quiz-home.jpg', tekst: ['quiz', 'de voorpagina'] },
    { soort: 'foto', src: 'img/scherm/quiz-vraag.jpg', tekst: ['quiz', 'het begin van mijn Fitness Quiz'] },
    { soort: 'code' },
    { soort: 'mail' },
];

// Houdingen per stap. x en y zijn een deel van de zichtbare breedte en hoogte,
// draai is in radialen, scherm en tot: welk scherm aan het begin en eind van de stap,
// licht: gloed van het toetsenbord
const HOUDINGEN = {
    groot: {
        start:   { x:  0.22, y: -0.08, draaiY: -0.55, draaiX: 0.18, schaal: 1.00, scherm: 0, tot: 0, licht: 0.0 },
        over:    { x: -0.22, y: -0.08, draaiY:  0.62, draaiX: 0.12, schaal: 0.95, scherm: 0, tot: 0, licht: 0.0 },
        wk:      { x:  0.19, y: -0.04, draaiY: -0.16, draaiX: 0.06, schaal: 1.15, scherm: 1, tot: 3, licht: 0.2 },
        quiz:    { x: -0.19, y: -0.04, draaiY:  0.18, draaiX: 0.06, schaal: 1.15, scherm: 4, tot: 5, licht: 0.2 },
        skills:  { x:  0.20, y: -0.08, draaiY: -0.62, draaiX: 0.20, schaal: 1.00, scherm: 6, tot: 6, licht: 1.0 },
        contact: { x: -0.20, y: -0.06, draaiY:  0.10, draaiX: 0.08, schaal: 1.05, scherm: 7, tot: 7, licht: 0.6 },
    },
    klein: {
        start:   { x: 0, y: 0.20, draaiY: -0.45, draaiX: 0.22, schaal: 1.00, scherm: 0, tot: 0, licht: 0.0 },
        over:    { x: 0, y: 0.20, draaiY:  0.45, draaiX: 0.18, schaal: 0.95, scherm: 0, tot: 0, licht: 0.0 },
        wk:      { x: 0, y: 0.21, draaiY: -0.10, draaiX: 0.10, schaal: 1.10, scherm: 1, tot: 3, licht: 0.2 },
        quiz:    { x: 0, y: 0.21, draaiY:  0.12, draaiX: 0.10, schaal: 1.10, scherm: 4, tot: 5, licht: 0.2 },
        skills:  { x: 0, y: 0.20, draaiY: -0.55, draaiX: 0.22, schaal: 1.00, scherm: 6, tot: 6, licht: 1.0 },
        contact: { x: 0, y: 0.20, draaiY:  0.08, draaiX: 0.12, schaal: 1.05, scherm: 7, tot: 7, licht: 0.6 },
    },
};
const STAPPEN = ['start', 'over', 'wk', 'quiz', 'skills', 'contact'];
const zonderTot = ({ tot, ...rest }) => rest;

// Elk scherm blijft even staan en loopt dan snel over in het volgende
const vasthouden = (stappen) => (p) => {
    const deel = Math.min(p * stappen, stappen - 1e-6);
    const i = Math.floor(deel);
    const f = Math.min(1, Math.max(0, (deel - i - 0.38) / 0.24));
    return (i + f * f * (3 - 2 * f)) / stappen;
};

if (rustig) zonder3d('minder beweging gevraagd');
else if (!webglWerkt()) zonder3d('geen WebGL2');
else start().catch((fout) => zonder3d(fout.message || fout));

async function start() {
    const klein = isKlein();

    // Renderer: scherp, ACES, schaduwen
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, klein ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = klein ? THREE.PCFSoftShadowMap : THREE.VSMShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.1, 7.2);
    camera.lookAt(0, 0.35, 0);

    // Omgeving: studio-HDRI op groot scherm, een lichtere studio op de telefoon
    const pmrem = new THREE.PMREMGenerator(renderer);
    if (klein) {
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    } else {
        const hdr = await new RGBELoader().loadAsync('models/studio.hdr');
        scene.environment = pmrem.fromEquirectangular(hdr).texture;
        hdr.dispose();
    }
    pmrem.dispose();
    scene.environmentIntensity = 0.9;

    // Hoofdlicht met zachte schaduw, plus een groen randlicht
    const licht = new THREE.DirectionalLight(0xffffff, 1.6);
    licht.castShadow = true;
    licht.shadow.mapSize.set(klein ? 1024 : 2048, klein ? 1024 : 2048);
    licht.shadow.camera.left = -3; licht.shadow.camera.right = 3;
    licht.shadow.camera.top = 3; licht.shadow.camera.bottom = -3;
    licht.shadow.camera.near = 0.5; licht.shadow.camera.far = 20;
    licht.shadow.radius = 10;
    licht.shadow.blurSamples = 20;
    licht.shadow.bias = -0.0004;
    scene.add(licht, licht.target);
    const rand = new THREE.DirectionalLight(0x46d17e, 0.9);
    rand.position.set(-4, 2, -3);
    scene.add(rand);

    // Het model
    const gltf = await new GLTFLoader().loadAsync('models/laptop.glb');
    const model = gltf.scene;

    // Midden op de grond zetten en op een vaste breedte schalen
    const doos = new THREE.Box3().setFromObject(model);
    const maat = doos.getSize(new THREE.Vector3());
    const midden = doos.getCenter(new THREE.Vector3());
    const factor = 2.2 / Math.max(maat.x, maat.z);
    model.scale.setScalar(factor);
    model.position.set(-midden.x * factor, -doos.min.y * factor, -midden.z * factor);

    const laptop = new THREE.Group();
    laptop.add(model);
    scene.add(laptop);

    // Schaduw op een onzichtbare vloer onder de laptop
    const vloer = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.45 }));
    vloer.rotation.x = -Math.PI / 2;
    vloer.receiveShadow = true;
    laptop.add(vloer);

    // Licht van het scherm dat op het toetsenbord valt, in de kleur van wat er op het scherm staat
    const schermLicht = new THREE.PointLight(0xffffff, 0, 2.6, 2);
    schermLicht.position.set(0, 0.55, -0.1);
    laptop.add(schermLicht);

    let schermMesh = null;
    const behuizing = [];
    model.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true;
        o.receiveShadow = true;
        const materialen = Array.isArray(o.material) ? o.material : [o.material];
        materialen.forEach((m) => { if (m.envMapIntensity !== undefined) m.envMapIntensity = 1; });
        if (!schermMesh && /screen|display|lcd|monitor|scherm/i.test(o.name)) schermMesh = o;
        // De behuizing is in het model mat; als geborsteld aluminium oogt hij echter
        if (/frame/i.test(o.name)) {
            materialen.forEach((m) => { m.metalness = 0.75; m.roughness = 0.38; m.emissive = new THREE.Color(0x46d17e); });
            behuizing.push(...materialen);
        }
    });

    // Het scherm
    await document.fonts.ready;
    const scherm = await maakScherm(schermMesh, renderer);

    // Houding toepassen
    const staat = zonderTot(HOUDINGEN[klein ? 'klein' : 'groot'].start);
    // zicht: zichtbare breedte en hoogte; pas: kleiner maken als het scherm smal is (telefoon)
    const zicht = { b: 1, h: 1, pas: 1 };
    function meetZicht() {
        const afstand = camera.position.distanceTo(new THREE.Vector3(0, 0.35, 0));
        zicht.h = 2 * afstand * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        zicht.b = zicht.h * camera.aspect;
        zicht.pas = Math.min(1, (0.66 * zicht.b) / 2.2);
    }
    meetZicht();

    // Muis: de laptop kijkt een klein beetje mee
    const muis = { x: 0, y: 0, doelX: 0, doelY: 0 };
    if (fijneMuis) {
        window.addEventListener('pointermove', (e) => {
            muis.doelX = (e.clientX / window.innerWidth) * 2 - 1;
            muis.doelY = (e.clientY / window.innerHeight) * 2 - 1;
        });
    }

    // Toetsenbord licht even op als je over een knop of link gaat
    let extraLicht = 0;
    document.querySelectorAll('a, button').forEach((el) => {
        el.addEventListener('pointerenter', () => { extraLicht = 0.8; });
    });

    // Tekst "Op het scherm" bij de projecten
    const schermTeksten = {};
    document.querySelectorAll('[data-scherm-tekst]').forEach((el) => { schermTeksten[el.dataset.schermTekst] = el; });
    let vorigeTekst = -1;

    const klok = new THREE.Clock();
    let vorigScherm = -1;
    renderer.setAnimationLoop(() => {
        const t = klok.getElapsedTime();
        muis.x += (muis.doelX - muis.x) * 0.05;
        muis.y += (muis.doelY - muis.y) * 0.05;
        extraLicht *= 0.94;

        laptop.position.set(staat.x * zicht.b, staat.y * zicht.h + Math.sin(t * 0.8) * 0.03, 0);
        laptop.rotation.set(staat.draaiX + muis.y * 0.05, staat.draaiY + Math.sin(t * 0.5) * 0.025 + muis.x * 0.12, 0);
        laptop.scale.setScalar(staat.schaal * zicht.pas);
        licht.position.set(laptop.position.x + 2.5, 6, 4);
        licht.target.position.copy(laptop.position);

        const gloed = Math.min(1.4, staat.licht + extraLicht) * (0.85 + Math.sin(t * 2) * 0.15);
        behuizing.forEach((m) => { m.emissiveIntensity = gloed; });

        if (scherm) {
            if (Math.abs(staat.scherm - vorigScherm) > 0.002 || scherm.leeft(staat.scherm)) {
                scherm.toon(staat.scherm);
                vorigScherm = staat.scherm;
            }
            schermLicht.color.copy(scherm.kleur(staat.scherm));
            schermLicht.intensity = staat.scherm < 0.5 ? staat.scherm * 2.4 : 1.2;

            const nr = Math.round(staat.scherm);
            if (nr !== vorigeTekst) {
                const [voor, tekst] = SCHERMEN[nr].tekst || [];
                if (voor && schermTeksten[voor]) schermTeksten[voor].textContent = tekst;
                vorigeTekst = nr;
            }
        }
        renderer.render(scene, camera);
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        meetZicht();
    });

    // Scrollen stuurt de houding: van de vorige stap naar de volgende,
    // en binnen een project van het ene scherm naar het volgende
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add({ groot: '(min-width: 768px)', klein: '(max-width: 767px)' }, (ctx) => {
        const set = HOUDINGEN[ctx.conditions.klein ? 'klein' : 'groot'];
        Object.assign(staat, zonderTot(set.start));
        STAPPEN.slice(1).forEach((stap, i) => {
            const sectie = document.querySelector(`[data-stap="${stap}"]`);
            const vorige = set[STAPPEN[i]];
            gsap.fromTo(staat, { ...zonderTot(vorige), scherm: vorige.tot }, {
                ...zonderTot(set[stap]),
                ease: 'power2.inOut',
                immediateRender: false,
                scrollTrigger: { trigger: sectie, start: 'top bottom', end: 'top 25%', scrub: 1.2 },
            });
            if (set[stap].tot > set[stap].scherm) {
                gsap.fromTo(staat, { scherm: set[stap].scherm }, {
                    scherm: set[stap].tot,
                    ease: vasthouden(set[stap].tot - set[stap].scherm),
                    immediateRender: false,
                    scrollTrigger: { trigger: sectie, start: 'top 20%', end: 'bottom 95%', scrub: 0.8 },
                });
            }
        });
    });
    ScrollTrigger.refresh();

    requestAnimationFrame(() => canvas.classList.add('klaar'));
}

// Legt een vlak op de voorkant van het deksel en tekent daarop de schermen.
// Maten in de eigen ruimte van het scherm-onderdeel: 0,304 breed, 0,2 hoog, de voorkant ligt aan de -z kant.
const PANEEL = { breed: 0.298, hoog: 0.188, midY: 0.0985, z: -0.0058 };

async function maakScherm(mesh, renderer) {
    if (!mesh) {
        console.info('Geen schermonderdeel gevonden in het model');
        return null;
    }
    const laad = (src) => new Promise((ok, fout) => {
        const img = new Image();
        img.onload = () => ok(img);
        img.onerror = () => fout(new Error('Kan ' + src + ' niet laden'));
        img.src = src;
    });

    const B = 1600, H = 1000;
    const nieuwDoek = () => { const c = document.createElement('canvas'); c.width = B; c.height = H; return c; };

    // Elk scherm één keer klaarzetten
    const lagen = await Promise.all(SCHERMEN.map(async (s) => {
        const c = nieuwDoek();
        const x = c.getContext('2d');
        if (s.soort === 'foto') x.drawImage(await laad(s.src), 0, 0, B, H);
        if (s.soort === 'start') tekenStart(x);
        if (s.soort === 'code') tekenCode(x);
        if (s.soort === 'mail') tekenMail(x, false);
        return c;
    }));

    // Gemiddelde kleur per scherm, voor het licht op het toetsenbord
    const kleuren = lagen.map((c) => {
        const k = document.createElement('canvas'); k.width = k.height = 1;
        const kx = k.getContext('2d');
        kx.drawImage(c, 0, 0, 1, 1);
        const [r, g, b] = kx.getImageData(0, 0, 1, 1).data;
        return new THREE.Color(r / 255, g / 255, b / 255).lerp(new THREE.Color(1, 1, 1), 0.25);
    });

    const doek = nieuwDoek();
    const ctx = doek.getContext('2d');
    const texture = new THREE.CanvasTexture(doek);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;

    const paneel = new THREE.Mesh(
        new THREE.PlaneGeometry(PANEEL.breed, PANEEL.hoog),
        new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    );
    paneel.position.set(0, PANEEL.midY, PANEEL.z);
    paneel.rotation.y = Math.PI;
    mesh.add(paneel);

    // Deksel: aluminium achterkant, glanzende rand
    mesh.material.metalness = 0.6;
    mesh.material.roughness = 0.4;

    const MAIL = SCHERMEN.findIndex((s) => s.soort === 'mail');
    let cursorAan = null;
    const mengKleur = new THREE.Color();

    return {
        // Het mailscherm heeft een knipperende cursor
        leeft(waarde) {
            if (Math.round(waarde) !== MAIL) return false;
            const aan = Math.floor(performance.now() / 530) % 2 === 0;
            if (aan === cursorAan) return false;
            cursorAan = aan;
            tekenMail(lagen[MAIL].getContext('2d'), aan);
            return true;
        },
        toon(waarde) {
            const i = Math.max(0, Math.min(lagen.length - 1, Math.floor(waarde)));
            const f = waarde - i;
            ctx.globalAlpha = 1;
            ctx.drawImage(lagen[i], 0, 0);
            if (f > 0.001 && lagen[i + 1]) {
                ctx.globalAlpha = f;
                ctx.drawImage(lagen[i + 1], 0, 0);
                ctx.globalAlpha = 1;
            }
            texture.needsUpdate = true;
        },
        kleur(waarde) {
            const i = Math.max(0, Math.min(kleuren.length - 1, Math.floor(waarde)));
            const j = Math.min(kleuren.length - 1, i + 1);
            return mengKleur.copy(kleuren[i]).lerp(kleuren[j], waarde - i);
        },
    };
}

// Opstartscherm: naam en wat ik doe, rustig op donkergroen
function tekenStart(x) {
    x.fillStyle = '#06100b';
    x.fillRect(0, 0, 1600, 1000);
    x.fillStyle = '#46D17E';
    x.fillRect(740, 330, 120, 120);
    x.fillStyle = '#06100b';
    x.font = '800 96px Bricolage, Arial, sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('Q', 800, 396);
    x.fillStyle = '#ECF2EE';
    x.font = '800 64px Bricolage, Arial, sans-serif';
    x.fillText('Quinten Löb', 800, 560);
    x.fillStyle = '#A6B8AE';
    x.font = '400 34px Bricolage, Arial, sans-serif';
    x.fillText('Software Development · Rotterdam', 800, 630);
}

// Code-editor met het echte stuk puntentelling uit bracket.php van mijn WK-site
function tekenCode(x) {
    const mono = 'Consolas, "Cascadia Mono", ui-monospace, monospace';
    x.fillStyle = '#0a1510';
    x.fillRect(0, 0, 1600, 1000);
    // titelbalk
    x.fillStyle = '#10251B';
    x.fillRect(0, 0, 1600, 64);
    [['#ff5f57', 36], ['#febc2e', 66], ['#28c840', 96]].forEach(([k, px]) => { x.fillStyle = k; x.beginPath(); x.arc(px, 32, 9, 0, 7); x.fill(); });
    x.fillStyle = '#A6B8AE';
    x.font = '400 24px Bricolage, Arial, sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('wk2026 — bracket.php', 800, 33);
    // bestanden links
    x.fillStyle = '#0d1d15';
    x.fillRect(0, 64, 330, 936);
    x.textAlign = 'left';
    x.font = '600 22px Bricolage, Arial, sans-serif';
    x.fillStyle = '#A6B8AE';
    x.fillText('WK2026', 32, 112);
    const bestanden = ['bracket.php', 'config.php', 'land.php', 'landen.php', 'views/', 'wk2026.db', 'package.json'];
    x.font = '400 24px Bricolage, Arial, sans-serif';
    bestanden.forEach((b, i) => {
        const y = 164 + i * 50;
        if (i === 0) { x.fillStyle = '#173223'; x.fillRect(0, y - 24, 330, 48); }
        x.fillStyle = b.endsWith('.db') ? '#46D17E' : i === 0 ? '#ECF2EE' : '#A6B8AE';
        x.fillText(b, 48, y);
    });
    // code
    const regels = [
        [['c', '// Punten uitdelen']],
        [['k', 'foreach '], ['p', '('], ['v', '$duels'], ['k', ' as '], ['v', '$duel'], ['p', ') {']],
        [['c', '    // Nog niet gespeeld? Dan geen punten']],
        [['k', '    if '], ['p', '('], ['v', '$duel'], ['p', '['], ['s', "'doelpunten1'"], ['p', '] === '], ['k', 'null'], ['p', ') {']],
        [['k', '        continue'], ['p', ';']],
        [['p', '    }']],
        [['k', '    if '], ['p', '('], ['v', '$duel'], ['p', '['], ['s', "'doelpunten1'"], ['p', '] > '], ['v', '$duel'], ['p', '['], ['s', "'doelpunten2'"], ['p', ']) {']],
        [['v', '        $punten'], ['p', '['], ['v', '$team1'], ['p', '] = '], ['v', '$punten'], ['p', '['], ['v', '$team1'], ['p', '] + '], ['n', '3'], ['p', ';']],
        [['p', '    } '], ['k', 'elseif '], ['p', '('], ['v', '$duel'], ['p', '['], ['s', "'doelpunten2'"], ['p', '] > '], ['v', '$duel'], ['p', '['], ['s', "'doelpunten1'"], ['p', ']) {']],
        [['v', '        $punten'], ['p', '['], ['v', '$team2'], ['p', '] = '], ['v', '$punten'], ['p', '['], ['v', '$team2'], ['p', '] + '], ['n', '3'], ['p', ';']],
        [['p', '    } '], ['k', 'else '], ['p', '{']],
        [['v', '        $punten'], ['p', '['], ['v', '$team1'], ['p', '] = '], ['v', '$punten'], ['p', '['], ['v', '$team1'], ['p', '] + '], ['n', '1'], ['p', ';']],
        [['v', '        $punten'], ['p', '['], ['v', '$team2'], ['p', '] = '], ['v', '$punten'], ['p', '['], ['v', '$team2'], ['p', '] + '], ['n', '1'], ['p', ';']],
        [['p', '    }']],
        [['p', '}']],
        [],
        [['c', '// Sorteren op punten (hoog naar laag)']],
        [['f', 'arsort'], ['p', '('], ['v', '$punten'], ['p', ');']],
    ];
    const kleur = { c: '#6b8f7a', k: '#46D17E', v: '#9fd8ff', s: '#e8e3a3', n: '#f2a8ff', f: '#ECF2EE', p: '#c9d6cf' };
    x.font = `400 25px ${mono}`;
    regels.forEach((regel, i) => {
        const y = 118 + i * 46;
        x.fillStyle = '#3f5a4b';
        x.textAlign = 'right';
        x.fillText(String(44 + i), 410, y);
        x.textAlign = 'left';
        let px = 440;
        regel.forEach(([soort, tekst]) => {
            x.fillStyle = kleur[soort];
            x.fillText(tekst, px, y);
            px += x.measureText(tekst).width;
        });
    });
}

// Een nieuw mailtje aan mij, met een knipperende cursor
function tekenMail(x, cursor) {
    x.fillStyle = '#0a1510';
    x.fillRect(0, 0, 1600, 1000);
    x.fillStyle = '#ECF2EE';
    x.fillRect(200, 110, 1200, 780);
    x.fillStyle = '#10251B';
    x.fillRect(200, 110, 1200, 80);
    x.fillStyle = '#ECF2EE';
    x.font = '600 32px Bricolage, Arial, sans-serif';
    x.textAlign = 'left';
    x.textBaseline = 'middle';
    x.fillText('Nieuw bericht', 240, 150);
    const veld = (label, waarde, y) => {
        x.fillStyle = '#5d7368';
        x.font = '400 30px Bricolage, Arial, sans-serif';
        x.fillText(label, 240, y);
        x.fillStyle = '#0B1A13';
        x.font = '600 30px Bricolage, Arial, sans-serif';
        x.fillText(waarde, 420, y);
        x.fillStyle = '#d5ded9';
        x.fillRect(240, y + 34, 1120, 3);
    };
    veld('Aan', 'quintenlob6@gmail.com', 250);
    veld('Onderwerp', 'Stageplek', 330);
    x.fillStyle = '#0B1A13';
    x.font = '400 32px Bricolage, Arial, sans-serif';
    x.fillText('Hoi Quinten,', 240, 430);
    if (cursor) { x.fillStyle = '#46D17E'; x.fillRect(240, 470, 4, 40); }
    x.fillStyle = '#46D17E';
    x.fillRect(1120, 790, 240, 70);
    x.fillStyle = '#08130D';
    x.font = '600 30px Bricolage, Arial, sans-serif';
    x.textAlign = 'center';
    x.fillText('Versturen', 1240, 826);
}
