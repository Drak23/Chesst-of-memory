import { colores } from "./colores.js";
import { agregarObjeto, tieneObjeto, OBJETOS } from "./inventario.js";
import { progreso } from "./minijuego.js";

//  Figuras: 0 círculo, 1 cuadrado, 2 triángulo, 3 rectángulo.(nota para mi jaja)

const RESPUESTA = [0, 1, 2, 3];   // combinación correcta
const INICIAL = [2, 0, 3, 1];     // combinación con la que empieza
 
export function cargarPuzzle(k) {
    const {
        add, rect, text, pos, anchor, color, outline, area, rgb, vec2, wait,
        onKeyPress, onDraw, go, scene, width, height,
        drawCircle, drawRect, drawPolygon,
    } = k;
 
    const CASILLA = 150;
    const SEPARACION = 10;
    const FIGURA = rgb(41, 36, 27);
 
    scene("puzzle", ({ id = "figuras", recompensa = "llave", volver = {} } = {}) => {
        const cx = width() / 2;
        const cy = height() / 2;
        const posiciones = [...INICIAL];
        let terminado = false;
 
        // Fondo
        add([rect(width(), height()), pos(0, 0), color(colores.fondo)]);
 
        add([
            text("Encuentra la combinación", { size: 38, font: "monospace" }),
            pos(cx, cy - 190),
            anchor("center"),
            color(colores.dorado),
        ]);
 
        // Panel de madera
        const anchoPanel = 4 * CASILLA + 3 * SEPARACION + 48;
        add([
            rect(anchoPanel, CASILLA + 48),
            pos(cx, cy),
            anchor("center"),
            color("#382c21"),
            outline(4, "#866b41"),
        ]);
 
        const mensaje = add([
            text("", { size: 30, font: "monospace" }),
            pos(cx, cy + 150),
            anchor("center"),
            color(46, 204, 113),
        ]);
        add([
            text("CLIC: cambiar figura     ESC: salir", { size: 16, font: "monospace" }),
            pos(cx, height() - 50),
            anchor("center"),
            color(colores.gris),
        ]);
 
        // x del centro de la casilla i
        const centroX = (i) => cx - ((4 * CASILLA + 3 * SEPARACION) / 2) + CASILLA / 2 + i * (CASILLA + SEPARACION);
 
        function comprobar() {
            if (posiciones.every((p, i) => p === RESPUESTA[i])) ganar();
        }
 
        function ganar() {
            terminado = true;
            const consegui = agregarObjeto(recompensa) || tieneObjeto(recompensa);
            if (!consegui) {
                // Sin espacio en el inventario: no se da por resuelto, para no perder la recompensa
                mensaje.text = "Tu inventario está lleno.";
                wait(1.4, () => go("juego", { ...volver, mensaje: "Tu inventario está lleno." }));
                return;
            }
            progreso[id] = true; // queda resuelto para siempre
            mensaje.text = "¡Correcto!";
            wait(1.3, () => go("juego", { ...volver, mensaje: `Obtuviste: ${OBJETOS[recompensa].nombre}` }));
        }
 
        // Casillas (botones)
        for (let i = 0; i < 4; i++) {
            const casilla = add([
                rect(CASILLA, CASILLA),
                pos(centroX(i), cy),
                anchor("center"),
                color("#b5a17a"),
                outline(2, "#786343"),
                area(),
            ]);
            casilla.onHover(() => { if (!terminado) casilla.color = rgb(210, 189, 145); });
            casilla.onHoverEnd(() => { casilla.color = rgb(181, 161, 122); });
            casilla.onClick(() => {
                if (terminado) return;
                posiciones[i] = (posiciones[i] + 1) % 4;
                comprobar();
            });
        }
 
        // Figuras dentro de las casillas
        onDraw(() => {
            for (let i = 0; i < 4; i++) {
                const x = centroX(i);
                switch (posiciones[i]) {
                    case 0: // círculo
                        drawCircle({ pos: vec2(x, cy), radius: 40, color: FIGURA });
                        break;
                    case 1: // cuadrado
                        drawRect({ pos: vec2(x - 40, cy - 40), width: 80, height: 80, color: FIGURA });
                        break;
                    case 2: // triángulo
                        drawPolygon({
                            pts: [vec2(x, cy - 40), vec2(x + 44, cy + 40), vec2(x - 44, cy + 40)],
                            color: FIGURA,
                        });
                        break;
                    default: // rectángulo
                        drawRect({ pos: vec2(x - 50, cy - 25), width: 100, height: 50, color: FIGURA });
                }
            }
        });
 
        onKeyPress("escape", () => go("juego", volver));
    });
}