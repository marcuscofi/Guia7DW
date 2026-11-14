// ACCEDIENDO A LA REFERENCIA DEL FORMULARIO QUE
// TENDRA LOS NUEVOS ELEMENTOS
const newForm = document.getElementById("idNewForm");
const mensajeVacio = document.getElementById("idMensajeVacio");

// ACCEDIENDO A LA REFERENCIA DE BOTONES
const buttonCrear = document.getElementById("idBtnCrear");
const buttonAddElemento = document.getElementById("idBtnAddElement");

// ACCEDIENDO AL VALOR DEL SELECT PARA DETERMINAR EL TIPO DE ELEMENTO A CREAR
const cmbElemento = document.getElementById("idCmbElemento");

// ACCEDIENDO A LOS CONTROLES DEL MODAL
const tituloElemento = document.getElementById("idTituloElemento");
const nombreElemento = document.getElementById("idNombreElemento");

// CREANDO MODAL CON BOOTSTRAP
const modalElemento = document.getElementById("idModal");
const modal = new bootstrap.Modal(modalElemento, {});

// El nombre debe iniciar con una letra para formar un id valido (idNombre)
const REGEX_NOMBRE_CONTROL = /^[A-Za-z][A-Za-z0-9_-]*$/;
const TOTAL_OPCIONES_SELECT = 10;

// AGREGANDO FUNCIONES

// Muestra u oculta el mensaje de formulario vacio
const actualizarEstadoVacio = function () {
  mensajeVacio.hidden = newForm.children.length > 0;
};

// Crea el texto que muestra el ID asignado al control
const crearEtiquetaId = function (idControl) {
  const labelId = document.createElement("span");
  labelId.className = "form-text d-block";
  labelId.textContent = `ID de control : ${idControl}`;
  return labelId;
};

// Agrega al nuevo formulario el SPAN con el ID y el DIV con el control
const agregarAlFormulario = function (labelId, divElemento) {
  const grupo = document.createElement("div");
  grupo.className = "mb-4";
  grupo.appendChild(labelId);
  grupo.appendChild(divElemento);
  newForm.appendChild(grupo);
  actualizarEstadoVacio();
};

const verificarTipoElemento = function () {
  let elemento = cmbElemento.value;
  // validando que se haya seleccionado un elemento
  if (elemento != "") {
    // Metodo perteneciente al modal de bootstrap
    modal.show();
  } else {
    alert("Debe seleccionar el elemento que se creara");
  }
};

// Crea un elemento de tipo SELECT
const newSelect = function (titulo, idControl) {
  // Creando elementos
  let addElemento = document.createElement("select");
  // creando atributos para el nuevo elemento
  addElemento.setAttribute("id", idControl);
  addElemento.setAttribute("name", idControl);
  addElemento.setAttribute("class", "form-select");
  addElemento.setAttribute("aria-label", titulo);

  // creando option para el select
  for (let i = 1; i <= TOTAL_OPCIONES_SELECT; i++) {
    let addOption = document.createElement("option");
    addOption.value = i;
    addOption.textContent = `Opcion ${i}`;
    addElemento.appendChild(addOption);
  }

  // creando label para el nuevo control
  let labelElemento = document.createElement("label");
  labelElemento.setAttribute("for", idControl);
  // creando texto para label
  labelElemento.textContent = titulo;

  // Creando plantilla de bootstrap para visualizar el nuevo elemento
  let divElemento = document.createElement("div");
  divElemento.setAttribute("class", "form-floating");

  // Creando el select que sera hijo del div
  divElemento.appendChild(addElemento);
  // Creando el label que sera hijo del div
  divElemento.appendChild(labelElemento);

  agregarAlFormulario(crearEtiquetaId(idControl), divElemento);
};

// Crea un elemento de tipo RADIO o CHECKBOX
const newRadioCheckbox = function (newElemento, titulo, idControl) {
  // Creando elementos
  let addElemento = document.createElement("input");
  // creando atributos para el nuevo elemento
  addElemento.setAttribute("id", idControl);
  addElemento.setAttribute("name", idControl);
  addElemento.setAttribute("type", newElemento);
  addElemento.setAttribute("class", "form-check-input");

  // creando label para el nuevo control
  let labelElemento = document.createElement("label");
  labelElemento.setAttribute("class", "form-check-label");
  labelElemento.setAttribute("for", idControl);
  // creando texto para label
  labelElemento.textContent = titulo;

  // Creando plantilla de bootstrap para visualizar el nuevo elemento
  let divElemento = document.createElement("div");
  divElemento.setAttribute("class", "form-check");

  // Creando el input que sera hijo del div
  divElemento.appendChild(addElemento);
  // Creando el label que sera hijo del div
  divElemento.appendChild(labelElemento);

  agregarAlFormulario(crearEtiquetaId(idControl), divElemento);
};

// Crea un elemento de tipo TEXTAREA, TEXT, NUMBER, DATE, PASSWORD u otro
const newInput = function (newElemento, titulo, idControl) {
  // Creando elementos de tipo = text, number, date, password o textarea
  let addElemento =
    newElemento == "textarea"
      ? document.createElement("textarea")
      : document.createElement("input");

  // creando atributos para el nuevo elemento
  addElemento.setAttribute("id", idControl);
  addElemento.setAttribute("name", idControl);
  if (newElemento != "textarea") {
    addElemento.setAttribute("type", newElemento);
  } else {
    addElemento.style.height = "100px";
  }
  addElemento.setAttribute("class", "form-control");
  addElemento.setAttribute("placeholder", titulo);

  // creando label para el nuevo control
  let labelElemento = document.createElement("label");
  labelElemento.setAttribute("for", idControl);

  // creando texto para label
  labelElemento.textContent = titulo;

  // creando icono para el label
  let iconLabel = document.createElement("i");
  iconLabel.setAttribute("class", "bi bi-tag me-1");

  // creando el elemento i como hijo del label, afterbegin le
  // indicamos que se creara antes de su primer hijo
  labelElemento.insertAdjacentElement("afterbegin", iconLabel);

  // Creando plantilla de bootstrap para visualizar el nuevo elemento
  let divElemento = document.createElement("div");
  divElemento.setAttribute("class", "form-floating");

  // Creando el input que sera hijo del div
  divElemento.appendChild(addElemento);
  // Creando el label que sera hijo del div
  divElemento.appendChild(labelElemento);

  agregarAlFormulario(crearEtiquetaId(idControl), divElemento);
};

// Valida los datos del modal y crea el elemento seleccionado
const agregarElemento = function () {
  const titulo = tituloElemento.value.trim();
  const nombre = nombreElemento.value.trim();

  if (nombre == "" || titulo == "") {
    alert("Faltan campos por completar");
    return;
  }

  if (!REGEX_NOMBRE_CONTROL.test(nombre)) {
    alert(
      "El nombre del control debe iniciar con una letra y solo puede contener letras, numeros, guion o guion bajo"
    );
    nombreElemento.focus();
    return;
  }

  const idControl = `id${nombre}`;
  if (document.getElementById(idControl)) {
    alert(`Ya existe un control con el ID ${idControl}`);
    nombreElemento.focus();
    return;
  }

  let elemento = cmbElemento.value;

  if (elemento == "select") {
    newSelect(titulo, idControl);
  } else if (elemento == "radio" || elemento == "checkbox") {
    newRadioCheckbox(elemento, titulo, idControl);
  } else {
    newInput(elemento, titulo, idControl);
  }

  modal.hide();
};

// AGREGANDO EVENTO CLIC A LOS BOTONES
buttonCrear.addEventListener("click", () => {
  verificarTipoElemento();
});

buttonAddElemento.addEventListener("click", () => {
  agregarElemento();
});

// Permite confirmar con la tecla Enter desde los campos del modal
[tituloElemento, nombreElemento].forEach((campo) => {
  campo.addEventListener("keydown", (evento) => {
    if (evento.key == "Enter") {
      evento.preventDefault();
      agregarElemento();
    }
  });
});

// Agregando evento para el modal de bootstrap
modalElemento.addEventListener("shown.bs.modal", () => {
  // Limpiando campos para los nuevos elementos
  tituloElemento.value = "";
  nombreElemento.value = "";
  // inicializando puntero en el campo del titulo para el control
  tituloElemento.focus();
});