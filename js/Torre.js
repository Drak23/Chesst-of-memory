import { colores } from "./colores.js";
import { agregarObjeto, OBJETOS } from "./inventario.js";
import { progreso } from "./minijuego.js";
 

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
 
export function cargarTorre(k) {
    const {
        add, rect, text, sprite, pos, anchor, color, outline, opacity, area, body, scale, rgb, rand,
        wait, destroy, shake, dt, clamp, go, scene, width, height,
        onKeyDown, onKeyPress, onUpdate, isKeyDown,
    } = k;
 
    const ESC = height() / 800;
    const OX = (width() - 800 * ESC) / 2;
    const gx = (x) => OX + x * ESC;
    const gy = (y) => y * ESC;
    const gl = (n) => n * ESC;
    const tam = (n) => Math.round(n * ESC);
 
    // Carga del sprite de La Torre solo si el archivo existe (así no da error si aún no lo tienes)
    let jefeListo = false;
    if (SPRITE_JEFE.archivo && typeof fetch === "function") {
        fetch(SPRITE_JEFE.archivo, { method: "HEAD" })
            .then((r) => {
                if (!r.ok) return;
                const n = SPRITE_JEFE.cuadros;
                const carga = k.loadSprite("torre_jefe", SPRITE_JEFE.archivo, {
                    sliceX: n,
                    filter: "nearest", // pixel art nítido
                    anims: { idle: { from: 0, to: n - 1, loop: true, speed: SPRITE_JEFE.fps } },
                });
                if (carga && typeof carga.then === "function") carga.then(() => (jefeListo = true)).catch(() => {});
                else setTimeout(() => (jefeListo = true), 500);
            })
            .catch(() => {});
    }
 
    // ---------------- Jefe ----------------
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
 
            // Con sprite
            if (jefeListo) {
                const torre = add([
                    sprite("torre_jefe", { anim: "idle", height: gl(SPRITE_JEFE.alto) }),
                    pos(gx(110), gy(115)),
                    anchor("center"),
                    color(255, 255, 255),
                ]);
                return {
                    alerta(on) { torre.color = on ? rgb(255, 110, 110) : rgb(255, 255, 255); },
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
 
        atacar(etapa, jugador, visor, alGolpear, narrador) {
            visor.alerta(true);
            narrador("¡ALERTA! La Torre está preparando una embestida...");
 
            const horizontal = rand(0, 1) > 0.5;
            const targetY = horizontal ? rand(260, 660) : 0;
            const targetX = !horizontal ? rand(60, 680) : 0;
            const aviso = etapa === 3 ? 0.9 : etapa === 2 ? 1.2 : 1.6;
 
            const zona = add([
                rect(gl(horizontal ? 720 : 60), gl(horizontal ? 60 : 480)),
                pos(gx(horizontal ? 40 : targetX), gy(horizontal ? targetY : 240)),
                color(255, 50, 50),
                opacity(0.35),
                area(),
                "hazard",
            ]);
 
            wait(aviso, () => {
                zona.opacity = 0.85;
                if (jugador.isColliding(zona)) alGolpear();
                wait(0.5, () => {
                    destroy(zona);
                    visor.alerta(false);
                });
            });
        },
    };
 
    // ---------------- Jugador ----------------
    const Jugador = {
        crear() {
            const LADO = gl(30); // tamaño del cuerpo (las colisiones); el sprite se dibuja encima
 
            const jugador = add([
                rect(LADO, LADO),
                pos(gx(60), gy(330)),
                opacity(0), // el cuerpo no se ve: solo sirve para chocar con muros y zonas
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
 
            jugador.onUpdate(() => {
                jugador.pos.x = clamp(jugador.pos.x, gx(25), gx(745));
                jugador.pos.y = clamp(jugador.pos.y, gy(225), gy(725));
 
                // Vista y animación según hacia dónde camina (igual que en el juego)
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
 
    // ---------------- Escena principal ----------------
    scene("torre", ({ volver = {} } = {}) => {
        const estado = {
            currentStage: 1,
            deliveries: 0,
            requiredDeliveries: 2,
            hasItem: false,
            playerHealth: 3,
            isInvulnerable: false,
        };
 
        add([rect(width(), height()), pos(0, 0), color(15, 15, 20)]);
 
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
 
        // Zona de juego
        add([rect(gl(760), gl(540)), pos(gx(20), gy(220)), color(18, 20, 28), outline(3, rgb(255, 38, 0))]);
 
        add([rect(gl(70), gl(70)), pos(gx(40), gy(240)), color(40, 180, 80), outline(2, rgb(255, 255, 255)), area(), "pointA"]);
        add([text("ORIGEN\n  (A)", { size: tam(12), font: "monospace" }), pos(gx(75), gy(275)), anchor("center"), color(255, 255, 255)]);
 
        add([rect(gl(70), gl(70)), pos(gx(690), gy(670)), color(220, 160, 40), outline(2, rgb(255, 255, 255)), area(), "pointB"]);
        add([text("ALTAR\n  (B)", { size: tam(12), font: "monospace" }), pos(gx(725), gy(705)), anchor("center"), color(255, 255, 255)]);
 
        // Muros de cada etapa: [x, y, ancho, alto]
        const muros = [];
        function construirMuros(etapa) {
            muros.forEach((m) => destroy(m));
            muros.length = 0;
 
            const disenos = {
                1: [[180, 240, 20, 240], [580, 420, 20, 240], [200, 460, 240, 20]],
                2: [[180, 240, 20, 240], [580, 420, 20, 240], [200, 460, 240, 20], [420, 320, 220, 20]],
                3: [[180, 240, 20, 240], [580, 420, 20, 240], [200, 460, 240, 20], [420, 320, 220, 20], [360, 560, 20, 140]],
            };
 
            disenos[etapa].forEach((w) => {
                muros.push(add([
                    rect(gl(w[2]), gl(w[3])),
                    pos(gx(w[0]), gy(w[1])),
                    color(70, 70, 95),
                    outline(2, rgb(130, 130, 160)),
                    area(),
                    body({ isStatic: true }),
                ]));
            });
        }
        construirMuros(1);
 
        const jugador = Jugador.crear();
 
        function avanzarEtapa() {
            estado.deliveries = 0;
            estado.currentStage++;
 
            if (estado.currentStage === 2) {
                estado.requiredDeliveries = 3;
                construirMuros(2);
                hudEtapa.text = "ETAPA: 2 (COMPLICACIÓN AMBIENTAL)";
                hudMsg.text = "Narrador: 'Nuevos muros bloquean el centro.'";
                hudProgreso.text = `Entregas: 0 / ${estado.requiredDeliveries}  |  Item: NINGUNO`;
                visor.etapa(2);
            } else if (estado.currentStage === 3) {
                estado.requiredDeliveries = 3;
                construirMuros(3);
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
 
    // ---------------- Derrota ----------------
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
 
    // ---------------- Victoria ----------------
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