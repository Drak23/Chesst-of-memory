import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";
import { cargarMenu } from "./Menu.js";
import { cargarJuego } from "./juego.js";
import { colores } from "./colores.js";
 
// Única instancia de Kaplay
const k = kaplay({
    width: 1280,
    height: 720,
    background: colores.fondo,
    global: false,
    texFilter: "linear", // suaviza los dibujos al agrandarlos
});
 
cargarMenu(k);   // escenas: "menu" y "mensaje"
cargarJuego(k);  // escena: "juego"
 
k.go("menu");