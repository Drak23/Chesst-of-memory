import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";
import { cargarMenu } from "./Menu.js";
import { cargarJuego } from "./juego.js";
import { cargarMinijuego } from "./minijuego.js";
import { cargarPuzzle } from "./Puzzle figuras.js";
import { cargarTorre } from "./Torre.js";
import { colores } from "./colores.js";
 
// Única instancia de Kaplay, compartida por todas las escenas.
// 1280x720 = 16:9, igual que tus escenarios (640x360 escalados x2)
const k = kaplay({
    width: 1280,
    height: 720,
    background: colores.fondo,
    global: false,
    texFilter: "nearest",                       // pixel art nítido: sin suavizar al agrandar
    pixelDensity: window.devicePixelRatio || 1, // más nítido en pantallas de alta resolución
});
 
cargarMenu(k);   // escenas: "menu" y "mensaje"
cargarJuego(k);  // escena: "juego"
cargarMinijuego(k); // escena: "minijuego"
cargarPuzzle(k);    // escena: "puzzle"
cargarTorre(k);     // escenas: "torre", "torre_derrota", "torre_victoria"
 
k.go("menu");