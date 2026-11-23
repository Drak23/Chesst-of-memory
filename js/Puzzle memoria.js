import { colores } from "./colores.js";
import { progreso } from "./Minijuego.js";

const TOTAL_RONDAS = 3;

// Las 4 luces
const LUCES = [
    { color: [148, 59, 66] },    // rojo
    { color: [57, 91, 128] },    // azul
    { color: [70, 115, 74] },    // verde
    { color: [177, 140, 71] },   // amarillo
];
const brillo = (c, f = 1.8) => c.map((v) => Math.min(255, Math.round(v * f)));   // luz encendida: más clara

export function cargarPuzzleMemoria(k) {
    const {
        add, rect, text, pos, anchor, color, opacity, outline, area, rgb, wait, go, scene, width, height,
        onKeyPress,
    } = k;

    scene("puzzle_memoria", ({ id = "memoria", volver = {} } = {}) => {
        const W = width();
        const H = height();
        const cx = W / 2;

        let secuencia = [];
        let paso = 0;
        let ronda = 0;
        let bloqueado = true;
        let activo = true;   // false al salir de la escena (para que no sigan las esperas)
        const esperar = (s) => new Promise((resolver) => wait(s, resolver));

        // Pantalla 
        add([rect(W, H), pos(0, 0), color(colores.fondo)]);

        const pw = 520;
        const ph = 600;
        const px = cx - pw / 2;
        const py = (H - ph) / 2;
        add([rect(pw, ph), pos(px, py), color(41, 33, 30), outline(4, rgb(117, 88, 59))]);

        const rondaTexto = add([
            text("Tres pruebas aguardan...", { size: 26, font: "Georgia" }),
            pos(cx, py + 50),
            anchor("center"),
            color(217, 197, 165),
        ]);

        // Las 4 luces en cuadrícula de 2 x 2
        const gap = 14;
        const bw = (pw - 60 - gap) / 2;
        const bh = 130;
        const gx0 = px + 30;
        const gy0 = py + 100;
        const botones = LUCES.map((l, i) => {
            const b = add([
                rect(bw, bh),
                pos(gx0 + (i % 2) * (bw + gap), gy0 + Math.floor(i / 2) * (bh + gap)),
                color(...l.color),
                opacity(0.5),
                outline(3, rgb(102, 80, 57)),
                area(),
            ]);
            b.onClick(() => pulsar(i));
            return b;
        });

        const mensaje = add([
            text("Observa y recuerda...", { size: 22, font: "Georgia", width: pw - 60, align: "center" }),
            pos(cx, py + 100 + 2 * bh + gap + 50),
            anchor("center"),
            color(217, 197, 165),
        ]);

        const comenzar = add([
            rect(260, 56),
            pos(cx, py + ph - 55),
            anchor("center"),
            color(73, 56, 45),
            outline(2, rgb(117, 88, 59)),
            area(),
        ]);
        const comenzarTexto = add([
            text("Activar mecanismo", { size: 22, font: "Georgia" }),
            pos(cx, py + ph - 55),
            anchor("center"),
            color(255, 255, 255),
        ]);

        add([
            text("CLIC: elegir luz     ESC: salir", { size: 16, font: "monospace" }),
            pos(cx, H - 40),
            anchor("center"),
            color(colores.gris),
        ]);

        // Luces 
        function encender(i) {
            botones[i].opacity = 1;
            botones[i].color = rgb(...brillo(LUCES[i].color));
        }
        function apagar(i) {
            botones[i].opacity = 0.5;
            botones[i].color = rgb(...LUCES[i].color);
        }

        //  Lógica 
        comenzar.onClick(() => {
            if (!bloqueado || secuencia.length > 0) return;
            comenzar.hidden = true;
            comenzarTexto.hidden = true;
            secuencia = [Math.floor(Math.random() * 4)];
            ronda = 0;
            siguienteRonda();
        });

        // Después de cada ronda hay un color más
        async function siguienteRonda() {
            ronda++;
            secuencia.push(Math.floor(Math.random() * 4));
            rondaTexto.text = `Ronda ${ronda} de ${TOTAL_RONDAS}`;
            await mostrarSecuencia();
        }

        async function mostrarSecuencia() {
            bloqueado = true;
            paso = 0;
            mensaje.text = "Observa las luces...";
            await esperar(0.7);
            for (const n of secuencia) {
                if (!activo) return;
                encender(n);
                await esperar(0.55);
                apagar(n);
                await esperar(0.25);
            }
            if (!activo) return;
            bloqueado = false;
            mensaje.text = "¡Repite la secuencia!";
        }

        async function pulsar(i) {
            if (bloqueado || !activo) return;
            encender(i);
            wait(0.16, () => apagar(i));

            // Si se equivoca
            if (i !== secuencia[paso]) {
                bloqueado = true;
                mensaje.text = "¡Incorrecto! Intenta otra vez";
                await esperar(0.9);
                await mostrarSecuencia();
                return;
            }

            // Si lo hace bien
            paso++;
            if (paso === secuencia.length) {
                bloqueado = true;
                if (ronda === TOTAL_RONDAS) {
                    terminar();
                } else {
                    mensaje.text = "¡Correcto!";
                    await esperar(0.85);
                    await siguienteRonda();
                }
            }
        }

        function terminar() {
            mensaje.text = "¡Puzzle completado!";
            rondaTexto.text = "¡Todas las rondas superadas!";
            progreso[id] = true;   // queda resuelto para siempre
            wait(1.6, () => {
                activo = false;
                go("juego", { ...volver, mensaje: "El mecanismo se activó." });
            });
        }

        onKeyPress("escape", () => {
            activo = false;
            go("juego", volver);
        });
    });
}