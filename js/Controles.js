import { colores } from "./colores.js";


// Cada recuadro: flecha, sprite del protagonista (cargados en juego.js) y si va volteado
const CELDAS = [
    { flecha: "←", sprite: "prota_lado", voltear: true },    // izquierda
    { flecha: "→", sprite: "prota_lado", voltear: false },   // derecha
    { flecha: "↓", sprite: "prota_abajo", voltear: false },  // abajo
    { flecha: "↑", sprite: "prota_arriba", voltear: false }, // arriba
];

const TEXTO = [
    "Movimiento: WASD / Flechas (Derecha, Arriba, Abajo, Izquierda)",
    "E: interactuar con puertas y cofres",
    "Inventario: Tab",
];

export function crearControles(k) {
    const { add, rect, text, sprite, pos, anchor, color, opacity, outline, z, destroy, wait, onKeyPress, onMousePress } = k;

    let capa = null;
    let alCerrar = null;
    let abiertoEn = -1;

    function construir() {
        const W = k.width();
        const H = k.height();
        capa = add([pos(0, 0), z(800), "controles"]);

        // Fondo oscuro
        capa.add([rect(W, H), pos(0, 0), color(0, 0, 0), opacity(0.55), z(0)]);

        // Panel negro
        const pw = 700;
        const ph = 580;
        const px = (W - pw) / 2;
        const py = (H - ph) / 2;
        capa.add([rect(pw, ph, { radius: 10 }), pos(px, py), color(8, 8, 10), outline(3, colores.dorado), z(1)]);

        // Los 4 recuadros
        const margen = 30;
        const sep = 18;
        const cw = (pw - margen * 2 - sep) / 2;
        const ch = 150;
        CELDAS.forEach((c, i) => {
            const cx = px + margen + (i % 2) * (cw + sep);
            const cy = py + margen + Math.floor(i / 2) * (ch + sep);
            capa.add([rect(cw, ch, { radius: 6 }), pos(cx, cy), color(245, 245, 245), z(2)]);

            // Flecha de la dirección
            capa.add([
                text(c.flecha, { size: 46, font: "monospace" }),
                pos(cx + cw * 0.28, cy + ch / 2),
                anchor("center"),
                color(20, 20, 20),
                z(3),
            ]);

            // El protagonista caminando en esa dirección
            let spr = null;
            try {
                spr = capa.add([
                    sprite(c.sprite, { anim: "caminar", height: 112, flipX: !!c.voltear }),
                    pos(cx + cw * 0.64, cy + ch - 12),
                    anchor("bot"),
                    z(3),
                ]);
            } catch (e) { /* si el sprite no está cargado, el recuadro queda solo con la flecha */ }
            if (!spr) return;
        });

        // Cuadro de texto
        const ty = py + margen + 2 * ch + sep + 22;
        const th = py + ph - 30 - ty;
        capa.add([rect(pw - margen * 2, th, { radius: 6 }), pos(px + margen, ty), color(122, 120, 120), z(2)]);
        capa.add([
            text(TEXTO.join("\n\n"), { size: 17, font: "monospace", width: pw - margen * 2 - 40 }),
            pos(px + margen + 20, ty + 22),
            color(255, 255, 255),
            z(3),
        ]);

        capa.add([
            text("E / ESPACIO / clic: continuar", { size: 14, font: "monospace" }),
            pos(px + pw - margen, py + ph - 12),
            anchor("botright"),
            color(colores.gris),
            z(3),
        ]);
    }

    function cerrar() {
        if (!capa) return;
        destroy(capa);
        capa = null;
        const f = alCerrar;
        alCerrar = null;
        // Pequeña pausa: así la misma tecla (E) no activa otra cosa en el juego al cerrarse
        if (f) wait(0.15, f);
    }

    function mostrar(fin) {
        if (capa) return;
        alCerrar = fin || null;
        abiertoEn = k.time();
        construir();
    }

    const intentar = () => {
        if (!capa) return;
        if (k.time() - abiertoEn < 0.4) return;   // evita que la tecla que venía del diálogo la cierre al instante
        cerrar();
    };
    onKeyPress(["e", "space", "enter", "escape"], intentar);
    onMousePress(intentar);

    return { mostrar, abierto: () => capa !== null };
}