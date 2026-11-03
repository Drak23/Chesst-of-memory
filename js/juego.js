import { colores } from "./colores.js";
 
const S = 4;
const W = 320 * S;
const H = 180 * S;
 
const SALAS = {
    vestibulo: {
        imagen: "assets/vestibulo.jpeg",
        suelo: { x1: 14, x2: 306, y1: 128, y2: 172 },
        puertas: [
            {
                nombre: "Puerta azul",
                rect: [20, 44, 32, 94],
                zona: [8, 125, 80, 172],
                color: "#2f6fd0",
                destino: { sala: "pasillo", spawn: [92, 160] },
            },
            {
                nombre: "Puerta naranja",
                rect: [264, 46, 38, 90],
                zona: [250, 125, 312, 172],
                color: "#e07a1f",
                destino: null,
                mensaje: "Está atascada... todavía no hay nada detrás.",
            },
            {
                nombre: "Escaleras",
                tipo: "escalera",
                rect: [110, 120, 100, 26],
                zona: [108, 128, 212, 148],
                destino: { sala: "pasillo", spawn: [92, 160] },
            },
        ],
    },
 
    pasillo: {
        imagen: "assets/pasillo.jpeg",
        suelo: { x1: 14, x2: 306, y1: 130, y2: 172 },
        puertas: [
            {
                nombre: "Puerta izquierda",
                rect: [22, 40, 30, 108],
                zona: [8, 138, 80, 172],
                color: "#2f6fd0",
                destino: { sala: "vestibulo", spawn: [92, 150] },
            },
            {
                nombre: "Puerta azul",
                rect: [112, 62, 36, 58],
                zona: [100, 130, 166, 172],
                color: "#2f6fd0",
                destino: null,
                mensaje: "Un cuarto vacío. (Aquí irá algo después)",
            },
            {
                nombre: "Puerta de madera",
                rect: [174, 62, 56, 60],
                zona: [166, 130, 240, 172],
                color: "#6b7a90",
                destino: null,
                mensaje: "Está cerrada con llave.",
                cerrada: true,
            },
            {
                nombre: "Puerta derecha",
                rect: [268, 40, 32, 92],
                zona: [254, 130, 312, 172],
                color: "#2f6fd0",
                destino: null,
                mensaje: "No habre esta cerrada",
            },
        ],
    },
};
 
const SALA_INICIAL = "vestibulo";
const SPAWN_INICIAL = [160, 160];
 
export function cargarJuego(k) {
    const {
        add, rect, circle, sprite, pos, color, opacity, z, text,
        anchor, scale, outline, vec2, go, scene, onKeyPress, onUpdate,
        onDraw, isKeyDown, dt, wait, tween, drawRect, easings, clamp,
    } = k;
 
    // Carga de los escenarios (guárdados en la carpeta assets/)
    for (const id in SALAS) k.loadSprite(id, SALAS[id].imagen);
 
    scene("juego", (datos = {}) => {
        const salaId = datos.sala || SALA_INICIAL;
        const sala = SALAS[salaId];
        const spawn = datos.spawn || SPAWN_INICIAL;
 
        let ocupado = false; // true mientras se abre una puerta
        let depurar = false;
 
        //  Fondo 
        add([sprite(salaId, { width: W, height: H }), pos(0, 0), z(-10)]);
 
        //  Personaje (provisional, se reemplazará por un sprite más adelante) 
        const jugador = add([
            pos(spawn[0] * S, spawn[1] * S),
            anchor("center"),
            scale(1),
            z(10),
        ]);
        jugador.add([circle(34), scale(1, 0.3), pos(0, 0), anchor("center"), color(0, 0, 0), opacity(0.3)]);
        const cuerpo = jugador.add([
            rect(54, 120, { radius: 14 }),
            pos(0, 0),
            anchor("bot"),
            color(colores.dorado),
            outline(4, "#2b2208"),
        ]);
        jugador.add([
            circle(26),
            pos(0, -148),
            anchor("center"),
            color("#f1eadb"),
            outline(4, "#2b2208"),
        ]);
        // Ojitos que indican hacia dónde mira(probicional)
        const ojos = jugador.add([
            circle(4),
            pos(8, -150),
            anchor("center"),
            color("#111019"),
        ]);
 
        // Perspectiva: más lejos = más pequeño
        const sue = sala.suelo;
        function ajustarPerspectiva() {
            const t = (jugador.pos.y / S - sue.y1) / (sue.y2 - sue.y1);
            const e = 0.65 + clamp(t, 0, 1) * 0.6;
            jugador.scale = vec2(e, e);
            jugador.z = 10 + jugador.pos.y / 100;
        }
        ajustarPerspectiva();
 
        //  Interfaz 
        const caja = add([
            rect(560, 44, { radius: 8 }),
            pos(W / 2, H - 40),
            anchor("center"),
            color(17, 16, 25),
            opacity(0.85),
            outline(2, colores.dorado),
            z(200),
        ]);
        const aviso = add([
            text("", { size: 20, font: "monospace" }),
            pos(W / 2, H - 40),
            anchor("center"),
            color(colores.blanco),
            z(201),
        ]);
        const mensaje = add([
            text("", { size: 26, font: "monospace" }),
            pos(W / 2, 50),
            anchor("center"),
            color(colores.dorado),
            outline(5, k.rgb(17, 16, 25)),
            z(201),
        ]);
        add([
            text("WASD/Flechas: mover   E: abrir   F1: zonas   ESC: menú", {
                size: 14,
                font: "monospace",
            }),
            pos(12, 10),
            color(colores.gris),
            z(201),
        ]);
 
        function decir(t, seg = 1.8) {
            mensaje.text = t;
            const mio = t;
            wait(seg, () => { if (mensaje.text === mio) mensaje.text = ""; });
        }
 
        //  Transición 
        const velo = add([
            rect(W, H),
            pos(0, 0),
            color(0, 0, 0),
            opacity(1),
            z(1000),
        ]);
        tween(1, 0, 0.4, (v) => (velo.opacity = v));
 
        function irA(destino) {
            ocupado = true;
            tween(0, 1, 0.35, (v) => (velo.opacity = v));
            wait(0.4, () => go("juego", { sala: destino.sala, spawn: destino.spawn }));
        }
 
        //  Puertas 
        function dentro(zona, x, y) {
            return x >= zona[0] && x <= zona[2] && y >= zona[1] && y <= zona[3];
        }
 
        function puertaCercana() {
            const px = jugador.pos.x / S;
            const py = jugador.pos.y / S;
            return sala.puertas.find((p) => dentro(p.zona, px, py));
        }
 
        function abrir(puerta) {
            if (puerta.tipo === "escalera") {
                irA(puerta.destino);
                return;
            }
 
            ocupado = true;
            const [rx, ry, rw, rh] = puerta.rect.map((n) => n * S);
 
            // Interior oscuro que se ve al abrir
            const hueco = add([
                rect(rw, rh),
                pos(rx, ry),
                color("#17131f"),
                z(5),
            ]);
            // Hoja de la puerta que se "abre" (se encoge hacia la bisagra)
            const hoja = add([
                rect(rw, rh),
                pos(rx, ry),
                color(puerta.color || "#6b7a90"),
                outline(3, "#0d0b12"),
                z(6),
            ]);
 
            if (puerta.cerrada) {
                // Intenta abrir pero está con llave: se sacude un poco
                let t = 0;
                const sacudir = k.onUpdate(() => {
                    t += dt();
                    hoja.pos.x = rx + Math.sin(t * 60) * 3;
                });
                decir(puerta.mensaje);
                wait(0.5, () => {
                    sacudir.cancel();
                    destroy(hoja);
                    destroy(hueco);
                    ocupado = false;
                });
                return;
            }
 
            tween(1, 0.2, 0.35, (v) => (hoja.width = rw * v), easings.easeOutQuad);
 
            wait(0.45, () => {
                if (puerta.destino) {
                    irA(puerta.destino);
                } else {
                    decir(puerta.mensaje || "No hay nada aquí.");
                    wait(1.3, () => {
                        tween(0.2, 1, 0.3, (v) => (hoja.width = rw * v));
                        wait(0.35, () => {
                            destroy(hoja);
                            destroy(hueco);
                            ocupado = false;
                        });
                    });
                }
            });
        }
 
        const destroy = k.destroy;
 
        onKeyPress(["e", "enter", "space"], () => {
            if (ocupado) return;
            const p = puertaCercana();
            if (p) abrir(p);
        });
 
        onKeyPress("f1", () => (depurar = !depurar));
        onKeyPress("escape", () => go("menu"));
 
        //  Movimiento 
        const VELOCIDAD = 200;
        let mirando = 1;
 
        onUpdate(() => {
            if (!ocupado) {
                let dx = 0;
                let dy = 0;
                if (isKeyDown("a") || isKeyDown("left")) dx -= 1;
                if (isKeyDown("d") || isKeyDown("right")) dx += 1;
                if (isKeyDown("w") || isKeyDown("up")) dy -= 1;
                if (isKeyDown("s") || isKeyDown("down")) dy += 1;
 
                if (dx !== 0 || dy !== 0) {
                    const dir = vec2(dx, dy).unit();
                    // En perspectiva, el movimiento vertical es más corto
                    const vel = VELOCIDAD * jugador.scale.x;
                    jugador.pos.x += dir.x * vel * 1.4 * dt();
                    jugador.pos.y += dir.y * vel * 0.8 * dt();
                    if (dx !== 0) mirando = dx;
 
                    // Balanceo al caminar
                    cuerpo.pos.y = Math.sin(k.time() * 14) * 3;
                } else {
                    cuerpo.pos.y = 0;
                }
                ojos.pos.x = 8 * mirando;
            }
 
            // Límites del suelo
            jugador.pos.x = clamp(jugador.pos.x, sue.x1 * S, sue.x2 * S);
            jugador.pos.y = clamp(jugador.pos.y, sue.y1 * S, sue.y2 * S);
            ajustarPerspectiva();
 
            // Aviso de interacción
            const cerca = !ocupado ? puertaCercana() : null;
            caja.hidden = !cerca;
            aviso.hidden = !cerca;
            if (cerca) {
                aviso.text = cerca.tipo === "escalera"
                    ? "E: subir / bajar escaleras"
                    : `E: abrir  ${cerca.nombre}`;
            }
        });
 
        //  Ayuda para ajustar zonas (F1) 
        onDraw(() => {
            if (!depurar) return;
            drawRect({
                pos: vec2(sue.x1 * S, sue.y1 * S),
                width: (sue.x2 - sue.x1) * S,
                height: (sue.y2 - sue.y1) * S,
                fill: false,
                outline: { color: k.rgb(0, 255, 0), width: 3 },
            });
            for (const p of sala.puertas) {
                drawRect({
                    pos: vec2(p.rect[0] * S, p.rect[1] * S),
                    width: p.rect[2] * S,
                    height: p.rect[3] * S,
                    fill: false,
                    outline: { color: k.rgb(255, 60, 60), width: 3 },
                });
                drawRect({
                    pos: vec2(p.zona[0] * S, p.zona[1] * S),
                    width: (p.zona[2] - p.zona[0]) * S,
                    height: (p.zona[3] - p.zona[1]) * S,
                    fill: false,
                    outline: { color: k.rgb(255, 220, 0), width: 2 },
                });
            }
        });
    });
}