import { colores } from "./colores.js";
import { crearInventario, agregarObjeto, tieneObjeto, yaRecogido, OBJETOS } from "./inventario.js";
import { progreso } from "./minijuego.js";
 
// Todas las medidas de SALAS están en el tamaño de tus imágenes: 640 x 360.
// S es cuánto se agranda en pantalla (2 = ventana de 1280 x 720).
const S = 2;
const W = 640 * S;
const H = 360 * S;
 
const SALAS = {
    vestibulo: {
        imagen: "assets/Esenarios/entrada.png",
        // Piso caminable: polígono con los puntos [x, y] donde pueden pisar los pies.
        // Sigue la base de las paredes (diagonales) y sube por los escalones hasta el descanso de arriba, frente a la puerta.
        suelo: [
            [20, 310],    // esquina izquierda (junto a la puerta izquierda)
            [120, 274],   // esquina inferior izquierda de las escaleras
            [245, 282],   // esquina inferior derecha de las escaleras
            [292, 158],   // esquina superior izquierda de las escaleras
            [348, 158],   // esquina superior derecha de las escaleras
            [395, 282],    // esquina inferior izquierda de las escaleras
            [500, 274],   // esquina inferior derecha de las escaleras
            [630, 320],    // esquina derecha (junto a la puerta derecha)
            [635, 352],  // esquina inferior derecha
            [20, 352],   // esquina inferior izquierda
        ],
        // Tamaño del personaje según su altura en pantalla: [y, escala].
        // Arriba de las escaleras se ve más pequeño porque está más lejos.
        escala: [[158, 0.38], [284, 0.73], [352, 1.25]],
        puertas: [
            {
                nombre: "Puerta Torre",
                rect: [40, 88, 64, 188],
                zona: [40, 236, 104, 300],
                destino: { sala: "pasillo", spawn: [264, 250] },
                animacion: { imagen: "assets/Puertas/animationdoor-Sheet.png", cuadros: 3, pos: [29, 81], fps: 8 },
            },
            {
                nombre: "Puerta alfil",
                rect: [528, 92, 76, 180],
                zona: [528, 236, 590, 300],
                destino: null,
                animacion: { imagen: "assets/Puertas/animationdoor2-Sheet.png", cuadros: 4, pos: [521, 86], fps: 8 },
                mensaje: "Está atascada... todavía no hay nada detrás.",
                cerrada: true,
            },
            {
                nombre: "Puerta de las escaleras",
                rect: [286, 88, 72, 64],
                zona: [286, 130, 352, 160],
                destino: null,
                animacion: { imagen: "assets/Puertas/Puertareja.png", cuadros: 4, pos: [270, 68], fps: 8 },
                mensaje: "Está atascada... todavía no hay nada detrás.",
                cerrada: true,
            },
        ],
    },
 
    pasillo: {
        imagen: "assets/Esenarios/pasillo.png",
        // Piso del pasillo: el fondo toca la base de las puertas del centro (y = 240) y las orillas siguen la base de las paredes, que se abren hacia el frente.
        suelo: [
            [20, 305],    // esquina izquierda (junto a la puerta izquierda)
            [194, 240],   // fondo, esquina izquierda
            [450, 240],   // fondo, esquina derecha
            [620, 310],   // esquina derecha (junto a la puerta derecha)
            [620, 352],
            [20, 352],
        ],
        escala: [[240, 0.62], [352, 1.25]],
        // Objetos en el piso: [x, y] donde quedan (dentro del piso caminable).
        objetos: [],
        puertas: [
            {
                nombre: "Puerta izquierda",
                rect: [44, 80, 60, 216],
                zona: [44, 246, 104, 300],
                destino: { sala: "habitacion1", spawn: [560, 318] },
                animacion: { imagen: "assets/Puertas/animationdoor1-Sheet.png", cuadros: 3, pos: [32, 80], fps: 8 },
            },
            {
                nombre: "Puerta entrada",
                rect: [224, 124, 72, 116],
                zona: [224, 200, 296, 244],
                destino: { sala: "vestibulo", spawn: [124, 300] },
                animacion: { imagen: "assets/Puertas/Pasilloanimation-Sheet.png", cuadros: 3, pos: [212, 123], fps: 8 },
            },
            {
                nombre: "Puerta de La Torre",
                rect: [348, 124, 72, 116],
                zona: [348, 200, 420, 244],
                destino: null,
                mensaje: "Está cerrada con llave.",
                requiere: "llave",        // objeto necesario para intentar abrirla
                animacion: { imagen: "assets/Puertas/Torreanimation-Sheet.png", cuadros: 3, pos: [331, 124], fps: 8 },
                minijuegos: [
                    { escena: "minijuego", id: "madera" },  // el círculo (con la llave)
                    { escena: "torre", id: "torre" },       // La Torre (después de abrirla)
                ],
                mensajeAbierta: "Ya derrotaste a La Torre. (Aquí irá lo que sigue.)",
            },
            {
                nombre: "Puerta derecha",
                rect: [536, 90, 64, 184],
                zona: [536, 220, 604, 290],
                destino: { sala: "habitacion", spawn: [80, 318] },
                animacion: { imagen: "assets/Puertas/animation door2-Sheet.png", cuadros: 3, pos: [522, 81], fps: 8 },
            },
        ],
    },
 
    habitacion1: {
        imagen: "assets/Esenarios/habitacion1.png",
        // Piso: sigue la base de las paredes y se detiene antes de la mesa del fondo
        suelo: [[10, 314], [192, 250], [458, 250], [630, 316], [630, 352], [10, 352]],
        escala: [[250, 0.62], [352, 1.25]],
        // Objetos en el piso: [x, y] donde quedan (dentro del piso caminable)
        objetos: [
            { id: "nota_1", pos: [190, 300] },
        ],
        puertas: [
            {
                nombre: "Puerta de salida",
                rect: [530, 85, 78, 215],
                zona: [530, 262, 600, 300],
                destino: { sala: "pasillo", spawn: [76, 310] },
                animacion: { imagen: "assets/Puertas/door-Sheet.png", cuadros: 3, pos: [527, 83], fps: 8, espejo: true },
            },
        ],
    },
    habitacion: {
        imagen: "assets/Esenarios/habitacion.png",
        espejo: true,
        suelo: [[630, 314], [448, 250], [182, 250], [10, 316], [10, 352], [630, 352]],
        escala: [[250, 0.62], [352, 1.25]],
        objetos: [
            { id: "nota_2", pos: [450, 300] },
        ],
        puertas: [
            {
                nombre: "Puerta de salida",
                rect: [42, 85, 78, 215],
                zona: [42, 262, 110, 300],
                destino: { sala: "pasillo", spawn: [570, 290] },
                animacion: { imagen: "assets/Puertas/door-Sheet.png", cuadros: 3, pos: [29, 83], fps: 8  },
            },
            {
                nombre: "Cofre",
                tipo: "cofre",
                rect: [319, 185, 24, 12],
                zona: [300, 202, 360, 260],
                puzzle: "figuras",
                recompensa: "llave",
            },
        ],
    },
};
 
function puntoEnPoligono(poli, x, y) {
    let dentro = false;
    for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
        const [xi, yi] = poli[i];
        const [xj, yj] = poli[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            dentro = !dentro;
        }
    }
    return dentro;
}
 
// Tamaño del personaje según su altura (y) usando los puntos [y, escala] de la sala
function escalaEn(puntos, y) {
    if (y <= puntos[0][0]) return puntos[0][1];
    for (let i = 1; i < puntos.length; i++) {
        const [y0, e0] = puntos[i - 1];
        const [y1, e1] = puntos[i];
        if (y <= y1) return e0 + ((y - y0) / (y1 - y0)) * (e1 - e0);
    }
    return puntos[puntos.length - 1][1];
}
 
// Cuánto se agranda el sprite (32 px por cuadro). Súbelo o bájalo para cambiar el tamaño.
const ESCALA_SPRITE = 6;
 
const SALA_INICIAL = "vestibulo";
const SPAWN_INICIAL = [320, 320];
 
export function cargarJuego(k) {
    const {
        add, rect, circle, sprite, pos, color, opacity, z, text,
        anchor, scale, outline, vec2, go, scene, onKeyPress, onUpdate,
        onDraw, isKeyDown, dt, wait, tween, drawRect, drawPolygon, easings, clamp,
    } = k;
 
    // Carga de los escenarios (guárdados en la carpeta assets/)
    for (const id in SALAS) k.loadSprite(id, SALAS[id].imagen);
 
    // Protagonista: una hoja por vista (cada cuadro de 32 x 32 px)
    const VISTAS = {
        lado:   { archivo: "assets/sprites/Playerfront-Sheet.png",   cuadros: 5 },
        arriba: { archivo: "assets/sprites/backwards-Sheet.png", cuadros: 5 },
        abajo:  { archivo: "assets/sprites/playerfrontview-Sheet.png",  cuadros: 5 },
    };
    for (const [nombre, v] of Object.entries(VISTAS)) {
        k.loadSprite(`prota_${nombre}`, v.archivo, {
            sliceX: v.cuadros,
            filter: "nearest", // pixel art nítido, sin suavizar
            anims: {
                quieto: 0,
                caminar: { from: 0, to: v.cuadros - 1, loop: true, speed: 8 },
            },
        });
    }
 
    // Animaciones de las puertas
    for (const [idSala, datosSala] of Object.entries(SALAS)) {
        datosSala.puertas.forEach((p, i) => {
            if (!p.animacion) return;
            p.animacion.nombre = `puerta_${idSala}_${i}`;
            k.loadSprite(p.animacion.nombre, p.animacion.imagen, {
                sliceX: p.animacion.cuadros,
                filter: "nearest",
            });
        });
    }
 
    scene("juego", (datos = {}) => {
        const salaId = datos.sala || SALA_INICIAL;
        const sala = SALAS[salaId];
        const spawn = datos.spawn || SPAWN_INICIAL;
 
        let ocupado = false; // true mientras se abre una puerta
        let depurar = false;
 
        // Inventario (TAB o I). No se abre mientras una puerta está animándose.
        const inv = crearInventario(k, { puedeAbrir: () => !ocupado });
 
        //  Fondo
        add([sprite(salaId, { width: W, height: H, flipX: !!sala.espejo }), pos(0, 0), z(-10)]);
 
        //  Sombra
        const sombra = add([
            circle(34),
            scale(1, 0.3),
            pos(spawn[0] * S, spawn[1] * S),
            anchor("center"),
            color(0, 0, 0),
            opacity(0.3),
            z(10),
        ]);
 
        const jugador = add([
            pos(spawn[0] * S, spawn[1] * S),
            scale(ESCALA_SPRITE),
            z(10),
        ]);
        const vistas = {};
        for (const nombre of Object.keys(VISTAS)) {
            vistas[nombre] = jugador.add([
                sprite(`prota_${nombre}`, { anim: "quieto" }),
                anchor("bot"),
            ]);
            vistas[nombre].hidden = nombre !== "abajo";
        }
 
        // Perspectiva: más lejos = más pequeño
        const poligono = sala.suelo;
 
        function caminable(px, py) {
            return puntoEnPoligono(poligono, px / S, py / S);
        }
 
        function ajustarPerspectiva() {
            const e = escalaEn(sala.escala, jugador.pos.y / S);
            jugador.scale = vec2(e * ESCALA_SPRITE, e * ESCALA_SPRITE);
            jugador.z = 10 + jugador.pos.y / 100;
            sombra.pos = vec2(jugador.pos.x, jugador.pos.y - 2);
            sombra.scale = vec2(e, e * 0.3);
            sombra.z = jugador.z - 0.5;
        }
        ajustarPerspectiva();
 
        //  Objetos en el piso (cuadros de color que se recogen con E)
        const recogibles = [];
        for (const o of sala.objetos || []) {
            if (yaRecogido(o.id)) continue;
            const def = OBJETOS[o.id];
            const e = escalaEn(sala.escala, o.pos[1]);
            const lado = 26 * e;
            const px = o.pos[0] * S;
            const py = o.pos[1] * S;
            const zObj = 10 + py / 100 - 0.2; // queda detrás del personaje si este está más cerca
 
            const sombraObj = add([
                circle(lado * 0.8),
                scale(1, 0.3),
                pos(px, py),
                anchor("center"),
                color(0, 0, 0),
                opacity(0.3),
                z(zObj - 0.1),
            ]);
            const cuadro = add([
                rect(lado, lado, { radius: 3 }),
                pos(px, py - lado),
                anchor("center"),
                color(def.color),
                outline(3, "#0d0b12"),
                z(zObj),
            ]);
            const base = py - lado;
            const fase = recogibles.length * 1.7;
            cuadro.onUpdate(() => {
                cuadro.pos.y = base + Math.sin(k.time() * 3 + fase) * 3; // flota suavemente
            });
            recogibles.push({ id: o.id, x: o.pos[0], y: o.pos[1], cuadro, sombraObj });
        }
 
        // Quita del piso los objetos que ya se recogieron
        function limpiarRecogidos() {
            for (let i = recogibles.length - 1; i >= 0; i--) {
                if (yaRecogido(recogibles[i].id)) {
                    k.destroy(recogibles[i].cuadro);
                    k.destroy(recogibles[i].sombraObj);
                    recogibles.splice(i, 1);
                }
            }
        }
 
        function objetoCercano() {
            const px = jugador.pos.x / S;
            const py = jugador.pos.y / S;
            return recogibles.find((r) => {
                const dx = px - r.x;
                const dy = (py - r.y) * 1.8; // el eje vertical está aplastado por la perspectiva
                return Math.sqrt(dx * dx + dy * dy) < 34;
            });
        }
 
        function recoger(r) {
            if (!agregarObjeto(r.id) && !tieneObjeto(r.id)) {
                decir("Tu inventario está lleno.");
                return;
            }
            limpiarRecogidos();
            decir(`Obtuviste: ${OBJETOS[r.id].nombre}`);
        }
 
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
            text("WASD/Flechas: mover   E: abrir   TAB: inventario   F2: zonas   ESC: menú", {
                size: 14,
                font: "monospace",
            }),
            pos(12, 20),
            color(colores.rojo),
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
 
        // Mensaje al volver de un puzzle o minijuego
        if (datos.mensaje) wait(0.6, () => decir(datos.mensaje));
 
        function irA(destino) {
            ocupado = true;
            tween(0, 1, 0.35, (v) => (velo.opacity = v));
            wait(0.4, () => {
                if (destino.escena) go(destino.escena, destino.datos);
                else go("juego", { sala: destino.sala, spawn: destino.spawn });
            });
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
 
        // Cofre: si el puzzle no está resuelto, entra al puzzle; si ya lo está, queda vacío
        function abrirCofre(c) {
            if (progreso[c.puzzle]) {
                decir("El cofre está vacío.");
                return;
            }
            irA({
                escena: "puzzle",
                datos: {
                    id: c.puzzle,
                    recompensa: c.recompensa,
                    volver: { sala: salaId, spawn: [jugador.pos.x / S, jugador.pos.y / S] },
                },
            });
        }
 
        function abrir(puerta) {
            if (puerta.tipo === "cofre") {
                abrirCofre(puerta);
                return;
            }
            if (puerta.tipo === "escalera") {
                irA(puerta.destino);
                return;
            }
 
            ocupado = true;
            const [rx, ry, rw, rh] = puerta.rect.map((n) => n * S);
            const anim = puerta.animacion;
            let hueco = null;
            let hoja;
            if (anim) {
                hoja = add([
                    sprite(anim.nombre, { frame: 0, flipX: !!anim.espejo }),
                    pos(anim.pos[0] * S, anim.pos[1] * S),
                    scale(S * (anim.escala || 1)),
                    z(6),
                ]);
            } else {
                // Interior oscuro que se ve al abrir
                hueco = add([
                    rect(rw, rh),
                    pos(rx, ry),
                    color("#17131f"),
                    z(5),
                ]);
                // Sprite de la puerta que se "abre" (se encoge hacia la bisagra)
                hoja = add([
                    rect(rw, rh),
                    pos(rx, ry),
                    color(puerta.color || "#6b7a90"),
                    outline(3, "#0d0b12"),
                    z(6),
                ]);
            }
            const xBase = hoja.pos.x;
            const quitar = () => {
                destroy(hoja);
                if (hueco) destroy(hueco);
            };
 
            // Abre
            function reproducir(alReves, fin) {
                if (!anim) {
                    if (alReves) tween(0.2, 1, 0.3, (v) => (hoja.width = rw * v));
                    else tween(1, 0.2, 0.35, (v) => (hoja.width = rw * v), easings.easeOutQuad);
                    wait(alReves ? 0.35 : 0.45, fin);
                    return;
                }
                const fps = anim.fps || 8;
                for (let i = 1; i < anim.cuadros; i++) {
                    const f = alReves ? anim.cuadros - 1 - i : i;
                    wait(i / fps, () => {
                        if (hoja.exists()) hoja.frame = f;
                    });
                }
                wait(anim.cuadros / fps, fin);
            }
 
            // Bloqueada: marcada como cerrada
            const bloqueada = puerta.cerrada || (puerta.requiere && !tieneObjeto(puerta.requiere));
 
            if (bloqueada) {
                // Intenta abrir pero está con llave: se sacude un poco
                let t = 0;
                const sacudir = k.onUpdate(() => {
                    t += dt();
                    hoja.pos.x = xBase + Math.sin(t * 60) * 3;
                });
                decir(puerta.mensaje);
                wait(0.5, () => {
                    sacudir.cancel();
                    quitar();
                    ocupado = false;
                });
                return;
            }
 
            reproducir(false, () => {
                const lista = puerta.minijuegos || [];
                const pendiente = lista.find((m) => !progreso[m.id]);
                if (pendiente) {
                    // Entra al minijuego que toca y vuelve a este mismo lugar al terminar
                    irA({
                        escena: pendiente.escena,
                        datos: {
                            id: pendiente.id,
                            volver: { sala: salaId, spawn: [jugador.pos.x / S, jugador.pos.y / S] },
                        },
                    });
                } else if (puerta.destino) {
                    irA(puerta.destino);
                } else {
                    const resuelto = lista.length > 0;
                    decir((resuelto && puerta.mensajeAbierta) || puerta.mensaje || "No hay nada aquí.");
                    wait(1.3, () => {
                        reproducir(true, () => {
                            quitar();
                            ocupado = false;
                        });
                    });
                }
            });
        }
 
        const destroy = k.destroy;
 
        onKeyPress(["e", "enter", "space"], () => {
            if (ocupado || inv.estaAbierto()) return;
            const r = objetoCercano();
            if (r) {
                recoger(r);
                return;
            }
            const p = puertaCercana();
            if (p) abrir(p);
        });
 
        onKeyPress("f2", () => (depurar = !depurar));
        onKeyPress("escape", () => {
            if (inv.estaAbierto()) inv.cerrar();
            else go("menu");
        });
 
        // PRUEBA: F3 te da el siguiente objeto del catálogo (bórralo cuando ya no lo necesites)
        onKeyPress("f3", () => {
            const nuevo = Object.keys(OBJETOS).find((id) => agregarObjeto(id));
            decir(nuevo ? `Obtuviste: ${OBJETOS[nuevo].nombre}` : "Ya tienes todos los objetos");
        });
 
        //  Movimiento
        const VELOCIDAD = 200;
        let mirando = 1;
        let direccion = "abajo"; // hacia dónde mira: "lado", "arriba" o "abajo"
 
        // nombre: "quieto" o "caminar", siempre en la vista de la dirección actual
        function animar(nombre) {
            for (const d in vistas) vistas[d].hidden = d !== direccion;
            const v = vistas[direccion];
            if (v.curAnim() !== nombre) v.play(nombre);
            v.flipX = direccion === "lado" && mirando < 0;
        }
 
        onUpdate(() => {
            if (!ocupado && !inv.estaAbierto()) {
                let dx = 0;
                let dy = 0;
                if (isKeyDown("a") || isKeyDown("left")) dx -= 1;
                if (isKeyDown("d") || isKeyDown("right")) dx += 1;
                if (isKeyDown("w") || isKeyDown("up")) dy -= 1;
                if (isKeyDown("s") || isKeyDown("down")) dy += 1;
 
                if (dx !== 0 || dy !== 0) {
                    const dir = vec2(dx, dy).unit();
                    // En perspectiva, el movimiento vertical es más corto
                    const vel = VELOCIDAD * Math.max(jugador.scale.x / ESCALA_SPRITE, 0.7);
                    const nx = jugador.pos.x + dir.x * vel * 1.4 * dt();
                    const ny = jugador.pos.y + dir.y * vel * 0.8 * dt();
                    // Solo avanza si los pies siguen dentro del piso;
                    // si choca en diagonal, se desliza por la pared.
                    if (caminable(nx, ny)) {
                        jugador.pos.x = nx;
                        jugador.pos.y = ny;
                    } else if (caminable(nx, jugador.pos.y)) {
                        jugador.pos.x = nx;
                    } else if (caminable(jugador.pos.x, ny)) {
                        jugador.pos.y = ny;
                    }
                    if (dx !== 0) mirando = dx;
 
                    // Si se mueve de lado (aun en diagonal) se ve de lado;
                    // si solo va hacia arriba o hacia abajo, de espaldas o de frente.
                    direccion = dx !== 0 ? "lado" : dy < 0 ? "arriba" : "abajo";
                    animar("caminar");
                } else {
                    animar("quieto");
                }
            } else {
                animar("quieto");
            }
 
            ajustarPerspectiva();
 
            // Aviso de interacción
            limpiarRecogidos();
            const libre = !ocupado && !inv.estaAbierto();
            const objCerca = libre ? objetoCercano() : null;
            const cerca = libre && !objCerca ? puertaCercana() : null;
            caja.hidden = !(objCerca || cerca);
            aviso.hidden = caja.hidden;
            if (objCerca) {
                aviso.text = `E: recoger  ${OBJETOS[objCerca.id].nombre}`;
            } else if (cerca) {
                aviso.text = cerca.tipo === "escalera"
                    ? "E: subir / bajar escaleras"
                    : `E: abrir  ${cerca.nombre}`;
            }
        });
 
        //  Ayuda para ajustar zonas (F2)
        onDraw(() => {
            if (!depurar) return;
            drawPolygon({
                pts: poligono.map(([x, y]) => vec2(x * S, y * S)),
                fill: false,
                outline: { color: k.rgb(0, 255, 0), width: 3 },
            });
            for (const p of sala.puertas) {
                if (p.animacion) {
                    k.drawSprite({
                        sprite: p.animacion.nombre,
                        frame: 0,
                        flipX: !!p.animacion.espejo,
                        pos: vec2(p.animacion.pos[0] * S, p.animacion.pos[1] * S),
                        scale: vec2(S * (p.animacion.escala || 1)),
                        opacity: 0.55,
                    });
                }
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