// ---------------------------------------------------------------
// Configuracion de la API (TheCocktailDB publicada en RapidAPI)
// ---------------------------------------------------------------
const HOST_POR_DEFECTO = "the-cocktail-db.p.rapidapi.com";
const ALMACEN_KEY = "1"; // Test Key en documentacion ya que se me dificulto montar el plan gratis
const ALMACEN_HOST = "guia7.rapidapi.host";
const REGEX_HOST = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i;

const TAMANO_PAGINA = 12;
const TIEMPO_ESPERA_MS = 12000;
const CATEGORIA_INICIAL = "Cocktail";
const MAXIMO_INGREDIENTES = 15;

// Categorias utilizadas si el endpoint de categorias no responde
const CATEGORIAS_RESPALDO = [
  "Beer",
  "Cocktail",
  "Cocoa",
  "Coffee / Tea",
  "Homemade Liqueur",
  "Milk / Float / Shake",
  "Ordinary Drink",
  "Other / Unknown",
  "Punch / Party Drink",
  "Shot",
  "Soft Drink",
];

const IMAGEN_NO_DISPONIBLE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">' +
      '<rect width="300" height="300" fill="#e9ecef"/>' +
      '<text x="150" y="158" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#6c757d">Sin imagen</text>' +
      "</svg>"
  );

// ---------------------------------------------------------------
// Referencias al DOM
// ---------------------------------------------------------------
const formBusqueda = document.getElementById("idFormBusqueda");
const inputBuscar = document.getElementById("idBuscar");
const botonBuscar = document.getElementById("idBtnBuscar");
const selectCategoria = document.getElementById("idCategoria");
const contenedorEstado = document.getElementById("idEstado");
const tituloResultados = document.getElementById("idTituloResultados");
const contador = document.getElementById("idContador");
const listado = document.getElementById("idListado");
const botonVerMas = document.getElementById("idBtnVerMas");

const modalDetalleElemento = document.getElementById("idModalDetalle");
const modalDetalle = new bootstrap.Modal(modalDetalleElemento, {});
const tituloDetalle = document.getElementById("idTituloDetalle");
const cuerpoDetalle = document.getElementById("idCuerpoDetalle");

const botonConfig = document.getElementById("idBtnConfig");
const modalConfigElemento = document.getElementById("idModalConfig");
const modalConfig = new bootstrap.Modal(modalConfigElemento, {});
const formConfig = document.getElementById("idFormConfig");
const inputApiKey = document.getElementById("idApiKey");
const inputApiHost = document.getElementById("idApiHost");
const botonMostrarKey = document.getElementById("idBtnMostrarKey");
const botonBorrarKey = document.getElementById("idBtnBorrarKey");

// ---------------------------------------------------------------
// Estado de la aplicacion
// ---------------------------------------------------------------
const estado = {
  bebidas: [],
  mostradas: 0,
  titulo: "",
  controladorListado: null,
  controladorDetalle: null,
};

// Detalles ya consultados, para no repetir solicitudes
const cacheDetalle = new Map();

// ---------------------------------------------------------------
// Almacenamiento local (para guardar la API key y el host)
// ---------------------------------------------------------------
const leerAlmacen = function (clave) {
  try {
    return window.localStorage.getItem(clave);
  } catch (error) {
    return null;
  }
};

const guardarAlmacen = function (clave, valor) {
  try {
    if (valor === null) {
      window.localStorage.removeItem(clave);
    } else {
      window.localStorage.setItem(clave, valor);
    }
  } catch (error) {
    console.warn("No se pudo acceder al almacenamiento local:", error);
  }
};

const configuracion = {
  key: leerAlmacen(ALMACEN_KEY) || "",
  host: leerAlmacen(ALMACEN_HOST) || HOST_POR_DEFECTO,
};

// ---------------------------------------------------------------
// Utilidades de DOM
// ---------------------------------------------------------------
const crearElemento = function (etiqueta, clases = "", texto = "") {
  const elemento = document.createElement(etiqueta);
  if (clases != "") {
    elemento.className = clases;
  }
  if (texto != "") {
    elemento.textContent = texto;
  }
  return elemento;
};

const limpiarNodo = function (nodo) {
  while (nodo.firstChild) {
    nodo.removeChild(nodo.firstChild);
  }
};

// Dibuja una alerta (carga, error, aviso o vacio) dentro de un contenedor
const pintarAlerta = function (contenedor, tipo, mensaje, accion = null) {
  limpiarNodo(contenedor);
  if (tipo == "limpio") {
    return;
  }

  const clases = {
    cargando: "alert-secondary",
    error: "alert-danger",
    aviso: "alert-warning",
    vacio: "alert-info",
  };

  const alerta = crearElemento(
    "div",
    `alert ${clases[tipo]} d-flex flex-wrap align-items-center gap-3`
  );
  alerta.setAttribute("role", tipo == "error" ? "alert" : "status");

  if (tipo == "cargando") {
    const spinner = crearElemento("div", "spinner-border spinner-border-sm");
    spinner.setAttribute("aria-hidden", "true");
    alerta.appendChild(spinner);
  }

  alerta.appendChild(crearElemento("span", "flex-grow-1", mensaje));

  if (accion) {
    const boton = crearElemento("button", "btn btn-sm btn-outline-dark", accion.texto);
    boton.setAttribute("type", "button");
    boton.addEventListener("click", accion.ejecutar);
    alerta.appendChild(boton);
  }

  contenedor.appendChild(alerta);
};

const mostrarEstado = function (tipo, mensaje, accion = null) {
  pintarAlerta(contenedorEstado, tipo, mensaje, accion);
};

// ---------------------------------------------------------------
// Cliente de la API (Fetch + async/await)
// ---------------------------------------------------------------
class ErrorApi extends Error {
  constructor(tipo, mensaje, estadoHttp = null) {
    super(mensaje);
    this.name = "ErrorApi";
    this.tipo = tipo;
    this.estadoHttp = estadoHttp;
  }
}

const mensajeSegunEstado = function (codigo) {
  if (codigo == 401 || codigo == 403) {
    return `La API key es inválida o no está suscrita a este plan (HTTP ${codigo}). Revise sus credenciales.`;
  }
  if (codigo == 404) {
    return "El recurso solicitado no existe (HTTP 404).";
  }
  if (codigo == 429) {
    return "Se superó el límite de solicitudes del plan gratuito (HTTP 429). Intente nuevamente en unos instantes.";
  }
  if (codigo >= 500) {
    return `El servidor de la API no está disponible (HTTP ${codigo}). Intente más tarde.`;
  }
  return `La API respondió con un error inesperado (HTTP ${codigo}).`;
};

// Realiza una solicitud GET a la API y devuelve el JSON recibido
const solicitarApi = async function (endpoint, parametros = {}, senal = null) {
  if (!configuracion.key) {
    throw new ErrorApi(
      "configuracion",
      "Debe configurar su API key de RapidAPI para consultar los datos."
    );
  }

  const url = new URL(`https://${configuracion.host}/${endpoint}`);
  for (const [nombre, valor] of Object.entries(parametros)) {
    url.searchParams.set(nombre, valor);
  }

  // Controlador propio para cancelar por tiempo de espera o por cancelacion externa
  const controlador = new AbortController();
  const temporizador = setTimeout(() => {
    controlador.abort(new DOMException("Tiempo de espera agotado", "TimeoutError"));
  }, TIEMPO_ESPERA_MS);

  if (senal) {
    senal.addEventListener("abort", () => controlador.abort(senal.reason), { once: true });
  }

  try {
    const respuesta = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": configuracion.key,
        "X-RapidAPI-Host": configuracion.host,
        Accept: "application/json",
      },
      signal: controlador.signal,
    });

    if (!respuesta.ok) {
      throw new ErrorApi("http", mensajeSegunEstado(respuesta.status), respuesta.status);
    }

    // Algunos endpoints devuelven cuerpo vacio cuando no hay resultados
    const texto = await respuesta.text();
    return texto.trim() == "" ? {} : JSON.parse(texto);
  } catch (error) {
    if (error instanceof ErrorApi) {
      throw error;
    }
    if (error.name == "TimeoutError") {
      throw new ErrorApi("tiempo", "La API tardó demasiado en responder. Intente nuevamente.");
    }
    if (error.name == "AbortError") {
      throw new ErrorApi("cancelado", "Solicitud cancelada.");
    }
    if (error instanceof SyntaxError) {
      throw new ErrorApi("formato", "La API devolvió una respuesta con un formato no válido.");
    }
    throw new ErrorApi(
      "red",
      "No se pudo conectar con la API. Verifique su conexión a internet."
    );
  } finally {
    clearTimeout(temporizador);
  }
};

// La API devuelve { drinks: [...] }, { drinks: null } o { drinks: "None Found" }
const extraerBebidas = function (datos) {
  return datos && Array.isArray(datos.drinks) ? datos.drinks : [];
};

// ---------------------------------------------------------------
// Categorias (endpoint auxiliar: list.php)
// ---------------------------------------------------------------
const poblarCategorias = function (categorias) {
  limpiarNodo(selectCategoria);

  const opcionInicial = crearElemento("option", "", "Seleccione una categoría");
  opcionInicial.value = "";
  selectCategoria.appendChild(opcionInicial);

  for (const categoria of categorias) {
    const opcion = crearElemento("option", "", categoria);
    opcion.value = categoria;
    selectCategoria.appendChild(opcion);
  }
};

const cargarCategorias = async function () {
  try {
    const datos = await solicitarApi("list.php", { c: "list" });
    const categorias = extraerBebidas(datos)
      .map((elemento) => elemento.strCategory)
      .filter((categoria) => Boolean(categoria))
      .sort((a, b) => a.localeCompare(b));

    poblarCategorias(categorias.length > 0 ? categorias : CATEGORIAS_RESPALDO);
  } catch (error) {
    console.warn("No se pudieron cargar las categorias:", error);
    poblarCategorias(CATEGORIAS_RESPALDO);
  }
};

// ---------------------------------------------------------------
// ENDPOINT 1: listado de recursos (filter.php y search.php)
// ---------------------------------------------------------------
const crearTarjeta = function (bebida) {
  const columna = crearElemento("div", "col-6 col-md-4 col-lg-3");
  const tarjeta = crearElemento("article", "card h-100 shadow-sm tarjeta-coctel");

  const imagen = crearElemento("img", "card-img-top");
  imagen.setAttribute("loading", "lazy");
  imagen.setAttribute("alt", `Fotografía de ${bebida.strDrink}`);
  imagen.addEventListener(
    "error",
    () => {
      imagen.setAttribute("src", IMAGEN_NO_DISPONIBLE);
    },
    { once: true }
  );
  imagen.setAttribute("src", bebida.strDrinkThumb || IMAGEN_NO_DISPONIBLE);

  const cuerpo = crearElemento("div", "card-body pb-2");
  cuerpo.appendChild(crearElemento("h3", "h6 card-title mb-1", bebida.strDrink));
  cuerpo.appendChild(
    crearElemento("small", "text-muted", bebida.strCategory || `Código ${bebida.idDrink}`)
  );

  const pie = crearElemento("div", "card-footer bg-transparent border-0 pt-0");
  const boton = crearElemento("button", "btn btn-primary btn-sm w-100 stretched-link", "Ver detalle");
  boton.setAttribute("type", "button");
  boton.setAttribute("data-id", bebida.idDrink);
  boton.setAttribute("data-nombre", bebida.strDrink);
  boton.setAttribute("aria-label", `Ver detalle de ${bebida.strDrink}`);
  pie.appendChild(boton);

  tarjeta.appendChild(imagen);
  tarjeta.appendChild(cuerpo);
  tarjeta.appendChild(pie);
  columna.appendChild(tarjeta);
  return columna;
};

// Agrega al listado la siguiente pagina de resultados
const renderizarSiguientePagina = function () {
  const fragmento = document.createDocumentFragment();
  const siguiente = estado.bebidas.slice(
    estado.mostradas,
    estado.mostradas + TAMANO_PAGINA
  );

  for (const bebida of siguiente) {
    fragmento.appendChild(crearTarjeta(bebida));
  }
  listado.appendChild(fragmento);
  estado.mostradas += siguiente.length;

  contador.textContent = `Mostrando ${estado.mostradas} de ${estado.bebidas.length} resultados`;
  contador.hidden = false;
  botonVerMas.hidden = estado.mostradas >= estado.bebidas.length;
};

const reiniciarListado = function () {
  estado.bebidas = [];
  estado.mostradas = 0;
  limpiarNodo(listado);
  listado.setAttribute("aria-busy", "false");
  tituloResultados.hidden = true;
  contador.hidden = true;
  botonVerMas.hidden = true;
};

// Consulta un endpoint de listado y muestra los resultados
const ejecutarListado = async function (titulo, endpoint, parametros) {
  // Si hay una consulta en curso se cancela para evitar respuestas desordenadas
  if (estado.controladorListado) {
    estado.controladorListado.abort();
  }
  const controlador = new AbortController();
  estado.controladorListado = controlador;

  const reintentar = {
    texto: "Reintentar",
    ejecutar: () => ejecutarListado(titulo, endpoint, parametros),
  };

  reiniciarListado();
  listado.setAttribute("aria-busy", "true");
  botonBuscar.disabled = true;
  mostrarEstado("cargando", `Cargando resultados (${titulo})...`);

  try {
    const datos = await solicitarApi(endpoint, parametros, controlador.signal);
    if (controlador !== estado.controladorListado) {
      return;
    }

    estado.bebidas = extraerBebidas(datos);
    estado.titulo = titulo;

    if (estado.bebidas.length == 0) {
      mostrarEstado("vacio", `No se encontraron resultados (${titulo}).`);
      return;
    }

    mostrarEstado("limpio");
    tituloResultados.textContent = titulo;
    tituloResultados.hidden = false;
    renderizarSiguientePagina();
  } catch (error) {
    if (controlador !== estado.controladorListado || error.tipo == "cancelado") {
      return;
    }
    if (error instanceof ErrorApi) {
      if (error.tipo == "configuracion") {
        mostrarEstado("aviso", error.message, {
          texto: "Configurar API key",
          ejecutar: abrirConfiguracion,
        });
      } else {
        mostrarEstado("error", error.message, reintentar);
      }
    } else {
      console.error(error);
      mostrarEstado("error", "Ocurrió un error inesperado al mostrar los resultados.", reintentar);
    }
  } finally {
    if (controlador === estado.controladorListado) {
      listado.setAttribute("aria-busy", "false");
      botonBuscar.disabled = false;
    }
  }
};

const buscarPorNombre = function (nombre) {
  selectCategoria.value = "";
  return ejecutarListado(`Búsqueda: ${nombre}`, "search.php", { s: nombre });
};

const listarPorCategoria = function (categoria) {
  inputBuscar.value = "";
  return ejecutarListado(`Categoría: ${categoria}`, "filter.php", { c: categoria });
};

// ---------------------------------------------------------------
// ENDPOINT 2: detalle de un recurso (lookup.php)
// ---------------------------------------------------------------
const crearInsignia = function (icono, texto) {
  const insignia = crearElemento("span", "badge text-bg-secondary me-1 mb-1");
  const marca = crearElemento("i", `bi ${icono} me-1`);
  marca.setAttribute("aria-hidden", "true");
  insignia.appendChild(marca);
  insignia.appendChild(document.createTextNode(texto));
  return insignia;
};

// Une los campos strIngredient1..15 con sus medidas strMeasure1..15
const obtenerIngredientes = function (bebida) {
  const ingredientes = [];
  for (let i = 1; i <= MAXIMO_INGREDIENTES; i++) {
    const ingrediente = bebida[`strIngredient${i}`];
    if (ingrediente && ingrediente.trim() != "") {
      const medida = bebida[`strMeasure${i}`];
      ingredientes.push({
        ingrediente: ingrediente.trim(),
        medida: medida ? medida.trim() : "",
      });
    }
  }
  return ingredientes;
};

const renderizarDetalle = function (bebida) {
  limpiarNodo(cuerpoDetalle);

  const fila = crearElemento("div", "row g-4");

  // Columna de la imagen
  const columnaImagen = crearElemento("div", "col-12 col-md-5");
  const imagen = crearElemento("img", "detalle-imagen");
  imagen.setAttribute("alt", `Fotografía de ${bebida.strDrink}`);
  imagen.addEventListener(
    "error",
    () => {
      imagen.setAttribute("src", IMAGEN_NO_DISPONIBLE);
    },
    { once: true }
  );
  imagen.setAttribute("src", bebida.strDrinkThumb || IMAGEN_NO_DISPONIBLE);
  columnaImagen.appendChild(imagen);

  // Columna de informacion
  const columnaInfo = crearElemento("div", "col-12 col-md-7");

  const insignias = crearElemento("div", "mb-3");
  if (bebida.strCategory) {
    insignias.appendChild(crearInsignia("bi-tag", bebida.strCategory));
  }
  if (bebida.strAlcoholic) {
    insignias.appendChild(crearInsignia("bi-droplet", bebida.strAlcoholic));
  }
  if (bebida.strGlass) {
    insignias.appendChild(crearInsignia("bi-cup-straw", bebida.strGlass));
  }
  columnaInfo.appendChild(insignias);

  columnaInfo.appendChild(crearElemento("h2", "h6 fw-bold", "Ingredientes"));
  const listaIngredientes = crearElemento("ul", "list-group list-group-flush mb-3");
  for (const { ingrediente, medida } of obtenerIngredientes(bebida)) {
    const item = crearElemento(
      "li",
      "list-group-item d-flex justify-content-between align-items-center px-0"
    );
    item.appendChild(crearElemento("span", "", ingrediente));
    item.appendChild(crearElemento("small", "text-muted", medida));
    listaIngredientes.appendChild(item);
  }
  columnaInfo.appendChild(listaIngredientes);

  // Instrucciones: se prefiere la version en español si existe
  const instrucciones = bebida.strInstructionsES || bebida.strInstructions;
  columnaInfo.appendChild(crearElemento("h2", "h6 fw-bold", "Preparación"));
  columnaInfo.appendChild(
    crearElemento("p", "mb-2", instrucciones || "No hay instrucciones disponibles.")
  );
  if (instrucciones && !bebida.strInstructionsES) {
    columnaInfo.appendChild(
      crearElemento("small", "text-muted", "Instrucciones disponibles solo en inglés.")
    );
  }

  fila.appendChild(columnaImagen);
  fila.appendChild(columnaInfo);
  cuerpoDetalle.appendChild(fila);
};

const abrirDetalle = async function (id, nombre) {
  if (estado.controladorDetalle) {
    estado.controladorDetalle.abort();
  }
  const controlador = new AbortController();
  estado.controladorDetalle = controlador;

  tituloDetalle.textContent = nombre || "Detalle";
  pintarAlerta(cuerpoDetalle, "cargando", "Cargando información del cóctel...");
  modalDetalle.show();

  try {
    let bebida = cacheDetalle.get(id);

    if (!bebida) {
      const datos = await solicitarApi("lookup.php", { i: id }, controlador.signal);
      bebida = extraerBebidas(datos)[0];

      if (!bebida) {
        throw new ErrorApi("vacio", "No se encontró información detallada para este cóctel.");
      }
      cacheDetalle.set(id, bebida);
    }

    if (controlador !== estado.controladorDetalle) {
      return;
    }
    tituloDetalle.textContent = bebida.strDrink;
    renderizarDetalle(bebida);
  } catch (error) {
    if (controlador !== estado.controladorDetalle || error.tipo == "cancelado") {
      return;
    }
    const mensaje =
      error instanceof ErrorApi
        ? error.message
        : "Ocurrió un error inesperado al mostrar el detalle.";
    if (!(error instanceof ErrorApi)) {
      console.error(error);
    }
    pintarAlerta(cuerpoDetalle, "error", mensaje, {
      texto: "Reintentar",
      ejecutar: () => abrirDetalle(id, nombre),
    });
  }
};

// ---------------------------------------------------------------
// Configuracion de credenciales
// ---------------------------------------------------------------
const abrirConfiguracion = function () {
  inputApiKey.value = configuracion.key;
  inputApiHost.value = configuracion.host;
  inputApiKey.classList.remove("is-invalid");
  inputApiHost.classList.remove("is-invalid");
  inputApiKey.type = "password";
  botonMostrarKey.setAttribute("aria-pressed", "false");
  modalConfig.show();
};

const guardarConfiguracion = function () {
  const clave = inputApiKey.value.trim();
  const host = inputApiHost.value.trim();

  inputApiKey.classList.toggle("is-invalid", clave == "");
  inputApiHost.classList.toggle("is-invalid", !REGEX_HOST.test(host));

  if (clave == "") {
    inputApiKey.focus();
    return;
  }
  if (!REGEX_HOST.test(host)) {
    inputApiHost.focus();
    return;
  }

  configuracion.key = clave;
  configuracion.host = host;
  guardarAlmacen(ALMACEN_KEY, clave);
  guardarAlmacen(ALMACEN_HOST, host);

  modalConfig.hide();
  cacheDetalle.clear();
  iniciarAplicacion();
};

const borrarConfiguracion = function () {
  configuracion.key = "";
  configuracion.host = HOST_POR_DEFECTO;
  guardarAlmacen(ALMACEN_KEY, null);
  guardarAlmacen(ALMACEN_HOST, null);
  cacheDetalle.clear();

  modalConfig.hide();
  iniciarAplicacion();
};

// ---------------------------------------------------------------
// Inicio de la aplicacion
// ---------------------------------------------------------------
const iniciarAplicacion = async function () {
  reiniciarListado();

  if (!configuracion.key) {
    poblarCategorias(CATEGORIAS_RESPALDO);
    mostrarEstado(
      "aviso",
      "Configure su API key de RapidAPI para consultar los cócteles.",
      { texto: "Configurar API key", ejecutar: abrirConfiguracion }
    );
    return;
  }

  mostrarEstado("cargando", "Cargando categorías...");
  await cargarCategorias();

  if (Array.from(selectCategoria.options).some((o) => o.value == CATEGORIA_INICIAL)) {
    selectCategoria.value = CATEGORIA_INICIAL;
    listarPorCategoria(CATEGORIA_INICIAL);
  } else {
    mostrarEstado("limpio");
  }
};

// ---------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------
formBusqueda.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const nombre = inputBuscar.value.trim();

  if (nombre == "") {
    inputBuscar.classList.add("is-invalid");
    mostrarEstado("aviso", "Ingrese el nombre de un cóctel para realizar la búsqueda.");
    inputBuscar.focus();
    return;
  }

  inputBuscar.classList.remove("is-invalid");
  buscarPorNombre(nombre);
});

inputBuscar.addEventListener("input", () => {
  inputBuscar.classList.remove("is-invalid");
});

selectCategoria.addEventListener("change", () => {
  if (selectCategoria.value != "") {
    listarPorCategoria(selectCategoria.value);
  }
});

botonVerMas.addEventListener("click", renderizarSiguientePagina);

// Delegacion de eventos: un solo listener para todas las tarjetas
listado.addEventListener("click", (evento) => {
  const boton = evento.target.closest("[data-id]");
  if (boton) {
    abrirDetalle(boton.dataset.id, boton.dataset.nombre);
  }
});

// Si se cierra el modal se cancela la consulta de detalle en curso
modalDetalleElemento.addEventListener("hidden.bs.modal", () => {
  if (estado.controladorDetalle) {
    estado.controladorDetalle.abort();
  }
});

botonConfig.addEventListener("click", abrirConfiguracion);

formConfig.addEventListener("submit", (evento) => {
  evento.preventDefault();
  guardarConfiguracion();
});

botonBorrarKey.addEventListener("click", borrarConfiguracion);

botonMostrarKey.addEventListener("click", () => {
  const visible = inputApiKey.type == "text";
  inputApiKey.type = visible ? "password" : "text";
  botonMostrarKey.setAttribute("aria-pressed", String(!visible));
});

modalConfigElemento.addEventListener("shown.bs.modal", () => {
  inputApiKey.focus();
});

iniciarAplicacion();