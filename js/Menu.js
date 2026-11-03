import { colores } from "./colores.js";

export function cargarMenu(k) {
    const {
        add, rect, pos, color, opacity, z,
        text, anchor, outline, area, scale,
        onKeyPress, go, scene, width, height,
    } = k;

    // MENÚ PRINCIPAL
    scene("menu", () => {

        // Fondo
        add([
            rect(width(), height()),
            pos(0, 0),
            color(colores.fondo),
            z(-10),
        ]);

        // Partículas decorativas
        for (let i = 0; i < 35; i++) {
            add([
                rect(2, 2),
                pos((i * 137) % width(), (i * 83) % height()),
                color(colores.dorado),
                opacity(0.25),
                z(-5),
            ]);
        }

        // Marco exterior
        add([
            rect(1100, 700),
            pos(width() / 2, height() / 2),
            anchor("center"),
            color(colores.fondo),
            outline(2, "#d6b568"),
            z(-2),
        ]);

        // Marco interior
        add([
            rect(990, 630),
            pos(width() / 2, height() / 2),
            anchor("center"),
            color(colores.fondo),
            outline(1, "#282431"),
            z(-1),
        ]);

        // Título principal
        add([
            text("CHESS", { size: 88, font: "monospace" }),
            pos(width() / 2, 180),
            anchor("center"),
            color(colores.blanco),
        ]);

        // Título secundario
        add([
            text("OF MEMORY", { size: 38, font: "monospace" }),
            pos(width() / 2, 230),
            anchor("center"),
            color(colores.dorado),
        ]);

        // FUNCIÓN PARA CREAR BOTONES
        function crearBoton(etiqueta, y, accion) {
            const boton = add([
                rect(320, 60, { radius: 5 }),
                pos(width() / 2, y),
                anchor("center"),
                color(colores.boton),
                outline(2, colores.dorado),
                area(),
                scale(1),
            ]);

            const etiquetaBoton = add([
                text(etiqueta, { size: 20, font: "monospace" }),
                pos(width() / 2, y),
                anchor("center"),
                color(colores.blanco),
            ]);

            boton.onHover(() => {
                boton.color = k.rgb(64, 56, 74);
                boton.scale = k.vec2(1.05);
                etiquetaBoton.color = k.rgb(214, 181, 104);
            });

            boton.onHoverEnd(() => {
                boton.color = k.rgb(37, 34, 46);
                boton.scale = k.vec2(1, 1);
                etiquetaBoton.color = k.rgb(241, 234, 219);
            });

            boton.onClick(accion);
        }

        // BOTONES DEL MENÚ

        // Aquí se conecta el menú con el juego
        crearBoton("NUEVA PARTIDA", 320, () => {
            go("juego");
        });

        crearBoton("OPCIONES", 390, () => {
            go("mensaje", {
                titulo: "OPCIONES",
                descripcion: "Aquí podrás configurar el mega increible juego.",
            });
        });

        crearBoton("SALIR", 460, () => {
            go("mensaje", {
                titulo: "HASTA PRONTO",
                descripcion: "Puedes cerrar esta pestaña y no vuelvas 👍(＾＾).",
            });
        });

        // Ayuda de controles
        add([
            text("WASD mover  |  E abrir puertas", {
                size: 16,
                font: "monospace",
            }),
            pos(width() / 2, 600),
            anchor("center"),
            color(colores.gris),
        ]);
    });

    // PANTALLA SECUNDARIA PROVISIONAL
    scene("mensaje", (datos = {}) => {

        add([
            rect(width(), height()),
            pos(0, 0),
            color(colores.fondo),
        ]);

        add([
            text(datos.titulo || "CHESS OF MEMORY", { size: 38, font: "monospace" }),
            pos(width() / 2, 230),
            anchor("center"),
            color(colores.dorado),
        ]);

        add([
            text(datos.descripcion || "", { size: 18, font: "monospace" }),
            pos(width() / 2, 290),
            anchor("center"),
            color(colores.blanco),
        ]);

        add([
            text("Presiona ESC para volver", { size: 16, font: "monospace" }),
            pos(width() / 2, 390),
            anchor("center"),
            color(colores.gris),
        ]);

        onKeyPress("escape", () => {
            go("menu");
        });
    });
}