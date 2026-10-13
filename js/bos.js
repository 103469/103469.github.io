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
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobiel(), alpha: true, stencil: true, powerPreference: 'high-performance' });
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

    // ── WATER: een beekje langs het pad dat uitkomt in een meertje ──
    // Deze hoogte-functie bestaat twee keer: hier in JavaScript (voor de grond)
    // en als GLSL in de shader van het gras. Ze moeten precies hetzelfde zijn.
    const BEEK_B = 1.6;                             // halve breedte van de beek
    const MEER_Z = -380, MEER_RX = 19, MEER_RZ = 13, MEER_Y = 0.1;
    const glad = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const heuvel = (x, z) => { const gy = -(z + 250); return Math.sin(x * 0.05) * Math.cos(gy * 0.04) * 1.6 + Math.sin(x * 0.13 + gy * 0.07) * 0.5; };
    const beekX = (z) => -4.6 + Math.sin(z * 0.035) * 1.3 + Math.sin(z * 0.011 + 1.0) * 0.9;
    const beekY = (z) => { const c = heuvel(beekX(z), z) - 0.1; return c + (MEER_Y - c) * glad(-345, -366, z); };
    function grondHoogte(x, z) {
        let h = heuvel(x, z);
        const r = Math.hypot(x / MEER_RX, (z - MEER_Z) / MEER_RZ);
        if (r < 1) return MEER_Y - 0.02 - 0.7 * (1 - r * r);             // bodem van het meer
        h = MEER_Y + 0.1 + (h - MEER_Y - 0.1) * glad(1, 1.7, r);          // vlakke oever rond het meer
        if (z > MEER_Z && z < 70) {
            const d = Math.abs(x - beekX(z)), wy = beekY(z);
            h = d < BEEK_B ? wy - 0.02 - 0.4 * (1 - (d / BEEK_B) ** 2) : wy + 0.12 + (h - wy - 0.12) * glad(BEEK_B, BEEK_B + 1.8, d);
        }
        return h;
    }
    const HOOGTE_GLSL = /* glsl */`
        float glad(float a, float b, float x) { return smoothstep(a, b, x); }
        float heuvel(float x, float z) { float gy = -(z + 250.0); return sin(x * 0.05) * cos(gy * 0.04) * 1.6 + sin(x * 0.13 + gy * 0.07) * 0.5; }
        float beekX(float z) { return -4.6 + sin(z * 0.035) * 1.3 + sin(z * 0.011 + 1.0) * 0.9; }
        float beekY(float z) { float c = heuvel(beekX(z), z) - 0.1; return c + (${MEER_Y.toFixed(2)} - c) * glad(-345.0, -366.0, z); }
        float grondHoogte(float x, float z) {
            float h = heuvel(x, z);
            float r = length(vec2(x / ${MEER_RX.toFixed(1)}, (z - ${MEER_Z.toFixed(1)}) / ${MEER_RZ.toFixed(1)}));
            if (r < 1.0) return ${MEER_Y.toFixed(2)} - 0.02 - 0.7 * (1.0 - r * r);
            h = ${MEER_Y.toFixed(2)} + 0.1 + (h - ${MEER_Y.toFixed(2)} - 0.1) * glad(1.0, 1.7, r);
            if (z > ${MEER_Z.toFixed(1)} && z < 70.0) {
                float d = abs(x - beekX(z)), wy = beekY(z);
                float q = d / ${BEEK_B.toFixed(2)};
                h = d < ${BEEK_B.toFixed(2)} ? wy - 0.02 - 0.4 * (1.0 - q * q) : wy + 0.12 + (h - wy - 0.12) * glad(${BEEK_B.toFixed(2)}, ${(BEEK_B + 1.8).toFixed(2)}, d);
            }
            return h;
        }
        // 1 = hier staat water (dan geen gras), daartussen = oever met kort gras
        float isWater(float x, float z) {
            float r = length(vec2(x / ${MEER_RX.toFixed(1)}, (z - ${MEER_Z.toFixed(1)}) / ${MEER_RZ.toFixed(1)}));
            float d = abs(x - beekX(z));
            // de rand van het water is onregelmatig: soms groeit het gras er tot in
            float rafel = sin(z * 1.7 + x) * 0.18 + sin(z * 4.3 - x * 2.0) * 0.1;
            float beek = z > ${MEER_Z.toFixed(1)} ? 1.0 - smoothstep(${(BEEK_B - 0.25).toFixed(2)}, ${(BEEK_B + 1.6).toFixed(2)}, d + rafel) * 0.3 - step(${(BEEK_B - 0.25).toFixed(2)}, d + rafel) * 0.7 : 0.0;
            float meer = 1.0 - smoothstep(0.98, 1.3, r + rafel * 0.03) * 0.3 - step(0.98, r + rafel * 0.03) * 0.7;
            return max(beek, meer);
        }`;

    // grond: veel puntjes dicht bij het pad (voor de beek), weinig ver weg
    const grondGeo = new THREE.PlaneGeometry(2, 1100, 170, 550);
    const gp = grondGeo.attributes.position;
    for (let i = 0; i < gp.count; i++) {
        const u = gp.getX(i), gx = Math.sign(u) * 350 * u * u, gy = gp.getY(i);
        gp.setX(i, gx);
        gp.setZ(i, grondHoogte(gx, -250 - gy));
    }
    // kleur van de grond: een beetje afwisseling, en natte (donkere) oevers bij het water
    const grondKleur = new Float32Array(gp.count * 3), basis = new THREE.Color('#060F0E');
    for (let i = 0; i < gp.count; i++) {
        const gx = gp.getX(i), gz = -250 - gp.getY(i);
        const r = Math.hypot(gx / MEER_RX, (gz - MEER_Z) / MEER_RZ);
        const d = gz > MEER_Z ? Math.abs(gx - beekX(gz)) - BEEK_B : 99;
        const nat = Math.max(1 - glad(0, 1.6, d), 1 - glad(1, 1.25, r));
        const v = 0.85 + 0.3 * (Math.sin(gx * 0.7 + gz * 0.3) * Math.sin(gz * 0.5 - gx * 0.2) * 0.5 + 0.5);
        const k = v * (1 - nat * 0.45);
        grondKleur[i * 3] = basis.r * k; grondKleur[i * 3 + 1] = basis.g * k; grondKleur[i * 3 + 2] = basis.b * k * (1 + nat * 0.3);
    }
    grondGeo.setAttribute('color', new THREE.BufferAttribute(grondKleur, 3));
    grondGeo.computeVertexNormals();
    const grond = new THREE.Mesh(grondGeo, new THREE.MeshBasicMaterial({ vertexColors: true }));
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
    // Tienduizenden gebogen sprietjes (elk 4 stukjes + een punt, "instanced").
    // Ze groeien in pollen en liggen in een strook voor de camera; als je
    // verder het bos in loopt, schuiven ze in de shader mee.
    const GRAS_N = mobiel() ? 20000 : 46000;
    const GRAS_LENGTE = 64;
    const STUKJES = 4;
    const sprietPos = [], sprietIndex = [];
    for (let j = 0; j < STUKJES; j++) { const y = j / STUKJES; sprietPos.push(-0.5, y, 0, 0.5, y, 0); }
    sprietPos.push(0, 1, 0);
    for (let j = 0; j < STUKJES - 1; j++) { const a = j * 2; sprietIndex.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const laatste = (STUKJES - 1) * 2;
    sprietIndex.push(laatste, laatste + 1, laatste + 2);
    const spriet = new THREE.InstancedBufferGeometry();
    spriet.setAttribute('position', new THREE.Float32BufferAttribute(sprietPos, 3));
    spriet.setIndex(sprietIndex);

    const gOffset = new Float32Array(GRAS_N * 2), gVorm = new Float32Array(GRAS_N * 4), gKleur = new Float32Array(GRAS_N * 2);
    let pol = null, inPol = 0;
    for (let i = 0; i < GRAS_N; i++) {
        // nieuwe pol: een plek waar 6 tot 24 sprietjes dicht bij elkaar staan
        if (!pol || inPol <= 0) {
            let x = (Math.random() - 0.5) * 70;
            if (Math.abs(x) < 2.5 && Math.random() < 0.7) x += Math.sign(x || 1) * 2.5;   // het pad is wat kaler
            pol = { x, z: Math.random() * GRAS_LENGTE, r: 0.12 + Math.random() * 0.4, h: 0.45 + Math.random() * 0.75 };
            inPol = 6 + Math.floor(Math.random() * 18);
            if (Math.random() < 0.3) { pol.r = 1.6; inPol = 3; }                        // losse sprietjes tussen de pollen
        }
        inPol--;
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * pol.r;
        gOffset[i * 2] = pol.x + Math.cos(a) * r;
        gOffset[i * 2 + 1] = (pol.z + Math.sin(a) * r + GRAS_LENGTE) % GRAS_LENGTE;
        const midden = 1 - r / pol.r;                                    // midden van de pol = langer
        gVorm[i * 4] = pol.h * (0.45 + midden * 0.45 + Math.random() * 0.35);          // hoogte
        gVorm[i * 4 + 1] = a + (Math.random() - 0.5) * 1.2;                           // draaiing (naar buiten)
        gVorm[i * 4 + 2] = 0.15 + Math.random() * 0.55 + (1 - midden) * 0.3;           // hoe ver hij buigt
        gVorm[i * 4 + 3] = Math.random() * 100;                                        // fase voor de wind
        gKleur[i * 2] = Math.random();                                                 // kleurverschil
        gKleur[i * 2 + 1] = Math.random() < 0.09 ? 0.6 + Math.random() * 0.4 : 0;      // droog sprietje
    }
    spriet.setAttribute('aOffset', new THREE.InstancedBufferAttribute(gOffset, 2));
    spriet.setAttribute('aVorm', new THREE.InstancedBufferAttribute(gVorm, 4));
    spriet.setAttribute('aKleur', new THREE.InstancedBufferAttribute(gKleur, 2));
    spriet.instanceCount = GRAS_N;
    const LAMPJES = 10;
    const grasUniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
        uTijd: { value: 0 }, uCamZ: { value: 0 }, uLengte: { value: GRAS_LENGTE }, uDageraad: { value: 0 },
        uLampjes: { value: Array.from({ length: LAMPJES }, () => new THREE.Vector4(0, -99, 0, 0)) },
    }]);
    const grasMat = new THREE.ShaderMaterial({
        uniforms: grasUniforms, fog: true, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
            #include <fog_pars_vertex>
            uniform float uTijd, uCamZ, uLengte;
            uniform vec4 uLampjes[${LAMPJES}];
            attribute vec2 aOffset, aKleur;
            attribute vec4 aVorm;
            varying float vTop, vTint, vDroog, vMaan;
            varying vec3 vLamp;
            // zelfde heuvels (en beek en meer) als de grond
            ${HOOGTE_GLSL}
            void main() {
                // strook voor de camera: van 1.5 tot uLengte ver
                float afstand = 1.5 + mod(aOffset.y - uCamZ, uLengte);
                float z = uCamZ - afstand;
                float x = aOffset.x;
                float h = position.y;
                float hoog = aVorm.x * smoothstep(uLengte, uLengte - 14.0, afstand);   // ver weg krimpen = geen plopjes
                hoog *= 1.0 - isWater(x, z);                                              // geen gras in het water
                // smal, en naar de punt toe steeds smaller
                float breed = (0.035 + aVorm.x * 0.035) * (1.0 - h * 0.75);
                float c = cos(aVorm.y), s = sin(aVorm.y);
                vec2 dwars = vec2(c, s), voor = vec2(-s, c);
                // buigen: hoe hoger, hoe verder de spriet overhelt
                float buig = aVorm.z * h * h * hoog;
                vec3 p = vec3(dwars.x * position.x * breed + voor.x * buig, h * hoog * (1.0 - aVorm.z * h * 0.35), dwars.y * position.x * breed + voor.y * buig);
                // wind: grote, trage windvlagen die over het veld trekken + klein getril
                float vlaag = sin(z * 0.09 + x * 0.03 + uTijd * 0.9) * 0.5 + 0.5;
                vlaag = vlaag * vlaag * (0.6 + 0.4 * sin(x * 0.11 - uTijd * 0.5));
                float tril = sin(uTijd * 3.1 + aVorm.w) * 0.06;
                float wind = (0.12 + vlaag * 0.5 + tril) * h * h * hoog;
                p.x += wind;
                p.z += wind * 0.35;
                p.y -= wind * wind * 0.4;
                vec3 wereld = vec3(x, grondHoogte(x, z) - 0.04, z) + p;

                // licht van de maan (links) op de kant die ernaar kijkt
                vMaan = abs(dot(voor, normalize(vec2(-0.8, 0.5))));
                // licht van vuurvliegjes die vlakbij het gras vliegen
                vec3 lamp = vec3(0.0);
                for (int k = 0; k < ${LAMPJES}; k++) {
                    vec3 d = uLampjes[k].xyz - wereld;
                    lamp += uLampjes[k].w / (1.0 + dot(d, d) * 1.6);
                }
                vLamp = lamp * vec3(0.95, 0.9, 0.45);
                vTop = h;
                vTint = aKleur.x;
                vDroog = aKleur.y;
                vec4 mvPosition = viewMatrix * vec4(wereld, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                #include <fog_vertex>
            }`,
        fragmentShader: /* glsl */`
            #include <fog_pars_fragment>
            uniform float uDageraad;
            varying float vTop, vTint, vDroog, vMaan;
            varying vec3 vLamp;
            void main() {
                vec3 voet = vec3(0.012, 0.03, 0.026);
                vec3 midden = mix(vec3(0.045, 0.11, 0.085), vec3(0.075, 0.15, 0.09), vTint);
                vec3 punt = mix(vec3(0.10, 0.20, 0.13), vec3(0.15, 0.24, 0.12), vTint);
                vec3 droog = mix(vec3(0.13, 0.12, 0.07), vec3(0.20, 0.17, 0.09), vTint);
                vec3 k = vTop < 0.5 ? mix(voet, midden, vTop * 2.0) : mix(midden, punt, vTop * 2.0 - 1.0);
                k = mix(k, mix(voet, droog, vTop), vDroog);
                // zacht randje maanlicht op de bovenkant
                k += vec3(0.05, 0.07, 0.09) * vMaan * pow(vTop, 2.5);
                // gloed van vuurvliegjes
                k += vLamp * (0.25 + vTop * 0.75) * 0.5;
                k *= 1.0 + uDageraad * 0.6;
                gl_FragColor = vec4(k, 1.0);
                #include <fog_fragment>
            }`,
    });
    const gras = new THREE.Mesh(spriet, grasMat);
    gras.frustumCulled = false;
    scene.add(gras);

    // het water zelf: donker, met kleine golfjes en sterren die erin glinsteren
    const waterUniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
        uTijd: { value: 0 }, uDageraad: { value: 0 },
    }]);
    const waterMat = new THREE.ShaderMaterial({
        uniforms: waterUniforms, fog: true,
        // het water zet een "stempel" (stencil) zodat de weerspiegeling alleen op het water komt
        stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp,
        vertexShader: /* glsl */`
            #include <fog_pars_vertex>
            attribute float aStroom;
            varying vec3 vWereld;
            varying float vStroom;
            void main() {
                vec4 w = modelMatrix * vec4(position, 1.0);
                vWereld = w.xyz;
                vStroom = aStroom;
                vec4 mvPosition = viewMatrix * w;
                gl_Position = projectionMatrix * mvPosition;
                #include <fog_vertex>
            }`,
        fragmentShader: /* glsl */`
            #include <fog_pars_fragment>
            uniform float uTijd, uDageraad;
            varying vec3 vWereld;
            varying float vStroom;
            void main() {
                vec2 p = vWereld.xz;
                float t = uTijd;
                float s = t * 1.6 * vStroom;                  // in de beek stroomt het water mee
                // golfjes: een paar sinussen door elkaar
                vec2 g = vec2(0.0);
                g += vec2(cos(p.x * 2.1 + p.y * 0.7 + t * 1.3), 0.0) * 0.06;
                g += vec2(0.0, cos(p.y * 2.6 + s * 2.0 - p.x * 0.4 + t * 0.9)) * 0.07;
                g += vec2(cos(p.x * 5.3 - p.y * 3.1 + t * 2.2), cos(p.y * 6.1 + p.x * 2.3 + s * 3.0 + t * 1.7)) * 0.025;
                float ver = length(cameraPosition - vWereld);
                g *= 1.0 / (1.0 + ver * 0.08);                 // ver weg rustiger, anders flikkert het
                vec3 n = normalize(vec3(g.x, 1.0, g.y));
                vec3 V = normalize(cameraPosition - vWereld);
                float fresnel = 0.15 + 0.85 * pow(1.0 - max(dot(n, V), 0.0), 3.0);
                vec3 diep = vec3(0.003, 0.010, 0.018);
                vec3 lucht = mix(vec3(0.04, 0.08, 0.105), vec3(0.20, 0.14, 0.18), uDageraad);
                vec3 R0 = reflect(-V, n);
                // de lucht in het water: lichter naar de horizon
                float hor = 1.0 - R0.y;
                vec3 k = mix(diep, lucht, fresnel) * (0.6 + 1.2 * hor * hor);
                // sterren die in het water weerspiegelen (en mee golven)
                vec2 sc = floor(R0.xz / max(R0.y, 0.05) * 70.0);
                float ster = step(0.993, fract(sin(dot(sc, vec2(12.9898, 78.233))) * 43758.5453));
                k += vec3(0.75, 0.8, 0.85) * ster * (1.0 - uDageraad) * smoothstep(0.05, 0.3, R0.y);
                gl_FragColor = vec4(k, 1.0);
                #include <fog_fragment>
            }`,
    });
    // beek: een lint van punten langs beekX, net zo breed als de bedding
    {
        const p = [], st = [], idx = [];
        const breed = BEEK_B + 0.6;
        let rij = 0;
        for (let z = 62; z >= MEER_Z + 2; z -= 0.8, rij++) {
            const x = beekX(z), y = beekY(z);
            p.push(x - breed, y, z, x + breed, y, z);
            st.push(1, 1);
            if (rij > 0) { const a = (rij - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
        g.setAttribute('aStroom', new THREE.Float32BufferAttribute(st, 1));
        g.setIndex(idx);
        const beek = new THREE.Mesh(g, waterMat);
        beek.renderOrder = 1; beek.frustumCulled = false;
        scene.add(beek);
    }
    // meer: een plat ovaal bij de open plek
    {
        const g = new THREE.CircleGeometry(1, 72);
        g.rotateX(-Math.PI / 2);
        g.setAttribute('aStroom', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count), 1));
        const meer = new THREE.Mesh(g, waterMat);
        meer.scale.set(MEER_RX * 1.12, 1, MEER_RZ * 1.12);
        meer.position.set(0, MEER_Y, MEER_Z);
        meer.renderOrder = 1;
        scene.add(meer);
    }


    // ── VUURVLIEGJES ───────────────────────────────────────────────
    const N = mobiel() ? 1400 : 3400;
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    const thuis = new Float32Array(N * 3);      // plek t.o.v. de camera-diepte
    const maat = new Float32Array(N);
    const fase = new Float32Array(N);
    const groep = new Float32Array(N);
    const inVorm = new Float32Array(N);         // 1 = hoort bij de vorm, altijd vóór de bomen
    const kleurMix = new Float32Array(N);      // 0 = gewone kleur, 1 = kleur van de vorm
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
    geo.setAttribute('aMix', new THREE.BufferAttribute(kleurMix, 1));
    geo.setAttribute('aInVorm', new THREE.BufferAttribute(inVorm, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);   // nooit wegvallen

    const uniforms = {
        uTijd: { value: 0 }, uPr: { value: pr }, uLicht: { value: -1 },
        uDageraad: { value: 0 }, uAan: { value: 0 }, uSchaal: { value: H / 900 },
        uK1: { value: new THREE.Vector3(1.0, 0.86, 0.42) }, uK2: { value: new THREE.Vector3(0.78, 1.0, 0.45) },
        uK3: { value: new THREE.Vector3(0.78, 1.0, 0.45) }, uDrie: { value: 0 }, uRgb: { value: 0 },
        // skills: elke taal zijn eigen kleur (HTML, PHP, SQL, Tailwind, JS, Git, Plesk)
        uSkill: { value: [[1.0, 0.5, 0.22], [0.66, 0.55, 1.0], [0.35, 0.65, 1.0], [0.25, 0.92, 1.0], [1.0, 0.92, 0.25], [1.0, 0.32, 0.3], [0.35, 1.0, 0.6]].map((k) => new THREE.Vector3(...k)) },
    };
    // kleuren per vorm: twee (of drie) kleuren, en de controller wisselt als RGB
    const KLASSIEK = { k: [[1.0, 0.86, 0.42], [0.78, 1.0, 0.45]] };
    const PALET = {
        bal: { k: [[0.95, 1.0, 0.9], [0.35, 1.0, 0.42]] },
        halter: { k: [[1.0, 0.36, 0.08], [1.0, 0.55, 0.15]] },
        controller: { k: [[0.2, 0.95, 1.0], [0.78, 0.3, 1.0]], rgb: 1 },
        wereld: { k: [[0.3, 1.0, 0.42], [1.0, 0.28, 0.28], [0.35, 0.55, 1.0]] },
        vraag: { k: [[1.0, 0.42, 0.78], [0.72, 0.42, 1.0]] },
        pad: { k: [[1.0, 0.82, 0.32], [1.0, 0.66, 0.2]] },
        open: { k: [[0.85, 0.94, 1.0], [0.55, 0.78, 1.0]] },
    };
    let palet = KLASSIEK;
    const doelK = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    const mat = new THREE.ShaderMaterial({
        uniforms, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
            uniform float uTijd, uPr, uLicht, uAan, uSchaal;
            uniform vec3 uK1, uK2, uK3, uSkill[7];
            uniform float uDrie, uRgb;
            attribute float aMaat, aFase, aGroep, aMix, aInVorm;
            varying float vSterk, vZacht;
            varying vec3 vKleur;
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
                float tint = fract(aFase * 0.913);
                vec3 klassiek = mix(vec3(1.0, 0.86, 0.42), vec3(0.78, 1.0, 0.45), tint);
                vec3 thema = mix(uK1, uK2, tint);
                vec3 drie = tint < 0.34 ? uK1 : (tint < 0.67 ? uK2 : uK3);
                thema = mix(thema, drie, uDrie);
                // gaming: kleuren die als een golf door de vorm lopen
                float golf = 0.5 + 0.5 * sin(uTijd * 1.8 + position.x * 0.6 + position.y * 0.9);
                thema = mix(thema, mix(uK1, uK2, golf), uRgb);
                if (aGroep > 0.5 && aGroep < 7.5) thema = uSkill[int(aGroep + 0.5) - 1];
                vKleur = mix(klassiek, thema, aMix);
                gl_PointSize = min(px, 72.0 * uPr);
                gl_Position = projectionMatrix * mv;
                // vuurvliegjes in een vorm (je naam, de voetbal...) komen altijd vóór de bomen
                if (aInVorm > 0.5) gl_Position.z = -gl_Position.w * 0.999;
            }`,
        fragmentShader: /* glsl */`
            uniform float uDageraad;
            varying float vSterk, vZacht;
            varying vec3 vKleur;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                if (d > 0.5) discard;
                float kern = pow(smoothstep(0.5, 0.0, d), mix(4.0, 1.4, vZacht));
                float gloed = exp(-d * d * mix(18.0, 9.0, vZacht)) * 0.55;
                vec3 kleur = mix(vKleur, vec3(1.0, 0.78, 0.55), uDageraad * 0.4);
                float a = (kern * 1.4 + gloed) * vSterk;
                // het hartje is bijna wit, de gloed eromheen heeft de kleur
                gl_FragColor = vec4(kleur * a + vec3(0.35) * kern * kern * vSterk, a);
            }`,
    });
    const punten = new THREE.Points(geo, mat);
    punten.frustumCulled = false;
    scene.add(punten);

    // spiegelbeeld van de vuurvliegjes in het water: dezelfde puntjes,
    // omgeklapt rond het wateroppervlak, en alleen zichtbaar waar water is
    const spiegelVertex = mat.vertexShader
        .replace('void main() {', `
            float beekXs(float z) { return -4.6 + sin(z * 0.035) * 1.3 + sin(z * 0.011 + 1.0) * 0.9; }
            float heuvelS(float x, float z) { float gy = -(z + 250.0); return sin(x * 0.05) * cos(gy * 0.04) * 1.6 + sin(x * 0.13 + gy * 0.07) * 0.5; }
            void main() {`)
        .replace('vec4 mv = modelViewMatrix * vec4(position, 1.0);', `
                float c = heuvelS(beekXs(position.z), position.z) - 0.1;
                float niveau = c + (${MEER_Y.toFixed(2)} - c) * smoothstep(-345.0, -366.0, position.z);
                vec3 sp = vec3(position.x, 2.0 * niveau - position.y, position.z);
                sp.x += sin(uTijd * 2.0 + position.z * 3.0) * 0.04 * min(position.y - niveau, 4.0);   // golfjes vervormen het beeld
                vec4 mv = modelViewMatrix * vec4(sp, 1.0);`)
        .replace('vSterk = sterk * aan', 'vSterk = 0.42 * sterk * aan');
    const spiegelMat = new THREE.ShaderMaterial({
        uniforms, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
        stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc,
        stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.KeepStencilOp,
        vertexShader: spiegelVertex, fragmentShader: mat.fragmentShader,
    });
    const spiegel = new THREE.Points(geo, spiegelMat);
    spiegel.frustumCulled = false;
    spiegel.renderOrder = 2;
    scene.add(spiegel);

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
        palet = (naam && PALET[naam]) || KLASSIEK;
        uniforms.uLicht.value = -1;
        const lijst = actieveVorm ? vormen[actieveVorm] : null;
        const aantal = lijst ? Math.floor(N * (AANDEEL[naam] || 0.7)) : 0;
        for (let k = 0; k < N; k++) {
            const i = volgorde[k];
            if (lijst && k < aantal) { vormPunt[i] = k % lijst.length; groep[i] = lijst[vormPunt[i]][3]; }
            else { vormPunt[i] = -1; groep[i] = 0; }
            inVorm[i] = vormPunt[i] >= 0 ? 1 : 0;
        }
        geo.attributes.aGroep.needsUpdate = true;
        geo.attributes.aInVorm.needsUpdate = true;
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

    // een paar vuurvliegjes die laag bij het gras vliegen, verlichten het gras
    const lampIndex = new Int32Array(LAMPJES).fill(-1);
    let lampTeller = 0;
    function kiesLampjes(cz) {
        if (lampTeller++ % 20 === 0) {
            const goed = (i) => {
                const y = pos[i * 3 + 1], dz = cz - pos[i * 3 + 2];
                return y < 3.2 && dz > 2 && dz < 34 && Math.abs(pos[i * 3]) < 26;
            };
            for (let k = 0; k < LAMPJES; k++) {
                if (lampIndex[k] >= 0 && goed(lampIndex[k])) continue;     // houden zolang hij laag vliegt
                lampIndex[k] = -1;
                grasUniforms.uLampjes.value[k].w = 0;                      // nieuwe lamp begint uit
                for (let poging = 0; poging < 60; poging++) {
                    const i = Math.floor(Math.random() * N);
                    if (goed(i) && !lampIndex.includes(i)) { lampIndex[k] = i; break; }
                }
            }
        }
        const aan = uniforms.uAan.value;
        grasUniforms.uLampjes.value.forEach((l, k) => {
            const i = lampIndex[k];
            if (i < 0) { l.w += (0 - l.w) * 0.1; return; }
            // gloed volgt het knipperen een beetje, en dooft zacht uit als hij hoog vliegt
            const hoogte = pos[i * 3 + 1];
            const doel = aan * Math.max(0, 1 - hoogte / 3.2) * (0.6 + 0.4 * Math.sin(klok.elapsedTime * 1.5 + fase[i]));
            l.set(pos[i * 3], hoogte, pos[i * 3 + 2], l.w + (doel - l.w) * 0.1);
        });
    }

    function frame() {
        const dt = Math.min(klok.getDelta(), 0.07);
        const t = klok.elapsedTime;
        uniforms.uTijd.value = t;
        boomUniforms.uTijd.value = t;
        grasUniforms.uTijd.value = t;
        grasUniforms.uDageraad.value = uniforms.uDageraad.value;
        waterUniforms.uTijd.value = t;
        waterUniforms.uDageraad.value = uniforms.uDageraad.value;
        // kleuren rustig laten overlopen naar die van de nieuwe vorm
        const zacht = Math.min(1, dt * 1.6);
        for (let k = 0; k < 3; k++) doelK[k].set(...palet.k[Math.min(k, palet.k.length - 1)]);
        uniforms.uK1.value.lerp(doelK[0], zacht); uniforms.uK2.value.lerp(doelK[1], zacht); uniforms.uK3.value.lerp(doelK[2], zacht);
        uniforms.uDrie.value += ((palet.k.length > 2 ? 1 : 0) - uniforms.uDrie.value) * zacht;
        uniforms.uRgb.value += ((palet.rgb || 0) - uniforms.uRgb.value) * zacht;
        const mixStap = Math.min(1, dt * 1.4);
        for (let i = 0; i < N; i++) kleurMix[i] += ((vormPunt[i] >= 0 ? 1 : 0.22) - kleurMix[i]) * mixStap;
        geo.attributes.aMix.needsUpdate = true;
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
        kiesLampjes(cz);

        // mist
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
