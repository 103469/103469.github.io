// laptop.js — één 3D-laptop in een fotostudio die meebeweegt met het scrollen; op het scherm verschijnen de projecten
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const html = document.documentElement;
const canvas = document.querySelector('.buhne');
const rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isKlein = () => window.matchMedia('(max-width: 767px)').matches;
const fijneMuis = window.matchMedia('(pointer: fine)').matches;

// Laadscherm: toont hoeveel van de laptop, de belichting en de schermen binnen is
const vulling = document.querySelector('.lader-vulling');
const getal = document.querySelector('.lader-getal');
function voortgang(deel) {
    const p = Math.max(0, Math.min(1, deel));
    if (vulling) vulling.style.transform = `scaleX(${p})`;
    if (getal) getal.textContent = Math.round(p * 100);
}
THREE.DefaultLoadingManager.onProgress = (_url, geladen, totaal) => voortgang((geladen / totaal) * 0.95);
function laderWeg() {
    voortgang(1);
    setTimeout(() => html.classList.remove('laden'), 250);
}

// Zonder 3D: de screenshots verschijnen als kleine kaartjes bij de projecten
function zonder3d(reden) {
    html.classList.add('geen-3d');
    laderWeg();
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

// Shots per stap, zoals een camera in een studio.
// kant: waar de laptop in beeld staat (-1 links, 1 rechts, 0 midden), afstand en hoogte van de camera,
// kijk: hoogte waar de camera naar kijkt, hoek: camera iets om de laptop heen,
// draai: draai van de laptop, scherm en tot: welk scherm aan begin en eind, licht: gloed van het toetsenbord
const SHOTS = {
    groot: {
        start:   { kant:  1, hoog: 0, afstand: 7.0, hoogte: 1.5, kijk: 0.55, hoek:  0.00, draai: -0.48, scherm: 0, tot: 0, licht: 0.10 },
        over:    { kant: -1, hoog: 0, afstand: 7.6, hoogte: 1.9, kijk: 0.50, hoek:  0.10, draai:  0.55, scherm: 0, tot: 0, licht: 0.10 },
        wk:      { kant:  1, hoog: 0, afstand: 6.5, hoogte: 1.15, kijk: 0.78, hoek: -0.04, draai: -0.12, scherm: 1, tot: 3, licht: 0.25 },
        quiz:    { kant: -1, hoog: 0, afstand: 6.5, hoogte: 1.15, kijk: 0.78, hoek:  0.04, draai:  0.12, scherm: 4, tot: 5, licht: 0.25 },
        skills:  { kant:  0, hoog: 0.2, afstand: 9.6, hoogte: 4.6, kijk: 0.45, hoek:  0.00, draai: -0.35, scherm: 6, tot: 6, licht: 2.40 },
        contact: { kant: -1, hoog: 0, afstand: 6.4, hoogte: 1.3, kijk: 0.65, hoek:  0.06, draai:  0.08, scherm: 7, tot: 7, licht: 0.50 },
    },
    klein: {
        start:   { kant: 0, hoog: 0.24, afstand: 7.0, hoogte: 1.6, kijk: 0.55, hoek:  0.00, draai: -0.30, scherm: 0, tot: 0, licht: 0.10 },
        over:    { kant: 0, hoog: 0.24, afstand: 7.0, hoogte: 1.9, kijk: 0.55, hoek:  0.06, draai:  0.30, scherm: 0, tot: 0, licht: 0.10 },
        wk:      { kant: 0, hoog: 0.24, afstand: 6.0, hoogte: 1.2, kijk: 0.70, hoek:  0.00, draai: -0.06, scherm: 1, tot: 3, licht: 0.25 },
        quiz:    { kant: 0, hoog: 0.24, afstand: 6.0, hoogte: 1.2, kijk: 0.70, hoek:  0.00, draai:  0.06, scherm: 4, tot: 5, licht: 0.25 },
        skills:  { kant: 0, hoog: 0.24, afstand: 6.6, hoogte: 3.0, kijk: 0.35, hoek: -0.06, draai: -0.30, scherm: 6, tot: 6, licht: 1.60 },
        contact: { kant: 0, hoog: 0.24, afstand: 6.6, hoogte: 1.4, kijk: 0.60, hoek:  0.00, draai:  0.05, scherm: 7, tot: 7, licht: 0.50 },
    },
};
const STAPPEN = ['start', 'over', 'wk', 'quiz', 'skills', 'contact'];
const zonderTot = ({ tot, ...rest }) => rest;

// Elk scherm blijft even staan en loopt dan snel over in het volgende
const vasthouden = (stappen) => (p) => {
    const deel = Math.min(p * stappen, stappen - 1e-6);
    const i = Math.floor(deel);
    const f = Math.min(1, Math.max(0, (deel - i - 0.3) / 0.4));
    return (i + f * f * (3 - 2 * f)) / stappen;
};

// Vloer-reflectie die naar de randen toe wegvalt
const VLOER = {
    uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uSterkte: { value: 0.1 } },
    vertexShader: /* glsl */`
        uniform mat4 textureMatrix;
        varying vec4 vSpiegel; varying vec2 vUv;
        void main() {
            vUv = uv;
            vSpiegel = textureMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse; uniform float uSterkte;
        varying vec4 vSpiegel; varying vec2 vUv;
        void main() {
            vec4 spiegel = texture2DProj(tDiffuse, vSpiegel);
            float weg = 1.0 - smoothstep(0.04, 0.3, distance(vUv, vec2(0.5)));
            gl_FragColor = vec4(spiegel.rgb, weg * uSterkte);
        }`,
};

if (rustig) zonder3d('minder beweging gevraagd');
else if (!webglWerkt()) zonder3d('geen WebGL2');
else start().catch((fout) => zonder3d(fout.message || fout));

async function start() {
    const klein = isKlein();
    let kwaliteit = klein ? 1.25 : 1.6;

    // Renderer: doorzichtig, zodat de egale achtergrond van de pagina erachter staat
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, kwaliteit));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    RectAreaLightUniformsLib.init();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 100);

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
    scene.environmentIntensity = 0.85;

    // Studiolicht: key light met zachte schaduw, een fill en twee koele strijklichten langs de randen
    const key = new THREE.DirectionalLight(0xfff6ec, 2.4);
    key.castShadow = true;
    key.shadow.mapSize.set(klein ? 1024 : 2048, klein ? 1024 : 2048);
    Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 20 });
    key.shadow.radius = 14;
    key.shadow.blurSamples = 16;
    key.shadow.bias = -0.0005;
    key.position.set(3, 6, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfeee6, 0.5);
    fill.position.set(-5, 2, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xeef3ff, 1.6);
    rim.position.set(-3, 2.5, -5);
    scene.add(rim);
    const rim2 = new THREE.DirectionalLight(0xeef3ff, 0.8);
    rim2.position.set(4, 1.5, -4);
    scene.add(rim2);

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

    // Zachte contactschaduw (vlak onder de laptop) plus de schaduw van het key light
    const contact = new THREE.Mesh(
        new THREE.PlaneGeometry(3.0, 2.2),
        new THREE.MeshBasicMaterial({ map: contactSchaduw(), transparent: true, depthWrite: false, opacity: 0.85, toneMapped: false }),
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.003;
    laptop.add(contact);
    const vloer = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.35 }));
    vloer.rotation.x = -Math.PI / 2;
    vloer.position.y = 0.002;
    vloer.receiveShadow = true;
    laptop.add(vloer);

    // Subtiele spiegeling in de vloer
    const spiegel = klein ? null : new Reflector(new THREE.PlaneGeometry(7, 7), {
        shader: VLOER, textureWidth: klein ? 256 : 512, textureHeight: klein ? 256 : 512, multisample: 0, clipBias: 0.003,
    });
    if (spiegel) {
        spiegel.material.transparent = true;
        spiegel.material.depthWrite = false;
        spiegel.rotation.x = -Math.PI / 2;
        laptop.add(spiegel);
    }

    let schermMesh = null;
    const behuizing = [];
    model.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true;
        o.receiveShadow = true;
        if (!schermMesh && /screen|display|lcd|monitor|scherm/i.test(o.name)) schermMesh = o;
        // Geborsteld aluminium; de toetsen krijgen een zachte groene achtergrondverlichting
        if (/frame/i.test(o.name)) {
            const m = o.material;
            m.color.setRGB(1.3, 1.32, 1.36);
            m.metalness = 0.9;
            m.roughness = 1;
            m.roughnessMap = geborsteld();
            m.envMapIntensity = 1.3;
            if (m.emissiveMap) m.emissiveMap = toetsenMasker(m.emissiveMap, m.map);
            m.emissive = new THREE.Color(0xc4dfa0);
            m.emissiveIntensity = 0;
            behuizing.push(m);
        }
    });

    // Het scherm
    await Promise.all(['500 64px Newsreader', '400 34px Schibsted', '500 30px Schibsted'].map((f) => document.fonts.load(f)));
    const scherm = await maakScherm(schermMesh, renderer);

    function maatZetten() {
        const b = window.innerWidth, h = window.innerHeight;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, kwaliteit));
        renderer.setSize(b, h, false);
        camera.aspect = b / h;
        camera.updateProjectionMatrix();
    }
    maatZetten();
    window.addEventListener('resize', maatZetten);

    // Huidige shot; het deksel gaat bij het laden open
    const staat = zonderTot(SHOTS[klein ? 'klein' : 'groot'].start);
    const deksel = { open: 0 };
    const DICHT = -1.62;

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
        el.addEventListener('pointerenter', () => { extraLicht = 0.7; });
    });

    // Tekst "Op het scherm" bij de projecten
    const schermTeksten = {};
    document.querySelectorAll('[data-scherm-tekst]').forEach((el) => { schermTeksten[el.dataset.schermTekst] = el; });
    let vorigeTekst = -1;

    const kijkPunt = new THREE.Vector3();
    const klok = new THREE.Clock();
    let vorigScherm = -1;
    let frames = 0, gemeten = 0;

    renderer.setAnimationLoop(() => {
        const dt = Math.min(klok.getDelta(), 0.1);
        const t = klok.elapsedTime;
        muis.x += (muis.doelX - muis.x) * 0.05;
        muis.y += (muis.doelY - muis.y) * 0.05;
        extraLicht *= 0.94;

        // Camera: dolly, hoogte en een klein beetje om de laptop heen
        const b = window.innerWidth, h = window.innerHeight;
        let afstand = staat.afstand;
        if (camera.aspect < 1) {
            // Telefoon: zo ver terug dat de hele laptop met wat ruimte in beeld past
            const breedtePerAfstand = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
            afstand = Math.max(afstand, 2.65 / breedtePerAfstand);
        }
        const hoek = staat.hoek + muis.x * 0.05;
        camera.position.set(Math.sin(hoek) * afstand, staat.hoogte * (afstand / staat.afstand) - muis.y * 0.08, Math.cos(hoek) * afstand);
        kijkPunt.set(0, staat.kijk, 0);
        camera.lookAt(kijkPunt);
        // Laptop naar links of rechts in beeld; op de telefoon bovenin
        const opzij = -staat.kant * 0.23 * b;
        const omhoog = staat.hoog * h;
        camera.setViewOffset(b, h, opzij, omhoog, b, h);

        laptop.position.y = Math.sin(t * 0.8) * 0.025;
        laptop.rotation.y = staat.draai + Math.sin(t * 0.5) * 0.02;

        // Deksel open of dicht, het scherm licht op als het opengaat
        schermMesh.rotation.x = DICHT * (1 - deksel.open);
        const aan = Math.max(0, (deksel.open - 0.55) / 0.45);

        const gloed = Math.min(2.6, staat.licht + extraLicht) * (0.88 + Math.sin(t * 2) * 0.12) * aan;
        behuizing.forEach((m) => { m.emissiveIntensity = gloed; });

        if (scherm) {
            if (Math.abs(staat.scherm - vorigScherm) > 0.002 || scherm.leeft(staat.scherm)) {
                scherm.toon(staat.scherm);
                vorigScherm = staat.scherm;
            }
            scherm.helderheid(aan);
            const nr = Math.round(staat.scherm);
            if (nr !== vorigeTekst) {
                const [voor, tekst] = SCHERMEN[nr].tekst || [];
                const el = voor && schermTeksten[voor];
                // Tekst even laten wegvagen, dan de nieuwe laten opkomen
                if (el && el.textContent !== tekst) {
                    el.classList.add('wissel');
                    clearTimeout(el.wacht);
                    el.wacht = setTimeout(() => { el.textContent = tekst; el.classList.remove('wissel'); }, 200);
                }
                vorigeTekst = nr;
            }
        }

        renderer.render(scene, camera);

        // Loopt het niet soepel? Dan een stap lager in kwaliteit
        frames++;
        gemeten += dt;
        if (frames === 90) {
            if (gemeten / frames > 1 / 40 && kwaliteit > 1) {
                kwaliteit = 1;
                if (spiegel) spiegel.visible = false;
                maatZetten();
            }
        }
    });

    // Scrollen stuurt het shot: van de vorige stap naar de volgende,
    // en binnen een project van het ene scherm naar het volgende
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add({ groot: '(min-width: 768px)', klein: '(max-width: 767px)' }, (ctx) => {
        const set = SHOTS[ctx.conditions.klein ? 'klein' : 'groot'];
        Object.assign(staat, zonderTot(set.start));
        STAPPEN.slice(1).forEach((stap, i) => {
            const sectie = document.querySelector(`[data-stap="${stap}"]`);
            const vorige = set[STAPPEN[i]];
            gsap.fromTo(staat, { ...zonderTot(vorige), scherm: vorige.tot }, {
                ...zonderTot(set[stap]),
                ease: 'power3.inOut',
                immediateRender: false,
                scrollTrigger: { trigger: sectie, start: 'top bottom', end: 'top 20%', scrub: 1.6 },
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

    // Binnenkomst: het beeld komt op en de laptop klapt open
    // Eerst één beeld tekenen, dan het laadscherm weg, zodat je nooit een halve scène ziet
    renderer.render(scene, camera);
    await new Promise((klaar) => requestAnimationFrame(() => requestAnimationFrame(klaar)));
    laderWeg();
    canvas.classList.add('klaar');
    html.classList.add('laptop-klaar');
    gsap.to(deksel, { open: 1, duration: 2.2, delay: 0.7, ease: 'power3.inOut' });
}

// Fijne streepjes zoals bij geborsteld aluminium (ruwheid wisselt per lijn)
function geborsteld() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const x = c.getContext('2d');
    x.fillStyle = 'rgb(84,84,84)';
    x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1400; i++) {
        const g = 74 + Math.random() * 20;
        x.fillStyle = `rgba(${g},${g},${g},0.35)`;
        x.fillRect(Math.random() * 512 - 100, Math.random() * 512, 80 + Math.random() * 300, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 3);
    t.flipY = false;
    return t;
}

// De gloed van het model zit ook op randen van de behuizing; houd alleen de letters op de toetsen
// en de openingen rond de toetsen over (gebieden in de textuur van het model)
function toetsenMasker(gloed, kleur) {
    const S = 1024;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d');
    x.drawImage(gloed.image, 0, 0, S, S);
    x.fillStyle = '#000';
    x.fillRect(0, 0, S, Math.round(S * 0.73));
    // openingen rond de toetsen: donkere vlakken in het toetsenbordgebied
    const k = document.createElement('canvas');
    k.width = k.height = S;
    const kx = k.getContext('2d');
    kx.drawImage(kleur.image, 0, 0, S, S);
    const [x0, y0, x1, y1] = [0.2, 0.06, 0.42, 0.655].map((v) => Math.round(v * S));
    const bron = kx.getImageData(x0, y0, x1 - x0, y1 - y0);
    const doel = x.getImageData(x0, y0, x1 - x0, y1 - y0);
    for (let i = 0; i < bron.data.length; i += 4) {
        const v = bron.data[i] < 40 ? 255 : 0;
        doel.data[i] = doel.data[i + 1] = doel.data[i + 2] = v;
    }
    x.putImageData(doel, x0, y0);
    const t = new THREE.CanvasTexture(c);
    t.flipY = false;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

// Zachte donkere vlek onder de laptop, waar hij de vloer raakt
function contactSchaduw() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 192;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 96, 10, 128, 96, 120);
    g.addColorStop(0, 'rgba(0,0,0,0.75)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.scale(1, 0.8);
    x.fillRect(0, 0, 256, 240);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

// Legt een lichtgevend, glanzend vlak op de voorkant van het deksel en tekent daarop de schermen.
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

    const B = 2048, H = 1280;
    const nieuwDoek = () => { const c = document.createElement('canvas'); c.width = B; c.height = H; return c; };

    // Elk scherm één keer klaarzetten
    // Foto's worden direct gebruikt (geen tussenstap via een canvas), zodat ze scherp blijven
    const lagen = await Promise.all(SCHERMEN.map(async (s) => {
        if (s.soort === 'foto') return laad(s.src);
        const c = nieuwDoek();
        const x = c.getContext('2d');
        x.scale(B / 1600, H / 1000);
        if (s.soort === 'start') tekenStart(x);
        if (s.soort === 'code') tekenCode(x);
        if (s.soort === 'mail') tekenMail(x, false);
        return c;
    }));

    // Gemiddelde kleur per scherm, voor het licht dat het scherm geeft
    const kleuren = lagen.map((c) => {
        const k = document.createElement('canvas'); k.width = k.height = 1;
        const kx = k.getContext('2d');
        kx.drawImage(c, 0, 0, 1, 1);
        const [r, g, b] = kx.getImageData(0, 0, 1, 1).data;
        return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace).lerp(new THREE.Color(1, 1, 1), 0.3);
    });

    // Elk scherm krijgt een eigen textuur die één keer naar de videokaart gaat;
    // bij het wisselen mengt de shader twee texturen, dus er hoeft niets opnieuw getekend te worden
    const texturen = lagen.map((laag) => {
        const t = laag instanceof HTMLCanvasElement ? new THREE.CanvasTexture(laag) : new THREE.Texture(laag);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.needsUpdate = true;
        renderer.initTexture(t);
        return t;
    });

    // Het beeld zelf in echte kleuren, met daarvoor een dunne glasplaat die de studio weerspiegelt.
    // Het nieuwe scherm zoomt heel licht in terwijl het oude wegvloeit.
    const beeld = new THREE.ShaderMaterial({
        uniforms: { uA: { value: texturen[0] }, uB: { value: texturen[0] }, uMix: { value: 0 }, uHelder: { value: 0 } },
        vertexShader: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
        fragmentShader: /* glsl */`
            uniform sampler2D uA, uB; uniform float uMix, uHelder;
            varying vec2 vUv;
            void main() {
                vec2 uvB = (vUv - 0.5) * (1.0 - 0.025 * (1.0 - uMix)) + 0.5;
                // negatieve bias: een iets scherpere mipmap, zodat kleine tekst leesbaar blijft
                vec3 a = texture2D(uA, vUv, -0.6).rgb;
                vec3 b = texture2D(uB, uvB, -0.6).rgb;
                gl_FragColor = vec4(mix(a, b, uMix) * uHelder, 1.0);
                #include <colorspace_fragment>
            }`,
        toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2,
    });
    const paneel = new THREE.Mesh(new THREE.PlaneGeometry(PANEEL.breed, PANEEL.hoog), beeld);
    paneel.position.set(0, PANEEL.midY, PANEEL.z);
    paneel.rotation.y = Math.PI;
    mesh.add(paneel);
    const glas = new THREE.Mesh(paneel.geometry, new THREE.MeshPhysicalMaterial({
        color: 0x000000, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03,
        transparent: true, opacity: 0.14, envMapIntensity: 1.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4,
    }));
    glas.position.copy(paneel.position);
    glas.rotation.y = Math.PI;
    mesh.add(glas);

    // Het scherm geeft licht op het toetsenbord en de vloer
    const schermLicht = new THREE.RectAreaLight(0xffffff, 0, 2.1, 1.3);
    schermLicht.position.set(0, PANEEL.midY, PANEEL.z - 0.002);
    schermLicht.rotation.y = Math.PI;
    mesh.add(schermLicht);

    // Deksel: aluminium achterkant, zwarte glanzende rand
    mesh.material.metalness = 0.85;
    mesh.material.roughness = 0.32;
    mesh.material.envMapIntensity = 1.2;

    const MAIL = SCHERMEN.findIndex((s) => s.soort === 'mail');
    let cursorAan = null;
    let waardeNu = 0;

    return {
        // Het mailscherm heeft een knipperende cursor
        leeft(waarde) {
            if (Math.round(waarde) !== MAIL) return false;
            const aan = Math.floor(performance.now() / 530) % 2 === 0;
            if (aan === cursorAan) return false;
            cursorAan = aan;
            tekenMail(lagen[MAIL].getContext('2d'), aan);
            texturen[MAIL].needsUpdate = true;
            return true;
        },
        toon(waarde) {
            waardeNu = waarde;
            const i = Math.max(0, Math.min(lagen.length - 1, Math.floor(waarde)));
            const j = Math.min(lagen.length - 1, i + 1);
            const f = waarde - i;
            beeld.uniforms.uA.value = texturen[i];
            beeld.uniforms.uB.value = texturen[j];
            beeld.uniforms.uMix.value = f;
            schermLicht.color.copy(kleuren[i]).lerp(kleuren[j], f);
        },
        helderheid(aan) {
            beeld.uniforms.uHelder.value = 0.92 * aan;
            schermLicht.intensity = (waardeNu < 0.5 ? 2.5 : 5) * aan;
        },
    };
}

// Opstartscherm: naam en wat ik doe, rustig op flessengroen
function tekenStart(x) {
    x.fillStyle = '#1B3A2A';
    x.fillRect(0, 0, 1600, 1000);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = '#F1ECE1';
    x.font = '500 120px Newsreader, Georgia, serif';
    x.fillText('Quinten Löb', 800, 470);
    x.fillStyle = '#B7BDAC';
    x.font = '400 34px Schibsted, Arial, sans-serif';
    x.fillText('Software Development · Rotterdam', 800, 580);
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
    x.fillStyle = '#B7BDAC';
    x.font = '400 24px Schibsted, Arial, sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('wk2026 — bracket.php', 800, 33);
    // bestanden links
    x.fillStyle = '#0d1d15';
    x.fillRect(0, 64, 330, 936);
    x.textAlign = 'left';
    x.font = '500 22px Schibsted, Arial, sans-serif';
    x.fillStyle = '#B7BDAC';
    x.fillText('WK2026', 32, 112);
    const bestanden = ['bracket.php', 'config.php', 'land.php', 'landen.php', 'views/', 'wk2026.db', 'package.json'];
    x.font = '400 24px Schibsted, Arial, sans-serif';
    bestanden.forEach((b, i) => {
        const y = 164 + i * 50;
        if (i === 0) { x.fillStyle = '#173223'; x.fillRect(0, y - 24, 330, 48); }
        x.fillStyle = b.endsWith('.db') ? '#C4DFA0' : i === 0 ? '#F1ECE1' : '#B7BDAC';
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
    const kleur = { c: '#6b8f7a', k: '#C4DFA0', v: '#9fd8ff', s: '#e8e3a3', n: '#f2a8ff', f: '#F1ECE1', p: '#c9d6cf' };
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

// Een mailprogramma met een nieuw bericht aan mij, met een knipperende cursor
function tekenMail(x, cursor) {
    const letter = (gewicht, maat) => `${gewicht} ${maat}px Schibsted, Arial, sans-serif`;
    x.fillStyle = '#0a1510';
    x.fillRect(0, 0, 1600, 1000);
    // mappen links
    x.fillStyle = '#0d1d15';
    x.fillRect(0, 0, 300, 1000);
    x.textAlign = 'left';
    x.textBaseline = 'middle';
    x.fillStyle = '#C4DFA0';
    x.fillRect(32, 40, 236, 64);
    x.fillStyle = '#08130D';
    x.font = letter(500, 24);
    x.fillText('+ Nieuw bericht', 52, 73);
    ['Inbox', 'Met ster', 'Verzonden', 'Concepten'].forEach((map, i) => {
        const y = 170 + i * 58;
        if (i === 3) { x.fillStyle = '#173223'; x.fillRect(16, y - 26, 268, 52); }
        x.fillStyle = i === 3 ? '#F1ECE1' : '#B7BDAC';
        x.font = letter(i === 3 ? 600 : 400, 27);
        x.fillText(map, 48, y);
    });
    // het bericht
    x.fillStyle = '#F1ECE1';
    x.fillRect(360, 60, 1180, 880);
    x.fillStyle = '#10251B';
    x.fillRect(360, 60, 1180, 80);
    x.fillStyle = '#F1ECE1';
    x.font = letter(600, 30);
    x.fillText('Nieuw bericht', 400, 100);
    const veld = (label, waarde, y) => {
        x.fillStyle = '#5d7368';
        x.font = letter(400, 28);
        x.fillText(label, 400, y);
        x.fillStyle = '#0B1A13';
        x.font = letter(600, 28);
        x.fillText(waarde, 570, y);
        x.fillStyle = '#d5ded9';
        x.fillRect(400, y + 32, 1100, 3);
    };
    veld('Aan', 'quintenlob6@gmail.com', 200);
    veld('Onderwerp', 'Stageplek', 276);
    x.fillStyle = '#0B1A13';
    x.font = letter(400, 30);
    x.fillText('Hoi Quinten,', 400, 370);
    if (cursor) { x.fillStyle = '#C4DFA0'; x.fillRect(400, 408, 4, 40); }
    x.fillStyle = '#6f8379';
    ['Wij hebben een stageplek voor iemand die graag', 'bouwt met PHP, databases en AI.'].forEach((r, i) => x.fillText(r, 420, 430 + i * 46));
    x.fillStyle = '#C4DFA0';
    x.fillRect(1260, 840, 240, 70);
    x.fillStyle = '#08130D';
    x.font = letter(600, 28);
    x.textAlign = 'center';
    x.fillText('Versturen', 1380, 876);
}
