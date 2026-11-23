
export function buscarHoja(k, listos, nombre, archivos, cuadros, animacion, fps, maxTextura = 2048) {
    if (typeof Image === "undefined") return;
    const probar = (i) => {
        if (i >= archivos.length) {
            console.warn(`Falta el dibujo: ${archivos[0]}`);
            return;
        }
        const img = new Image();
        img.onerror = () => probar(i + 1);
        img.onload = () => {
            try {
                const fw = img.width / cuadros;            // ancho de cada cuadro en la hoja (puede tener decimales)
                const cw = Math.round(fw);                 // ancho entero en la cuadrícula
                const ch = img.height;
                const cols = Math.max(1, Math.min(cuadros, Math.floor(maxTextura / cw)));
                const filas = Math.ceil(cuadros / cols);
                const lienzo = document.createElement("canvas");
                lienzo.width = cols * cw;
                lienzo.height = filas * ch;
                const g = lienzo.getContext("2d");
                g.imageSmoothingEnabled = false;
                for (let n = 0; n < cuadros; n++) {
                    const sx = Math.round(n * fw);
                    g.drawImage(img, sx, 0, Math.min(cw, img.width - sx), ch,
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