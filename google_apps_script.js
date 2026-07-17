/**
 * UruExplorer v2.0 - Google Apps Script Web Scraper (Con Fusión Automática)
 * ------------------------------------------------------------------------
 * Este script se ejecuta en Google Sheets. Lee tus eventos creados a mano en
 * "Eventos_Manuales", busca nuevos eventos en la web (evitando duplicar los manuales)
 * y los consolida todos juntos dentro de la pestaña "Eventos" (que lee la app).
 * 
 * Novedades v2.0:
 * - Ampliado para capturar toda la cartelera de Cines (Movie, Life, Grupocine, Cinemateca).
 * - Ampliado para capturar todas las obras de Teatro y espectáculos en el país.
 * - Corrección de endpoints ASPX de Cartelera Montevideo Portal (evitando HTTP 404).
 * 
 * Instrucciones de instalación:
 * 1. En tu Google Sheet, asegúrate de tener las pestañas: "Destinos" y "Eventos_Manuales".
 * 2. Ve a: Extensiones -> Apps Script.
 * 3. En el archivo "Scraper.gs", borra cualquier código existente y pega este archivo completo.
 * 4. Guarda el proyecto (icono de disquete).
 * 5. Haz clic en "Ejecutar" sobre la función "scrapeAllEvents" para probarlo.
 */

// Nombres de las pestañas
const SHEET_EVENTOS_NAME = "Eventos";           // Pestaña principal de lectura para la App
const SHEET_MANUALES_NAME = "Eventos_Manuales"; // Pestaña donde escribes tus eventos manuales
const SHEET_DESTINOS_NAME = "Base de Datos - Destinos Turísticos Uruguay";         // Pestaña de destinos turísticos

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
  
  // --- SCRAPER 2: Cartelera.com.uy (Cines y Teatros) ---
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

  // --- SCRAPER 4: Antel Arena ---
  try {
    const eventosAntel = scraperAntelArena(destinosMap);
    eventosAntel.forEach(ev => {
      const titClean = ev.titulo.trim().toLowerCase();
      if (!titulosExistentes.has(titClean)) {
        scrapedEventos.push(ev);
        titulosExistentes.add(titClean);
      }
    });
  } catch (e) {
    Logger.log("Error en Scraper Antel Arena: " + e.message);
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
      fecha: (row[fechaIdx] instanceof Date) ? Utilities.formatDate(row[fechaIdx], Session.getScriptTimeZone(), "dd/MM/yyyy") : (row[fechaIdx] ? row[fechaIdx].toString().trim() : ""),
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
 * --- SCRAPER 2: Cartelera.com.uy (Cines y Teatros) ---
 */
function scraperCartelera(destinosMap) {
  const eventos = [];
  
  // Categorías de cartelera a consultar en el nuevo formato ASPX/Redirect de Montevideo Portal:
  const categorias = [
    { url: "https://cartelera.montevideo.com.uy/cine", tipo: "Cine", descDefault: "Película en cartelera de cines nacionales." },
    { url: "https://cartelera.montevideo.com.uy/teatro", tipo: "Teatro", descDefault: "Obra de teatro o espectáculo artístico en cartelera nacional." },
    { url: "https://cartelera.montevideo.com.uy/musica", tipo: "Concierto", descDefault: "Espectáculo musical o recital en vivo en cartelera nacional." }
  ];
  
  categorias.forEach(cat => {
    try {
      const response = UrlFetchApp.fetch(cat.url, { muteHttpExceptions: true });
      if (response.getResponseCode() !== 200) {
        Logger.log("No se pudo acceder a " + cat.url);
        return;
      }
      
      const html = response.getContentText("UTF-8");
      
      // Obtener el bloque de listado-eventos sin truncar prematuramente
      const startIdx = html.indexOf('class="listado-eventos"');
      if (startIdx === -1) {
        Logger.log("No se encontró el contenedor de eventos en " + cat.url);
        return;
      }
      const listadoHtml = html.substring(startIdx);
      
      // Separar por cada artículo de evento
      const articles = listadoHtml.split('<article class="evento">');
      if (articles.length < 2) return;
      
      // Procesar cada película / obra teatral
      for (let i = 1; i < articles.length; i++) {
        const art = articles[i];
        
        // Extraer título
        let titulo = extractBetween(art, '<h2 class="name bold">', '</h2>');
        titulo = titulo.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
        if (!titulo) continue;
        
        // Enlace por defecto de detalles en Cartelera
        let linkRel = extractBetween(art, '<h2 class="name bold"><a href="', '"');
        let ticketUrlDefault = linkRel ? linkRel.trim() : cat.url;
        
        // Extraer descripción técnica (Género, Dirección, Actores)
        const eventDataHtml = extractBetween(art, '<ul class="event-data">', '</ul>');
        let descripcion = eventDataHtml ? eventDataHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : cat.descDefault;
        if (descripcion.length < 5) {
          descripcion = cat.descDefault;
        }
        
        // Determinar la fecha de la cartelera o del estreno
        let fechaText = "";
        const estrenoHtml = extractBetween(art, 'Estreno previsto:', '</li>');
        if (estrenoHtml) {
          let estrenoDate = estrenoHtml.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
          if (estrenoDate) {
            fechaText = "Estreno: " + estrenoDate;
          }
        }
        if (!fechaText) {
          // Si ya está en cartelera, colocamos el rango de la semana actual (jueves a miércoles)
          fechaText = obtenerSemanaCartelera();
        }

        // Extraer salas/locales asociados al espectáculo
        let salas = [];
        if (art.includes('<p class="heading small bold">')) {
          const salaParts = art.split('<p class="heading small bold">');
          for (let j = 1; j < salaParts.length; j++) {
            const part = salaParts[j];
            let local = part.split('</p>')[0].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
            if (!local) continue;
            
            let buyLink = extractBetween(part, 'href="', '"');
            buyLink = buyLink ? buyLink.trim() : "";
            if (buyLink.includes(" ") || buyLink.length < 5 || buyLink.startsWith("listado.html")) {
              buyLink = ticketUrlDefault;
            }
            salas.push({ local: local, ticketUrl: buyLink });
          }
        } else if (art.includes('<strong>Sala:</strong>')) {
          let local = extractBetween(art, '<strong>Sala:</strong>', '</li>').replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
          if (local) {
            salas.push({ local: local, ticketUrl: ticketUrlDefault });
          }
        }

        // Si no hay salas registradas, saltear
        if (salas.length === 0) continue;

        salas.forEach(sala => {
          let local = sala.local;
          let buyLink = sala.ticketUrl;

          // Determinar el departamento sugerido basándonos en la sala
          let departamento = "Montevideo";
          const localLower = local.toLowerCase();
          
          if (localLower.includes("maccio") || localLower.includes("san jose")) departamento = "San José";
          if (localLower.includes("florencio sanchez") || localLower.includes("paysandu")) departamento = "Paysandú";
          if (localLower.includes("cantegril") || localLower.includes("maldonado") || localLower.includes("punta del este") || localLower.includes("punta shopping")) departamento = "Maldonado";
          if (localLower.includes("colonia") || localLower.includes("bastion")) departamento = "Colonia";
          if (localLower.includes("las piedras") || localLower.includes("costa urbana") || localLower.includes("canelones")) departamento = "Canelones";
          if (localLower.includes("rivera") || localLower.includes("siñeriz")) departamento = "Rivera";
          if (localLower.includes("salto")) departamento = "Salto";
          if (localLower.includes("artigas")) departamento = "Artigas";
          if (localLower.includes("chuy") || localLower.includes("rocha")) departamento = "Rocha";
          if (localLower.includes("fray bentos") || localLower.includes("rio negro")) departamento = "Río Negro";
          if (localLower.includes("durazno")) departamento = "Durazno";
          if (localLower.includes("mercedes") || localLower.includes("soriano")) departamento = "Soriano";
          
          // Realizar cruce de localización con destinosMap
          const cruce = encontrarDestinoYDepartamento(titulo + " " + local, destinosMap, departamento);
          
          eventos.push({
            destino: cruce.destino,
            departamento: cruce.departamento,
            titulo: titulo,
            local: local,
            tipo: cat.tipo,
            fecha: fechaText,
            descripcion: descripcion,
            ticketUrl: buyLink,
            gratis: false
          });
        });
      }
    } catch (e) {
      Logger.log("Error en Cartelera " + cat.url + ": " + e.message);
    }
  });
  
  return eventos;
}

/**
 * --- SCRAPER: Antel Arena Oficial ---
 */
function scraperAntelArena(destinosMap) {
  const url = "https://www.antelarena.com.uy/events/";
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) return [];
  
  const html = response.getContentText("UTF-8");
  const eventos = [];
  
  const parts = html.split('<div class="eventItem');
  if (parts.length < 2) return [];
  
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    
    // Title
    const titleBlock = extractBetween(part, 'class="h3 title', '</div>');
    let titulo = extractBetween(titleBlock, '">', '</a>').replace(/<[^>]*>/g, "").trim();
    if (!titulo) {
      titulo = extractBetween(part, 'title="More Info">', '</a>').replace(/<[^>]*>/g, "").trim();
    }
    if (!titulo) continue;
    
    // Tagline (Subtitle)
    const tagline = extractBetween(part, 'class="h4 tagline">', '</div>').replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    
    // Date
    const day = extractBetween(part, 'class="m-date__day">', '</span>').trim();
    const month = extractBetween(part, 'class="m-date__month">', '</span>').trim();
    const year = extractBetween(part, 'class="m-date__year">', '</span>').trim();
    let fecha = `${day} de ${month} ${year}`.trim().replace(/\s+/g, " ");
    
    // Ticket link
    let ticketUrl = "";
    let ticketsChunk = extractBetween(part, 'class="tickets', '</a>');
    if (ticketsChunk) {
      ticketUrl = extractBetween(ticketsChunk, 'href="', '"').trim();
    }
    if (!ticketUrl) {
      let detailLink = extractBetween(part, 'href="/events/detail/', '"').trim();
      ticketUrl = detailLink ? "https://www.antelarena.com.uy/events/detail/" + detailLink : url;
    }
    
    // Map to destination
    const cruce = encontrarDestinoYDepartamento(titulo + " Antel Arena", destinosMap, "Montevideo");
    
    // Build description
    let desc = tagline ? `${tagline}. Espectáculo en el Antel Arena.` : "Espectáculo en el Antel Arena.";
    
    eventos.push({
      destino: cruce.destino,
      departamento: cruce.departamento,
      titulo: titulo,
      local: "Antel Arena",
      tipo: clasificarTipoEvento(titulo + " " + desc, desc),
      fecha: fecha,
      descripcion: desc,
      ticketUrl: ticketUrl,
      gratis: false
    });
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

/**
 * Retorna el rango de la semana de cartelera actual en formato español.
 * La semana de cine en Uruguay va desde el jueves hasta el miércoles de la semana siguiente.
 */
function obtenerSemanaCartelera() {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0: Domingo, 1: Lunes, ..., 4: Jueves, ..., 6: Sábado
  const diffJueves = (diaSemana >= 4) ? (diaSemana - 4) : (diaSemana + 3);
  
  const jueves = new Date(hoy);
  jueves.setDate(hoy.getDate() - diffJueves);
  
  const miercoles = new Date(jueves);
  miercoles.setDate(jueves.getDate() + 6);
  
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  
  const diaJ = jueves.getDate();
  const mesJ = meses[jueves.getMonth()];
  const anioJ = jueves.getFullYear();
  
  const diaM = miercoles.getDate();
  const mesM = meses[miercoles.getMonth()];
  const anioM = miercoles.getFullYear();
  
  if (mesJ === mesM) {
    return "Del " + diaJ + " al " + diaM + " de " + mesJ + " de " + anioJ;
  } else {
    return "Del " + diaJ + " de " + mesJ + " al " + diaM + " de " + mesM + " de " + anioM;
  }
}

/**
 * Asesor Turístico y Geógrafo: Auditoría y optimización de coordenadas GPS en Google Sheets.
 * Busca destinos con coordenadas incompletas o imprecisas y las actualiza usando Google Maps Geocoder.
 */
function auditarCoordenadasDestinos() {
  const startTime = new Date().getTime(); // Registrar tiempo de inicio
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DESTINOS_NAME);
  if (!sheet) {
    Logger.log("Error: No se encontró la pestaña '" + SHEET_DESTINOS_NAME + "'.");
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return;
  
  const headers = data[0].map(h => h.toString().toLowerCase().trim());
  const destIdx = headers.indexOf("destino");
  const deptIdx = headers.indexOf("departamento");
  const gpsIdx = headers.indexOf("coordenadas gps");
  
  if (destIdx === -1 || deptIdx === -1 || gpsIdx === -1) {
    Logger.log("Error: Columnas requeridas ('Destino', 'Departamento' o 'Coordenadas GPS') no encontradas.");
    return;
  }
  
  let actualizaciones = 0;
  
  for (let i = 1; i < data.length; i++) {
    // Control de tiempo para evitar el corte abrupto de Google (límite de 5 minutos y medio)
    const currentTime = new Date().getTime();
    if (currentTime - startTime > 330000) { // 5.5 minutos
      Logger.log("Límite de tiempo de seguridad de Google alcanzado (5.5 min). Se actualizaron " + actualizaciones + " destinos en esta tanda. Haz clic en 'Ejecutar' nuevamente para continuar con el resto.");
      return;
    }

    const row = data[i];
    const destino = row[destIdx] ? row[destIdx].toString().trim() : "";
    const depto = row[deptIdx] ? row[deptIdx].toString().trim() : "";
    let gps = row[gpsIdx] ? row[gpsIdx].toString().trim() : "";
    
    if (!destino) continue;
    
    // Verificar si ya tiene formato de 6 decimales exacto (ej: -34.400305, -53.783021)
    const regex6Dec = /^-?\d+\.\d{6},\s*-?\d+\.\d{6}$/;
    const tiene6Dec = regex6Dec.test(gps);
    
    if (!tiene6Dec || !gps) {
      // Limpiar nombre del destino para mejorar coincidencia (remover cosas entre paréntesis)
      const cleanDestino = destino.replace(/\(.*?\)/g, "").trim();
      const query = cleanDestino + ", " + depto + ", Uruguay";
      
      try {
        Logger.log("Geocodificando: " + query);
        const response = Maps.newGeocoder().geocode(query);
        
        if (response.status === 'OK' && response.results && response.results.length > 0) {
          const loc = response.results[0].geometry.location;
          const lat6 = loc.lat.toFixed(6);
          const lng6 = loc.lng.toFixed(6);
          const nuevasCoords = lat6 + ", " + lng6;
          
          sheet.getRange(i + 1, gpsIdx + 1).setValue(nuevasCoords);
          Logger.log("✓ Actualizado '" + destino + "': " + nuevasCoords);
          actualizaciones++;
        } else {
          // Intentar fallback sin el departamento
          const fallbackResponse = Maps.newGeocoder().geocode(cleanDestino + ", Uruguay");
          if (fallbackResponse.status === 'OK' && fallbackResponse.results && fallbackResponse.results.length > 0) {
            const loc = fallbackResponse.results[0].geometry.location;
            const lat6 = loc.lat.toFixed(6);
            const lng6 = loc.lng.toFixed(6);
            const nuevasCoords = lat6 + ", " + lng6;
            
            sheet.getRange(i + 1, gpsIdx + 1).setValue(nuevasCoords);
            Logger.log("✓ Actualizado (Fallback) '" + destino + "': " + nuevasCoords);
            actualizaciones++;
          } else {
            // Si el geocoder de Google no encuentra nada, simplemente formatear las coordenadas existentes a 6 decimales
            if (gps) {
              const coords = gps.split(",");
              if (coords.length === 2) {
                const lat = parseFloat(coords[0].trim());
                const lng = parseFloat(coords[1].trim());
                if (!isNaN(lat) && !isNaN(lng)) {
                  const formateadas = lat.toFixed(6) + ", " + lng.toFixed(6);
                  sheet.getRange(i + 1, gpsIdx + 1).setValue(formateadas);
                  Logger.log("ℹ Formateadas coords existentes para '" + destino + "': " + formateadas);
                  actualizaciones++;
                }
              }
            } else {
              Logger.log("⚠ No se pudieron encontrar coordenadas para: " + destino);
            }
          }
        }
      } catch (e) {
        Logger.log("Error al geocodificar '" + destino + "': " + e.message);
      }
    }
  }
  
  Logger.log("Auditoría de coordenadas finalizada con éxito. Total actualizados: " + actualizaciones);
}
