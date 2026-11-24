import { colores } from "./colores.js";
import { crearDialogo, HABLANTES } from "./Dialogo.js";
import { buscarHoja } from "./Hojas.js";
import { progreso } from "./Minijuego.js";

const SALA = {
    archivos: ["assets/Cinematicas/principio-Sheet.png"],
    cuadros: 5,
    fps: 3,          // movimiento suave de la sala
};

const MOSTRAR_ACOTACIONES = true;

export function cargarPrologo2(k) {
    const {
        add, rect, text, sprite, pos, anchor, color, opacity, outline, rgb, scale, rotate, z, vec2,
        wait, destroy, shake, tween, easings, go, scene, width, height, onKeyPress, onUpdate, dt,
    } = k;

    const listos = {};
    buscarHoja(k, listos, "prologo2_sala", SALA.archivos, SALA.cuadros, "idle", SALA.fps);

    scene("prologo2", () => {
        const W = width();
        const H = height();

        // Sala 
        let fondo;
        if (listos.prologo2_sala) {
            fondo = add([sprite("prologo2_sala", { anim: "idle", width: W, height: H }), pos(0, 0), scale(1), z(0)]);
        } else {
            fondo = add([rect(W, H), pos(0, 0), scale(1), color(40, 38, 48), z(0)]);
        }

        // Calabozo
        const calabozo = [];
        calabozo.push(add([rect(W, H), pos(0, 0), color(14, 14, 20), z(5)]));
        for (let i = 0; i < 9; i++) {
            calabozo.push(add([rect(22, H), pos(60 + i * 150, 0), color(46, 48, 58), z(6)]));
        }
        calabozo.push(add([rect(W, 22), pos(0, H * 0.2), color(46, 48, 58), z(6)]));
        calabozo.push(add([rect(W, 22), pos(0, H * 0.8), color(46, 48, 58), z(6)]));
        calabozo.forEach((o) => (o.hidden = true));

        // Efectos
        const oscuro = add([rect(W, H), pos(0, 0), color(0, 0, 0), opacity(0.92), z(40)]);   // la habitación está a oscuras
        const parpadoArriba = add([rect(W, H / 2), pos(0, 0), color(0, 0, 0), z(50)]);
        const parpadoAbajo = add([rect(W, H / 2), pos(0, H / 2), color(0, 0, 0), z(50)]);
        const flash = add([rect(W, H), pos(0, 0), color(255, 255, 255), opacity(0), z(60)]);
        const negro = add([rect(W, H), pos(0, 0), color(0, 0, 0), opacity(1), z(1000)]);

        const aOscuro = (a, t = 1.5) => tween(oscuro.opacity, a, t, (v) => (oscuro.opacity = v));
        // Párpados: f = 0 cerrados, 1 abiertos del todo
        const parpados = (f) => {
            parpadoArriba.pos.y = -(H / 2) * f;
            parpadoAbajo.pos.y = H / 2 + (H / 2) * f;
        };
        parpados(0);
        const aParpados = (de, a, t) => tween(de, a, t, parpados);

        // Acciones del guion 
        // El protagonista despierta: abre los ojos a ratos, todo borroso y oscuro
        const despertar = (seguir) => {
            tween(1, 0, 0.8, (v) => (negro.opacity = v));
            wait(0.8, () => aParpados(0, 0.25, 0.9));
            wait(2.0, () => aParpados(0.25, 0, 0.5));
            wait(3.0, () => aParpados(0, 0.55, 0.9));
            wait(4.2, () => aParpados(0.55, 0.1, 0.5));
            wait(5.0, () => aParpados(0.1, 1, 1.2));
            wait(6.4, seguir);
        };
        const luz = (a, t = 1.5) => (seguir) => {
            aOscuro(a, t);
            wait(t + 0.1, seguir);
        };
        // La reina habla: todos se quedan helados
        const terror = (seguir) => {
            shake(8);
            aOscuro(0.75, 0.6);
            wait(1, seguir);
        };
        // La Torre se lanza sobre el protagonista y rompe la silla
        const empujon = (seguir) => {
            const px = W * 0.18;   // hacia dónde se acerca (La Torre está a la izquierda)
            const py = H * 0.68;
            aOscuro(0.2, 0.3);
            tween(1, 2.8, 0.55, (s) => {
                fondo.scale = vec2(s);
                fondo.pos = vec2(px * (1 - s), py * (1 - s));
            }, easings.easeInQuad);
            wait(0.55, () => {
                shake(36);
                flash.opacity = 1;
                tween(1, 0, 0.4, (v) => (flash.opacity = v));
                const letrero = add([
                    text("¡CRASH!", { size: 110, font: "monospace" }),
                    pos(W / 2, H * 0.55),
                    anchor("center"),
                    color(colores.dorado),
                    z(700),
                ]);
                wait(0.9, () => destroy(letrero));
                tween(0, 1, 0.5, (v) => (negro.opacity = v));
            });
            wait(1.6, () => {
                fondo.scale = vec2(1);
                fondo.pos = vec2(0, 0);
                aOscuro(0.4, 0.1);
                tween(1, 0, 0.6, (v) => (negro.opacity = v));
            });
            wait(2.3, seguir);
        };
        // El protagonista corre por el pasillo.
        const huida = (seguir) => {
            const letrero = add([
                text("¡CORRE!", { size: 120, font: "monospace" }),
                pos(W / 2, H * 0.25),
                anchor("center"),
                color(colores.dorado),
                z(700),
            ]);
            for (let i = 0; i < 5; i++) wait(i * 0.4, () => shake(10));
            wait(1.5, () => destroy(letrero));

            // Minijuego: apretar rápido una sucesión de 5 flechas. Supera = progreso.escape true; si no, false (igual termina capturado)
            progreso.escape = false;
            const TIEMPO = 4.5;
            const DIRS = [
                { tecla: "left", alt: "a", simbolo: "←" },
                { tecla: "right", alt: "d", simbolo: "→" },
                { tecla: "up", alt: "w", simbolo: "↑" },
                { tecla: "down", alt: "s", simbolo: "↓" },
            ];
            const pasos = Array.from({ length: 5 }, () => DIRS[Math.floor(Math.random() * DIRS.length)]);
            wait(1.0, () => {
                const objs = [];
                const bw = 110;
                const gap = 20;
                const total = 5 * bw + 4 * gap;
                const x0 = (W - total) / 2;
                const y = H * 0.58;
                let idx = 0;
                let restante = TIEMPO;
                let activo = true;

                objs.push(add([
                    text("¡Aprieta las flechas rápido!", { size: 28, font: "monospace" }),
                    pos(W / 2, y - bw / 2 - 40),
                    anchor("center"),
                    color(colores.blanco),
                    z(700),
                ]));
                const cajas = pasos.map((p, i) => {
                    const cx = x0 + i * (bw + gap) + bw / 2;
                    const caja = add([
                        rect(bw, bw, { radius: 8 }),
                        pos(cx, y),
                        anchor("center"),
                        color(20, 20, 28),
                        outline(4, rgb(133, 128, 143)),
                        z(700),
                    ]);
                    objs.push(caja);
                    objs.push(add([
                        text(p.simbolo, { size: 64, font: "monospace" }),
                        pos(cx, y),
                        anchor("center"),
                        color(colores.blanco),
                        z(701),
                    ]));
                    return caja;
                });
                const barra = add([rect(total, 12), pos(x0, y + bw / 2 + 30), color(colores.dorado), z(700)]);
                objs.push(barra);

                const pintar = () => {
                    cajas.forEach((c, i) => {
                        c.color = i < idx ? rgb(60, 160, 90) : rgb(20, 20, 28);
                        c.outline.color = i === idx ? rgb(214, 181, 104) : rgb(133, 128, 143);
                        c.outline.width = i === idx ? 8 : 4;
                    });
                };
                pintar();

                function terminar(logrado) {
                    if (!activo) return;
                    activo = false;
                    progreso.escape = logrado;
                    objs.push(add([
                        text(logrado ? "¡LO LOGRAS!" : "¡TE ALCANZAN!", { size: 60, font: "monospace" }),
                        pos(W / 2, y + bw / 2 + 90),
                        anchor("center"),
                        color(logrado ? rgb(100, 220, 130) : rgb(255, 80, 80)),
                        z(700),
                    ]));
                    shake(logrado ? 8 : 20);
                    wait(1.0, () => {
                        objs.forEach((o) => destroy(o));
                        seguir();
                    });
                }

                onUpdate(() => {
                    if (!activo) return;
                    restante -= dt();
                    barra.width = Math.max(0, total * (restante / TIEMPO));
                    if (restante <= 0) terminar(false);
                });
                onKeyPress(["left", "right", "up", "down", "a", "d", "w", "s"], (tecla) => {
                    if (!activo) return;
                    if (tecla === pasos[idx].tecla || tecla === pasos[idx].alt) {
                        idx++;
                        pintar();
                        if (idx >= pasos.length) terminar(true);
                    } else {
                        idx = 0;   // se equivocó: empieza la sucesión otra vez
                        shake(6);
                        pintar();
                    }
                });
            });
        };
        const hayDibujo = (n) => typeof k.getSprite === "function" && !!k.getSprite(n) && !!k.getSprite(n).data;
        // La persecución (sobre fondo negro): La Torre alcanza al protagonista y lo deja inconsciente
        const alcance = (seguir) => {
            const piso = H * 0.84;
            const xProta = W * 0.3;
            const xFinal = W * 0.72;
            // Durante la persecución el fondo es negro: solo se ven el protagonista y La Torre
            const fondoNegro = add([rect(W, H), pos(0, 0), color(0, 0, 0), opacity(1), z(15)]);
            oscuro.opacity = 0;

            const prota = hayDibujo("prota_lado")
                ? add([sprite("prota_lado", { anim: "caminar", height: 200 }), pos(xProta, piso), anchor("bot"), rotate(0), z(20)])
                : add([rect(70, 170), pos(xProta, piso), anchor("bot"), rotate(0), color(214, 181, 104), z(20)]);
            const dibujoTorre = hayDibujo("torre_ataque_frente") ? "torre_ataque_frente" : hayDibujo("torre_jefe") ? "torre_jefe" : null;
            const torreSpr = dibujoTorre
                ? add([sprite(dibujoTorre, { height: 320 }), pos(-260, piso), anchor("bot"), rotate(0), z(21)])
                : add([rect(150, 300), pos(-260, piso), anchor("bot"), rotate(0), color(80, 80, 100), z(21)]);

            if (progreso.escape === true) torreSpr.hidden = true;   // si superó el escape, solo tropieza: La Torre no aparece

            tween(xProta, xFinal, 1.6, (v) => (prota.pos.x = v));
            tween(-260, xFinal - 170, 1.6, (v) => (torreSpr.pos.x = v), easings.easeInQuad);
            for (let i = 0; i < 4; i++) wait(i * 0.4, () => shake(8));

            // Lo alcanza: golpe y el protagonista cae (si superó el minijuego de escape, solo tropieza)
            const tropieza = progreso.escape === true;
            wait(1.6, () => {
                shake(tropieza ? 18 : 40);
                if (!tropieza) {
                    flash.opacity = 1;
                    tween(1, 0, 0.4, (v) => (flash.opacity = v));
                }
                const letrero = add([
                    text(tropieza ? "¡TROPIEZA!" : "¡PAM!", { size: tropieza ? 90 : 120, font: "monospace" }),
                    pos(W / 2, H * 0.3),
                    anchor("center"),
                    color(colores.dorado),
                    z(700),
                ]);
                wait(1, () => destroy(letrero));
                tween(0, 90, 0.3, (v) => (prota.angle = v));
                tween(xFinal, xFinal + 70, 0.3, (v) => (prota.pos.x = v));
            });
            // Se desmaya: todo se funde a negro
            wait(2.3, () => tween(0, 1, 0.9, (v) => (negro.opacity = v)));
            wait(3.5, () => {
                destroy(prota);
                destroy(torreSpr);
                destroy(fondoNegro);
                seguir();
            });
        };
        // Lo encierran: se ven los barrotes del calabozo
        const entraCalabozo = (seguir) => {
            fondo.hidden = true;
            calabozo.forEach((o) => (o.hidden = false));
            oscuro.opacity = 0.35;
            tween(1, 0, 1.2, (v) => (negro.opacity = v));
            wait(1.5, seguir);
        };

        // Guion 
        // Los nombres de la familia salen de HABLANTES (en dialogo.js), así se cambian en un solo lugar.
        const Albion = HABLANTES.Albion.nombre;
        const Ramberry = HABLANTES.Ramberry.nombre;
        const Kareem = HABLANTES.Kareem.nombre.replace(/^La\s+/i, "");   // "kareem" -> "kareem" cuando la llaman por su nombre
        const acot = (t) => (MOSTRAR_ACOTACIONES ? [{ texto: t }] : []);
        const guion = [
            { accion: despertar },
            ...acot("Después de un tiempo, Vlad comienza a recuperar el conocimiento. Se encuentra atado a una silla dentro de una habitación completamente oscura."),
            { quien: "Vlad", texto: "Agh... ¿Q-qué pasó...? ¿Dónde demonios estoy...?" },
            ...acot("Unas risas comienzan a escucharse desde la oscuridad."),
            { quien: "v_Ramberry", texto: "Vaya, vaya... ¡Carne fresca! Jijiji." },
            { quien: "Vlad", texto: "¡¿Quién anda ahí?! ¡Muéstrate, cobarde!" },
            { quien: "v_Kareem", texto: "Parece que el forastero tiene carácter." },
            ...acot("Una segunda voz, mucho más grave, resuena en la habitación."),
            { quien: "v_Albion", texto: "Ya basta, ustedes dos. Nuestro invitado está esperando." },
            ...acot("Una tercera voz, más autoritaria, interrumpe la conversación."),
            { quien: "Vlad", texto: "¿Quiénes... quiénes son ustedes?" },
            { accion: luz(0.55) },
            { quien: "Albion", texto: `Es cierto, disculpa mis modales. Soy el rey ${Albion}, segundo al mando de la familia Lamburgo. Y tú, forastero, eres nuestro invitado.` },
            { quien: "Ramberry", texto: `¡Y yo soy la primogénita de la familia Lamburgo! ¡${Ramberry}! Jijiji. Y desde ahora serás mi nueva mascota. ¡¿Verdad, papá?!` },
            { accion: luz(0.35) },
            { quien: "v_Kareem", texto: `Señorita ${Ramberry}, cuide sus modales.` },
            { quien: "Ramberry", texto: `Ay, ${Kareem}, jijiji. ¡No seas tan amargado!` },
            { quien: "Kareem", texto: "Señorita, este forastero podría ser peligroso. Lo mejor sería eliminarlo de inmediato." },
            { quien: "Ramberry", texto: "¡Wha, wha! ¡No, no, no! Jijiji. ¡Él es mío! ¡Mío para jugar!" },
            ...acot(`${Ramberry} se acerca lentamente a Vlad con una sonrisa.`),
            { quien: "Ramberry", texto: "¿Verdad que sí, mascota?" },
            { quien: "Vlad", texto: "¡Aléjate de mí, maldita niña!" },
            { quien: "Ramberry", texto: "Ay, ay, ay..." },
            ...acot(`${Ramberry} chasquea la lengua y observa al protagonista con una expresión de disgusto.`),
            { quien: "Ramberry", texto: "Parece que tendré que entrenarte bien, lindura. No debes morder a tu dueña, jijiji." },
            { quien: "v_Beryl", texto: "Silencio, mis niños." },
            { accion: terror },
            ...acot("Una voz tranquila, pero autoritaria, se escucha desde el fondo de la habitación. Todos guardan silencio de inmediato y sus rostros muestran un profundo terror."),
            { quien: "v_Beryl", texto: `${Kareem}, encárgate del forastero.` },
            { quien: "Kareem", texto: "Será un placer, mi señora." },
            { accion: empujon },   // *se acerca rápidamente al prota y lo empuja fuerte, rompiendo la silla*
            ...acot(`${Kareem} se acerca rápidamente a Vlad y lo empuja con tanta fuerza que la silla en la que está atado se rompe.`),
            { quien: "Kareem", texto: "Este será tu final, forastero." },
            { quien: "Vlad", texto: "Eso lo dudo." },
            ...acot(`Vlad aprovecha el momento para escapar de la habitación y comienza a correr por el pasillo mientras ${Kareem} lo persigue.`),
            { accion: huida },
            { accion: alcance },   // Kareem lo alcanza y lo desmaya
            ...acot("Finalmente, Vlad es capturado y encerrado en un calabozo."),
            { accion: entraCalabozo },
        ];

        const dialogo = crearDialogo(k, { saltarConEsc: true, posicion: "arriba" });
        wait(0.3, () => dialogo.hablar(guion, () => go("juego", { despertar: true })));   // *empieza el juego*: despierta en el sótano

        add([
            text("ESC: saltar la cinemática", { size: 14, font: "monospace" }),
            pos(12, H - 24),
            color(colores.gris),
            z(950),
        ]);
    });
}