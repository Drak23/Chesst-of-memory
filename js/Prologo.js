import { colores } from "./colores.js";
import { crearDialogo, HABLANTES } from "./Dialogo.js";

// Hojas horizontales: cuántos cuadros tienen y a qué velocidad corren.
// "archivos" = rutas posibles.
const FONDO = {
    archivos: ["assets/Cinematicas/Cinematica1-Sheet.png", "assets/Cinematicas/Cinematica1-Sheet.jpg"],
    cuadros: 34,
    fps: 10,
};
const CARRETA = {
    archivos: ["assets/Cinematicas/carretaanimation-Sheet.png"],
    cuadros: 19,
    fps: 10,
    ancho: 264,        // tamaño de cada cuadro de la hoja, en píxeles
    alto: 84,
    escala: 2.2,       // cuánto se agranda en pantalla
    x: 300,            // dónde se detiene (izquierda del carruaje)
    yRuedas: 680,      // altura del suelo donde apoyan las ruedas
    pisoRuedas: 80,    // fila del dibujo donde terminan las ruedas
};

// Las acotaciones (*...*) que están solas se muestran como narración.
// Dibujos quietos del carruaje cuando se van la acompañante y luego el conductor (opcionales)
const CARRETA_SIN_ACOMPANANTE = "assets/Cinematicas/carruaje sin primer personaje.png";
const CARRETA_SIN_NADIE = "assets/Cinematicas/carrueje sin nadie.png";

const MOSTRAR_ACOTACIONES = true;

export function cargarPrologo(k) {
    const {
        add, rect, text, sprite, pos, anchor, color, opacity, z, vec2, rgb, rand,
        wait, destroy, shake, dt, tween, easings, go, scene, width, height, drawLine,
    } = k;

    const listos = {};
    const MAX_TEXTURA = 2048;
    function buscar(nombre, archivos, cuadros, animacion, fps) {
        if (typeof Image === "undefined") return;
        const probar = (i) => {
            if (i >= archivos.length) {
                console.warn(`Falta el dibujo del prólogo: ${archivos[0]}`);
                return;
            }
            const img = new Image();
            img.onerror = () => probar(i + 1);
            img.onload = () => {
                try {
                    const fw = img.width / cuadros;           // ancho de cada cuadro en la hoja (puede tener decimales)
                    const cw = Math.round(fw);                // ancho entero en la cuadrícula
                    const ch = img.height;
                    const cols = Math.max(1, Math.floor(MAX_TEXTURA / cw));
                    const filas = Math.ceil(cuadros / cols);
                    const lienzo = document.createElement("canvas");
                    lienzo.width = cols * cw;
                    lienzo.height = filas * ch;
                    const g = lienzo.getContext("2d");
                    g.imageSmoothingEnabled = false;
                    for (let n = 0; n < cuadros; n++) {
                        g.drawImage(img, Math.round(n * fw), 0, Math.min(cw, img.width - Math.round(n * fw)), ch,
                            (n % cols) * cw, Math.floor(n / cols) * ch, cw, ch);
                    }
                    const carga = k.loadSprite(nombre, lienzo.toDataURL("image/png"), {
                        filter: "nearest",
                        sliceX: cols,
                        sliceY: filas,
                        anims: { [animacion]: { from: 0, to: cuadros - 1, loop: true, speed: fps } },
                    });
                    if (carga && typeof carga.then === "function") carga.then(() => (listos[nombre] = true)).catch(() => {});
                    else setTimeout(() => (listos[nombre] = true), 500);
                } catch (e) {
                    console.warn(`No se pudo preparar la hoja ${archivos[i]}`, e);
                }
            };
            img.src = archivos[i];
        };
        probar(0);
    }
    buscar("prologo_fondo", FONDO.archivos, FONDO.cuadros, "correr", FONDO.fps);
    buscar("prologo_carreta", CARRETA.archivos, CARRETA.cuadros, "rodar", CARRETA.fps);

    function cargarQuieto(nombre, archivo) {
        if (typeof fetch !== "function") return;
        fetch(archivo, { method: "HEAD" })
            .then((r) => {
                if (!r.ok) {
                    console.warn(`Falta el dibujo: ${archivo}`);
                    return;
                }
                const carga = k.loadSprite(nombre, archivo, { filter: "nearest" });
                if (carga && typeof carga.then === "function") carga.then(() => (listos[nombre] = true)).catch(() => {});
                else setTimeout(() => (listos[nombre] = true), 500);
            })
            .catch(() => {});
    }
    cargarQuieto("prologo_carreta_sin_acompanante", CARRETA_SIN_ACOMPANANTE);
    cargarQuieto("prologo_carreta_sin_nadie", CARRETA_SIN_NADIE);

    scene("prologo", () => {
        const W = width();
        const H = height();

        // Fondo
        let fondo = null;
        if (listos.prologo_fondo) {
            fondo = add([sprite("prologo_fondo", { anim: "correr", width: W, height: H }), pos(0, 0), z(0)]);
        } else {
            add([rect(W, H), pos(0, 0), color(70, 74, 78), z(0)]);
            add([rect(W, H * 0.38), pos(0, H * 0.62), color(58, 38, 34), z(1)]);
        }

        //Carruaje
        const CW = CARRETA.ancho * CARRETA.escala;
        const CH = CARRETA.alto * CARRETA.escala;
        const yCarreta = CARRETA.yRuedas - (CARRETA.pisoRuedas / CARRETA.alto) * CH;
        let carreta;
        if (listos.prologo_carreta) {
            carreta = add([sprite("prologo_carreta", { anim: "rodar", width: CW, height: CH }), pos(-CW - 20, yCarreta), z(10)]);
        } else {
            carreta = add([rect(CW * 0.7, CH * 0.6), pos(-CW - 20, yCarreta + CH * 0.3), color(70, 40, 30), z(10)]);
        }

        //Efectos 
        const oscuro = add([rect(W, H), pos(0, 0), color(8, 12, 28), opacity(0), z(40)]);
        const flash = add([rect(W, H), pos(0, 0), color(255, 255, 255), opacity(0), z(60)]);
        const negro = add([rect(W, H), pos(0, 0), color(0, 0, 0), opacity(1), z(1000)]);

        // Lluvia: gotas que caen en diagonal; "densidad" (0 a 1) dice cuántas se ven
        const lluvia = { densidad: 0 };
        const gotas = [];
        for (let i = 0; i < 320; i++) gotas.push({ x: rand(0, W + 300), y: rand(0, H), v: rand(700, 1100), l: rand(14, 30) });
        add([
            z(45),
            {
                update() {
                    for (const g of gotas) {
                        g.y += g.v * dt();
                        g.x -= g.v * 0.18 * dt();
                        if (g.y > H) {
                            g.y = -g.l;
                            g.x = rand(0, W + 300);
                        }
                    }
                },
                draw() {
                    const n = Math.floor(gotas.length * lluvia.densidad);
                    for (let i = 0; i < n; i++) {
                        const g = gotas[i];
                        drawLine({
                            p1: vec2(g.x, g.y),
                            p2: vec2(g.x - g.l * 0.18, g.y + g.l),
                            width: 2,
                            color: rgb(190, 205, 230),
                            opacity: 0.45,
                        });
                    }
                },
            },
        ]);

        const aLluvia = (d, t = 1.5) => tween(lluvia.densidad, d, t, (v) => (lluvia.densidad = v));
        const aOscuro = (a, t = 1.5) => tween(oscuro.opacity, a, t, (v) => (oscuro.opacity = v));
        function relampago(fuerza = 0.8) {
            flash.opacity = fuerza;
            tween(fuerza, 0, 0.5, (v) => (flash.opacity = v));
            wait(0.2, () => {
                flash.opacity = fuerza * 0.75;
                tween(fuerza * 0.75, 0, 0.45, (v) => (flash.opacity = v));
            });
        }
        const velocidad = (n) => {
            if (fondo) fondo.animSpeed = n;
            if (listos.prologo_carreta) carreta.animSpeed = n;
        };

        // Cambia el dibujo del carruaje (ya detenido) cuando alguien se va
        const cambiarCarreta = (nombre) => (seguir) => {
            if (listos[nombre]) {
                const x = carreta.pos.x;
                destroy(carreta);
                carreta = add([sprite(nombre, { width: CW, height: CH }), pos(x, yCarreta), z(10)]);
            }
            seguir();
        };

        // Acciones del guion 
        const entrada = (seguir) => {
            tween(1, 0, 1.2, (v) => (negro.opacity = v));
            tween(-CW - 20, CARRETA.x, 3.6, (v) => (carreta.pos.x = v), easings.easeOutQuad);
            wait(3.7, seguir);
        };
        const nubes = (seguir) => {
            aOscuro(0.3, 1.5);
            wait(1.6, seguir);
        };
        const primerasGotas = (seguir) => {
            aLluvia(0.25, 2);
            aOscuro(0.38, 2);
            wait(0.6, () => relampago(0.35));   // truenos a lo lejos
            wait(2, seguir);
        };
        const acelerar = (seguir) => {
            velocidad(1.7);
            wait(0.8, seguir);
        };
        const lluviaFuerte = (seguir) => {
            aLluvia(0.75, 1.5);
            aOscuro(0.5, 1.5);
            relampago(0.7);
            wait(1.8, seguir);
        };
        const pum = (seguir) => {
            if (listos.prologo_carreta && carreta.stop) carreta.stop();
            if (fondo && fondo.stop) fondo.stop();
            shake(22);
            const letrero = add([
                text("¡PUM!", { size: 120, font: "monospace" }),
                pos(W / 2, H * 0.3),
                anchor("center"),
                color(colores.dorado),
                z(700),
            ]);
            wait(1, () => destroy(letrero));
            wait(1.2, seguir);
        };
        // Pasa el tiempo: se funde a negro y vuelve más oscuro
        const pasaTiempo = (seguir) => {
            tween(0, 1, 0.9, (v) => (negro.opacity = v));
            wait(1.3, () => {
                aOscuro(0.58, 0.1);
                aLluvia(0.85, 0.1);
                tween(1, 0, 0.9, (v) => (negro.opacity = v));
            });
            wait(2.4, seguir);
        };
        const silencio = (seguir) => {
            aLluvia(0.6, 1);
            wait(0.8, () => relampago(0.55));
            wait(2.2, () => relampago(0.8));
            wait(3.6, seguir);
        };
        const golpe = (seguir) => {
            shake(34);
            flash.opacity = 1;
            tween(1, 0, 0.4, (v) => (flash.opacity = v));
            wait(0.25, () => tween(0, 1, 0.8, (v) => (negro.opacity = v)));
            wait(2.2, seguir);
        };

        //  Guion 
        const npc2 = HABLANTES.npc2.nombre;
        const acot = (t) => (MOSTRAR_ACOTACIONES ? [{ texto: t }] : []);
        const guion = [
            { accion: entrada },
            ...acot("Un carruaje avanza por un camino solitario rumbo al pueblo de Ashley. En su interior viaja Vlad, un misterioso forastero que permanece en silencio durante el trayecto."),
            { quien: "npc1", texto: "¿No cree que es un mal momento para venir por estos lugares, forastero? La guerra no dejó mucho por aquí. Si viene de turismo, le recomiendo ir directamente a Ashley." },
            ...acot("Vlad observa al conductor de reojo."),
            { quien: "Vlad", texto: "Eso no le incumbe. Le pagué para que me llevara, no para hacerme preguntas." },
            ...acot("Vlad se acomoda la capucha y vuelve a guardar silencio."),
            { quien: "npc2", texto: "Dios mío..." },
            ...acot("La acompañante del conductor suspira, claramente molesta por la respuesta del forastero."),
            { quien: "npc2", texto: "Qué grosero. El hecho de que haya pagado no le da derecho a hablarnos así, señor." },
            { quien: "npc1", texto: "Como sea, mejor no le hagas caso." },
            ...acot("La acompañante levanta la mirada hacia el cielo y observa unas nubes oscuras que comienzan a cubrirlo."),
            { accion: nubes },
            { quien: "npc2", texto: "Agh... Se están formando unas nubes enormes. Seguro que habrá tormenta." },
            { quien: "npc1", texto: "Sí, eso parece..." },
            ...acot("El conductor saca un mapa y lo observa mientras continúa guiando a los caballos."),
            { quien: "npc1", texto: "Solo espero que no tardemos demasiado en llegar. Tenemos que cruzar Riften." },
            { quien: "npc2", texto: "Ugh, odio ese lugar. Dicen que todavía hay cadáveres de la guerra enterrados por ahí... Y esa mansión en la montaña... No sé, me da muy mala espina." },
            { quien: "npc1", texto: "Tranquila." },
            ...acot("El conductor escupe su tabaco a un lado del camino."),
            { quien: "npc1", texto: "Ese pueblo lleva años abandonado. Ya no vive nadie ahí." },
            { accion: primerasGotas },
            ...acot("Las primeras gotas de lluvia comienzan a caer sobre el carruaje mientras algunos truenos se escuchan a lo lejos."),
            { quien: "npc1", texto: "Agh, la tormenta se acerca más rápido de lo que pensé. Será mejor que nos demos prisa." },
            ...acot("El conductor sacude las riendas y los caballos aceleran el paso."),
            { accion: acelerar },
            { accion: lluviaFuerte },
            ...acot("La lluvia aumenta su intensidad y el camino comienza a llenarse de lodo."),
            { quien: "npc2", texto: "Oye, el camino se está poniendo muy lodoso. ¿No crees que las ruedas puedan atascarse?" },
            { quien: "npc1", texto: "No lo creo, tú tranqu..." },
            { accion: pum },
            ...acot("De repente, el carruaje da un fuerte golpe y se detiene bruscamente."),
            { quien: "npc1", texto: "¡Agh! ¡Demonios!" },
            ...acot("El conductor baja del carruaje y se acerca a una de las ruedas para revisarla."),
            { quien: "npc1", texto: "Genial... Nos hemos atascado." },
            { quien: "npc2", texto: "Te lo dije." },
            { quien: "npc1", texto: "Sí, sí, ya te escuché." },
            ...acot("El conductor mira a su acompañante con resignación."),
            { quien: "npc1", texto: "En lugar de quedarte ahí mirándome, mejor ayúdame. Busca una rama gruesa para hacer palanca." },
            ...acot("El conductor se agacha junto a la rueda."),
            { quien: "npc1", texto: "Yo intentaré hacer un agujero para colocarla." },
            { quien: "npc2", texto: "Como sea..." },
            ...acot("La acompañante se aleja del carruaje y se adentra en el bosque cercano para buscar una rama."),
            { accion: cambiarCarreta("prologo_carreta_sin_acompanante") },
            { quien: "npc1", texto: "No vaya a ayudar demasiado, forastero." },
            ...acot("Vlad permanece sentado en el carruaje y se limita a suspirar."),
            { quien: "npc1", texto: "Claro... Debí suponerlo." },
            ...acot("El conductor continúa trabajando mientras murmura entre dientes."),
            { quien: "npc1", texto: "Eso me pasa por aceptar llevar forasteros... Todos unos maleducados." },
            { accion: pasaTiempo },
            ...acot("Pasa un rato y la acompañante todavía no regresa. El conductor deja de trabajar y observa el bosque."),
            { quien: "npc1", texto: "Esta niña ya tardó demasiado..." },
            ...acot("El conductor suspira y se dirige a Vlad."),
            { quien: "npc1", texto: "Forastero, ahora regreso. Voy a ver qué le pasó." },
            ...acot("El conductor se adentra en el bosque, siguiendo el mismo camino que toma su acompañante."),
            { accion: cambiarCarreta("prologo_carreta_sin_nadie") },
            { quien: "Vlad", texto: "Como sea..." },
            { accion: pasaTiempo },
            ...acot("Pasa otro rato, pero ninguno de los dos regresa. La tormenta continúa y el bosque permanece en silencio."),
            ...acot("Vlad comienza a impacientarse y finalmente baja del carruaje."),
            { quien: "Vlad", texto: "¡Oiga, señor!" },
            ...acot("Vlad levanta la voz con evidente molestia."),
            { quien: "Vlad", texto: "¡Ya se tardó demasiado!" },
            { accion: silencio },
            ...acot("Nadie responde. El único sonido que se escucha proviene de la lluvia y los truenos."),
            { quien: "Vlad", texto: "¿Señor?" },
            ...acot("Vlad se acerca al bosque y comienza a caminar entre los árboles, pero no encuentra señales de nadie."),
            ...acot("De repente, un ruido proveniente del carruaje llama su atención."),
            { quien: "Vlad", texto: "Más le vale que ya haya arreglado esa maldita rueda o voy a..." },
            ...acot("Vlad se gira rápidamente, pero antes de poder reaccionar recibe un fuerte golpe que lo deja inconsciente."),
            { accion: golpe },   // *se voltea y recibe un golpe que lo deja noqueado*
            ...acot("La pantalla se oscurece."),
        ];

        const dialogo = crearDialogo(k, { saltarConEsc: true, posicion: "arriba" });   // el cuadro de texto va arriba
        wait(0.3, () => dialogo.hablar(guion, () => go("prologo2")));

        add([
            text("ESC: saltar el prólogo", { size: 14, font: "monospace" }),
            pos(12, H - 24),
            color(colores.gris),
            z(950),
        ]);
    });
}