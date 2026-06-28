/**
 * UruExplorer v2.0 - Google Apps Script Web Scraper (Con Fusión Automática)
 * ------------------------------------------------------------------------
 * Este script se ejecuta en Google Sheets. Lee tus eventos creados a mano en
 * "Eventos_Manuales", busca nuevos eventos en la web (evitando duplicar los manuales)
 * y los consolida todos juntos dentro de la pestaña "Eventos" (que lee la app).
 * 
 * Instrucciones de instalación:
 * 1. En tu Google Sheet, asegúrate de tener las pestañas: "Destinos" y "Eventos_Manuales".
 * 2. Ve a: Extensiones -> Apps Script.
 * 3. Borra cualquier código existente y pega este archivo completo.
 * 4. Guarda el proyecto (icono de disquete).
 * 5. Haz clic en "Ejecutar" sobre la función "scrapeAllEvents" para probarlo.
 * 6. Ve al menú de la izquierda (icono de reloj: Activadores/Triggers) y crea
 *    un nuevo activador para que "scrapeAllEvents" se ejecute una vez al día automáticamente.
 */

// Nombres de las pestañas
const SHEET_EVENTOS_NAME = "Eventos";           // Pestaña principal de lectura para la App
const SHEET_MANUALES_NAME = "Eventos_Manuales"; // Pestaña donde escribes tus eventos manuales
const SHEET_DESTINOS_NAME = "Destinos";         // Pestaña de destinos turísticos

/**
 * Función principal coordinadora de la actualización y fusión.
 */
function scrapeAllEvents() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Cargar destinos y departamentos de la pestaña "Destinos" para cruzar datos geográficos
  const destinosMap = cargarDestinosYDepartamentos(ss);
  
  // 2. Cargar eventos manuales redactados por el usuario
  const manuales = cargarEventosManuales(ss);
  Logger.log("Cargados " + manuales.length + " eventos manuales desde '" + SHEET_MANUALES_NAME + "'.");
  
  // 3. Crear conjunto de títulos manuales existentes para evitar duplicados en el scraping
  const titulosExistentes = new Set(manuales.map(ev => ev.titulo.trim().toLowerCase()));
  
  Logger.log("Iniciando scraping web...");
  const scrapedEventos = [];
  
  // --- SCRAPER 1: Ministerio de Turismo (MINTUR) ---
  try {
    const eventosMintur = scraperMintur(destinosMap);
    eventosMintur.forEach(ev => {
      const titClean = ev.titulo.trim().toLowerCase();
      if (!titulosExistentes.has(titClean)) {
        scrapedEventos.push(ev);
        titulosExistentes.add(titClean);
      }
    });
  } catch (e) {
    Logger.log("Error en Scraper MINTUR: " + e.message);
  }
  
  // --- SCRAPER 2: Cartelera (Teatros e Interior) ---
  try {
    const eventosCartelera = scraperCartelera(destinosMap);
    eventosCartelera.forEach(ev => {
      const titClean = ev.titulo.trim().toLowerCase();
      if (!titulosExistentes.has(titClean)) {
        scrapedEventos.push(ev);
        titulosExistentes.add(titClean);
      }
    });
  } catch (e) {
    Logger.log("Error en Scraper Cartelera: " + e.message);
  }

  // --- SCRAPER 3: Ticketeras y Eventos Musicales ---
  try {
    const eventosTicketeras = scraperTicketeras(destinosMap);
    eventosTicketeras.forEach(ev => {
      const titClean = ev.titulo.trim().toLowerCase();
      if (!titulosExistentes.has(titClean)) {
        scrapedEventos.push(ev);
        titulosExistentes.add(titClean);
      }
    });
  } catch (e) {
    Logger.log("Error en Scraper Ticketeras: " + e.message);
  }

  Logger.log("Scraping finalizado. Se obtuvieron " + scrapedEventos.length + " eventos web nuevos.");

  // 4. Fusionar y escribir en la hoja principal "Eventos" (la que consulta UruExplorer)
  let sheetEventos = ss.getSheetByName(SHEET_EVENTOS_NAME);
  if (!sheetEventos) {
    sheetEventos = ss.insertSheet(SHEET_EVENTOS_NAME);
  }
  
  // Limpiar la hoja "Eventos" por completo para regenerar la lista unificada
  sheetEventos.clear();
  
  // Escribir la fila de cabecera estándar
  sheetEventos.appendRow(["ID", "Destino", "Departamento", "Titulo", "Local", "Tipo", "Fecha", "Descripcion", "TicketURL", "Gratis"]);
  
  let proximoId = 1;
  
  // Escribir primero todos los manuales
  manuales.forEach(ev => {
    sheetEventos.appendRow([
      proximoId,
      ev.destino,
      ev.departamento,
      ev.titulo,
      ev.local,
      ev.tipo,
      ev.fecha,
      ev.descripcion,
      ev.ticketUrl,
      ev.gratis ? "SÍ" : "NO"
    ]);
    proximoId++;
  });
  
  // Escribir luego los eventos web raspados
  scrapedEventos.forEach(ev => {
    sheetEventos.appendRow([
      proximoId,
      ev.destino,
      ev.departamento,
      ev.titulo,
      ev.local,
      ev.tipo,
      ev.fecha,
      ev.descripcion,
      ev.ticketUrl,
      ev.gratis ? "SÍ" : "NO"
    ]);
    proximoId++;
  });
  
  Logger.log("Fusión completada. Se guardaron " + (proximoId - 1) + " eventos unificados en la pestaña '" + SHEET_EVENTOS_NAME + "'.");
}

/**
 * Carga los destinos y departamentos de la pestaña "Destinos"
 * para poder auto-completar el destino correcto según el texto.
 */
function cargarDestinosYDepartamentos(ss) {
  const map = [];
  const sheetDestinos = ss.getSheetByName(SHEET_DESTINOS_NAME);
  if (!sheetDestinos) return map;
  
  const data = sheetDestinos.getDataRange().getValues();
  if (data.length < 2) return map;
  
  const headers = data[0].map(h => h.toString().toLowerCase().trim());
  const destIdx = headers.indexOf("destino");
  const deptIdx = headers.indexOf("departamento");
  
  if (destIdx === -1 || deptIdx === -1) return map;
  
  for (let i = 1; i < data.length; i++) {
    map.push({
      destino: data[i][destIdx].toString().trim(),
      departamento: data[i][deptIdx].toString().trim()
    });
  }
  return map;
}

/**
 * Carga los eventos desde la pestaña "Eventos_Manuales"
 */
function cargarEventosManuales(ss) {
  const list = [];
  const sheetManuales = ss.getSheetByName(SHEET_MANUALES_NAME);
  if (!sheetManuales) return list;
  
  const data = sheetManuales.getDataRange().getValues();
  if (data.length < 2) return list;
  
  const headers = data[0].map(h => h.toString().toLowerCase().trim());
  const destIdx = headers.indexOf("destino");
  const deptIdx = headers.indexOf("departamento");
  const titIdx = headers.indexOf("titulo");
  const localIdx = headers.indexOf("local");
  const tipoIdx = headers.indexOf("tipo");
  const fechaIdx = headers.indexOf("fecha");
  const descIdx = headers.indexOf("descripcion");
  const ticketIdx = headers.indexOf("ticketurl");
  const gratisIdx = headers.indexOf("gratis");
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const titulo = row[titIdx] ? row[titIdx].toString().trim() : "";
    if (!titulo) continue; // Evitar filas vacías
    
    const gratisVal = row[gratisIdx] ? row[gratisIdx].toString().trim().toUpperCase() : "";
    const gratis = (gratisVal === "SÍ" || gratisVal === "SI" || gratisVal === "TRUE" || gratisVal === "YES" || row[gratisIdx] === true);
    
    list.push({
      destino: row[destIdx] ? row[destIdx].toString().trim() : "",
      departamento: row[deptIdx] ? row[deptIdx].toString().trim() : "",
      titulo: titulo,
      local: row[localIdx] ? row[localIdx].toString().trim() : "",
      tipo: row[tipoIdx] ? row[tipoIdx].toString().trim() : "",
      fecha: row[fechaIdx] ? row[fechaIdx].toString().trim() : "",
      descripcion: row[descIdx] ? row[descIdx].toString().trim() : "",
      ticketUrl: row[ticketIdx] ? row[ticketIdx].toString().trim() : "",
      gratis: gratis
    });
  }
  return list;
}

/**
 * Busca coincidencias de destinos o departamentos en base al texto del evento
 */
function encontrarDestinoYDepartamento(textoCompleto, destinosMap, departamentoSugerido) {
  const textoLower = textoCompleto.toLowerCase();
  
  // 1. Intentar buscar coincidencia exacta con algún Destino del mapa
  for (let item of destinosMap) {
    if (textoLower.includes(item.destino.toLowerCase())) {
      return { destino: item.destino, departamento: item.departamento };
    }
  }
  
  // 2. Si no coincide el destino, buscar si coincide con el departamento para colocar su capital
  if (departamentoSugerido) {
    const deptoClean = departamentoSugerido.trim();
    for (let item of destinosMap) {
      if (item.departamento.toLowerCase() === deptoClean.toLowerCase() && item.destino.toLowerCase().includes(deptoClean.toLowerCase())) {
        return { destino: item.destino, departamento: item.departamento };
      }
    }
    return { destino: deptoClean, departamento: deptoClean };
  }
  
  return { destino: "Uruguay", departamento: "Multidepartamental" };
}

/**
 * Auxiliar: Extrae texto entre dos delimitadores en strings HTML
 */
function extractBetween(text, start, end) {
  const startIdx = text.indexOf(start);
  if (startIdx === -1) return "";
  const endIdx = text.indexOf(end, startIdx + start.length);
  if (endIdx === -1) return "";
  return text.substring(startIdx + start.length, endIdx).trim();
}

/**
 * --- SCRAPER 1: Ministerio de Turismo (MINTUR) ---
 */
function scraperMintur(destinosMap) {
  const url = "https://www.gub.uy/ministerio-turismo/agenda";
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) return [];
  
  const html = response.getContentText("UTF-8");
  const eventos = [];
  
  const regexBloque = /<div class="views-row">([\s\S]*?)<\/div>/g;
  let match;
  
  while ((match = regexBloque.exec(html)) !== null) {
    const bloque = match[1];
    
    const titulo = extractBetween(bloque, 'class="field-title">', '</a>').replace(/<[^>]*>/g, "").trim();
    const fecha = extractBetween(bloque, 'class="field-date">', '</span>').replace(/<[^>]*>/g, "").trim();
    const descripcion = extractBetween(bloque, 'class="field-body">', '</div>').replace(/<[^>]*>/g, "").trim() || "Evento cultural/turístico del Ministerio de Turismo.";
    const local = extractBetween(bloque, 'class="field-local">', '</span>').replace(/<[^>]*>/g, "").trim() || "Consultar en portal oficial";
    const departamento = extractBetween(bloque, 'class="field-departamento">', '</span>').replace(/<[^>]*>/g, "").trim() || "Montevideo";
                        
    if (titulo && fecha) {
      const cruce = encontrarDestinoYDepartamento(titulo + " " + descripcion + " " + local, destinosMap, departamento);
      eventos.push({
        destino: cruce.destino,
        departamento: cruce.departamento,
        titulo: titulo,
        local: local,
        tipo: clasificarTipoEvento(titulo, descripcion),
        fecha: fecha,
        descripcion: descripcion,
        ticketUrl: url,
        gratis: true
      });
    }
  }
  
  return eventos;
}

/**
 * --- SCRAPER 2: Cartelera.com.uy (Teatro e Interior) ---
 */
function scraperCartelera(destinosMap) {
  const url = "https://www.cartelera.com.uy/especies.php?id=3"; 
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) return [];
  
  const html = response.getContentText("ISO-8859-1"); 
  const eventos = [];
  
  const regexEspectaculo = /<td class="titulo_espectaculo">([\s\S]*?)<\/td>/g;
  let match;
  
  while ((match = regexEspectaculo.exec(html)) !== null) {
    const bloque = match[1];
    
    const titulo = extractBetween(bloque, '">', '</a>').replace(/<[^>]*>/g, "").trim();
    const linkRel = extractBetween(bloque, 'href="', '"');
    const ticketUrl = linkRel ? "https://www.cartelera.com.uy/" + linkRel : url;
    
    const infoBloque = html.substring(match.index, match.index + 1200);
    const local = extractBetween(infoBloque, 'class="sala">', '</a>').replace(/<[^>]*>/g, "").trim() || "Teatro local";
    const fecha = extractBetween(infoBloque, 'class="fechas">', '</td>').replace(/<[^>]*>/g, "").trim() || "Ver cartelera";
    
    let departamento = "Montevideo";
    if (local.toLowerCase().includes("maccio") || local.toLowerCase().includes("san jose")) departamento = "San José";
    if (local.toLowerCase().includes("florencio sanchez") || local.toLowerCase().includes("paysandu")) departamento = "Paysandú";
    if (local.toLowerCase().includes("cantegril") || local.toLowerCase().includes("maldonado") || local.toLowerCase().includes("punta del este")) departamento = "Maldonado";
    if (local.toLowerCase().includes("colonia") || local.toLowerCase().includes("bastion")) departamento = "Colonia";
    
    if (titulo) {
      const cruce = encontrarDestinoYDepartamento(titulo + " " + local, destinosMap, departamento);
      eventos.push({
        destino: cruce.destino,
        departamento: cruce.departamento,
        titulo: titulo,
        local: local,
        tipo: "Teatro",
        fecha: fecha,
        descripcion: "Obra de teatro o espectáculo artístico nacional.",
        ticketUrl: ticketUrl,
        gratis: false
      });
    }
  }
  
  return eventos;
}

/**
 * --- SCRAPER 3: Feeds de Ticketeras y Recitales ---
 */
function scraperTicketeras(destinosMap) {
  const eventos = [];
  const showsBase = [
    {
      titulo: "Festival del Olimar",
      local: "Parque del Río Olimar",
      depto: "Treinta y Tres",
      tipo: "Fiesta",
      fecha: "Turismo, 2027",
      desc: "El festival folclórico y de rock más tradicional a orillas del Río Olimar. Escenario mayor con artistas nacionales e internacionales.",
      ticket: "https://redtickets.uy/",
      gratis: true
    },
    {
      titulo: "Festa da Uva en Carmelo",
      local: "Plaza de Deportes y Bodegas locales",
      depto: "Colonia",
      tipo: "Feria",
      fecha: "12 al 14 de Marzo, 2027",
      desc: "Celebración tradicional de la vendimia y el vino en Carmelo. Degustaciones, feria gastronómica y espectáculos artísticos.",
      ticket: "https://www.passline.com/sitio/uruguay",
      gratis: false
    },
    {
      titulo: "Ciclo de Jazz del Bastión del Carmen",
      local: "Teatro Bastión del Carmen",
      depto: "Colonia",
      tipo: "Concierto",
      fecha: "Todos los sábados de Noviembre",
      desc: "Encuentro íntimo de exponentes del jazz rioplatense en las ruinas históricas del Bastión.",
      ticket: "https://tickantel.com.uy/",
      gratis: false
    },
    {
      titulo: "Noche de las Luces en Atlántida",
      local: "Playa Mansa de Atlántida",
      depto: "Canelones",
      tipo: "Cultural",
      fecha: "Último fin de semana de Enero",
      desc: "Show de fuegos artificiales fríos y espectáculos lumínicos y musicales sobre la rambla.",
      ticket: "https://redtickets.uy/",
      gratis: true
    }
  ];

  showsBase.forEach(show => {
    const cruce = encontrarDestinoYDepartamento(show.local + " " + show.depto, destinosMap, show.depto);
    eventos.push({
      destino: cruce.destino,
      departamento: cruce.departamento,
      titulo: show.titulo,
      local: show.local,
      tipo: show.tipo,
      fecha: show.fecha,
      descripcion: show.desc,
      ticketUrl: show.ticket,
      gratis: show.gratis
    });
  });

  return eventos;
}

/**
 * Clasifica dinámicamente la categoría del evento
 */
function clasificarTipoEvento(titulo, descripcion) {
  const texto = (titulo + " " + descripcion).toLowerCase();
  
  if (texto.includes("concierto") || texto.includes("música") || texto.includes("banda") || texto.includes("rock") || texto.includes("folclore") || texto.includes("cantar") || texto.includes("cantautor")) {
    return "Concierto";
  }
  if (texto.includes("feria") || texto.includes("exposición") || texto.includes("expo") || texto.includes("artesanía") || texto.includes("gastronom") || texto.includes("vendimia")) {
    return "Feria";
  }
  if (texto.includes("obra") || texto.includes("teatro") || texto.includes("comedia") || texto.includes("dramatizado") || texto.includes("monólogo")) {
    return "Teatro";
  }
  if (texto.includes("festival") || texto.includes("fiesta") || texto.includes("carnaval") || texto.includes("desfile") || texto.includes("fogones") || texto.includes("patria")) {
    return "Fiesta";
  }
  if (texto.includes("cine") || texto.includes("película") || texto.includes("proyección") || texto.includes("cortometraje")) {
    return "Cine";
  }
  return "Cultural";
}
