// laptop.js — één 3D-laptop die meedraait met het scrollen; op het scherm verschijnen de projecten
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const html = document.documentElement;
const canvas = document.querySelector('.buhne');
const rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isKlein = () => window.matchMedia('(max-width: 767px)').matches;

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

// Houdingen per stap. x en y zijn een deel van de zichtbare breedte en hoogte,
// draai is in radialen, scherm: 0 = uit, 1 = WK 2026, 2 = Quizzie
const HOUDINGEN = {
    groot: {
        start:   { x:  0.22, y: -0.08, draaiY: -0.55, draaiX: 0.18, schaal: 1.00, scherm: 0 },
        over:    { x: -0.22, y: -0.08, draaiY:  0.62, draaiX: 0.12, schaal: 0.95, scherm: 0 },
        wk:      { x:  0.19, y: -0.04, draaiY: -0.16, draaiX: 0.06, schaal: 1.15, scherm: 1 },
        quiz:    { x: -0.19, y: -0.04, draaiY:  0.18, draaiX: 0.06, schaal: 1.15, scherm: 2 },
        skills:  { x:  0.23, y: -0.10, draaiY: -0.95, draaiX: 0.22, schaal: 0.92, scherm: 2 },
        contact: { x: -0.22, y: -0.12, draaiY:  2.55, draaiX: 0.10, schaal: 0.90, scherm: 2 },
    },
    klein: {
        start:   { x: 0, y: 0.20, draaiY: -0.45, draaiX: 0.22, schaal: 1.00, scherm: 0 },
        over:    { x: 0, y: 0.20, draaiY:  0.45, draaiX: 0.18, schaal: 0.95, scherm: 0 },
        wk:      { x: 0, y: 0.21, draaiY: -0.10, draaiX: 0.10, schaal: 1.10, scherm: 1 },
        quiz:    { x: 0, y: 0.21, draaiY:  0.12, draaiX: 0.10, schaal: 1.10, scherm: 2 },
        skills:  { x: 0, y: 0.20, draaiY: -0.85, draaiX: 0.24, schaal: 0.95, scherm: 2 },
        contact: { x: 0, y: 0.20, draaiY:  2.50, draaiX: 0.14, schaal: 0.92, scherm: 2 },
    },
};
const STAPPEN = ['start', 'over', 'wk', 'quiz', 'skills', 'contact'];

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

    let schermMesh = null;
    const namen = [];
    model.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true;
        o.receiveShadow = true;
        const materialen = Array.isArray(o.material) ? o.material : [o.material];
        materialen.forEach((m) => { if (m.envMapIntensity !== undefined) m.envMapIntensity = 1; });
        // De behuizing is in het model mat; als geborsteld aluminium oogt hij echter
        if (/frame/i.test(o.name)) materialen.forEach((m) => { m.metalness = 0.75; m.roughness = 0.38; });
        const naam = `${o.name} ${materialen.map((m) => m.name).join(' ')}`;
        namen.push(naam);
        if (!schermMesh && /screen|display|lcd|monitor|scherm/i.test(naam)) schermMesh = o;
    });
    console.info('Laptop-onderdelen:', namen);

    // Het scherm: een canvas waarop de screenshots in elkaar overlopen
    const scherm = await maakScherm(schermMesh, renderer);

    // Houding toepassen
    const staat = { ...HOUDINGEN[klein ? 'klein' : 'groot'].start };
    // zicht: zichtbare breedte en hoogte; pas: kleiner maken als het scherm smal is (telefoon)
    const zicht = { b: 1, h: 1, pas: 1 };
    function meetZicht() {
        const afstand = camera.position.distanceTo(new THREE.Vector3(0, 0.35, 0));
        zicht.h = 2 * afstand * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        zicht.b = zicht.h * camera.aspect;
        zicht.pas = Math.min(1, (0.66 * zicht.b) / 2.2);
    }
    meetZicht();

    const klok = new THREE.Clock();
    let vorigScherm = -1;
    renderer.setAnimationLoop(() => {
        const t = klok.getElapsedTime();
        laptop.position.set(staat.x * zicht.b, staat.y * zicht.h + Math.sin(t * 0.8) * 0.03, 0);
        laptop.rotation.set(staat.draaiX, staat.draaiY + Math.sin(t * 0.5) * 0.025, 0);
        laptop.scale.setScalar(staat.schaal * zicht.pas);
        licht.position.set(laptop.position.x + 2.5, 6, 4);
        licht.target.position.copy(laptop.position);

        if (scherm && Math.abs(staat.scherm - vorigScherm) > 0.002) {
            scherm.toon(staat.scherm);
            vorigScherm = staat.scherm;
        }
        renderer.render(scene, camera);
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        meetZicht();
    });

    // Scrollen stuurt de houding: van de vorige stap naar de volgende
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add({ groot: '(min-width: 768px)', klein: '(max-width: 767px)' }, (ctx) => {
        const set = HOUDINGEN[ctx.conditions.klein ? 'klein' : 'groot'];
        Object.assign(staat, set.start);
        STAPPEN.slice(1).forEach((stap, i) => {
            const sectie = document.querySelector(`[data-stap="${stap}"]`);
            gsap.fromTo(staat, { ...set[STAPPEN[i]] }, {
                ...set[stap],
                ease: 'power2.inOut',
                immediateRender: false,
                scrollTrigger: { trigger: sectie, start: 'top bottom', end: 'top 25%', scrub: 1.2 },
            });
        });
    });
    ScrollTrigger.refresh();

    requestAnimationFrame(() => canvas.classList.add('klaar'));
}

// Legt een vlak op de voorkant van het deksel; toon(0..2) laat uit → WK → Quizzie overlopen.
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
    const [wk, quiz] = await Promise.all([laad('img/wk2026-site.jpg'), laad('img/quizzie-site.jpg')]);

    const doek = document.createElement('canvas');
    doek.width = 1600;
    doek.height = Math.round(1600 * PANEEL.hoog / PANEEL.breed);
    const ctx = doek.getContext('2d');

    const texture = new THREE.CanvasTexture(doek);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

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

    // Afbeelding vullend tekenen, bovenkant van de site bovenaan
    function teken(img, alfa) {
        if (alfa <= 0) return;
        const s = Math.max(doek.width / img.width, doek.height / img.height);
        const w = img.width * s, h = img.height * s;
        ctx.globalAlpha = alfa;
        ctx.drawImage(img, (doek.width - w) / 2, 0, w, h);
        ctx.globalAlpha = 1;
    }

    return {
        toon(waarde) {
            ctx.fillStyle = '#06100b';
            ctx.fillRect(0, 0, doek.width, doek.height);
            if (waarde <= 1) {
                teken(wk, waarde);
            } else {
                teken(wk, 1);
                teken(quiz, Math.min(1, waarde - 1));
            }
            texture.needsUpdate = true;
        },
    };
}
