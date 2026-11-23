import { colores } from "./colores.js";

// Quién habla: el nombre que se ve y su color.
export const HABLANTES = {
    Vlad: { nombre: "Vlad", color: "#d6b568" },
    Kareem: { nombre: "Kareem", color: "#0842ff" },
    npc1: { nombre: "NPC 1", color: "#8fd06f" },   // el cochero (verde en el carruaje). Cámbiale el nombre cuando lo tenga
    npc2: { nombre: "NPC 2", color: "#b57ad6" },   // la acompañante (morada en el carruaje)
    // La familia Lamburgo (los nombres son provisionales: cámbialos aquí y se actualizan en los diálogos)
    Albion: { nombre: "Albion", color: "#e82121" },
    Ramberry: { nombre: "Ramberry", color: "#f49427" },
    // Voces que todavía no se ven: salen como "???" con el color de quien habla
    v_Ramberry: { nombre: "???", color: "#f49427" },
    v_Kareem: { nombre: "???", color: "#0842ff" },
    v_Albion: { nombre: "???", color: "#e82121" },
    v_Beryl: { nombre: "???", color: "#081d4d" },
};

const LETRAS_POR_SEGUNDO = 55;
const MAX_CARACTERES = 70;   // ancho de cada renglón del cuadro

// Parte el texto en renglones fijos (así no se reacomoda mientras se escribe)
function envolver(texto, max = MAX_CARACTERES) {
    const renglones = [];
    for (const parrafo of String(texto).split("\n")) {
        let actual = "";
        for (const palabra of parrafo.split(" ")) {
            if (actual && (actual + " " + palabra).length > max) {
                renglones.push(actual);
                actual = palabra;
            } else {
                actual = actual ? actual + " " + palabra : palabra;
            }
        }
        renglones.push(actual);
    }
    return renglones.join("\n");
}

export function crearDialogo(k, opciones = {}) {
    const { add, rect, text, pos, anchor, color, outline, opacity, z, onKeyPress, onMousePress, onUpdate, destroy, dt, wait } = k;
    const saltarConEsc = !!opciones.saltarConEsc;   // ESC termina todo el diálogo
    const arriba = opciones.posicion === "arriba";  // "arriba": el cuadro va en la parte de arriba de la pantalla (por defecto, abajo)

    let capa = null;
    let cola = [];
    let alTerminar = null;
    let enAccion = false;    // una "accion" está en marcha
    let cerrando = false;    // pequeña pausa al cerrar (evita que la misma tecla abra otra cosa)
    let completo = true;
    let acumulado = 0;
    let total = 0;
    let letras = 0;
    let envuelto = "";
    let objTexto = null;
    let objHint = null;
    let abiertoEn = -1;

    function construir(linea) {
        if (capa) destroy(capa);
        capa = add([pos(0, 0), z(900), "dialogo"]);

        const bx = 60;
        const by = arriba ? 50 : 500;
        const bw = k.width() - 120;
        const bh = 190;

        capa.add([
            rect(bw, bh, { radius: 8 }),
            pos(bx, by),
            color(17, 16, 25),
            opacity(0.95),
            outline(3, colores.dorado),
            z(0),
        ]);

        const hablante = linea.quien ? HABLANTES[linea.quien] : null;
        if (hablante) {
            capa.add([
                rect(230, 40, { radius: 6 }),
                pos(bx + 24, by - 22),
                color(17, 16, 25),
                outline(3, hablante.color),
                z(1),
            ]);
            capa.add([
                text(hablante.nombre, { size: 22, font: "monospace" }),
                pos(bx + 24 + 115, by - 2),
                anchor("center"),
                color(hablante.color),
                z(2),
            ]);
        }

        envuelto = envolver(linea.texto);
        total = envuelto.length;
        letras = 0;
        acumulado = 0;
        completo = false;

        objTexto = capa.add([
            text("", { size: 22, font: "monospace" }),
            pos(bx + 34, by + 36),
            color(linea.quien ? colores.blanco : "#cfc7b4"),
            z(2),
        ]);
        objHint = capa.add([
            text("E / ESPACIO / clic: continuar", { size: 14, font: "monospace" }),
            pos(bx + bw - 24, by + bh - 20),
            anchor("botright"),
            color(colores.gris),
            z(2),
        ]);
        objHint.hidden = true;
    }

    function quitarCapa() {
        if (capa) destroy(capa);
        capa = null;
        objTexto = null;
        objHint = null;
    }

    function cerrar() {
        quitarCapa();
        cerrando = true;
        wait(0.15, () => {
            cerrando = false;
            const f = alTerminar;
            alTerminar = null;
            if (f) f();
        });
    }

    function siguiente() {
        if (cola.length === 0) {
            cerrar();
            return;
        }
        const linea = cola.shift();
        if (linea.accion) {
            quitarCapa();
            enAccion = true;
            linea.accion(() => {
                enAccion = false;
                siguiente();
            });
            return;
        }
        abiertoEn = k.time();
        construir(linea);
    }

    function hablar(lineas, fin) {
        cola = (Array.isArray(lineas) ? lineas : [lineas]).map((l) => (typeof l === "string" ? { texto: l } : l));
        alTerminar = fin || null;
        siguiente();
    }

    function avanzar() {
        if (!capa || enAccion || cerrando) return;
        if (k.time() - abiertoEn < 0.12) return;   // la misma tecla que abrió el diálogo no lo avanza
        if (!completo) {
            letras = total;
            acumulado = total;
            objTexto.text = envuelto;
            completo = true;
            objHint.hidden = false;
        } else {
            siguiente();
        }
    }

    // Termina todo el diálogo de golpe
    function saltar() {
        cola = [];
        if (enAccion || cerrando) return;   // la acción en marcha termina y luego se cierra
        if (capa) cerrar();
    }

    onUpdate(() => {
        if (!capa || completo) return;
        acumulado += dt() * LETRAS_POR_SEGUNDO;
        const n = Math.min(Math.floor(acumulado), total);
        if (n !== letras) {
            letras = n;
            objTexto.text = envuelto.slice(0, letras);
        }
        if (letras >= total) {
            completo = true;
            objHint.hidden = false;
        }
    });

    onKeyPress(["e", "space", "enter"], avanzar);
    onMousePress(avanzar);
    if (saltarConEsc) onKeyPress("escape", saltar);

    return {
        hablar,
        saltar,
        abierto: () => capa !== null || enAccion || cerrando,
    };
}