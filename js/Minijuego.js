import { colores } from "./colores.js";
 
// Qué minijuegos ya están resueltos (se conserva al cambiar de sala)
export const progreso = {
    madera: false,
    figuras: false, // puzzle de figuras del cofre
    torre: false,   // pelea contra La Torre (detrás de la puerta de madera)
};

export function cargarMinijuego(k) {
    const {
        add, rect, text, pos, anchor, color, rgb, vec2, rand, wait, dt,
        onKeyPress, onMousePress, onUpdate, onDraw, go, scene, width, height,
        drawCircle,
    } = k;
 
    const ACIERTOS_META = 5;   // aciertos seguidos necesarios
    const TOLERANCIA = 25;     // grados de margen
    const VELOCIDAD = 200;     // grados por segundo
    const RADIO = 150;         // radio del aro
 
    scene("minijuego", ({ id = "madera", volver = {} } = {}) => {
        const cx = width() / 2;
        const cy = height() / 2;
 
        let angulo = 0;
        let objetivo = rand(0, 360);
        let direccion = 1;
        let aciertos = ACIERTOS_META;
        let activo = true;
        let destello = 0; // segundos que el aro se ve rojo tras un fallo
 
        // Fondo y textos
        add([rect(width(), height()), pos(0, 0), color(colores.fondo)]);
        add([
            text("Fija el punto cuando coincida con el verde", { size: 22, font: "monospace" }),
            pos(cx, 90),
            anchor("center"),
            color(colores.blanco),
        ]);
        const contador = add([
            text(`Aciertos restantes: ${aciertos}`, { size: 24, font: "monospace" }),
            pos(cx, cy + RADIO + 60),
            anchor("center"),
            color(colores.dorado),
        ]);
        add([
            text("CLIC / ESPACIO: fijar     ESC: salir", { size: 16, font: "monospace" }),
            pos(cx, height() - 50),
            anchor("center"),
            color(colores.gris),
        ]);
 
        // Posición de un punto del aro (0° = arriba, giro hacia la derecha)
        function punto(grados) {
            const r = (grados * Math.PI) / 180;
            return vec2(cx + RADIO * Math.sin(r), cy - RADIO * Math.cos(r));
        }
 
        onUpdate(() => {
            if (destello > 0) destello -= dt();
            if (!activo) return;
            angulo = (angulo + dt() * VELOCIDAD * direccion + 360) % 360;
        });
 
        onDraw(() => {
            drawCircle({
                pos: vec2(cx, cy),
                radius: RADIO,
                fill: false,
                outline: { color: destello > 0 ? rgb(231, 76, 60) : rgb(255, 255, 255), width: 2 },
            });
            if (!activo) return;
            // Punto verde (la meta)
            drawCircle({
                pos: punto(objetivo),
                radius: 12,
                color: rgb(46, 204, 113),
                outline: { color: rgb(34, 34, 34), width: 4 },
            });
            // Punto que gira (el prota)
            drawCircle({
                pos: punto(angulo),
                radius: 12,
                color: rgb(214, 181, 104),
                outline: { color: rgb(34, 34, 34), width: 4 },
            });
        });
 
        function ganar() {
            activo = false;
            contador.text = "¡Listo!";
            wait(0.9, () => {
                progreso[id] = true;   // queda resuelto para siempre
                go("juego", volver);   // regresa a la sala
            });
        }
 
        function intentar() {
            if (!activo) return;
 
            let diferencia = Math.abs(angulo - objetivo);
            diferencia = Math.min(diferencia, 360 - diferencia);
 
            if (diferencia <= TOLERANCIA) {
                aciertos--;
                contador.text = `Aciertos restantes: ${aciertos}`;
                if (aciertos === 0) {
                    ganar();
                } else {
                    direccion *= -1;
                    objetivo = rand(0, 360);
                }
            } else {
                // Fallo: se reinicia la cuenta
                aciertos = ACIERTOS_META;
                contador.text = `Aciertos restantes: ${aciertos}`;
                destello = 0.25;
            }
        }
 
        onMousePress(intentar);
        onKeyPress("space", intentar);
        onKeyPress("escape", () => go("juego", volver));
    });
}