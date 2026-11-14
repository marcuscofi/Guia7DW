// Limites y paso de la escala del tamaño de letra
const ESCALA_MINIMA = 0.6;
const ESCALA_MAXIMA = 2;
const PASO_ESCALA = 0.1;
let escalaActual = 1;

const COLOR_FONDO_INICIAL = "#ffffff";
const COLOR_TITULOS_INICIAL = "#000000";
const COLOR_PARRAFOS_INICIAL = "#000000";

// Referencias a los controles de la pagina
const buttonFondo = document.getElementById("idFondo");
const buttonTitulos = document.getElementById("idTitulos");
const buttonParrafos = document.getElementById("idParrafos");
const buttonAumentar = document.getElementById("idBtnAumentar");
const buttonDisminuir = document.getElementById("idBtnDisminuir");
const buttonRestablecer = document.getElementById("idBtnRestablecer");
const indicadorEscala = document.getElementById("idIndicadorEscala");

// Inicializando primer color de fondo en el input color
const primerColorFondo = function (event) {
  document.body.style.backgroundColor = event.target.value;
};

const cambiarColorFondo = function (event) {
  document.body.style.backgroundColor = event.target.value;
};

// Asigna un color a todos los elementos que coinciden con el selector
const aplicarColorASelector = function (selector, colorSeleccionado) {
  const elementos = document.querySelectorAll(selector);
  for (let index = 0; index < elementos.length; index++) {
    elementos[index].style.color = colorSeleccionado;
  }
};

//Funciones para modificar el color de los titulos
const primerColorTitulos = function (event) {
  let colorSeleccionado = event.target.value;
  aplicarColorASelector("h1", colorSeleccionado);
};

const cambiarColorTitulos = function (event) {
  aplicarColorASelector("h1", event.target.value);
};

//Funciones para modificar el color de los parrafos
const primerColorParrafos = function (event) {
  let colorSeleccionado = event.target.value;
  aplicarColorASelector("p", colorSeleccionado);
};

const cambiarColorParrafos = function (event) {
  aplicarColorASelector("p", event.target.value);
};

// Funciones para manipular el tamaño de la fuente mostrada en el documento HTML.
// Se guarda el tamaño original de cada elemento (en px) y se multiplica por
// la escala actual, de esta forma los cambios no se acumulan entre elementos
// anidados y aumentar/disminuir siempre trabajan sobre el mismo valor.
const obtenerTamanoBase = function (elemento) {
  if (!elemento.dataset.tamanoBase) {
    elemento.dataset.tamanoBase = parseFloat(
      window.getComputedStyle(elemento).fontSize
    );
  }
  return Number(elemento.dataset.tamanoBase);
};

const obtenerElementosEscalables = function () {
  const parrafos = document.querySelectorAll("p");
  const titulos = document.querySelectorAll("h1");
  return [document.body, ...parrafos, ...titulos];
};

// Actualiza el indicador y habilita o deshabilita los botones segun la escala
const actualizarIndicadorEscala = function () {
  indicadorEscala.textContent = `${Math.round(escalaActual * 100)}%`;
  buttonAumentar.disabled = escalaActual >= ESCALA_MAXIMA;
  buttonDisminuir.disabled = escalaActual <= ESCALA_MINIMA;
};

const aplicarEscala = function () {
  const elementos = obtenerElementosEscalables();

  // Primero se registran todos los tamaños originales y luego se aplican,
  // asi el cambio en el body no altera la lectura de los demas elementos
  const tamanos = elementos.map((elemento) => obtenerTamanoBase(elemento));
  elementos.forEach((elemento, posicion) => {
    elemento.style.fontSize = `${(tamanos[posicion] * escalaActual).toFixed(2)}px`;
  });

  actualizarIndicadorEscala();
};

const cambiarEscala = function (variacion) {
  const nuevaEscala = Math.round((escalaActual + variacion) * 10) / 10;
  escalaActual = Math.min(ESCALA_MAXIMA, Math.max(ESCALA_MINIMA, nuevaEscala));
  aplicarEscala();
};

const aumentarLetra = function () {
  cambiarEscala(PASO_ESCALA);
};

const disminuirLetra = function () {
  cambiarEscala(-PASO_ESCALA);
};

// Quita los estilos en linea aplicados y regresa los controles a su valor inicial
const restablecerEstilos = function () {
  document.body.style.removeProperty("background-color");

  for (const elemento of obtenerElementosEscalables()) {
    elemento.style.removeProperty("font-size");
    delete elemento.dataset.tamanoBase;
  }
  for (const titulo of document.querySelectorAll("h1")) {
    titulo.style.removeProperty("color");
  }
  for (const parrafo of document.querySelectorAll("p")) {
    parrafo.style.removeProperty("color");
  }

  buttonFondo.value = COLOR_FONDO_INICIAL;
  buttonTitulos.value = COLOR_TITULOS_INICIAL;
  buttonParrafos.value = COLOR_PARRAFOS_INICIAL;

  escalaActual = 1;
  actualizarIndicadorEscala();
};

// Funcion principal para inicializar referencias y eventos a elementos HTML.
// Los eventos input y change se complementan para capturar en tiempo real
// el color seleccionado en <input type="color">.
const startDOM = () => {
  // Obteniendo la referencia del boton cambiar fondo
  buttonFondo.value = COLOR_FONDO_INICIAL;
  buttonFondo.addEventListener("input", primerColorFondo, false);
  buttonFondo.addEventListener("change", cambiarColorFondo, false);

  // Obteniendo la referencia del boton cambiar color de titulos
  buttonTitulos.value = COLOR_TITULOS_INICIAL;
  buttonTitulos.addEventListener("input", primerColorTitulos, false);
  buttonTitulos.addEventListener("change", cambiarColorTitulos, false);

  // Obteniendo la referencia del boton cambiar color de parrafos
  buttonParrafos.value = COLOR_PARRAFOS_INICIAL;
  buttonParrafos.addEventListener("input", primerColorParrafos, false);
  buttonParrafos.addEventListener("change", cambiarColorParrafos, false);

  //Obteniendo las referencias de los botones
  buttonAumentar.addEventListener("click", aumentarLetra, false);
  buttonDisminuir.addEventListener("click", disminuirLetra, false);
  buttonRestablecer.addEventListener("click", restablecerEstilos, false);
};

startDOM();