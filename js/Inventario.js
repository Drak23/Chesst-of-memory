import { colores } from "./colores.js";

// Cada objeto puede tener un dibujo:
//   archivo: la imagen    tam: [ancho, alto] de la imagen en píxeles    piso: tamaño al estar en el piso
// Sin "archivo" se ve como un cuadro de "color".
export const OBJETOS = {
    nota_1: {
        nombre: "Nota 1",
        descripcion: "Circulo (1)",
        color: "#e8892b",
        archivo: "assets/Notas/Nota1.png",
        tam: [60, 77],
        piso: 46,
    },
    nota_2: {
        nombre: "Nota 2",
        descripcion: "Rectángulo (4)",
        color: "#e8892b",
        archivo: "assets/Notas/Nota2.png",
        tam: [60, 77],
        piso: 46,
    },
    llave_hierro: {
        nombre: "Llave de alfil",
        descripcion: "Una llave pesada, de hierro oscuro. La Torre la custodiaba.",
        color: "#9aa3ad",
        archivo: "assets/llaves/llavealfil.png",
        tam: [15, 14],
        piso: 30,
    },
    llave: {
        nombre: "Llave torre",
        descripcion: "Una llave pequeña y antigua. Debe abrir una puerta de madera.",
        color: "#f2d11e",
        archivo: "assets/llaves/llavecofre.png",
        tam: [15, 14],
        piso: 30,
    },
};

// Carga los dibujos de los objetos (se llama una vez desde juego.js). El sprite de cada uno se llama "obj_<id>".
export function cargarIconos(k) {
    for (const [id, def] of Object.entries(OBJETOS)) {
        if (!def.archivo) continue;
        k.loadSprite(`obj_${id}`, def.archivo, { filter: "nearest" });
        def.icono = `obj_${id}`;
    }
}

// Tamaño [ancho, alto] de un objeto dibujado para que quepa en un cuadro de lado "max", sin deformarse
export function ajustar(def, max) {
    const [w, h] = def.tam || [1, 1];
    const e = max / Math.max(w, h);
    return [w * e, h * e];
}
 

const MAX_OBJETOS = 12;
const objetos = (globalThis.__objetos ??= []); // ids de los objetos que lleva el jugador
const recogidos = (globalThis.__recogidos ??= new Set()); // objetos que ya se recogieron alguna vez (no vuelven a salir en el piso)
 
export function agregarObjeto(id) {
    if (!OBJETOS[id]) return false;           // no existe en el catálogo
    if (objetos.includes(id)) return false;   // ya lo tiene
    if (objetos.length >= MAX_OBJETOS) return false; // inventario lleno (momentaneo)
    objetos.push(id);
    recogidos.add(id);
    return true;
}
 
export function yaRecogido(id) {
    return recogidos.has(id);
}
 
export function quitarObjeto(id) {
    const i = objetos.indexOf(id);
    if (i === -1) return false;
    objetos.splice(i, 1);
    return true;
}
 
export function tieneObjeto(id) {
    return objetos.includes(id);
}
 
export function listaObjetos() {
    return [...objetos];
}
 

export function crearInventario(k, opciones = {}) {
    const {
        add, rect, text, sprite, pos, anchor, color, opacity, outline,
        z, area, destroy, onKeyPress, onUpdate, clamp,
    } = k;
 
    // Para impedir que se abra en momentos que no son (por ejemplo, mientras se abre una puerta)
    const puedeAbrir = opciones.puedeAbrir || (() => true);
 
    const COLS = 4;
    const FILAS = 3;
    const CASILLA = 104;
    const SEPARACION = 14;
 
    let capa = null;      // contenedor de toda la interfaz
    let sel = 0;          // casilla seleccionada
    let redibujar = false;
 
    function construir() {
        if (capa) destroy(capa);
        capa = add([pos(0, 0), z(500), "inventario"]);
 
        const lista = listaObjetos();
        const W = k.width();
        const H = k.height();
 
        const px = 170;
        const py = 90;
        const pw = 940;
        const ph = 540;
 
        // Fondo oscuro y panel
        capa.add([rect(W, H), pos(0, 0), color(0, 0, 0), opacity(0.72), z(0)]);
        capa.add([
            rect(pw, ph, { radius: 8 }),
            pos(px, py),
            color(colores.fondo),
            outline(3, colores.dorado),
            z(1),
        ]);
 
        // Título y contador
        capa.add([
            text("INVENTARIO", { size: 32, font: "monospace" }),
            pos(px + 40, py + 30),
            color(colores.dorado),
            z(2),
        ]);
        capa.add([
            text(`${lista.length}/${MAX_OBJETOS}`, { size: 20, font: "monospace" }),
            pos(px + pw - 40, py + 38),
            anchor("topright"),
            color(colores.gris),
            z(2),
        ]);
 
        // Casillas
        const gx = px + 40;
        const gy = py + 100;
 
        for (let i = 0; i < COLS * FILAS; i++) {
            const sx = gx + (i % COLS) * (CASILLA + SEPARACION);
            const sy = gy + Math.floor(i / COLS) * (CASILLA + SEPARACION);
            const elegida = i === sel;
 
            const casilla = capa.add([
                rect(CASILLA, CASILLA, { radius: 6 }),
                pos(sx, sy),
                color(elegida ? "#40384a" : colores.boton),
                outline(elegida ? 4 : 2, elegida ? colores.dorado : "#3a3548"),
                area(),
                z(2),
            ]);
 
            casilla.onHover(() => {
                if (sel !== i) {
                    sel = i;
                    redibujar = true;
                }
            });
            casilla.onClick(() => {
                sel = i;
                redibujar = true;
            });
 
            const id = lista[i];
            if (!id) continue;
            const obj = OBJETOS[id];
 
            // Ícono: un cuadro de color con la inicial (se cambiara cuando se tenga el sprite)
            if (obj.icono) {
                const [iw, ih] = ajustar(obj, 64);
                capa.add([
                    sprite(obj.icono, { width: iw, height: ih }),
                    pos(sx + CASILLA / 2, sy + 46),
                    anchor("center"),
                    z(3),
                ]);
            } else {
                capa.add([
                    rect(60, 60, { radius: 4 }),
                    pos(sx + CASILLA / 2, sy + 46),
                    anchor("center"),
                    color(obj.color),
                    outline(3, "#0d0b12"),
                    z(3),
                ]);
            }
            capa.add([
                text(obj.nombre, { size: 12, font: "monospace", width: CASILLA - 8, align: "center" }),
                pos(sx + CASILLA / 2, sy + 90),
                anchor("center"),
                color(colores.blanco),
                z(4),
            ]);
        }
 
        // Panel de detalle
        const dx = gx + COLS * (CASILLA + SEPARACION) - SEPARACION + 40;
        const dw = px + pw - 40 - dx;
        const dh = FILAS * (CASILLA + SEPARACION) - SEPARACION;
 
        capa.add([
            rect(dw, dh, { radius: 6 }),
            pos(dx, gy),
            color(colores.boton),
            outline(2, "#3a3548"),
            z(2),
        ]);
 
        const elegido = lista[sel] ? OBJETOS[lista[sel]] : null;
        if (elegido) {
            capa.add([
                text(elegido.nombre, { size: 26, font: "monospace", width: dw - 40 }),
                pos(dx + 20, gy + 20),
                color(colores.dorado),
                z(3),
            ]);
            capa.add([
                text(elegido.descripcion, { size: 18, font: "monospace", width: dw - 40 }),
                pos(dx + 20, gy + 80),
                color(colores.blanco),
                z(3),
            ]);
        } else {
            capa.add([
                text(lista.length === 0 ? "No llevas nada contigo." : "Casilla vacía.", {
                    size: 18,
                    font: "monospace",
                    width: dw - 40,
                }),
                pos(dx + 20, gy + 20),
                color(colores.gris),
                z(3),
            ]);
        }
 
        // Ayuda
        capa.add([
            text("Flechas/WASD: elegir    TAB o ESC: cerrar", { size: 16, font: "monospace" }),
            pos(px + 40, py + ph - 40),
            color(colores.gris),
            z(2),
        ]);
    }
 
    function abrir() {
        if (capa || !puedeAbrir()) return;
        sel = 0;
        construir();
    }
 
    function cerrar() {
        if (!capa) return;
        destroy(capa);
        capa = null;
    }
 
    function estaAbierto() {
        return capa !== null;
    }
 
    function mover(dc, df) {
        if (!capa) return;
        const col = clamp((sel % COLS) + dc, 0, COLS - 1);
        const fila = clamp(Math.floor(sel / COLS) + df, 0, FILAS - 1);
        const nuevo = fila * COLS + col;
        if (nuevo !== sel) {
            sel = nuevo;
            redibujar = true;
        }
    }
 
    // Se redibuja fuera de los eventos del mouse para no borrar la casilla mientras se usa
    onUpdate(() => {
        if (redibujar && capa) {
            redibujar = false;
            construir();
        }
    });
 
    onKeyPress(["tab", "i"], () => (capa ? cerrar() : abrir()));
    onKeyPress(["left", "a"], () => mover(-1, 0));
    onKeyPress(["right", "d"], () => mover(1, 0));
    onKeyPress(["up", "w"], () => mover(0, -1));
    onKeyPress(["down", "s"], () => mover(0, 1));
 
    return { abrir, cerrar, estaAbierto };
}