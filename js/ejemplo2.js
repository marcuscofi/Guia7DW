// Obteniendo la referencia de los elementos
// aqui se esta utilizando el atributo name de cada elemento
const formulario = document.forms["frmRegistro"];
const button = document.forms["frmRegistro"].elements["btnRegistro"];
const buttonContar = formulario.elements["btnContar"];

// CREANDO MODAL CON BOOTSTRAP
const modalElemento = document.getElementById("idModal");
const modal = new bootstrap.Modal(modalElemento, {});

// OBTENIENDO LA REFERENCIA DEL CUERPO DEL MODAL
// PARA IMPRIMIR EL RESULTADO
const bodyModal = document.getElementById("idBodyModal");
const tituloModal = document.getElementById("modalLabel");

// Contenedores de los grupos de checkbox y radio
const grupoIntereses = document.getElementById("idGrupoIntereses");
const grupoCarrera = document.getElementById("idGrupoCarrera");

// Correo: texto@dominio.extension, sin puntos consecutivos en el usuario
const REGEX_CORREO =
  /^(?!.*\.\.)[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

// URL temporal de la vista previa del avatar (se libera al cerrar el modal)
let urlAvatar = null;

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

// Devuelve el texto del label asociado a un control
const textoEtiqueta = function (control) {
  const etiqueta = document.querySelector(`label[for="${control.id}"]`);
  return etiqueta ? etiqueta.textContent.trim() : control.id;
};

// Convierte yyyy-mm-dd en dd/mm/yyyy
const formatearFecha = function (fechaIso) {
  return fechaIso.split("-").reverse().join("/");
};

// Fecha actual (hora local) en formato yyyy-mm-dd
const obtenerFechaActual = function () {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
};

// Construye una tabla Bootstrap sin utilizar innerHTML.
// Cada fila es [campo, valor] y el valor puede ser texto o un nodo.
const construirTabla = function (encabezados, filas) {
  const contenedor = crearElemento("div", "table-responsive");
  const tabla = crearElemento(
    "table",
    "table table-striped table-bordered align-middle mb-0"
  );

  const thead = crearElemento("thead", "table-dark");
  const filaEncabezado = document.createElement("tr");
  for (const encabezado of encabezados) {
    const th = crearElemento("th", "", encabezado);
    th.setAttribute("scope", "col");
    filaEncabezado.appendChild(th);
  }
  thead.appendChild(filaEncabezado);

  const tbody = document.createElement("tbody");
  for (const [campo, valor] of filas) {
    const fila = document.createElement("tr");
    const th = crearElemento("th", "text-nowrap", campo);
    th.setAttribute("scope", "row");
    const td = document.createElement("td");

    if (valor instanceof Node) {
      td.appendChild(valor);
    } else {
      td.textContent = valor;
    }

    fila.appendChild(th);
    fila.appendChild(td);
    tbody.appendChild(fila);
  }

  tabla.appendChild(thead);
  tabla.appendChild(tbody);
  contenedor.appendChild(tabla);
  return contenedor;
};

// Muestra un titulo y un contenido en el modal de Bootstrap
const mostrarModal = function (titulo, contenido) {
  tituloModal.textContent = titulo;
  limpiarNodo(bodyModal);
  bodyModal.appendChild(contenido);
  // Funcion definida por Bootstrap que permite mostrar el modal
  modal.show();
};

// ---------------------------------------------------------------
// Recorrer el formulario (conteo de controles)
// ---------------------------------------------------------------

// Recorrer el formulario
const recorrerFormulario = function () {
  const totales = {
    text: 0,
    password: 0,
    radio: 0,
    checkbox: 0,
    date: 0,
    email: 0,
    file: 0,
    select: 0,
  };

  // Recorriendo elementos del formulario
  let elementos = formulario.elements;
  let totalElementos = elementos.length;

  for (let index = 0; index < totalElementos; index++) {
    // Accediendo a cada hijo del formulario
    let elemento = elementos[index];

    // verificando el tipo de control en el formulario
    let tipoElemento = elemento.type;
    // verificando el tipo de nodo
    let tipoNode = elemento.nodeName;

    // Contabilizando el total de INPUT segun su TYPE
    if (tipoNode == "INPUT" && Object.hasOwn(totales, tipoElemento)) {
      console.log(elemento);
      totales[tipoElemento]++;
    }
    // Contabilizando el total de SELECT
    else if (tipoNode == "SELECT") {
      console.log(elemento);
      totales.select++;
    }
  }

  const filas = [];
  let suma = 0;
  for (const [tipo, total] of Object.entries(totales)) {
    const nombre = tipo == "select" ? "select" : `input[type="${tipo}"]`;
    filas.push([`Total de ${nombre}`, String(total)]);
    suma += total;
  }
  filas.push(["Total de controles de captura", String(suma)]);

  mostrarModal(
    "Controles del formulario",
    construirTabla(["Control", "Cantidad"], filas)
  );
};

// ---------------------------------------------------------------
// Mensajes de validacion
// ---------------------------------------------------------------

// Quita las marcas de error asociadas a una clave (id de control o grupo)
const quitarError = function (clave) {
  const marcados = formulario.querySelectorAll(
    `[data-error-clave="${clave}"]`
  );
  for (const control of marcados) {
    control.classList.remove("is-invalid");
    control.removeAttribute("data-error-clave");
  }

  const mensajes = document.querySelectorAll(
    `.js-feedback[data-clave="${clave}"]`
  );
  for (const mensaje of mensajes) {
    mensaje.parentNode.removeChild(mensaje);
  }
};

const limpiarErrores = function () {
  const mensajes = document.querySelectorAll(".js-feedback");
  for (const mensaje of mensajes) {
    mensaje.parentNode.removeChild(mensaje);
  }
  const marcados = formulario.querySelectorAll(".is-invalid");
  for (const control of marcados) {
    control.classList.remove("is-invalid");
    control.removeAttribute("data-error-clave");
  }
};

// Dibuja un error: marca los controles y agrega el mensaje
const mostrarError = function (error) {
  for (const control of error.campos) {
    control.classList.add("is-invalid");
    control.setAttribute("data-error-clave", error.clave);
  }

  const mensaje = crearElemento(
    "div",
    "invalid-feedback d-block js-feedback",
    error.mensaje
  );
  mensaje.setAttribute("data-clave", error.clave);

  if (error.destino) {
    error.destino.appendChild(mensaje);
  } else {
    error.campos[0].insertAdjacentElement("afterend", mensaje);
  }
};

// Al modificar un control se elimina su mensaje de error
const limpiarErrorDelControl = function (evento) {
  const control = evento.target;
  let clave = control.id;

  if (control.type == "checkbox") {
    clave = "intereses";
  } else if (control.type == "radio") {
    clave = "carrera";
  }

  quitarError(clave);
  // Al cambiar la contraseña tambien se revalida la repeticion
  if (control.id == "idPassword") {
    quitarError("idPasswordRepetir");
  }
};

// ---------------------------------------------------------------
// Validaciones del formulario
// ---------------------------------------------------------------

// Devuelve la lista de errores encontrados (vacia si todo es valido)
const validarFormulario = function () {
  const errores = [];

  const agregarError = function (campos, mensaje, clave, destino = null) {
    errores.push({ campos, mensaje, clave, destino });
  };
  const tieneError = function (clave) {
    return errores.some((error) => error.clave == clave);
  };

  // a. Los campos no deben estar vacios
  const camposObligatorios = [
    ["idNombre", "Nombres"],
    ["idApellidos", "Apellidos"],
    ["idFechaNac", "Fecha de nacimiento"],
    ["idCorreo", "Correo electrónico"],
    ["idPassword", "Contraseña"],
    ["idPasswordRepetir", "Repetir contraseña"],
  ];

  for (const [id, nombre] of camposObligatorios) {
    const control = formulario.elements[id];
    const vacio =
      control.type == "password"
        ? control.value == ""
        : control.value.trim() == "";

    if (vacio) {
      agregarError([control], `El campo ${nombre} es obligatorio.`, id);
    }
  }

  // b. La fecha de nacimiento no puede superar la fecha actual
  const fechaNac = formulario.elements["idFechaNac"];
  if (!tieneError("idFechaNac") && fechaNac.value > obtenerFechaActual()) {
    agregarError(
      [fechaNac],
      "La fecha de nacimiento no puede ser posterior a la fecha actual.",
      "idFechaNac"
    );
  }

  // c. Correo electronico validado con expresion regular
  const correo = formulario.elements["idCorreo"];
  if (!tieneError("idCorreo") && !REGEX_CORREO.test(correo.value.trim())) {
    agregarError(
      [correo],
      "Ingrese un correo electrónico válido (ejemplo: usuario@dominio.com).",
      "idCorreo"
    );
  }

  const password = formulario.elements["idPassword"];
  const repetir = formulario.elements["idPasswordRepetir"];
  if (
    !tieneError("idPassword") &&
    !tieneError("idPasswordRepetir") &&
    password.value != repetir.value
  ) {
    agregarError([repetir], "Las contraseñas no coinciden.", "idPasswordRepetir");
  }

  const intereses = formulario.querySelectorAll('input[type="checkbox"]');
  const interesesMarcados = formulario.querySelectorAll(
    'input[type="checkbox"]:checked'
  );
  if (interesesMarcados.length == 0) {
    agregarError(
      Array.from(intereses),
      "Seleccione al menos un interés.",
      "intereses",
      grupoIntereses
    );
  }

  const carreras = formulario.querySelectorAll('input[name="idRdCarrera"]');
  const carreraMarcada = formulario.querySelector(
    'input[name="idRdCarrera"]:checked'
  );
  if (!carreraMarcada) {
    agregarError(
      Array.from(carreras),
      "Seleccione la carrera que estudia.",
      "carrera",
      grupoCarrera
    );
  }

  const pais = formulario.elements["idCmPais"];
  if (pais.value == "") {
    agregarError([pais], "Seleccione un país de origen.", "idCmPais");
  }

  const archivo = formulario.elements["idArchivo"];
  if (archivo.files.length > 0 && !archivo.files[0].type.startsWith("image/")) {
    agregarError(
      [archivo],
      "El archivo seleccionado debe ser una imagen.",
      "idArchivo"
    );
  }

  return errores;
};

// ---------------------------------------------------------------
// Resumen del registro
// ---------------------------------------------------------------

const crearCeldaAvatar = function () {
  const archivo = formulario.elements["idArchivo"].files[0];
  if (!archivo) {
    return "No se seleccionó ninguna imagen";
  }

  urlAvatar = URL.createObjectURL(archivo);

  const contenedor = crearElemento("div", "d-flex align-items-center gap-3");
  const imagen = crearElemento("img", "img-thumbnail");
  imagen.setAttribute("src", urlAvatar);
  imagen.setAttribute("alt", "Vista previa del avatar");
  imagen.style.maxHeight = "80px";
  imagen.style.maxWidth = "80px";

  const tamanoKb = (archivo.size / 1024).toFixed(1);
  const detalle = crearElemento("small", "text-muted", `${archivo.name} (${tamanoKb} KB)`);

  contenedor.appendChild(imagen);
  contenedor.appendChild(detalle);
  return contenedor;
};

const mostrarResumenRegistro = function () {
  const intereses = Array.from(
    formulario.querySelectorAll('input[type="checkbox"]:checked')
  ).map((control) => textoEtiqueta(control));

  const carrera = textoEtiqueta(
    formulario.querySelector('input[name="idRdCarrera"]:checked')
  );
  const pais = formulario.elements["idCmPais"];
  const paisTexto = pais.options[pais.selectedIndex].text;

  const filas = [
    ["Nombres", formulario.elements["idNombre"].value.trim()],
    ["Apellidos", formulario.elements["idApellidos"].value.trim()],
    ["Fecha de nacimiento", formatearFecha(formulario.elements["idFechaNac"].value)],
    ["Correo electrónico", formulario.elements["idCorreo"].value.trim()],
    ["Contraseña", "•".repeat(formulario.elements["idPassword"].value.length)],
    ["Intereses", intereses.join(", ")],
    ["Carrera", carrera],
    ["País de origen", paisTexto],
    ["Avatar", crearCeldaAvatar()],
  ];

  mostrarModal(
    "Registro validado correctamente",
    construirTabla(["Campo", "Información capturada"], filas)
  );
};

const enviarRegistro = function () {
  limpiarErrores();
  const errores = validarFormulario();

  if (errores.length > 0) {
    for (const error of errores) {
      mostrarError(error);
    }
    errores[0].campos[0].focus();
    return;
  }

  mostrarResumenRegistro();
};

// ---------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------

button.addEventListener("click", () => {
  enviarRegistro();
});

buttonContar.addEventListener("click", () => {
  recorrerFormulario();
});

formulario.addEventListener("input", limpiarErrorDelControl);
formulario.addEventListener("change", limpiarErrorDelControl);
formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  enviarRegistro();
});

modalElemento.addEventListener("hidden.bs.modal", () => {
  if (urlAvatar) {
    URL.revokeObjectURL(urlAvatar);
    urlAvatar = null;
  }
});

formulario.elements["idFechaNac"].setAttribute("max", obtenerFechaActual());