// OBTENIENDO LA REFERENCIA DE LOS BOTONES
// POR MEDIO DEL .getElementById

const buttonSpan = document.getElementById("idBtnSpan");
const buttonP = document.getElementById("idBtnP");
const buttonDiv = document.getElementById("idBtnDiv");
const buttonButton = document.getElementById("idBtnButton");
const imprimir = document.getElementById("idImprimirResultado");

// Longitud maxima del codigo HTML mostrado por cada etiqueta encontrada
const LONGITUD_MAXIMA_HTML = 140;

// DEFINICION DE FUNCIONES

// Elimina todos los nodos hijos de un elemento
const limpiarNodo = function (nodo) {
  while (nodo.firstChild) {
    nodo.removeChild(nodo.firstChild);
  }
};

// Devuelve el HTML del nodo en una sola linea y recortado
const resumirHtml = function (nodo) {
  const html = nodo.outerHTML.replace(/\s+/g, " ").trim();
  return html.length > LONGITUD_MAXIMA_HTML
    ? `${html.slice(0, LONGITUD_MAXIMA_HTML)}…`
    : html;
};

// Imprime el resultado en el documento usando nodos creados con DOM
const imprimirResultado = function (elemento, listaElementos) {
  limpiarNodo(imprimir);

  const titulo = document.createElement("h2");
  titulo.className = "h5 fw-bold mb-3";
  titulo.textContent = `Etiquetas buscadas <${elemento}></${elemento}> / Total encontradas : ${listaElementos.length}`;
  imprimir.appendChild(titulo);

  const lista = document.createElement("ul");
  lista.className = "list-group list-group-flush";

  for (const nodo of listaElementos) {
    const item = document.createElement("li");
    item.className = "list-group-item bg-transparent";

    const codigo = document.createElement("code");
    codigo.textContent = resumirHtml(nodo);

    item.appendChild(codigo);
    lista.appendChild(item);
  }

  imprimir.appendChild(lista);
  imprimir.hidden = false;
};

const contarElementos = function (elemento) {
  // OBTENIENDO EL NUMERO DE ETIQUETAS QUE SE HAN CREADO
  // EN EL DOCUMENTO HTML. Se copia la coleccion a un arreglo para que
  // los nodos agregados al imprimir el resultado no la modifiquen.
  let arrayElement = Array.from(document.getElementsByTagName(elemento));
  console.log(
    `Etiquetas buscadas <${elemento}></${elemento}> / Total encontradas : ${arrayElement.length}`
  );
  for (const i of arrayElement) {
    console.log(i);
  }

  imprimirResultado(elemento, arrayElement);
  alert("Revise la consola del navegador");
};

// DEFINICION DE EVENTOS PARA LOS BOTONES
buttonSpan.addEventListener("click", () => {
  contarElementos("span");
});

buttonP.addEventListener("click", () => {
  contarElementos("p");
});

buttonDiv.addEventListener("click", () => {
  contarElementos("div");
});

buttonButton.addEventListener("click", () => {
  contarElementos("button");
});