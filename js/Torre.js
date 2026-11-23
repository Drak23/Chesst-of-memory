import { colores } from "./colores.js";
import { agregarObjeto, OBJETOS } from "./Inventario.js";
import { progreso } from "./Minijuego.js";
import { crearDialogo } from "./Dialogo.js";
 

const RECOMPENSA = "llave_hierro";

const ESCALA_JUGADOR = 1.5;   // cuánto se agranda el sprite (cada cuadro es de 32 x 32 px)

// La Torre (recuadro de arriba a la izquierda). Es opcional: si el archivo no existe
// se usa el rectángulo provisional. Pon archivo: null para no buscarlo.
const SPRITE_JEFE = {
    archivo: "assets/sprites/torresprite-Sheet.png", // hoja horizontal con los cuadros de La Torre
    cuadros: 5,                       // cuántos cuadros tiene la hoja (de izquierda a derecha)
    fps: 6,                           // velocidad de la animación si tiene varios cuadros
    alto: 130,                        // alto en el recuadro (el recuadro mide 180, diseño de 800 x 800)
};
 
// ESCENARIOS 
// archivo: la imagen del escenario (640 x 360, el dibujo va dentro).
// dibujo: [x0, y0, x1, y1] en píxeles de la imagen = el rectángulo que ocupa el dibujo
const ARENAS = {
    inicial: { archivo: "assets/Esenarios/bossfight1.png", dibujo: [148, 99, 492, 343] }, // etapa 1
    normal:  { archivo: "assets/Esenarios/bossfight.png",  dibujo: [67, 99, 572, 343] },  // etapas 2 y 3
};
const ARTE = 1.5; // cuánto se agranda el escenario (unidades del diseño de 800 x 800 por píxel de la imagen)

//   puntos: "esquinas" = A arriba a la izquierda y B abajo a la derecha (como estaban);
//           "centro"   = A al centro-izquierda y B al centro-derecha.
//   muros:  [fx, fy, ancho, alto]  fx, fy = posición dentro del escenario (0 a 1); ancho y alto en el diseño.
const ETAPAS = {
    1: { arena: "inicial", puntos: "esquinas", muros: [] },
    2: { arena: "normal", puntos: "esquinas", muros: [[0.3, 0.2, 20, 130], [0.7, 0.55, 20, 130], [0.4, 0.62, 150, 20]] },
    3: { arena: "normal", puntos: "centro",   muros: [[0.3, 0.12, 20, 130], [0.7, 0.58, 20, 130], [0.45, 0.62, 150, 20], [0.45, 0.28, 150, 20]] },
};
const LADO_PUNTO = 60;   // tamaño de A y B
const MARGEN_PUNTO = 50; // distancia de A y B al borde del escenario (en las esquinas)
const INSET_CENTRO = 60; // distancia de A y B al borde (cuando van al centro)

// Geometría de cada escenario en el diseño de 800 x 800 (el centro del dibujo queda en 400, 490)
for (const a of Object.values(ARENAS)) {
    const [x0, y0, x1, y1] = a.dibujo;
    a.cx = (x0 + x1 + 1) / 2;
    a.cy = (y0 + y1 + 1) / 2;
    a.L = 400 - ((x1 - x0 + 1) / 2) * ARTE;
    a.R = 400 + ((x1 - x0 + 1) / 2) * ARTE;
    a.T = 490 - ((y1 - y0 + 1) / 2) * ARTE;
    a.B = 490 + ((y1 - y0 + 1) / 2) * ARTE;
}

// Sprites de La Torre al atacar (una imagen de 32 x 32 cada uno).
//   abajo  = ataque de columna (la zona roja cae de arriba a abajo)
//   frente = ataque de franja (la zona roja cruza de lado a lado)
const SPRITES_ATAQUE = {
    abajo:  "assets/sprites/torredownattack.png",
    frente: "assets/sprites/torrefrontattack.png",
};

// La Torre cruzando el escenario al atacar (usa los sprites de ataque de arriba)
const TORRE_ATAQUE = {
    tam: 80,        // tamaño del sprite en el escenario (diseño de 800 x 800)
    duracion: 0.7,  // segundos que tarda en cruzar la zona
};

export function cargarTorre(k) {
    const {
        add, rect, text, sprite, pos, anchor, color, outline, opacity, area, body, scale, rgb, rand, z, vec2,
        wait, destroy, shake, dt, clamp, go, scene, width, height, tween, easings,
        onKeyDown, onKeyPress, onUpdate, isKeyDown,
    } = k;
 
    const ESC = height() / 800;
    const OX = (width() - 800 * ESC) / 2;
    const gx = (x) => OX + x * ESC;
    const gy = (y) => y * ESC;
    const gl = (n) => n * ESC;
    const tam = (n) => Math.round(n * ESC);

    const mascaras = {};
    for (const [id, a] of Object.entries(ARENAS)) {
        k.loadSprite(`torre_arena_${id}`, a.archivo, { filter: "nearest" });
        if (typeof Image === "undefined") continue;
        const img = new Image();
        img.onload = () => {
            try {
                const c = document.createElement("canvas");
                c.width = img.width;
                c.height = img.height;
                const g = c.getContext("2d", { willReadFrequently: true });
                g.drawImage(img, 0, 0);
                const d = g.getImageData(0, 0, c.width, c.height).data;
                const m = new Uint8Array(c.width * c.height);
                for (let i = 0; i < m.length; i++) {
                    m[i] = d[i * 4 + 3] > 0 ? 1 : 0; // cualquier píxel del dibujo es piso
                }
                mascaras[id] = { w: c.width, h: c.height, m };
            } catch (e) { /* sin máscara: se usa el rectángulo del dibujo */ }
        };
        img.src = a.archivo;
    }

    function caminable(id, sx, sy) {
        const a = ARENAS[id];
        const px = Math.floor(a.cx + ((sx - OX) / ESC - 400) / ARTE);
        const py = Math.floor(a.cy + (sy / ESC - 490) / ARTE);
        const m = mascaras[id];
        if (m) return px >= 0 && py >= 0 && px < m.w && py < m.h && m.m[py * m.w + px] === 1;
        const [x0, y0, x1, y1] = a.dibujo;
        return px >= x0 && px <= x1 && py >= y0 && py <= y1;
    }
 
    // Carga de sprites 
    const listos = {};   // nombre -> true cuando ya se puede usar
    function cargarOpcional(nombre, archivo, opciones) {
        if (!archivo || typeof fetch !== "function") return;
        fetch(archivo, { method: "HEAD" })
            .then((r) => {
                if (!r.ok) return;
                const carga = k.loadSprite(nombre, archivo, { filter: "nearest", ...opciones });
                if (carga && typeof carga.then === "function") carga.then(() => (listos[nombre] = true)).catch(() => {});
                else setTimeout(() => (listos[nombre] = true), 500);
            })
            .catch(() => {});
    }
    const n = SPRITE_JEFE.cuadros;
    cargarOpcional("torre_jefe", SPRITE_JEFE.archivo, {
        sliceX: n,
        anims: { idle: { from: 0, to: n - 1, loop: true, speed: SPRITE_JEFE.fps } },
    });
    for (const [tipo, archivo] of Object.entries(SPRITES_ATAQUE)) cargarOpcional(`torre_ataque_${tipo}`, archivo, {});

    const Jefe = {
        // Devuelve { alerta(on), etapa(n) }: lo único que el resto del juego necesita del visor
        crearVisor() {
            add([
                rect(gl(180), gl(180)),
                pos(gx(20), gy(20)),
                color(30, 30, 40),
                outline(3, rgb(255, 50, 80)),
            ]);
            add([
                text("LA TORRE", { size: tam(16), font: "monospace" }),
                pos(gx(110), gy(40)),
                anchor("center"),
                color(255, 80, 100),
            ]);
 
            // Con sprite (el de reposo y/o los de ataque)
            const hayReposo = !!listos.torre_jefe;
            const hayAtaque = !!(listos.torre_ataque_abajo || listos.torre_ataque_frente);
            if (hayReposo || hayAtaque) {
                const crear = (nombre, opts) => add([
                    sprite(nombre, { ...opts, height: gl(SPRITE_JEFE.alto) }),
                    pos(gx(110), gy(115)),
                    anchor("center"),
                    color(255, 255, 255),
                ]);
                const reposo = hayReposo ? crear("torre_jefe", { anim: "idle" }) : null;
                const ataque = {};
                for (const tipo of Object.keys(SPRITES_ATAQUE)) {
                    if (!listos[`torre_ataque_${tipo}`]) continue;
                    ataque[tipo] = crear(`torre_ataque_${tipo}`, {});
                    ataque[tipo].hidden = true;
                }
                // Si no hay sprite de reposo, se usa el de ataque "frente" también en reposo
                const respaldo = reposo ? null : (ataque.frente || Object.values(ataque)[0]);
                if (respaldo) respaldo.hidden = false;
                return {
                    alerta(on, tipo = "abajo") {
                        const elegido = on ? (ataque[tipo] || Object.values(ataque)[0] || null) : null;
                        if (reposo) reposo.hidden = !!elegido;
                        for (const t in ataque) ataque[t].hidden = ataque[t] !== elegido && !(respaldo === ataque[t] && !elegido);
                        const tinte = on ? rgb(255, 110, 110) : rgb(255, 255, 255);
                        if (reposo) reposo.color = tinte;
                        for (const t in ataque) ataque[t].color = tinte;
                    },
                    etapa() {},
                };
            }
 
            // Rectángulo provisional
            const bossSprite = add([
                rect(gl(80), gl(100)),
                pos(gx(110), gy(115)),
                anchor("center"),
                color(80, 80, 100),
                outline(2, rgb(200, 200, 220)),
            ]);
            const bossEyes = add([
                rect(gl(50), gl(10)),
                pos(gx(110), gy(95)),
                anchor("center"),
                color(0, 255, 200),
            ]);
            return {
                alerta(on) { bossEyes.color = on ? rgb(255, 0, 0) : rgb(0, 255, 200); },
                etapa(n) { bossSprite.color = n === 2 ? rgb(120, 80, 80) : rgb(180, 50, 50); },
            };
        },
 
        // La zona roja avisa por dónde va a pasar; después La Torre (su sprite de ataque) cruza esa zona
        // en la dirección del ataque y solo golpea si te alcanza mientras pasa.
        atacar(etapa, jugador, visor, alGolpear, narrador, geo) {
            narrador("¡ALERTA! La Torre está preparando una embestida...");

            const aviso = etapa === 3 ? 0.9 : etapa === 2 ? 1.2 : 1.6;
            const GROSOR = 60;
            const cantidad = etapa === 3 ? 2 : 1;
            const zonas = [];   // { zona, horizontal, x, y, dir }
            let tipo = "abajo";
            for (let i = 0; i < cantidad; i++) {
                const horizontal = rand(0, 1) > 0.5;
                if (i === 0) tipo = horizontal ? "frente" : "abajo";
                const x = horizontal ? geo.L : rand(geo.L + 5, geo.R - GROSOR - 5);
                const y = horizontal ? rand(geo.T + 5, geo.B - GROSOR - 5) : geo.T;
                const dir = horizontal && rand(0, 1) > 0.5 ? -1 : 1; // las franjas pueden ir a la izquierda o a la derecha
                zonas.push({
                    zona: add([
                        rect(gl(horizontal ? geo.R - geo.L : GROSOR), gl(horizontal ? GROSOR : geo.B - geo.T)),
                        pos(gx(x), gy(y)),
                        color(255, 50, 50),
                        opacity(0.35),
                        area(),
                        "hazard",
                    ]),
                    horizontal, x, y, dir,
                });
            }

            visor.alerta(true, tipo);

            wait(aviso, () => {
                const hayTorre = (z) => listos[`torre_ataque_${z.horizontal ? "frente" : "abajo"}`];

                // Sin sprite de ataque: se golpea al instante en toda la zona
                let golpeado = false;
                for (const z of zonas) {
                    if (hayTorre(z)) continue;
                    z.zona.opacity = 0.85;
                    if (jugador.isColliding(z.zona)) golpeado = true;
                }
                if (golpeado) alGolpear();

                // Con sprite: La Torre cruza la zona
                const TAM = TORRE_ATAQUE.tam;
                let yaGolpeo = false;
                for (const z of zonas) {
                    if (!hayTorre(z)) continue;
                    z.zona.opacity = 0.5;
                    const largo = z.horizontal ? geo.R - geo.L : geo.B - geo.T;
                    const desde = -TAM / 2;
                    const hasta = largo + TAM / 2;
                    const torre = add([
                        sprite(`torre_ataque_${z.horizontal ? "frente" : "abajo"}`, { height: gl(TAM), flipX: z.horizontal && z.dir < 0 }),
                        pos(0, 0),
                        anchor("center"),
                        area(),
                        k.z(5),
                        "torre_ataque",
                    ]);
                    let t = 0;
                    const ponerEn = (d) => {
                        const r = z.dir < 0 && z.horizontal ? largo - d : d;   // d = avance recorrido
                        if (z.horizontal) torre.pos = vec2(gx(geo.L + r), gy(z.y + GROSOR / 2));
                        else torre.pos = vec2(gx(z.x + GROSOR / 2), gy(geo.T + r));
                    };
                    ponerEn(desde);
                    torre.onUpdate(() => {
                        t += dt();
                        const f = Math.min(t / TORRE_ATAQUE.duracion, 1);
                        ponerEn(desde + (hasta - desde) * f);
                        if (!yaGolpeo && jugador.isColliding(torre)) {
                            yaGolpeo = true;
                            alGolpear();
                        }
                        if (f >= 1 && !torre.terminado) {
                            torre.terminado = true;
                            destroy(torre);
                            destroy(z.zona);
                            z.zona = null;
                        }
                    });
                }

                // Sin sprite: la zona se quita a los 0.5 s. Con sprite: cuando termina de pasar.
                wait(Math.max(0.5, TORRE_ATAQUE.duracion + 0.1), () => {
                    zonas.forEach((z) => { if (z.zona) destroy(z.zona); });
                    visor.alerta(false);
                });
            });
        },
    };

    // Jugador 
    const Jugador = {
        crear() {
            const LADO = gl(30); // tamaño del cuerpo (las colisiones); el sprite se dibuja encima
 
            const jugador = add([
                rect(LADO, LADO),
                pos(gx(100), gy(490)),
                opacity(0),
                area(),
                body(),
                "player",
            ]);
 
            // Las tres vistas del protagonista; solo se muestra la de la dirección actual.
            // Los pies quedan en la base del cuerpo.
            const vistas = {};
            for (const nombre of ["lado", "arriba", "abajo"]) {
                vistas[nombre] = jugador.add([
                    sprite(`prota_${nombre}`, { anim: "quieto" }),
                    pos(LADO / 2, LADO),
                    anchor("bot"),
                    scale(ESCALA_JUGADOR),
                    opacity(1),
                ]);
                vistas[nombre].hidden = nombre !== "abajo";
            }
 
            // Marca amarilla sobre la cabeza cuando lleva la reliquia
            const reliquia = jugador.add([
                rect(gl(14), gl(14)),
                pos(LADO / 2, -gl(26)),
                anchor("center"),
                color(255, 220, 50),
                outline(2, rgb(255, 255, 255)),
            ]);
            reliquia.hidden = true;
 
            // Interfaz sencilla para el resto del juego
            let direccion = "abajo";
            let mirando = 1;
            jugador.visual = {
                cargando(si) { reliquia.hidden = !si; },
                parpadeo(si) { for (const n in vistas) vistas[n].opacity = si ? 0.4 : 1; },
            };
 
            const VEL = 220 * ESC;
            onKeyDown("left", () => jugador.move(-VEL, 0));
            onKeyDown("a", () => jugador.move(-VEL, 0));
            onKeyDown("right", () => jugador.move(VEL, 0));
            onKeyDown("d", () => jugador.move(VEL, 0));
            onKeyDown("up", () => jugador.move(0, -VEL));
            onKeyDown("w", () => jugador.move(0, -VEL));
            onKeyDown("down", () => jugador.move(0, VEL));
            onKeyDown("s", () => jugador.move(0, VEL));
 
            // piso del escenario 
            jugador.arena = "inicial";
            let ultima = jugador.pos.clone();
            const libre = (x, y) =>
                [[x + 1, y + 1], [x + LADO - 1, y + 1], [x + 1, y + LADO - 1], [x + LADO - 1, y + LADO - 1]]
                    .every(([a, b]) => caminable(jugador.arena, a, b));
            jugador.colocar = (cx, cy, arena) => {
                jugador.arena = arena;
                jugador.pos.x = cx - LADO / 2;
                jugador.pos.y = cy - LADO / 2;
                ultima = jugador.pos.clone();
            };

            jugador.onUpdate(() => {
                const { x, y } = jugador.pos;
                if (libre(x, y)) ultima = jugador.pos.clone();
                else if (libre(x, ultima.y)) { jugador.pos.y = ultima.y; ultima.x = x; }
                else if (libre(ultima.x, y)) { jugador.pos.x = ultima.x; ultima.y = y; }
                else jugador.pos = ultima.clone();
 
                // Vista y animación según hacia dónde camina 
                const dx = (isKeyDown("a") || isKeyDown("left") ? -1 : 0) + (isKeyDown("d") || isKeyDown("right") ? 1 : 0);
                const dy = (isKeyDown("w") || isKeyDown("up") ? -1 : 0) + (isKeyDown("s") || isKeyDown("down") ? 1 : 0);
                const moviendo = dx !== 0 || dy !== 0;
                if (dx !== 0) mirando = dx;
                if (moviendo) direccion = dx !== 0 ? "lado" : dy < 0 ? "arriba" : "abajo";
 
                for (const n in vistas) vistas[n].hidden = n !== direccion;
                const v = vistas[direccion];
                const anim = moviendo ? "caminar" : "quieto";
                if (v.curAnim() !== anim) v.play(anim);
                v.flipX = direccion === "lado" && mirando < 0;
            });
            return jugador;
        },
 
        interacciones(jugador, estado, actualizarHUD, avanzarEtapa) {
            jugador.onCollide("pointA", () => {
                if (!estado.hasItem) {
                    estado.hasItem = true;
                    jugador.visual.cargando(true);
                    actualizarHUD("item_picked");
                }
            });
            jugador.onCollide("pointB", () => {
                if (estado.hasItem) {
                    estado.hasItem = false;
                    estado.deliveries++;
                    jugador.visual.cargando(false);
                    if (estado.deliveries >= estado.requiredDeliveries) avanzarEtapa();
                    else actualizarHUD("item_delivered");
                }
            });
        },
 
        recibirDaño(jugador, estado, actualizarHUD, alPerder) {
            if (estado.isInvulnerable) return;
            estado.playerHealth--;
            estado.isInvulnerable = true;
            shake(12);
            actualizarHUD("damage");
            if (estado.playerHealth <= 0) {
                alPerder();
            } else {
                jugador.visual.parpadeo(true);
                wait(1.2, () => {
                    jugador.visual.parpadeo(false);
                    estado.isInvulnerable = false;
                });
            }
        },
    };
 
    //  Escena principal 
    scene("torre", ({ volver = {} } = {}) => {
        const estado = {
            currentStage: 1,
            deliveries: 0,
            requiredDeliveries: 2,
            hasItem: false,
            playerHealth: 3,
            isInvulnerable: false,
        };
 
        add([rect(width(), height()), pos(0, 0), color(15, 15, 20), z(-10)]);
 
        const visor = Jefe.crearVisor();
 
        add([
            rect(gl(560), gl(180)),
            pos(gx(220), gy(20)),
            color(25, 25, 35),
            outline(3, rgb(80, 120, 200)),
        ]);
 
        const hudEtapa = add([text("ETAPA: 1 (APRENDIZAJE)", { size: tam(16), font: "monospace" }), pos(gx(240), gy(40)), color(0, 240, 255)]);
        const hudProgreso = add([text("Entregas: 0 / 2  |  Item: NINGUNO", { size: tam(14), font: "monospace" }), pos(gx(240), gy(80)), color(255, 255, 100)]);
        const hudSalud = add([text("Salud Implícita: [ III ]", { size: tam(14), font: "monospace" }), pos(gx(240), gy(115)), color(100, 255, 100)]);
        const hudMsg = add([text("Narrador: 'Lleva la reliquia desde A hasta B'", { size: tam(13), font: "monospace" }), pos(gx(240), gy(150)), color(160, 160, 180)]);
 
        function actualizarHUD(evento) {
            const barras = ["", "[ I ]", "[ II ]", "[ III ]"];
            hudSalud.text = `Salud Implícita: ${barras[estado.playerHealth] || "[ AGOTADA ]"}`;
 
            if (evento === "item_picked") {
                hudProgreso.text = `Entregas: ${estado.deliveries} / ${estado.requiredDeliveries}  |  Item: LLEVAS RELIQUIA`;
                hudMsg.text = "Narrador: '¡Reliquia recogida! Corre al Altar (B)'";
            } else if (evento === "item_delivered") {
                hudProgreso.text = `Entregas: ${estado.deliveries} / ${estado.requiredDeliveries}  |  Item: NINGUNO`;
                hudMsg.text = "Narrador: '¡Entrega registrada! Ve por la siguiente.'";
            } else if (evento === "damage") {
                hudMsg.text = "¡IMPACTO RECIBIDO! Esquiva la zona roja.";
            }
        }
 
        let arte = null;
        const puntos = [];
        function armarEscenario(etapa) {
            const cfg = ETAPAS[etapa];
            const ar = ARENAS[cfg.arena];

            if (arte) destroy(arte);
            arte = add([
                sprite(`torre_arena_${cfg.arena}`, { width: gl(640 * ARTE), height: gl(360 * ARTE) }),
                pos(gx(400 - ar.cx * ARTE), gy(490 - ar.cy * ARTE)),
                z(-5),
            ]);

            puntos.forEach((p) => destroy(p));
            puntos.length = 0;
            let ax, ay, bx, by;
            if (cfg.puntos === "esquinas") {
                ax = ar.L + MARGEN_PUNTO; ay = ar.T + MARGEN_PUNTO;
                bx = ar.R - MARGEN_PUNTO; by = ar.B - MARGEN_PUNTO;
            } else {
                ax = ar.L + INSET_CENTRO + LADO_PUNTO / 2; bx = ar.R - INSET_CENTRO - LADO_PUNTO / 2;
                ay = by = (ar.T + ar.B) / 2;
            }
            const m = LADO_PUNTO / 2;
            puntos.push(add([rect(gl(LADO_PUNTO), gl(LADO_PUNTO)), pos(gx(ax - m), gy(ay - m)), color(40, 180, 80), outline(2, rgb(255, 255, 255)), area(), "pointA"]));
            puntos.push(add([text("ORIGEN\n  (A)", { size: tam(11), font: "monospace" }), pos(gx(ax), gy(ay)), anchor("center"), color(255, 255, 255)]));
            puntos.push(add([rect(gl(LADO_PUNTO), gl(LADO_PUNTO)), pos(gx(bx - m), gy(by - m)), color(220, 160, 40), outline(2, rgb(255, 255, 255)), area(), "pointB"]));
            puntos.push(add([text("ALTAR\n  (B)", { size: tam(11), font: "monospace" }), pos(gx(bx), gy(by)), anchor("center"), color(255, 255, 255)]));

            // Muros
            muros.forEach((w) => destroy(w));
            muros.length = 0;
            for (const [fx, fy, w, h] of cfg.muros) {
                muros.push(add([
                    rect(gl(w), gl(h)),
                    pos(gx(ar.L + (ar.R - ar.L) * fx), gy(ar.T + (ar.B - ar.T) * fy)),
                    color(70, 70, 95),
                    outline(2, rgb(130, 130, 160)),
                    area(),
                    body({ isStatic: true }),
                ]));
            }
            return { ax, ay };
        }
        const muros = [];
        let inicio = armarEscenario(1);

        const jugador = Jugador.crear();
        jugador.colocar(gx(inicio.ax), gy(inicio.ay), ETAPAS[1].arena);

        function cambiarEtapa(n) {
            const cfg = ETAPAS[n];
            const p = armarEscenario(n);
            jugador.colocar(gx(p.ax), gy(p.ay), cfg.arena);
        }

        function avanzarEtapa() {
            estado.deliveries = 0;
            estado.currentStage++;
 
            if (estado.currentStage === 2) {
                estado.requiredDeliveries = 3;
                cambiarEtapa(2);
                hudEtapa.text = "ETAPA: 2 (COMPLICACIÓN AMBIENTAL)";
                hudMsg.text = "Narrador: 'Nuevos muros bloquean el camino.'";
                hudProgreso.text = `Entregas: 0 / ${estado.requiredDeliveries}  |  Item: NINGUNO`;
                visor.etapa(2);
            } else if (estado.currentStage === 3) {
                estado.requiredDeliveries = 3;
                cambiarEtapa(3);
                hudEtapa.text = "ETAPA: 3 (FRENESÍ DE LA TORRE)";
                hudMsg.text = "Narrador: '¡La Torre ataca con mayor frecuencia!'";
                hudProgreso.text = `Entregas: 0 / ${estado.requiredDeliveries}  |  Item: NINGUNO`;
                visor.etapa(3);
            } else {
                go("torre_victoria", { volver });
            }
        }
 
        Jugador.interacciones(jugador, estado, actualizarHUD, avanzarEtapa);
 
        let relojAtaque = 0;
        onUpdate(() => {
            relojAtaque += dt();
            const intervalo = estado.currentStage === 3 ? 2.5 : 4.0;
 
            if (relojAtaque >= intervalo) {
                relojAtaque = 0;
                Jefe.atacar(
                    estado.currentStage,
                    jugador,
                    visor,
                    () => Jugador.recibirDaño(jugador, estado, actualizarHUD, () => go("torre_derrota", { volver })),
                    (msg) => { hudMsg.text = msg; },
                    ARENAS[ETAPAS[estado.currentStage].arena],
                );
            }
        });
 
        add([
            text("WASD / flechas: mover     ESC: salir", { size: 14, font: "monospace" }),
            pos(12, height() - 24),
            color(colores.gris),
        ]);
        onKeyPress("escape", () => go("juego", volver));
    });
 
    // diálogo antes de la pelea 
    // Recibe { id, escena, volver } desde la puerta y al terminar entra a la escena de la pelea.
    scene("torre_intro", ({ escena = "torre", id = "torre", volver = {} } = {}) => {
        const ar = ARENAS.inicial;
        const SUELO = 500;   // altura (diseño) donde pisan los personajes

        add([rect(width(), height()), pos(0, 0), color(15, 15, 20), z(-10)]);
        add([
            sprite("torre_arena_inicial", { width: gl(640 * ARTE), height: gl(360 * ARTE) }),
            pos(gx(400 - ar.cx * ARTE), gy(490 - ar.cy * ARTE)),
            z(-5),
        ]);
        add([
            text("ESC: saltar el diálogo", { size: 14, font: "monospace" }),
            pos(12, height() - 24),
            color(colores.gris),
            z(950),
        ]);

        // Fundido de entrada
        const velo = add([rect(width(), height()), pos(0, 0), color(0, 0, 0), opacity(1), z(1000)]);
        tween(1, 0, 0.5, (v) => (velo.opacity = v));

        // El protagonista entra caminando por la izquierda
        const xProta = ar.L + 140;
        const prota = add([
            sprite("prota_lado", { anim: "caminar", height: gl(110) }),
            pos(gx(ar.L - 60), gy(SUELO)),
            anchor("bot"),
            z(3),
        ]);
        tween(gx(ar.L - 60), gx(xProta), 1.2, (v) => (prota.pos.x = v));
        wait(1.25, () => prota.play("quieto"));

        // La Torre salta desde arriba y cae frente a él
        const xTorre = ar.R - 150;
        function caerTorre(seguir) {
            const cae = listos.torre_ataque_abajo ? "torre_ataque_abajo" : listos.torre_jefe ? "torre_jefe" : null;
            const crear = (nombre) => nombre
                ? add([sprite(nombre, nombre === "torre_jefe" ? { anim: "idle", height: gl(140) } : { height: gl(140) }), pos(gx(xTorre), -gl(160)), anchor("bot"), z(4)])
                : add([rect(gl(80), gl(110)), pos(gx(xTorre), -gl(160)), anchor("bot"), color(80, 80, 100), outline(2, rgb(200, 200, 220)), z(4)]);
            let torre = crear(cae);
            tween(-gl(160), gy(SUELO), 0.45, (v) => (torre.pos.y = v), easings.easeInQuad);
            wait(0.45, () => {
                shake(18);
                if (listos.torre_jefe && cae !== "torre_jefe") {
                    destroy(torre);
                    torre = crear("torre_jefe");
                    torre.pos.y = gy(SUELO);
                }
                wait(0.8, seguir);
            });
        }

        // Si no se supera el minijuego de escape (progreso.escape === false) la línea cambia (por si se agrega el minujego de escape)
        const casiEscapa = progreso.escape === false;

        const comenzar = () => {
            tween(0, 1, 0.4, (v) => (velo.opacity = v));
            wait(0.45, () => go(escena, { id, volver }));
        };

        const dialogo = crearDialogo(k, { saltarConEsc: true });
        wait(1.5, () => {
            dialogo.hablar([
                { texto: "Vlad regresa por el pasillo y consigue abrir la puerta que conduce a la sección de Kareem." },
                { quien: "Vlad", texto: "Me pregunto si estarán por aquí..." },
                { texto: "Vlad entra en la última habitación y percibe un olor desagradable." },
                { quien: "Vlad", texto: "Agh... Huele fatal aquí." },
                { quien: "Kareem", texto: "Vaya, vaya... Parece que una rata inmunda escapó de su jaula. Una rata a la que me encantará torturar." },
                { quien: "Vlad", texto: "Aquí la única rata que veo eres tú." },
                { quien: "Kareem", texto: "Mis amos me ordenaron matarte, pero la señorita Ramberry insistió en mantenerte con vida. Por eso tuve que encerrarte." },
                { quien: "Kareem", texto: "Pero ahora no hay nadie que me impida acabar contigo." },
                {
                    quien: "Vlad",
                    texto: casiEscapa
                        ? "La última vez escapé de ti. ¿Todavía te duele?"
                        : "La última vez casi conseguí escapar de ti. Esta vez no pienso fallar.",
                },
                { quien: "Kareem", texto: "¡Insolente! No importa..." },
                { texto: "Kareem salta desde el segundo piso de la habitación y cae frente a Vlad." },
                { accion: caerTorre },   // *salta del segundo piso y cae*
                { quien: "Kareem", texto: "¡Porque aquí es donde morirás!" },
            ], comenzar);
        });
    });

    // Derrota 
    scene("torre_derrota", ({ volver = {} } = {}) => {
        add([rect(width(), height()), pos(0, 0), color(15, 15, 20)]);
        add([
            text("HAS SIDO APLASTADO POR LA TORRE\n\nESPACIO: reintentar     ESC: salir", {
                size: 26,
                font: "monospace",
                align: "center",
            }),
            pos(width() / 2, height() / 2),
            anchor("center"),
            color(255, 70, 90),
        ]);
        onKeyPress("space", () => go("torre", { volver }));
        onKeyPress("escape", () => go("juego", volver));
    });
 
    // Victoria
    scene("torre_victoria", ({ volver = {} } = {}) => {
        progreso.torre = true;          // queda resuelto para siempre
        agregarObjeto(RECOMPENSA);      // la llave de hierro
 
        add([rect(width(), height()), pos(0, 0), color(15, 15, 20)]);
        add([
            text("¡VICTORIA!\n\nHas derrocado a La Torre y obtenido la Llave de Hierro.\n\nPresiona ESPACIO para continuar", {
                size: 26,
                font: "monospace",
                align: "center",
                width: width() - 160,
            }),
            pos(width() / 2, height() / 2),
            anchor("center"),
            color(80, 255, 120),
        ]);
        const salir = () => go("juego", { ...volver, mensaje: `Obtuviste: ${OBJETOS[RECOMPENSA].nombre}` });
        onKeyPress("space", salir);
        onKeyPress("enter", salir);
    });
}