// Figuras que hay
const figurasPuzzle = [
    "circulo",   //0
    "cuadrado",  //1
    "triangulo", //2
    "rectangulo" //3
];
// Combinacion correcta
const respuestaPuzzle = [0, 1, 2, 3];
// Combinacion inicial
let posicionesPuzzle = [2, 0, 3, 1];

const botonesPuzzle = document.querySelectorAll(".casilla");
const mensajePuzzle = document.getElementById("mensajePuzzle");
let puzzleTerminado = false;
// aqui es donde estan las figuras
function mostrarFiguras() {
    botonesPuzzle.forEach(function(boton, i) {
        let figura = boton.querySelector(".figura");
        figura.className = "figura " +
        figurasPuzzle[posicionesPuzzle[i]];
    });
}
// Cambiar figura al hacer clic (espero que funcione bien no como el otro que aun no le encuentro soluccion)
botonesPuzzle.forEach(function(boton, i) {
    boton.addEventListener("click", function() {
        if (puzzleTerminado) return;
        posicionesPuzzle[i]++;
        if (posicionesPuzzle[i] >= 4) {
            posicionesPuzzle[i] = 0;
        }
        mostrarFiguras();
        comprobarPuzzle();
    });
});
// Comprobar la  combinacion para avanzar 
function comprobarPuzzle() {
    let correcto = true;
    for (let i = 0; i < 4; i++) {
        if (posicionesPuzzle[i] !== respuestaPuzzle[i]) {
            correcto = false;
        }
    }
    if (correcto) {
        terminarPuzzleSimbolos();
    }
}
// aqui es donde se complata el puzzle amigo
function terminarPuzzleSimbolos() {
    puzzleTerminado = true;
    mensajePuzzle.textContent = "!Correcto!";
    // apartir de aqui es donde continua el juego
}
// Iniciar
mostrarFiguras();
