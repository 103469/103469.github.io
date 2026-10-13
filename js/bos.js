/* bos.js — een 3D-bos vol vuurvliegjes, van Quinten Löb
   ------------------------------------------------------------------
   - Een echt 3D-bos (three.js): honderden dennen in de mist.
   - Als je scrolt, loopt de camera het bos in.
   - Duizenden vuurvliegjes hangen in de ruimte. Bij elke sectie
     (data-vorm) vliegt een deel naar een 3D-vorm die langzaam draait.
   - Muis: rondkijken, vuurvliegjes komen nieuwsgierig op je af,
     ingedrukt houden = roepen, kort klikken = wegschieten.
   ------------------------------------------------------------------ */
import * as THREE from './three.module.min.js';

const html = document.documentElement;
const rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function heeftWebGL() {
    try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) { return false; }
}
if (rustig || !heeftWebGL()) html.classList.add('statisch');
else start();

function start() {
    html.classList.add('levend');

    // Teksten komen zacht tevoorschijn als je ernaartoe scrolt
    const kijker = new IntersectionObserver((items) => {
        items.forEach((it) => { if (it.isIntersecting) it.target.classList.add('zichtbaar'); });
    }, { threshold: 0.2 });
    document.querySelectorAll('.verschijn').forEach((el) => kijker.observe(el));

    // ── Basis ──────────────────────────────────────────────────────
    let W = window.innerWidth, H = window.innerHeight;
    const mobiel = () => W < 860;
    const canvas = document.getElementById('vuurvliegjes');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobiel(), alpha: true, powerPreference: 'high-performance' });
    const pr = Math.min(window.devicePixelRatio || 1, mobiel() ? 1.5 : 2);
    renderer.setPixelRatio(pr);
    renderer.setSize(W, H, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const mistNacht = new THREE.Color('#0E2229');
    const mistDag = new THREE.Color('#5A4150');
    scene.fog = new THREE.Fog(mistNacht.clone(), 8, 150);

    const FOV = 50;
    const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 900);
    camera.position.set(0, 3.2, 30);
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const viewH = (d) => 2 * d * tanHalf;          // hoogte van het beeld op afstand d
    const viewW = (d) => viewH(d) * (W / H);

    // ── HET BOS ────────────────────────────────────────────────────
    const START_Z = 30, EIND_Z = -350;            // de camera loopt van hier naar daar
    const OPEN_Z = -405, OPEN_R = 46;              // open plek aan het eind

    // grond
    const grondGeo = new THREE.PlaneGeometry(700, 1100, 70, 110);
    const gp = grondGeo.attributes.position;
    for (let i = 0; i < gp.count; i++) {
        const gx = gp.getX(i), gy = gp.getY(i);
        gp.setZ(i, Math.sin(gx * 0.05) * Math.cos(gy * 0.04) * 1.6 + Math.sin(gx * 0.13 + gy * 0.07) * 0.5);
    }
    grondGeo.computeVertexNormals();
    const grond = new THREE.Mesh(grondGeo, new THREE.MeshBasicMaterial({ color: '#060F0E' }));
    grond.rotation.x = -Math.PI / 2;
    grond.position.set(0, 0, -250);
    scene.add(grond);

    // dennen: elk boompje is een stam met drie kegels, allemaal "instanced" (snel)
    const aantalBomen = mobiel() ? 320 : 760;
    const bomen = [];
    let pogingen = 0;
    while (bomen.length < aantalBomen && pogingen++ < 20000) {
        const kant = Math.random() < 0.5 ? -1 : 1;
        const h = 8 + Math.random() * 13;
        // het pad in het midden vrijhouden: de takken mogen er niet in hangen
        const x = kant * (7 + h * 0.5 + Math.pow(Math.random(), 1.1) * 95);
        const z = 50 - Math.random() * 620;
        if (Math.hypot(x, (z - OPEN_Z) * 0.85) < OPEN_R) continue;     // open plek vrijhouden
        if (z < OPEN_Z - 30 && Math.abs(x) < 30) continue;
        bomen.push({ x, z, h, b: h * (0.3 + Math.random() * 0.08), r: Math.random() * Math.PI });
    }
    // ── Een den met echte takken ────────────────────────────────
    // Elke boom bestaat uit lagen takken. De rand van elke laag is puntig
    // (lange en korte takken door elkaar) en hangt een beetje naar beneden.
    // Kleur per hoekpunt: lichter aan de maankant (links), donker in de schaduw
    // en onderaan elke laag. Drie soorten bomen voor afwisseling.
    function maakDen(soort) {
        const posities = [], kleuren = [], index = [];
        const kleurVan = (y, nx, rand) => {
            const maan = 0.62 + Math.max(0, -nx) * 0.55;                 // maan staat links
            const hoogte = 0.75 + y * 0.35;
            const v = maan * hoogte * (rand ? 1.0 : 0.62);
            return [v * 0.86, v * 1.0, v * 0.92];
        };
        const voegToe = (x, y, z, k) => { posities.push(x, y, z); kleuren.push(k[0], k[1], k[2]); return posities.length / 3 - 1; };

        const lagen = soort === 0 ? 6 : soort === 1 ? 8 : 5;
        const breed = soort === 2 ? 0.5 : soort === 1 ? 0.34 : 0.42;
        const segs = 18;
        for (let l = 0; l < lagen; l++) {
            const t = l / (lagen - 1);
            const onder = 0.16 + t * 0.7;                                   // onderkant van deze laag
            const top = Math.min(1, onder + (soort === 1 ? 0.2 : 0.26));
            const r = breed * (1 - t * 0.82) * (0.9 + Math.random() * 0.2);
            const draai = Math.random() * Math.PI * 2;
            const topI = voegToe((Math.random() - 0.5) * 0.02, top, (Math.random() - 0.5) * 0.02, kleurVan(top, 0, true));
            const binnen = voegToe(0, onder + 0.04, 0, kleurVan(onder, 0, false));
            const rand = [];
            for (let s = 0; s < segs; s++) {
                const a = draai + s / segs * Math.PI * 2;
                const lang = s % 2 === 0;                                 // takpunt of inham
                const rr = r * (lang ? 1.0 + Math.random() * 0.22 : 0.58 + Math.random() * 0.12);
                const zak = lang ? 0.03 + Math.random() * 0.05 : 0.0;   // takpunten hangen iets naar beneden
                const nx = Math.cos(a);
                rand.push(voegToe(Math.cos(a) * rr, onder - zak, Math.sin(a) * rr, kleurVan(onder, nx, lang)));
            }
            for (let s = 0; s < segs; s++) {
                const a = rand[s], b = rand[(s + 1) % segs];
                index.push(topI, a, b);            // bovenkant van de laag
                index.push(binnen, b, a);          // onderkant (donker)
            }
        }
        // stam
        const stamR = 0.022, stamH = 0.24, stamSegs = 6;
        const stamOnder = [], stamBoven = [];
        for (let s = 0; s < stamSegs; s++) {
            const a = s / stamSegs * Math.PI * 2, nx = Math.cos(a);
            const k = kleurVan(0, nx, false).map((v) => v * 0.75);
            stamOnder.push(voegToe(Math.cos(a) * stamR * 1.4, -0.02, Math.sin(a) * stamR * 1.4, k));
            stamBoven.push(voegToe(Math.cos(a) * stamR, stamH, Math.sin(a) * stamR, k));
        }
        for (let s = 0; s < stamSegs; s++) {
            const a = stamOnder[s], b = stamOnder[(s + 1) % stamSegs], c = stamBoven[s], d = stamBoven[(s + 1) % stamSegs];
            index.push(a, c, b, b, c, d);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(posities, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(kleuren, 3));
        g.setIndex(index);
        return g;
    }

    // Shader voor de bomen: kleur per hoekpunt, mist, en wiegen in de wind
    const boomUniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
        uTijd: { value: 0 },
        uBasis: { value: new THREE.Color('#1B3B36') },
    }]);
    const boomMat = new THREE.ShaderMaterial({
        uniforms: boomUniforms,
        fog: true,
        vertexColors: true,
        side: THREE.DoubleSide,
        vertexShader: /* glsl */`
            #include <fog_pars_vertex>
            uniform float uTijd;
            varying vec3 vKleur;
            varying float vHoogte;
            void main() {
                vKleur = color;
                vHoogte = position.y;
                vec4 wereld = instanceMatrix * vec4(position, 1.0);
                // elke boom zijn eigen ritme, hoe hoger hoe meer hij wiegt
                float plek = instanceMatrix[3].x * 0.13 + instanceMatrix[3].z * 0.07;
                float wieg = position.y * position.y;
                wereld.x += sin(uTijd * 0.9 + plek) * 0.18 * wieg * instanceMatrix[1].y * 0.12;
                wereld.z += cos(uTijd * 0.7 + plek * 1.3) * 0.12 * wieg * instanceMatrix[1].y * 0.12;
                vec4 mvPosition = viewMatrix * wereld;
                gl_Position = projectionMatrix * mvPosition;
                #include <fog_vertex>
            }`,
        fragmentShader: /* glsl */`
            #include <fog_pars_fragment>
            uniform vec3 uBasis;
            varying vec3 vKleur;
            varying float vHoogte;
            void main() {
                vec3 k = uBasis * vKleur;
                // heel licht randje maanlicht op de toppen
                k += vec3(0.05, 0.07, 0.07) * smoothstep(0.75, 1.0, vHoogte);
                gl_FragColor = vec4(k, 1.0);
                #include <fog_fragment>
            }`,
    });

    // drie soorten dennen, verdeeld over de bomen
    const soorten = [maakDen(0), maakDen(1), maakDen(2)];
    const hulp = new THREE.Object3D();
    soorten.forEach((geom, soort) => {
        const mijn = bomen.filter((_, i) => i % 3 === soort);
        const mesh = new THREE.InstancedMesh(geom, boomMat, mijn.length);
        mijn.forEach((bm, i) => {
            hulp.position.set(bm.x, 0, bm.z);
            hulp.rotation.set((Math.random() - 0.5) * 0.06, bm.r, (Math.random() - 0.5) * 0.06);
            const s = bm.h;
            hulp.scale.set(s * (0.9 + Math.random() * 0.25), s, s * (0.9 + Math.random() * 0.25));
            hulp.updateMatrix();
            mesh.setMatrixAt(i, hulp.matrix);
        });
        mesh.frustumCulled = false;
        scene.add(mesh);
    });

    // ── GRAS ───────────────────────────────────────────────────────
    // Tienduizenden sprietjes (één driehoekje per spriet, "instanced").
    // Ze liggen in een strook voor de camera; als je verder het bos in
    // loopt, schuiven ze in de shader mee (zo is er altijd gras om je heen).
    const GRAS_N = mobiel() ? 16000 : 52000;
    const GRAS_LENGTE = 64;
    const spriet = new THREE.InstancedBufferGeometry();
    spriet.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.05, 1, 0], 3));
    spriet.setIndex([0, 1, 2]);
    const gOffset = new Float32Array(GRAS_N * 2), gVorm = new Float32Array(GRAS_N * 3);
    for (let i = 0; i < GRAS_N; i++) {
        // meer gras aan de zijkanten, iets minder midden op het pad
        let x = (Math.random() - 0.5) * 70;
        if (Math.abs(x) < 3 && Math.random() < 0.6) x += Math.sign(x || 1) * 3;
        gOffset[i * 2] = x;
        gOffset[i * 2 + 1] = Math.random() * GRAS_LENGTE;
        gVorm[i * 3] = 0.25 + Math.pow(Math.random(), 1.6) * 0.75;     // hoogte
        gVorm[i * 3 + 1] = Math.random() * Math.PI * 2;                 // draaiing
        gVorm[i * 3 + 2] = Math.random();                               // kleurverschil
    }
    spriet.setAttribute('aOffset', new THREE.InstancedBufferAttribute(gOffset, 2));
    spriet.setAttribute('aVorm', new THREE.InstancedBufferAttribute(gVorm, 3));
    spriet.instanceCount = GRAS_N;
    const grasUniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
        uTijd: { value: 0 }, uCamZ: { value: 0 }, uLengte: { value: GRAS_LENGTE },
    }]);
    const grasMat = new THREE.ShaderMaterial({
        uniforms: grasUniforms, fog: true, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
            #include <fog_pars_vertex>
            uniform float uTijd, uCamZ, uLengte;
            attribute vec2 aOffset;
            attribute vec3 aVorm;
            varying float vTop, vTint;
            // zelfde heuvels als de grond
            float grondHoogte(float x, float z) {
                float gy = -(z + 250.0);
                return sin(x * 0.05) * cos(gy * 0.04) * 1.6 + sin(x * 0.13 + gy * 0.07) * 0.5;
            }
            void main() {
                // strook voor de camera: van 1.5 tot uLengte ver
                float afstand = 1.5 + mod(aOffset.y - uCamZ, uLengte);
                float z = uCamZ - afstand;
                float x = aOffset.x;
                float hoog = aVorm.x * smoothstep(uLengte, uLengte - 14.0, afstand);   // ver weg krimpen = geen plopjes
                float breed = 0.06 + aVorm.x * 0.05;
                float c = cos(aVorm.y), s = sin(aVorm.y);
                vec3 p = vec3(position.x * breed * c, position.y * hoog, position.x * breed * s);
                // wind: golven die over het gras trekken, de punt beweegt het meest
                float golf = sin(uTijd * 1.4 + x * 0.35 + z * 0.22) * 0.6 + sin(uTijd * 2.3 + x * 0.9) * 0.25;
                p.x += golf * 0.16 * position.y * position.y * hoog;
                p.z += golf * 0.06 * position.y * hoog;
                vec3 wereld = vec3(x, grondHoogte(x, z) - 0.05, z) + p;
                vTop = position.y;
                vTint = aVorm.z;
                vec4 mvPosition = viewMatrix * vec4(wereld, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                #include <fog_vertex>
            }`,
        fragmentShader: /* glsl */`
            #include <fog_pars_fragment>
            varying float vTop, vTint;
            void main() {
                vec3 voet = vec3(0.020, 0.045, 0.040);
                vec3 punt = mix(vec3(0.07, 0.15, 0.12), vec3(0.10, 0.19, 0.13), vTint);
                gl_FragColor = vec4(mix(voet, punt, vTop), 1.0);
                #include <fog_fragment>
            }`,
    });
    const gras = new THREE.Mesh(spriet, grasMat);
    gras.frustumCulled = false;
    scene.add(gras);

    // maan: staat ver weg en loopt mee met de camera
    const maan = new THREE.Group();
    maan.add(new THREE.Mesh(new THREE.CircleGeometry(7, 40), new THREE.MeshBasicMaterial({ color: '#F4EBC9', fog: false })));
    for (const [r, o] of [[16, 0.06], [30, 0.035], [55, 0.02]]) {
        const g = new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshBasicMaterial({ color: '#F4EBC9', transparent: true, opacity: o, fog: false, depthWrite: false }));
        g.position.z = -0.5; maan.add(g);
    }
    maan.renderOrder = -1;
    scene.add(maan);

    // ── VUURVLIEGJES ───────────────────────────────────────────────
    const N = mobiel() ? 1400 : 3400;
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    const thuis = new Float32Array(N * 3);      // plek t.o.v. de camera-diepte
    const maat = new Float32Array(N);
    const fase = new Float32Array(N);
    const groep = new Float32Array(N);
    const vormPunt = new Int32Array(N).fill(-1);  // welk punt van de vorm (-1 = vrij)
    const volgorde = Array.from({ length: N }, (_, i) => i).sort(() => Math.random() - 0.5);

    function nieuweThuis(i) {
        thuis[i * 3] = (Math.random() - 0.5) * 64;
        thuis[i * 3 + 1] = 0.4 + Math.pow(Math.random(), 1.3) * 15;
        thuis[i * 3 + 2] = -4 - Math.random() * 120;
    }
    for (let i = 0; i < N; i++) {
        nieuweThuis(i);
        pos[i * 3] = thuis[i * 3];
        pos[i * 3 + 1] = -1;                                    // ze komen uit het gras omhoog
        pos[i * 3 + 2] = camera.position.z + thuis[i * 3 + 2];
        maat[i] = 2.6 + Math.pow(Math.random(), 3) * 7.5;
        fase[i] = Math.random() * 100;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aMaat', new THREE.BufferAttribute(maat, 1));
    geo.setAttribute('aFase', new THREE.BufferAttribute(fase, 1));
    geo.setAttribute('aGroep', new THREE.BufferAttribute(groep, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);   // nooit wegvallen

    const uniforms = {
        uTijd: { value: 0 }, uPr: { value: pr }, uLicht: { value: -1 },
        uDageraad: { value: 0 }, uAan: { value: 0 }, uSchaal: { value: H / 900 },
    };
    const mat = new THREE.ShaderMaterial({
        uniforms, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
            uniform float uTijd, uPr, uLicht, uAan, uSchaal;
            attribute float aMaat, aFase, aGroep;
            varying float vSterk, vTint, vZacht;
            void main() {
                float snel = 0.7 + fract(aFase * 0.618) * 1.6;
                float knipper = 0.5 + 0.5 * sin(uTijd * snel + aFase);
                float sterk = 0.28 + 0.72 * knipper * knipper;
                float grootte = aMaat;
                if (aGroep > 29.5 && aGroep < 37.5) { sterk = max(sterk, 0.85); grootte *= 1.25; }
                if (abs(aGroep - 38.0) < 0.5) { sterk = 0.15 + 0.85 * (0.5 + 0.5 * sin(uTijd * 5.0)); grootte *= 1.4; }
                if (abs(aGroep - 39.0) < 0.5) { sterk *= 0.22; }
                if (aGroep > 0.5 && abs(aGroep - uLicht) < 0.5) { sterk = 1.0; grootte *= 1.7; }
                float aan = clamp(uAan * 3.0 - fract(aFase * 0.37) * 2.0, 0.0, 1.0);

                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                float diep = max(-mv.z, 0.5);
                float px = grootte * uPr * uSchaal * (18.0 / diep) * (0.75 + 0.5 * knipper);
                // heel dichtbij = groot en wazig (zoals bij een echte camera)
                vZacht = smoothstep(14.0, 46.0, px);
                vSterk = sterk * aan * mix(1.0, 0.45, vZacht) * smoothstep(0.6, 2.5, diep);
                vTint = fract(aFase * 0.913);
                gl_PointSize = min(px, 72.0 * uPr);
                gl_Position = projectionMatrix * mv;
            }`,
        fragmentShader: /* glsl */`
            uniform float uDageraad;
            varying float vSterk, vTint, vZacht;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                if (d > 0.5) discard;
                float kern = pow(smoothstep(0.5, 0.0, d), mix(4.0, 1.4, vZacht));
                float gloed = exp(-d * d * mix(18.0, 9.0, vZacht)) * 0.55;
                vec3 kleur = mix(vec3(1.0, 0.86, 0.42), vec3(0.78, 1.0, 0.45), vTint);
                kleur = mix(kleur, vec3(1.0, 0.78, 0.55), uDageraad * 0.5);
                float a = (kern * 1.4 + gloed) * vSterk;
                gl_FragColor = vec4(kleur * a, a);
            }`,
    });
    const punten = new THREE.Points(geo, mat);
    punten.frustumCulled = false;
    scene.add(punten);

    // ── 3D-VORMEN (alles rond het midden, ongeveer -0.5 tot 0.5) ───
    const vormen = {};
    function hussel(l) { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; }

    // tekenen op een 2D-canvas en de pixels uitlezen; met dikte (twee lagen) wordt het 3D
    function bemonster(teken, breed = 512, hoog = 512, dichtheid = 3, alleenRand = 0, dikte = 0.04) {
        const c = document.createElement('canvas'); c.width = breed; c.height = hoog;
        const x = c.getContext('2d');
        x.fillStyle = '#fff'; x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round';
        teken(x, breed, hoog);
        const data = x.getImageData(0, 0, breed, hoog).data;
        const a = (px, py) => (px < 0 || py < 0 || px >= breed || py >= hoog) ? 0 : data[(py * breed + px) * 4 + 3];
        const lijst = [];
        for (let yy = 0; yy < hoog; yy += dichtheid) for (let xx = 0; xx < breed; xx += dichtheid) {
            if (a(xx, yy) > 140 && (!alleenRand || a(xx - alleenRand, yy) < 140 || a(xx + alleenRand, yy) < 140 || a(xx, yy - alleenRand) < 140 || a(xx, yy + alleenRand) < 140)) {
                const z = (Math.random() < 0.5 ? -1 : 1) * dikte * 0.5;
                lijst.push([(xx - breed / 2) / breed, -(yy - hoog / 2) / breed, z, 0]);
            }
        }
        return hussel(lijst);
    }
    // punten langs de randen van een 3D-figuur
    function langsRanden(geometrie, perEenheid) {
        const randen = new THREE.EdgesGeometry(geometrie, 1).attributes.position.array;
        const lijst = [];
        for (let i = 0; i < randen.length; i += 6) {
            const a = [randen[i], randen[i + 1], randen[i + 2]], b = [randen[i + 3], randen[i + 4], randen[i + 5]];
            const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
            const n = Math.max(2, Math.round(len * perEenheid));
            for (let k = 0; k < n; k++) { const t = Math.random(); lijst.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, 0]); }
        }
        return lijst;
    }

    function maakVormen() {
        // naam: de rand van de letters, met een beetje diepte
        vormen.naam = bemonster((x, b, h) => {
            let g = h * 0.8; x.font = `800 ${g}px Bricolage, sans-serif`;
            const w = x.measureText('Quinten').width; if (w > b * 0.94) g *= (b * 0.94) / w;
            x.font = `800 ${g}px Bricolage, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
            x.fillText('Quinten', b / 2, h * 0.54);
        }, 1200, 320, mobiel() ? 4 : 2, mobiel() ? 0 : 5, 0.02);

        // voetbal: een echte bol met naden (geodetisch), draait rond
        const bal = langsRanden(new THREE.IcosahedronGeometry(0.44, 1), 60);
        const opp = new THREE.IcosahedronGeometry(0.44, 3).attributes.position.array;
        for (let i = 0; i < 260; i++) { const k = Math.floor(Math.random() * (opp.length / 3)) * 3; bal.push([opp[k], opp[k + 1], opp[k + 2], 0]); }
        vormen.bal = hussel(bal);

        // halter: een stang met schijven
        const halter = [];
        for (let k = 0; k < 340; k++) { const t = Math.random(), h = Math.random() * Math.PI * 2; halter.push([-0.36 + t * 0.72, Math.cos(h) * 0.025, Math.sin(h) * 0.025, 0]); }
        [[-0.27, 0.19], [-0.33, 0.14], [0.27, 0.19], [0.33, 0.14]].forEach(([sx, r]) => {
            for (let k = 0; k < 380; k++) {
                const h = Math.random() * Math.PI * 2, rr = Math.random() < 0.55 ? r : Math.sqrt(Math.random()) * r;
                halter.push([sx + (Math.random() - 0.5) * 0.045, Math.cos(h) * rr, Math.sin(h) * rr, 0]);
            }
        });
        vormen.halter = hussel(halter);

        // controller: getekend, met dikte
        vormen.controller = bemonster((x, b) => {
            const m = b / 2; x.lineWidth = b * 0.035; x.beginPath();
            x.moveTo(b * 0.3, m - b * 0.16); x.lineTo(b * 0.7, m - b * 0.16);
            x.bezierCurveTo(b * 0.9, m - b * 0.16, b * 0.98, m + b * 0.2, b * 0.86, m + b * 0.24);
            x.bezierCurveTo(b * 0.78, m + b * 0.27, b * 0.7, m + b * 0.08, b * 0.62, m + b * 0.06);
            x.lineTo(b * 0.38, m + b * 0.06);
            x.bezierCurveTo(b * 0.3, m + b * 0.08, b * 0.22, m + b * 0.27, b * 0.14, m + b * 0.24);
            x.bezierCurveTo(b * 0.02, m + b * 0.2, b * 0.1, m - b * 0.16, b * 0.3, m - b * 0.16); x.stroke();
            x.fillRect(b * 0.22, m - b * 0.075, b * 0.15, b * 0.045); x.fillRect(b * 0.2725, m - b * 0.125, b * 0.045, b * 0.145);
            [[0.66, -0.085], [0.76, -0.03]].forEach(([l, t]) => { x.beginPath(); x.arc(b * l, m + b * t, b * 0.04, 0, Math.PI * 2); x.fill(); });
        }, 512, 512, 3, 0, 0.09);

        // wereldbol: breedte- en lengtegraden op een bol, draait rond
        const wereld = [], R = 0.44;
        [-60, -30, 0, 30, 60].forEach((lat) => {
            const y = Math.sin(lat * Math.PI / 180) * R, r = Math.cos(lat * Math.PI / 180) * R;
            for (let k = 0; k < 170 * (r / R) + 30; k++) { const h = Math.random() * Math.PI * 2; wereld.push([Math.cos(h) * r, y, Math.sin(h) * r, 0]); }
        });
        for (let m = 0; m < 6; m++) {
            const lon = m * Math.PI / 6;
            for (let k = 0; k < 170; k++) { const a = Math.random() * Math.PI * 2; wereld.push([Math.cos(a) * R * Math.cos(lon), Math.sin(a) * R, Math.cos(a) * R * Math.sin(lon), 0]); }
        }
        vormen.wereld = hussel(wereld);

        // vraagteken met dikte
        vormen.vraag = bemonster((x, b, h) => {
            x.font = `800 ${h * 0.9}px Bricolage, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
            x.fillText('?', b / 2, h * 0.53);
        }, 512, 512, 2, 10, 0.1);

        // skills: 7 bolletjes in een ring die rond draait
        const skills = [];
        for (let g = 0; g < 7; g++) {
            const a = g * Math.PI * 2 / 7, cx = Math.cos(a) * 0.38, cz = Math.sin(a) * 0.38;
            for (let k = 0; k < 130; k++) {
                const u = Math.random() * 2 - 1, h = Math.random() * Math.PI * 2, r = Math.cbrt(Math.random()) * 0.075, s = Math.sqrt(1 - u * u);
                skills.push([cx + s * Math.cos(h) * r, u * r, cz + s * Math.sin(h) * r, g + 1]);
            }
        }
        vormen.skills = hussel(skills);

        // pad met 10 stops dat de diepte in kronkelt
        const pad = [];
        const padPunt = (t) => [-0.42 + t * 0.84, -0.42 + t * 0.84 + Math.sin(t * Math.PI * 3) * 0.1, Math.sin(t * Math.PI * 2) * 0.28];
        for (let k = 0; k < 520; k++) { const p = padPunt(Math.random()); pad.push([p[0], p[1], p[2], 0]); }
        for (let s = 0; s < 10; s++) {
            const p = padPunt(s / 9);
            for (let k = 0; k < 60; k++) {
                const u = Math.random() * 2 - 1, h = Math.random() * Math.PI * 2, r = Math.cbrt(Math.random()) * 0.032, q = Math.sqrt(1 - u * u);
                pad.push([p[0] + q * Math.cos(h) * r, p[1] + u * r, p[2] + q * Math.sin(h) * r, 30 + s]);
            }
        }
        vormen.pad = hussel(pad);

        // open plek: een kring van licht op de grond
        const open = [];
        for (let k = 0; k < 2200; k++) {
            const h = Math.random() * Math.PI * 2;
            const binnen = Math.random() < 0.35;
            const r = (binnen ? 0.3 : 0.5) + (Math.random() - 0.5) * 0.05;
            // een paar stijgen op uit de kring, als vonken
            const y = Math.random() < 0.18 ? Math.random() * 0.3 : Math.random() * 0.03;
            open.push([Math.cos(h) * r, y, Math.sin(h) * r, 0]);
        }
        vormen.open = hussel(open);
    }

    // waar staat de vorm (in camera-ruimte) en hoe groot
    const DIEPTE = 18;
    function plek(naam) {
        const d = naam === 'open' ? 22 : DIEPTE, vh = viewH(d), vw = viewW(d);
        if (mobiel()) {
            if (naam === 'naam') return { x: 0, y: vh * 0.1, z: -d, s: vw * 0.92 };
            if (naam === 'open') return { x: 0, y: 1.3 - camera.position.y, z: -d, s: vw * 0.9 };
            return { x: 0, y: vh * 0.26, z: -d, s: Math.min(vw * 0.64, vh * 0.3) };
        }
        if (naam === 'naam') return { x: 0, y: vh * 0.06, z: -d, s: Math.min(vw * 0.82, vw * 1250 / W) };
        if (naam === 'open') return { x: 0, y: 1.3 - camera.position.y, z: -d, s: Math.min(vw * 0.42, 14) };
        return { x: vw * 0.24, y: 0, z: -d, s: Math.min(vw * 0.4, vh * 0.72) };
    }
    // draaien per vorm
    function draai(naam, t, mxN) {
        switch (naam) {
            case 'bal': return [0.35, t * 0.55];
            case 'wereld': return [0.4, t * 0.35];
            case 'halter': return [0.2, t * 0.6];
            case 'skills': return [0.42, t * 0.22];
            case 'pad': return [0.15, Math.sin(t * 0.35) * 0.55 + mxN * 0.25];
            case 'open': return [0.32, t * 0.12];
            default: return [0.0, Math.sin(t * 0.5) * 0.14 + mxN * 0.35];
        }
    }

    const AANDEEL = { naam: 0.9, open: 0.8, skills: 0.6 };
    let huidigeVorm = null, actieveVorm = null;
    function zetVorm(naam) {
        actieveVorm = naam && vormen[naam] ? naam : null;
        huidigeVorm = naam;
        uniforms.uLicht.value = -1;
        const lijst = actieveVorm ? vormen[actieveVorm] : null;
        const aantal = lijst ? Math.floor(N * (AANDEEL[naam] || 0.7)) : 0;
        for (let k = 0; k < N; k++) {
            const i = volgorde[k];
            if (lijst && k < aantal) { vormPunt[i] = k % lijst.length; groep[i] = lijst[vormPunt[i]][3]; }
            else { vormPunt[i] = -1; groep[i] = 0; }
        }
        geo.attributes.aGroep.needsUpdate = true;
    }

    // ── MUIS ───────────────────────────────────────────────────────
    let mxPx = -1, myPx = -1, muisSnel = 0, vorigeMx = 0, vorigeMy = 0;
    let roepen = false, roepTijd = 0, knal = null;
    let kijkX = 0, kijkY = 0;
    const lichtje = document.querySelector('.lichtje');
    function beweeg(cx, cy) {
        mxPx = cx; myPx = cy;
        if (lichtje) lichtje.style.transform = `translate(${cx}px, ${cy}px)`;
    }
    window.addEventListener('pointermove', (e) => { beweeg(e.clientX, e.clientY); if (e.pointerType === 'mouse') html.classList.add('muis'); }, { passive: true });
    document.addEventListener('pointerleave', () => { mxPx = myPx = -1; html.classList.remove('muis'); });
    window.addEventListener('touchend', () => { mxPx = myPx = -1; roepen = false; }, { passive: true });
    const opKnop = (el) => el.closest && el.closest('a, button, input, textarea, .skill, .stops li');
    window.addEventListener('pointerdown', (e) => {
        if (opKnop(e.target)) return;
        beweeg(e.clientX, e.clientY); roepen = true; roepTijd = performance.now(); html.classList.add('roept');
    });
    window.addEventListener('pointercancel', () => { roepen = false; html.classList.remove('roept'); });
    window.addEventListener('pointerup', (e) => {
        if (!roepen) return;
        if (performance.now() - roepTijd < 220) knal = { x: e.clientX, y: e.clientY };
        roepen = false; html.classList.remove('roept');
    });

    // ── SECTIES ────────────────────────────────────────────────────
    const secties = [...document.querySelectorAll('[data-vorm]')];
    const menuLinks = [...document.querySelectorAll('.menu a, .voortgang a')];
    const contact = document.getElementById('contact');
    function kijkWelkeSectie() {
        html.style.setProperty('--scroll', String(window.scrollY));
        if (roepen && performance.now() - roepTijd > 120) { roepen = false; html.classList.remove('roept'); }
        if (huidigeVorm === 'start') return;
        let beste = null, besteAfstand = Infinity;
        secties.forEach((s) => {
            const r = s.getBoundingClientRect();
            const af = Math.abs((r.top + r.bottom) / 2 - H / 2);
            if (r.bottom > 0 && r.top < H && af < besteAfstand) { beste = s; besteAfstand = af; }
        });
        if (beste) {
            const vorm = beste.dataset.vorm;
            if (vorm !== huidigeVorm) zetVorm(vorm === 'vrij' ? 'vrij' : vorm);
            const hoofd = beste.closest('[data-menu]')?.dataset.menu;
            menuLinks.forEach((a) => a.classList.toggle('actief', a.getAttribute('href') === '#' + hoofd));
        }
        const cr = contact.getBoundingClientRect();
        const d = Math.min(1, Math.max(0, 1 - cr.top / H));
        html.style.setProperty('--dageraad', d.toFixed(3));
        uniforms.uDageraad.value = d;
    }
    window.addEventListener('scroll', kijkWelkeSectie, { passive: true });

    document.querySelectorAll('[data-groep], [data-stop]').forEach((el) => {
        if (el.dataset.stop !== undefined) el.dataset.groep = String(30 + Number(el.dataset.stop));
        const aan = () => { uniforms.uLicht.value = Number(el.dataset.groep); };
        const uit = () => { uniforms.uLicht.value = -1; };
        el.addEventListener('pointerenter', aan); el.addEventListener('focus', aan);
        el.addEventListener('pointerleave', uit); el.addEventListener('blur', uit);
    });

    window.addEventListener('resize', () => {
        const nW = window.innerWidth, nH = window.innerHeight;
        const alleenAdresbalk = nW === W && Math.abs(nH - H) < 140;
        W = nW; H = nH;
        camera.aspect = W / H; camera.updateProjectionMatrix();
        renderer.setSize(W, H, false);
        uniforms.uSchaal.value = H / 900;
        if (!alleenAdresbalk) { maakVormen(); zetVorm(huidigeVorm); }
    });

    // ── ELKE FRAME ─────────────────────────────────────────────────
    const klok = new THREE.Clock();
    let tegoed = 0;
    const m = new THREE.Matrix4();          // camera -> wereld
    const vp = new THREE.Matrix4();         // wereld -> scherm
    const e = m.elements, v = vp.elements;
    const rechts = new THREE.Vector3(), boven = new THREE.Vector3();

    // langzame computer? dan automatisch een lichtere versie (minder pixels)
    let meetFrames = 0, meetStart = 0, lichter = false;
    function controleerSnelheid() {
        if (lichter) return;
        meetFrames++;
        if (meetFrames === 30) meetStart = performance.now();
        if (meetFrames === 150) {
            const fps = 120 / ((performance.now() - meetStart) / 1000);
            if (fps < 35) { lichter = true; renderer.setPixelRatio(1); uniforms.uPr.value = 1; renderer.setSize(W, H, false); }
        }
    }

    function frame() {
        const dt = Math.min(klok.getDelta(), 0.07);
        const t = klok.elapsedTime;
        uniforms.uTijd.value = t;
        boomUniforms.uTijd.value = t;
        grasUniforms.uTijd.value = t;
        uniforms.uAan.value = Math.min(1, uniforms.uAan.value + dt * 0.45);
        tegoed += dt * 60;
        const stappen = Math.min(4, Math.floor(tegoed));
        tegoed -= stappen;

        // muis in -1..1
        const heeftMuis = mxPx >= 0;
        const mxN = heeftMuis ? (mxPx / W) * 2 - 1 : 0, myN = heeftMuis ? -(myPx / H) * 2 + 1 : 0;
        muisSnel = muisSnel * 0.85 + Math.min(Math.hypot(mxPx - vorigeMx, myPx - vorigeMy), 200) * 0.15;
        vorigeMx = mxPx; vorigeMy = myPx;

        // camera: loopt het bos in met het scrollen, kijkt een beetje rond met de muis
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - H);
        const voortgang = Math.min(1, window.scrollY / maxScroll);
        const doelZ = START_Z + (EIND_Z - START_Z) * voortgang;
        for (let s = 0; s < stappen; s++) {
            camera.position.z += (doelZ - camera.position.z) * 0.06;
            kijkX += (mxN - kijkX) * 0.04; kijkY += (myN - kijkY) * 0.04;
        }
        camera.position.y = 2.2 + Math.sin(voortgang * Math.PI) * 1.0 + Math.sin(t * 0.6) * 0.1;
        camera.position.x = Math.sin(t * 0.21) * 0.4;
        camera.rotation.set(kijkY * 0.07 + 0.09, -kijkX * 0.12, 0, 'YXZ');
        camera.updateMatrixWorld();
        m.copy(camera.matrixWorld);
        vp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        rechts.setFromMatrixColumn(m, 0); boven.setFromMatrixColumn(m, 1);
        const cz = camera.position.z;
        grasUniforms.uCamZ.value = cz;

        // maan en mist
        maan.position.set(camera.position.x - 300, 205, cz - 560);
        maan.lookAt(camera.position);
        scene.fog.color.copy(mistNacht).lerp(mistDag, uniforms.uDageraad.value * 0.85);

        // vorm: plek, schaal en draaiing
        const lijst = actieveVorm ? vormen[actieveVorm] : null;
        const pl = lijst ? plek(actieveVorm) : null;
        const [rx, ry] = lijst ? draai(actieveVorm, t, kijkX) : [0, 0];
        const cX = Math.cos(rx), sX = Math.sin(rx), cY = Math.cos(ry), sY = Math.sin(ry);

        // punt waar je de vuurvliegjes naartoe roept (14 eenheden voor je, onder je muis)
        const roepD = 14;
        const roepCam = [mxN * viewW(roepD) / 2, myN * viewH(roepD) / 2, -roepD];
        const roepX = e[0] * roepCam[0] + e[4] * roepCam[1] + e[8] * roepCam[2] + e[12];
        const roepY = e[1] * roepCam[0] + e[5] * roepCam[1] + e[9] * roepCam[2] + e[13];
        const roepZ = e[2] * roepCam[0] + e[6] * roepCam[1] + e[10] * roepCam[2] + e[14];

        for (let stap = 0; stap < stappen; stap++) {
            for (let i = 0; i < N; i++) {
                const ix = i * 3;
                let x = pos[ix], y = pos[ix + 1], z = pos[ix + 2];
                const f = fase[i];
                let tx, ty, tz, kracht;
                const vp_i = vormPunt[i];

                if (lijst && vp_i >= 0) {
                    // in de vorm: punt draaien, schalen en voor de camera zetten
                    const p = lijst[vp_i];
                    let px = p[0], py = p[1], pz = p[2];
                    const qx = px * cY + pz * sY, qz = -px * sY + pz * cY;            // om Y
                    const qy = py * cX - qz * sX, qz2 = py * sX + qz * cX;          // om X
                    let lx, ly, lz;
                    if (actieveVorm === 'open') { lx = pl.x + qx * pl.s; ly = pl.y + qy * pl.s; lz = pl.z + qz2 * pl.s; }
                    else { lx = pl.x + qx * pl.s; ly = pl.y + qy * pl.s; lz = pl.z + qz2 * pl.s; }
                    lx += Math.sin(t * 1.7 + f) * 0.03; ly += Math.cos(t * 1.3 + f * 1.7) * 0.03;
                    tx = e[0] * lx + e[4] * ly + e[8] * lz + e[12];
                    ty = e[1] * lx + e[5] * ly + e[9] * lz + e[13];
                    tz = e[2] * lx + e[6] * ly + e[10] * lz + e[14];
                    kracht = 0.035;
                } else if (roepen && heeftMuis) {
                    const hoek = t * (0.8 + (f % 1)) + f, r = 0.4 + (f * 7.3) % 3.2;
                    tx = roepX + rechts.x * Math.cos(hoek) * r + boven.x * Math.sin(hoek) * r;
                    ty = roepY + rechts.y * Math.cos(hoek) * r + boven.y * Math.sin(hoek) * r;
                    tz = roepZ + Math.sin(hoek * 1.3) * r * 0.6;
                    kracht = 0.014;
                } else {
                    // vrij zweven rond een eigen plek in het bos
                    tx = thuis[ix] + Math.sin(t * 0.3 + f) * 1.8 + Math.sin(t * 0.13 + f * 2.1) * 1.2;
                    ty = thuis[ix + 1] + Math.cos(t * 0.27 + f * 1.3) * 0.9;
                    tz = cz + thuis[ix + 2] + Math.cos(t * 0.21 + f * 0.7) * 1.5;
                    kracht = 0.006;
                }

                let vx = vel[ix] + (tx - x) * kracht;
                let vy = vel[ix + 1] + (ty - y) * kracht;
                let vz = vel[ix + 2] + (tz - z) * kracht;

                // muis en klik: werken op het scherm, dus eerst het punt naar het scherm omrekenen
                if ((heeftMuis || knal) && stap === 0) {
                    const cw = v[3] * x + v[7] * y + v[11] * z + v[15];
                    if (cw > 0.5) {
                        const sx = ((v[0] * x + v[4] * y + v[8] * z + v[12]) / cw * 0.5 + 0.5) * W;
                        const sy = (1 - ((v[1] * x + v[5] * y + v[9] * z + v[13]) / cw * 0.5 + 0.5)) * H;
                        const perPx = viewH(cw) / H;                       // wereld-eenheden per pixel op die diepte
                        if (heeftMuis) {
                            const ddx = sx - mxPx, ddy = sy - myPx, dd = Math.hypot(ddx, ddy) || 1;
                            if (dd < 170) {
                                const inv = 1 - dd / 170;
                                let duw = 0;
                                if (muisSnel > 18) duw = inv * 3.2;
                                else if (vp_i < 0 && !roepen) duw = -inv * 0.18;
                                if (duw) {
                                    const ux = ddx / dd, uy = -ddy / dd;
                                    vx += (rechts.x * ux + boven.x * uy) * duw * perPx;
                                    vy += (rechts.y * ux + boven.y * uy) * duw * perPx;
                                    vz += (rechts.z * ux + boven.z * uy) * duw * perPx;
                                }
                            }
                        }
                        if (knal) {
                            const kx = sx - knal.x, ky = sy - knal.y, kd = Math.hypot(kx, ky) || 1;
                            if (kd < 320) {
                                const duw = (1 - kd / 320) * 14 * perPx, ux = kx / kd, uy = -ky / kd;
                                vx += (rechts.x * ux + boven.x * uy) * duw;
                                vy += (rechts.y * ux + boven.y * uy) * duw;
                                vz += (rechts.z * ux + boven.z * uy) * duw;
                            }
                        }
                    }
                }

                vx *= 0.9; vy *= 0.9; vz *= 0.9;
                vel[ix] = vx; vel[ix + 1] = vy; vel[ix + 2] = vz;
                pos[ix] = x + vx; pos[ix + 1] = y + vy; pos[ix + 2] = z + vz;
            }
        }
        knal = null;
        geo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
        if (!html.classList.contains('geladen')) html.classList.add('geladen');
        controleerSnelheid();
        requestAnimationFrame(frame);
    }

    // wacht op het lettertype, anders klopt de vorm van je naam niet
    const klaar = document.fonts && document.fonts.load ? document.fonts.load('800 100px Bricolage') : Promise.resolve();
    klaar.catch(() => {}).finally(() => {
        maakVormen();
        if (window.scrollY < H * 0.4) {
            // eerst even vrij rondvliegen, dan komen ze samen tot je naam
            zetVorm(null); huidigeVorm = 'start';
            setTimeout(() => { huidigeVorm = null; kijkWelkeSectie(); }, 1700);
        } else {
            kijkWelkeSectie();
        }
        // camera meteen op de goede plek als je halverwege de pagina binnenkomt
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - H);
        camera.position.z = START_Z + (EIND_Z - START_Z) * Math.min(1, window.scrollY / maxScroll);
        requestAnimationFrame(frame);
    });
}
