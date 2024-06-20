// Obtiene los elementos del DOM para la interfaz del análisis léxico, sintáctico y semántico
const lexico = document.getElementById("datos");
const sintac = document.getElementById("aSintactico");
const codigo = document.getElementById("codigo");
const containerCodigo = document.getElementById("container_codigo");
let lexemas = []; // Array para almacenar los lexemas cargados desde un archivo JSON
let tokens = []; // Array para almacenar los tokens generados del análisis léxico

// Función asíncrona para cargar los lexemas desde un archivo JSON
const cargarLexemas = async () => {
  try {
    const response = await fetch("./lexemas.json"); // Realiza la petición para obtener el archivo JSON
    if (!response.ok) {
      throw new Error('No se pudo cargar el archivo "lexemas.json".'); // Lanza un error si no se puede cargar el archivo
    }
    lexemas = await response.json(); // Almacena los lexemas en la variable global lexemas
  } catch (error) {
    console.error(error); // Muestra el error en la consola
    alert("Error al cargar los lexemas. Consulte la consola para más detalles."); // Muestra una alerta al usuario
  }
};

// Función para buscar un lexema en el array de lexemas cargados
const buscarLexema = (palabra) => {
  const lexemaEncontrado = lexemas.find((lexema) => lexema.nombre === palabra); // Busca el lexema por nombre
  return lexemaEncontrado || crearLexemaNoEncontrado(palabra); // Retorna el lexema encontrado o crea uno nuevo si no se encuentra
};

// Función para crear un lexema si no se encuentra en la lista
const crearLexemaNoEncontrado = (palabra) => {
  if (palabra !== "" && isNaN(palabra)) { // Verifica si la palabra no es un número
    return { nombre: palabra, tipo: "identificador", codigo: "101" }; // Retorna un objeto lexema de tipo identificador
  } else if (palabra !== "" && !isNaN(palabra)) { // Verifica si la palabra es un número
    return { nombre: palabra, tipo: "numero", codigo: "102" }; // Retorna un objeto lexema de tipo número
  }
  return null; // Retorna null si la palabra está vacía
};

// Función para dividir el código en líneas
const dividirLineas = (cadenas) => {
  return cadenas.split(/\n/g); // Divide el código por saltos de línea
};

// Función para dividir cada línea en palabras y buscar sus lexemas
const dividirPalabras = (lineas) => {
  lineas.forEach((linea) => {
    linea = linea.replace(/([;=+().])/g, ' $1 '); // Añade espacios alrededor de ciertos caracteres
    const palabras = linea.split(/\s+/); // Divide la línea en palabras
    const subTokens = palabras.map((palabra) => buscarLexema(palabra)).filter((token) => token !== null); // Busca lexemas para cada palabra y filtra null
    tokens.push(subTokens); // Añade los tokens encontrados al array tokens
  });
};

// Función para actualizar la tabla léxica en el DOM
const actualizarTablaLexico = () => {
  lexico.innerHTML = ""; // Limpia la tabla léxica
  tokens.forEach((tokenLista, indiceLinea) => {
    lexico.innerHTML += `
      <tr>
        <td class='linea text-body-1' colspan='3'>
          Línea ${indiceLinea + 1}
        </td>
      </tr>`; // Añade una fila para la línea actual
    tokenLista.forEach((token) => {
      lexico.innerHTML += `
        <tr>
          <td class="text-body-1">
            ${token.nombre}
          </td>
          <td class="text-body-1">
            ${token.tipo}
          </td>
          <td class="text-body-1">
            ${token.codigo}
          </td>
        </tr>`; // Añade una fila para cada token con su nombre, tipo y código
    });
  });
};

// Función para dividir el código en bloques basados en puntos y coma seguidos de un salto de línea
const dividirBloques = (cadenas) => {
  return cadenas.split(/;\s*\n/); // Divide las cadenas por puntos y coma seguidos de un salto de línea opcional
};

// Función para verificar la sintaxis de los bloques de código
const verificarSintaxisBloques = (bloques) => {
  return bloques.flatMap((bloque, index) => {
    bloque = bloque.trim(); // Elimina espacios en blanco al inicio y final del bloque

    if (bloque.startsWith("//") || bloque === "") {
      return [[index + 1, "Comentario o línea vacía, no se verifica sintaxis"]]; // Si es un comentario o línea vacía
    } else if (bloque.startsWith("const ") || bloque.startsWith("let ") || bloque.startsWith("var ")) {
      const regexDeclaracion = /^(const|let|var)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*("[^"]*"|'[^']*'|\d+);?$/;
      if (bloque.match(regexDeclaracion)) {
        return [[index + 1, "Declaración de variable correcta"]]; // Verifica si la declaración de la variable es correcta
      } else {
        return [[index + 1, `Error de sintaxis en el bloque ${index + 1}: Declaración de variable incorrecta`]]; // Indica un error de sintaxis
      }
    } else if (bloque.startsWith("if ")) {
      // Verificar sintaxis de la estructura if
      const regexIf = /^if\s*\((.+)\)\s*{\s*(.+)\s*}$/;
      if (bloque.match(regexIf)) {
        return [[index + 1, "Estructura if correcta"]]; // Verifica si la estructura if es correcta
      } else {
        return [[index + 1, `Error de sintaxis en el bloque ${index + 1}: Estructura if incorrecta`]]; // Indica un error de sintaxis
      }
    } else {
      return [[index + 1, `Error de sintaxis en el bloque ${index + 1}: Sintaxis no reconocida`]]; // Indica un error de sintaxis
    }
  });
};

// Función para actualizar los resultados sintácticos en el DOM
const actualizarResultadosSintacticos = (respuestas) => {
  sintac.innerHTML = ""; // Limpia los resultados sintácticos anteriores
  respuestas.forEach((respuesta) => {
    sintac.innerHTML += `
      <p class='text-body-1'>
        Bloque de código ${respuesta[0]}
      </p>
      <p class='text-body-1'>
        ${respuesta[1]}
      </p>`; // Añade los resultados de la verificación sintáctica
  });
};

// Función para verificar la semántica de los bloques de código
const verificarSemantica = (bloques) => {
  simbolos = {}; // Reiniciar la tabla de símbolos
  const resultadosSemantica = [];

  bloques.forEach((bloque, index) => {
    bloque = bloque.trim(); // Elimina espacios en blanco al inicio y final del bloque

    if (bloque.startsWith("const ") || bloque.startsWith("let ") || bloque.startsWith("var ")) {
      const partes = bloque.split(/\s+/); // Divide el bloque en partes por espacios
      const nombreVar = partes[1];
      const valorVar = partes.slice(3).join(" ").replace(/;$/, ""); // Obtiene el valor de la variable

      if (simbolos[nombreVar]) {
        resultadosSemantica.push([index + 1, `Error semántico en el bloque ${index + 1}: La variable '${nombreVar}' ya ha sido declarada`]); // Indica un error si la variable ya ha sido declarada
      } else {
        let tipoVar;
        if (/^["'][^"']*["']$/.test(valorVar)) {
          tipoVar = "string"; // Determina el tipo de la variable como string
        } else if (/^\d+$/.test(valorVar)) {
          tipoVar = "number"; // Determina el tipo de la variable como number
        } else {
          resultadosSemantica.push([index + 1, `Error semántico en el bloque ${index + 1}: Tipo de valor no soportado`]); // Indica un error si el tipo de valor no es soportado
          return;
        }

        simbolos[nombreVar] = { tipo: tipoVar, valor: valorVar }; // Añade la variable a la tabla de símbolos

        let lineaCodigoIntermedio = `${nombreVar} = ${valorVar};`;
        resultadosSemantica.push([index + 1, "Declaración de variable correcta", lineaCodigoIntermedio]); // Añade el resultado semántico
      }
    } else if (/^[a-zA-Z_$][0-9a-zA-Z_$]*\s*=\s*.+;?$/.test(bloque)) {
      const partes = bloque.split(/\s*=\s*/); // Divide el bloque por el operador de asignación
      const nombreVar = partes[0].trim();
      const valorVar = partes[1].replace(/;$/, "").trim(); // Obtiene el valor de la variable

      if (!simbolos[nombreVar]) {
        resultadosSemantica.push([index + 1, `Error semántico en el bloque ${index + 1}: La variable '${nombreVar}' no ha sido declarada`]); // Indica un error si la variable no ha sido declarada
        return;
      }

      const tipoVar = simbolos[nombreVar].tipo;

      if (tipoVar === "string" && !/^["'][^"']*["']$/.test(valorVar)) {
        resultadosSemantica.push([index + 1, `Error semántico en el bloque ${index + 1}: Se esperaba un valor de tipo string para la variable '${nombreVar}'`]); // Indica un error si el tipo de valor no coincide
      } else if (tipoVar === "number" && !/^\d+$/.test(valorVar)) {
        resultadosSemantica.push([index + 1, `Error semántico en el bloque ${index + 1}: Se esperaba un valor de tipo number para la variable '${nombreVar}'`]); // Indica un error si el tipo de valor no coincide
      } else {
        simbolos[nombreVar].valor = valorVar; // Actualiza el valor de la variable en la tabla de símbolos

        let lineaCodigoIntermedio = `${nombreVar} = ${valorVar};`;
        resultadosSemantica.push([index + 1, "Asignación de variable correcta", lineaCodigoIntermedio]); // Añade el resultado semántico
      }
    } else {
      resultadosSemantica.push([index + 1, "Línea no relevante para el análisis semántico"]); // Indica que la línea no es relevante para el análisis semántico
    }
  });

  return resultadosSemantica;
};

// Función para actualizar los resultados semánticos en el DOM
const actualizarResultadosSemanticos = (respuestas) => {
  const semantico = document.getElementById("aSemantico");
  semantico.innerHTML = ""; // Limpia los resultados semánticos anteriores
  respuestas.forEach((respuesta) => {
    semantico.innerHTML += `
      <p class='text-body-1'>
        Bloque de código ${respuesta[0]}
      </p>
      <p class='text-body-1'>
        ${respuesta[1]}
      </p>
      <p class='text-body-1'>
        Código intermedio: ${respuesta[2] || ""}
      </p>`; // Añade los resultados del análisis semántico y el código intermedio
  });
};

// Función para generar el código intermedio a partir de los bloques de código
const generarCodigoIntermedio = (bloques) => {
  let codigoIntermedio = [];

  bloques.forEach((bloque, index) => {
    bloque = bloque.trim(); // Elimina espacios en blanco al inicio y final del bloque

    if (bloque.startsWith("const ") || bloque.startsWith("let ") || bloque.startsWith("var ")) {
      const partes = bloque.split(/\s+/); // Divide el bloque en partes por espacios
      const nombreVar = partes[1];
      const valorVar = partes.slice(3).join(" ").replace(/;$/, ""); // Obtiene el valor de la variable

      let lineaCodigoIntermedio = `${nombreVar} = ${valorVar};`;
      codigoIntermedio.push([index + 1, lineaCodigoIntermedio]); // Añade la línea de código intermedio
    } else if (bloque.startsWith("if ")) {
      const regexIf = /^if\s*\((.+)\)\s*{\s*(.+)\s*}$/;
      const match = bloque.match(regexIf); // Verifica si la estructura if es correcta
      if (match) {
        const condicion = match[1].trim();
        const bloqueCodigo = match[2].trim();

        codigoIntermedio.push([index + 1, `if (${condicion}) {`]); // Añade la condición del if al código intermedio
        const lineasBloque = dividirBloques(bloqueCodigo); // Divide el bloque de código dentro del if
        const codigoIntermedioBloque = generarCodigoIntermedio(lineasBloque); // Genera el código intermedio para el bloque interno
        codigoIntermedio.push(...codigoIntermedioBloque); // Añade el código intermedio del bloque interno
        codigoIntermedio.push([index + 1, `}`]); // Añade el cierre del if al código intermedio
      }
    }
  });

  return codigoIntermedio;
};

// Función para actualizar el código intermedio en el DOM
const actualizarCodigoIntermedio = (codigoIntermedio) => {
  const intermedio = document.getElementById("codigoIntermedio");
  intermedio.innerHTML = ""; // Limpia el código intermedio anterior
  codigoIntermedio.forEach((linea) => {
    intermedio.innerHTML += `
      <p class='text-body-1'>
        ${linea[1]}
      </p>`; // Añade cada línea del código intermedio al DOM
  });
};

// Función para manejar el evento de envío del formulario
const onSubmitFormulario = async (event) => {
  event.preventDefault(); // Previene la acción por defecto del formulario
  tokens = []; // Limpia los tokens anteriores
  const lineas = dividirLineas(codigo.value); // Divide el código en líneas
  dividirPalabras(lineas); // Divide las líneas en palabras y busca los lexemas
  const bloques = dividirBloques(codigo.value); // Divide el código en bloques

  const respuestasSintaxis = verificarSintaxisBloques(bloques); // Verifica la sintaxis de los bloques
  const respuestasSemantica = verificarSemantica(bloques); // Verifica la semántica de los bloques
  const codigoIntermedio = generarCodigoIntermedio(bloques); // Genera el código intermedio

  actualizarTablaLexico(); // Actualiza la tabla léxica en el DOM
  actualizarResultadosSintacticos(respuestasSintaxis); // Actualiza los resultados sintácticos en el DOM
  actualizarResultadosSemanticos(respuestasSemantica); // Actualiza los resultados semánticos en el DOM
  actualizarCodigoIntermedio(codigoIntermedio); // Actualiza el código intermedio en el DOM
};

// Añade eventos para el envío y reseteo del formulario
containerCodigo.addEventListener('submit', onSubmitFormulario);
containerCodigo.addEventListener('reset', () => {
  lexico.innerHTML = ""; // Limpia la tabla léxica
  sintac.innerHTML = ""; // Limpia los resultados sintácticos
});
window.addEventListener("DOMContentLoaded", cargarLexemas); // Carga los lexemas al cargar la página
