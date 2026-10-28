const minijuego = document.getElementById("minijuego");
const jugador = document.getElementById("circuloJugador");
const meta = document.getElementById("circuloMeta");
const contador = document.getElementById("contadorMini");

let angulo = 0;
let objetivo = Math.random() * 360;
let direccion = 1;
let aciertos = 5;
let activo = true;
let ultimoTiempo = 0;

// punto verde en posición aleatoria
meta.style.transform = `rotate(${objetivo}deg)`;

// Girar círculo
function girar(tiempo) {
    if (!activo) return;
    if (ultimoTiempo !== 0) {
        angulo += (tiempo - ultimoTiempo) * 0.2 * direccion;
        angulo = (angulo + 360) % 360;
    }
    ultimoTiempo = tiempo;
    jugador.style.transform = `rotate(${angulo}deg)`;
    requestAnimationFrame(girar);
}

requestAnimationFrame(girar);

// los clic
minijuego.addEventListener("click", function() {
    if (!activo) return;

    let diferencia = Math.abs(angulo - objetivo);
    diferencia = Math.min(diferencia, 360 - diferencia);

    if (diferencia <= 25) {
        aciertos--;
        contador.textContent = "Aciertos restantes: " + aciertos;

        if (aciertos === 0) {
            terminarMinijuego();
        } else {
            direccion *= -1;
            objetivo = Math.random() * 360;
            meta.style.transform = `rotate(${objetivo}deg)`;
        }
        // condicion de derrota si el jugador empieza a fallar 
    } else {
        aciertos=5;
        contador.textContent = "Aciertos restantes:" + aciertos;
    }
});

// aqui se termina el minijuego de la llave 
function terminarMinijuego() {
    activo = false;
    minijuego.style.display = "none";

    // Aquí continuaria el juego rub pero aun no encuentro la forma de que despues siga el juego
}
