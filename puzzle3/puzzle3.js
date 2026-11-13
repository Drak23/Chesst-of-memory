const lucesMemoria = document.querySelectorAll(".luzMemoria");
const botonMemoria = document.getElementById("comenzarMemoria");
const mensajeMemoria = document.getElementById("mensajeMemoria");
const rondaTexto = document.getElementById("rondaMemoria");

let secuenciaMemoria = [];
let pasoMemoria = 0;
let rondaActual = 0;
let bloqueadoMemoria = true;

const totalRondas = 3;

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// aquei comienza el puzzle
botonMemoria.addEventListener("click", function() {
    botonMemoria.hidden = true;
    secuenciaMemoria = [Math.floor(Math.random() * 4)];
    rondaActual = 0;
    siguienteRonda();
});
// despues de la ronda hay mas coleres 
async function siguienteRonda() {
    rondaActual++;
    // aleatoriedad
secuenciaMemoria.push(Math.floor(Math.random() * 4));
rondaTexto.textContent = "Ronda " + rondaActual +
    " de " + totalRondas;
    await mostrarSecuencia();
}
// Mostrar las luces en orden
async function mostrarSecuencia() {
    bloqueadoMemoria = true;
    pasoMemoria = 0;
    mensajeMemoria.textContent = "Observa las luces...";
    await esperar(700);
    for (let numero of secuenciaMemoria) {
        lucesMemoria[numero].classList.add("activa");
        await esperar(550);
        lucesMemoria[numero].classList.remove("activa");
        await esperar(250);
    }

 bloqueadoMemoria = false;
mensajeMemoria.textContent = "¡Repite la secuencia!";
}
//  los clics (y aun no puedo arreglar el de la llave)
lucesMemoria.forEach(function(luz, i) {
    luz.addEventListener("click", async function() {
if (bloqueadoMemoria) return;
        luz.classList.add("activa");
        setTimeout(function() {
            luz.classList.remove("activa");
        }, 160);
        // Si se equivoca
 if (i !== secuenciaMemoria[pasoMemoria]) {
        bloqueadoMemoria = true;
        mensajeMemoria.textContent = "¡Incorrecto! Intenta otra vez";
    await esperar(900);
    await mostrarSecuencia();
    return;
        }
        // Si lo hace bien
    pasoMemoria++;

if (pasoMemoria === secuenciaMemoria.length) {
    bloqueadoMemoria = true;
if (rondaActual === totalRondas) {
    terminarPuzzleMemoria();
        } else {
    mensajeMemoria.textContent = "¡Correcto!";
        await esperar(850);
        await siguienteRonda();
            }
        }
    });
});
// termina el puzzle
function terminarPuzzleMemoria() {
    bloqueadoMemoria = true;
    mensajeMemoria.textContent = "¡Puzzle completado!";
    rondaTexto.textContent = "¡Todas las rondas superadas!";
    // aqui es donde sigue nuestro juegop 
}
