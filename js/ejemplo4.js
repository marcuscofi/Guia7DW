// Inicializando referencia de botones con metodos actuales
const buttonAgregarPagina = document.querySelector("#idAgregarPagina");
const buttonMenu = document.querySelector("#idAgregarMenu");
const buttonTitulo = document.querySelector("#idAgregarTitulo");
const buttonParrafo = document.querySelector("#idAgregarParrafo");
const buttonEliminarPagina = document.querySelector("#idEliminarPagina");

const pagina = document.querySelector("#idPagina");

// Verifica que exista el contenedor de la pagina; devuelve null si no existe
const obtenerContenedor = function () {
  const contenedor = document.querySelector("#idDivPage");
  if (!contenedor) {
    alert("Primero debe agregar un contenedor de pagina");
  }
  return contenedor;
};

// Verifica que exista el contenedor y el menu antes de agregar contenido
const obtenerContenedorConMenu = function () {
  const contenedor = obtenerContenedor();
  if (!contenedor) {
    return null;
  }

  // Verificando que exista el menu
  const menu = document.querySelectorAll("#idDivPage > header");
  if (menu.length == 0) {
    alert("Debe agregar un menu primero");
    return null;
  }

  return contenedor;
};

// Solicita un texto al usuario; devuelve null si cancela o lo deja vacio
const solicitarTexto = function (mensaje, mensajeError) {
  const texto = prompt(mensaje);
  if (texto === null || texto.trim() == "") {
    alert(mensajeError);
    return null;
  }
  return texto.trim();
};

// Crear el contenedor de la nueva pagina web
buttonAgregarPagina.addEventListener("click", function () {
  const contenedorVerificando = document.querySelector("#idDivPage");

  if (!contenedorVerificando) {
    //Creando el contenedor de la pagina
    const contenedor = document.createElement("div");
    contenedor.setAttribute("id", "idDivPage");
    contenedor.setAttribute("class", "container");
    contenedor.setAttribute(
      "style",
      "border:solid 1px black; height:500px; overflow-y: auto; overflow-x: hidden;"
    );

    pagina.appendChild(contenedor);
    contenedor.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else {
    alert("Ya se agrego el contenedor de la pagina");
  }
});

// Crear el menu de la pagina. Aqui se esta clonando el menu de la pagina principal
buttonMenu.addEventListener("click", function () {
  //verificando que exista el contenedor de la pagina
  const contenedor = obtenerContenedor();

  if (contenedor) {
    // Verificando que exista el menu
    const menuVerificar = document.querySelectorAll("#idDivPage > header");

    if (menuVerificar.length == 0) {
      // Clonando el menu principal de nuestra pagina
      // Para luego crearlo en la nueva pagina
      const menu = document.querySelector("header").cloneNode(true);

      // Los id deben ser unicos en el documento, por lo que se eliminan del clon
      menu.removeAttribute("id");
      for (const nodo of menu.querySelectorAll("[id]")) {
        nodo.removeAttribute("id");
      }

      contenedor.appendChild(menu);
    } else {
      alert("Ya ha sido agregado el menu");
    }
  }
});

// Crear titulos en la pagina web
buttonTitulo.addEventListener("click", function () {
  const contenedor = obtenerContenedorConMenu();
  if (!contenedor) {
    return;
  }

  const titulo = solicitarTexto(
    "Agregue el titulo de la pagina",
    "No se ha registrado ningun titulo, por favor ingrese informacion"
  );

  if (titulo !== null) {
    const h1 = document.createElement("h1");
    // Agregando clases de Bootstrap
    h1.setAttribute("class", "display-5 text-center fw-bold py-4 my-4");
    h1.textContent = titulo;

    contenedor.appendChild(h1);
    h1.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});

// Crear parrafos en la pagina web
buttonParrafo.addEventListener("click", function () {
  const contenedor = obtenerContenedorConMenu();
  if (!contenedor) {
    return;
  }

  const texto = solicitarTexto(
    "Agregue un parrafo a su pagina web",
    "No se ha registrado ningun parrafo, por favor ingrese informacion"
  );

  if (texto !== null) {
    const parrafo = document.createElement("p");
    // Agregando clases de Bootstrap
    parrafo.setAttribute("class", "lead mb-4 py-4");
    parrafo.textContent = texto;

    // Creando parrafo como hijo del contenedor
    contenedor.appendChild(parrafo);
    parrafo.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});

// Elimina la pagina creada con todos sus hijos
buttonEliminarPagina.addEventListener("click", function () {
  const contenedor = document.querySelector("#idDivPage");

  if (!contenedor) {
    alert("No hay ninguna pagina para eliminar");
    return;
  }

  if (confirm("¿Desea eliminar la pagina creada y todo su contenido?")) {
    pagina.removeChild(contenedor);
  }
});