// UruExplorer - Application Logic

// Configuración de Reportes de Error (Google Form pre-llenado)
const REPORT_FORM_BASE_URL = 'https://docs.google.com/forms/d/1uLhJ2kcy8byCfyRoP68m5nX_R7XWU45-islcbMFTM5U/viewform?entry.1878222161=';

// State management
let favorites = JSON.parse(localStorage.getItem('uruexplorer_favorites')) || [];
let rawItinerary = JSON.parse(localStorage.getItem('uruexplorer_itinerary')) || [];
let itinerary = rawItinerary.map(item => {
    if (typeof item === 'number') {
        return { type: 'destination', id: item };
    }
    return item;
});
let savedEvents = JSON.parse(localStorage.getItem('uruexplorer_saved_events')) || [];
let currentSearchMode = 'turismo'; // Tracks active search tab mode ('turismo' or 'eventos')
let savedItinerariesList = JSON.parse(localStorage.getItem('uruexplorer_saved_itineraries_list')) || [];
let cardEventFilters = {}; // Tracks active category filters per card: { cardId: 'Todos' }
let currentResults = [];
let userLocation = null;
let emptySearchCriterion = null; // Session empty search behavior ('near' or 'all')
let currentLang = 'es'; // default
let currentTheme = localStorage.getItem('uruexplorer_theme') || 'dark';
let eventDatePicker = null;

// Localization Dictionary
const TRANSLATIONS = {
    es: {
        tagline: "Explorá Uruguay de forma minimalista",
        tab_explorar: "Explorar",
        tab_resultados: "Resultados",
        tab_itinerario: "Mis rutas",
        lbl_buscar_destino: "Buscar Destino o Característica",
        placeholder_buscar: "Ej: Cabo Polonio, playa, cascada...",
        lbl_departamento: "Departamento",
        lbl_dificultad: "Grado de Dificultad",
        lbl_popularidad: "Popularidad",
        opt_todos_deptos: "Todos los departamentos",
        opt_todos_grados: "Todos los grados",
        btn_buscar: "Buscar Coincidencias",
        title_favoritos: "★ Tus Destinos Favoritos",
        no_favorites: "Aún no tienes destinos favoritos guardados. ¡Agrega algunos marcando la estrella en los bloques de resultados!",
        results_header: "Resultados de Búsqueda",
        btn_limpiar_itinerario: "✕ Limpiar Selección",
        lbl_only_events: "Solo con eventos",
        empty_results_title: "No se encontraron destinos",
        empty_results_text: "Intenta ajustar los criterios de búsqueda o seleccionar otros filtros.",
        itinerary_header: "Recorrido Seleccionado",
        btn_clear_all: "Limpiar Todo",
        card_report_error: "¿Algún dato incorrecto? Reportar",
        btn_trazar_itinerario: "🚙 Trazar Itinerario Completo en Google Maps",
        empty_itinerary_text: "No tienes destinos seleccionados para tu recorrido. Busca destinos y marca la casilla \"Recorrido\" en los resultados de búsqueda para agregarlos aquí.",
        itinerary_bar_count: "Itinerario: {count} destinos seleccionados",
        itinerary_bar_none: "Ninguno seleccionado",
        itinerary_mobile_link: "Ir a Establecer Ruta ➔",
        btn_limpiar: "✕ Limpiar",
        btn_ver_detalles: "Ver Detalles",
        btn_establecer_ruta: "Establecer Ruta",
        modal_title: "📍 Búsqueda amplia",
        modal_body: "No has especificado un destino ni un departamento. ¿Qué prefieres ver?",
        btn_modal_cerca: "📍 Buscar cerca de mi posición",
        btn_modal_todos: "🌍 Mostrar todas las disponibles",
        card_features: "Características",
        card_accommodation: "Alojamiento",
        card_dining: "Dónde comer",
        card_location: "Ubicación",
        card_contact: "Contacto principal",
        card_website: "Sitio Web",
        card_how_to_go: "Cómo ir",
        card_reset_map: "🔄 Restablecer Mapa",
        card_route: "Recorrido",
        distance_badge: "📍 a {distance} km",
        popularity_badge: "Popularidad",
        pop_alta: "Alta",
        pop_moderada: "Moderada",
        pop_emergente: "Emergente",
        no_info: "Consultar información local o sitio web",
        popularity_levels: {
            "Alta": "Alta",
            "Moderada": "Moderada",
            "Emergente": "Emergente"
        },
        // Events and Multiple Itinerary keys
        itinerary_events_header: "Eventos Agendados",
        title_save_itinerary: "Guardar Recorrido Actual",
        placeholder_itinerary_name: "Ej: Viaje Rocha Enero...",
        btn_save: "Guardar",
        title_saved_itineraries: "Mis Recorridos Guardados",
        no_saved_itineraries: "No tienes recorridos guardados en este dispositivo.",
        btn_search_events: "📅 Buscar Eventos",
        btn_load: "Cargar",
        btn_delete: "Eliminar",
        events_title: "Eventos Disponibles",
        events_filter_all: "Todos",
        events_filter_concerts: "Conciertos",
        events_filter_fairs: "Ferias",
        events_filter_festivals: "Fiestas",
        events_filter_theater_cine: "Teatro / Cine",
        events_filter_cultural: "Culturales",
        btn_buy_tickets: "🎟️ Comprar Entradas",
        btn_save_event: "⭐ Guardar Evento",
        btn_unsave_event: "⭐ Guardado",
        msg_itinerary_saved: "¡Recorrido guardado con éxito!",
        msg_itinerary_empty: "No hay destinos en el recorrido para guardar.",
        msg_itinerary_enter_name: "Por favor, ingresa un nombre para el recorrido.",
        tab_turismo: "Turismo",
        tab_eventos: "Eventos",
        lbl_buscar_evento: "Nombre de Evento o Característica",
        placeholder_buscar_evento: "Ej: Concierto, Teatro Solís...",
        lbl_tipo_evento: "Tipo de Evento",
        opt_todos_tipos: "Todos los tipos",
        lbl_fecha_inicio: "Fecha Inicio",
        lbl_fecha_fin: "Fecha Fin",
        lbl_fecha_rango: "Rango de Fechas",
        placeholder_fecha_rango: "Seleccione período de búsqueda...",
        btn_buscar_eventos: "Buscar Eventos",
        event_types: {
            "Concierto": "Concierto",
            "Feria": "Feria",
            "Fiesta": "Fiesta",
            "Teatro": "Teatro",
            "Cine": "Cine",
            "Cultural": "Cultural"
        },
        lbl_event_sources_intro: "Fuentes de información de eventos:"
    },
    en: {
        tagline: "Explore Uruguay in a minimalist way",
        tab_explorar: "Explore",
        tab_resultados: "Results",
        tab_itinerario: "My Routes",
        lbl_buscar_destino: "Search Destination or Feature",
        placeholder_buscar: "Ex: Cabo Polonio, beach, waterfall...",
        lbl_departamento: "Department",
        lbl_dificultad: "Difficulty Level",
        lbl_popularidad: "Popularity",
        opt_todos_deptos: "All departments",
        opt_todos_grados: "All levels",
        btn_buscar: "Search Matches",
        title_favoritos: "★ Your Favorite Destinations",
        no_favorites: "You don't have favorite destinations saved yet. Add some by marking the star in the result blocks!",
        results_header: "Search Results",
        btn_limpiar_itinerario: "✕ Clear Selection",
        lbl_only_events: "Only with events",
        empty_results_title: "No destinations found",
        empty_results_text: "Try adjusting the search criteria or selecting other filters.",
        itinerary_header: "Selected Route",
        btn_clear_all: "Clear All",
        card_report_error: "Any incorrect data? Report",
        btn_trazar_itinerario: "🚙 Trace Complete Itinerary on Google Maps",
        empty_itinerary_text: "You have no destinations selected for your route. Search for destinations and check the \"Route\" box in the search results to add them here.",
        itinerary_bar_count: "Itinerary: {count} destinations selected",
        itinerary_bar_none: "None selected",
        itinerary_mobile_link: "Go to Set Route ➔",
        btn_limpiar: "✕ Clear",
        btn_ver_detalles: "View Details",
        btn_establecer_ruta: "Set Route",
        modal_title: "📍 Broad search",
        modal_body: "You haven't specified a destination or department. What do you prefer to see?",
        btn_modal_cerca: "📍 Search near my position",
        btn_modal_todos: "🌍 Show all available",
        card_features: "Features",
        card_accommodation: "Lodging",
        card_dining: "Where to eat",
        card_location: "Location",
        card_contact: "Main contact",
        card_website: "Website",
        card_how_to_go: "How to go",
        card_reset_map: "🔄 Reset Map",
        card_route: "Route",
        distance_badge: "📍 {distance} km away",
        popularity_badge: "Popularity",
        pop_alta: "High",
        pop_moderada: "Moderate",
        pop_emergente: "Trending",
        no_info: "Consult local info or website",
        popularity_levels: {
            "Alta": "High",
            "Moderada": "Moderate",
            "Emergente": "Trending"
        },
        // Events and Multiple Itinerary keys
        itinerary_events_header: "Scheduled Events",
        title_save_itinerary: "Save Current Route",
        placeholder_itinerary_name: "Ex: Rocha Trip January...",
        btn_save: "Save",
        title_saved_itineraries: "My Saved Routes",
        no_saved_itineraries: "You have no saved routes on this device.",
        btn_search_events: "📅 Search Events",
        btn_load: "Load",
        btn_delete: "Delete",
        events_title: "Available Events",
        events_filter_all: "All",
        events_filter_concerts: "Concerts",
        events_filter_fairs: "Fairs",
        events_filter_festivals: "Festivals",
        events_filter_theater_cine: "Theater / Cinema",
        events_filter_cultural: "Cultural",
        btn_buy_tickets: "🎟️ Buy Tickets",
        btn_save_event: "⭐ Save Event",
        btn_unsave_event: "⭐ Saved",
        msg_itinerary_saved: "Route saved successfully!",
        msg_itinerary_empty: "There are no destinations in the route to save.",
        msg_itinerary_enter_name: "Please enter a name for the route.",
        tab_turismo: "Tourism",
        tab_eventos: "Events",
        lbl_buscar_evento: "Event Name or Feature",
        placeholder_buscar_evento: "Ex: Concert, Solis Theater...",
        lbl_tipo_evento: "Event Type",
        opt_todos_tipos: "All types",
        lbl_fecha_inicio: "Start Date",
        lbl_fecha_fin: "End Date",
        lbl_fecha_rango: "Date Range",
        placeholder_fecha_rango: "Select date range...",
        btn_buscar_eventos: "Search Events",
        event_types: {
            "Concierto": "Concert",
            "Feria": "Fair",
            "Fiesta": "Festival",
            "Teatro": "Theater",
            "Cine": "Cinema",
            "Cultural": "Cultural"
        },
        lbl_event_sources_intro: "Event information sources:"
    }
};

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1x_eFEDfD4Dm5cnDUHSpG8ga_tYhUZdjd4OhGSwmmfPc/export?format=csv';
const SHEET_EVENTOS_URL = 'https://docs.google.com/spreadsheets/d/1x_eFEDfD4Dm5cnDUHSpG8ga_tYhUZdjd4OhGSwmmfPc/export?format=csv&gid=784697719';
let appDestinos = DESTINOS; // Default fallback to destinos.js local data
let appEventos = EVENTOS; // Default fallback to eventos.js local data

// Helper to parse CSV string into an array of arrays
function parseCSV(text) {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const next = text[i+1];

        if (c === '"') {
            if (inQuotes && next === '"') {
                row[row.length - 1] += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            row.push('');
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') {
                i++;
            }
            lines.push(row);
            row = [''];
        } else {
            row[row.length - 1] += c;
        }
    }
    if (row.length > 1 || row[0] !== '') {
        lines.push(row);
    }
    return lines;
}

// Convert parsed CSV rows to structured destination objects matching appDestinos format
function processCSVData(csvText) {
    const parsed = parseCSV(csvText);
    if (parsed.length < 2) return null;
    
    // Normalize headers
    const headers = parsed[0].map(h => h.trim().toLowerCase());
    
    const findColIndex = (possibleNames) => {
        return headers.findIndex(h => 
            possibleNames.some(name => h.includes(name.toLowerCase()))
        );
    };

    const destIdx = findColIndex(['destino']);
    const deptIdx = findColIndex(['departamento']);
    const difIdx = findColIndex(['dificultad', 'grado de dificultad']);
    const charIdx = findColIndex(['caracteristicas', 'características']);
    const costIdx = findColIndex(['costos', 'costos principales']);
    const alojIdx = findColIndex(['alojamiento', 'opciones de alojamiento']);
    const comerIdx = findColIndex(['comer', 'opciones de comer']);
    const contIdx = findColIndex(['contacto', 'contacto principal']);
    const ubicIdx = findColIndex(['acceso', 'ubicacion', 'ubicación']);
    const gpsIdx = findColIndex(['gps', 'coordenadas gps']);
    const webIdx = findColIndex(['web', 'sitio web']);
    const popIdx = findColIndex(['popularidad']);

    const items = [];
    for (let i = 1; i < parsed.length; i++) {
        const row = parsed[i];
        // Skip empty or invalid rows
        if (row.length <= 1 || !row[destIdx]) continue;

        const gps = row[gpsIdx] ? row[gpsIdx].trim() : '';
        let lat = null, lng = null;
        if (gps) {
            const parts = gps.split(',');
            if (parts.length === 2) {
                lat = parseFloat(parts[0].trim());
                lng = parseFloat(parts[1].trim());
            }
        }

        let pop = row[popIdx] ? row[popIdx].trim() : '';
        if (pop.toLowerCase().includes('learning') || pop.toLowerCase().includes('help')) {
            pop = '';
        }

        const destName = row[destIdx] ? row[destIdx].trim() : '';
        const localDest = typeof DESTINOS !== 'undefined' ? DESTINOS.find(d => d.destino === destName) : null;

        items.push({
            id: i,
            destino: destName,
            departamento: row[deptIdx] ? row[deptIdx].trim() : '',
            dificultad: row[difIdx] ? row[difIdx].trim() : '',
            caracteristicas: row[charIdx] ? row[charIdx].trim() : '',
            caracteristicas_en: localDest && localDest.caracteristicas_en ? localDest.caracteristicas_en : '',
            costos: row[costIdx] ? row[costIdx].trim() : '',
            alojamiento: row[alojIdx] ? row[alojIdx].trim() : '',
            comer: row[comerIdx] ? row[comerIdx].trim() : '',
            contacto: row[contIdx] ? row[contIdx].trim() : '',
            ubicacion: row[ubicIdx] ? row[ubicIdx].trim() : '',
            gps: gps,
            lat: lat,
            lng: lng,
            web: row[webIdx] ? row[webIdx].trim() : '',
            popularidad: pop
        });
    }
    return items;
}

// Fetch the CSV directly from the public Google Sheet and parse it
// Convert parsed CSV rows to structured event objects matching EVENTOS format
function processEventsCSVData(csvText) {
    const parsed = parseCSV(csvText);
    if (parsed.length < 2) return null;
    
    // Normalize headers
    const headers = parsed[0].map(h => h.trim().toLowerCase());
    
    const findColIndex = (possibleNames) => {
        return headers.findIndex(h => 
            possibleNames.some(name => h.includes(name.toLowerCase()))
        );
    };

    const idIdx = findColIndex(['id']);
    const destIdx = findColIndex(['destino']);
    const deptIdx = findColIndex(['departamento']);
    const titleIdx = findColIndex(['titulo', 'título']);
    const localIdx = findColIndex(['local']);
    const typeIdx = findColIndex(['tipo']);
    const dateIdx = findColIndex(['fecha']);
    const descIdx = findColIndex(['descripcion', 'descripción']);
    const ticketIdx = findColIndex(['ticketurl', 'ticket url', 'enlace']);
    const freeIdx = findColIndex(['gratis']);

    const items = [];
    for (let i = 1; i < parsed.length; i++) {
        const row = parsed[i];
        // Skip empty or invalid rows
        if (row.length <= 1 || !row[titleIdx]) continue;

        const isFreeVal = row[freeIdx] ? row[freeIdx].trim().toUpperCase() : '';
        const gratis = (isFreeVal === 'SÍ' || isFreeVal === 'SI' || isFreeVal === 'YES' || isFreeVal === 'TRUE');

        items.push({
            id: row[idIdx] ? parseInt(row[idIdx].trim()) : i,
            destino: row[destIdx] ? row[destIdx].trim() : '',
            departamento: row[deptIdx] ? row[deptIdx].trim() : '',
            titulo: row[titleIdx] ? row[titleIdx].trim() : '',
            local: row[localIdx] ? row[localIdx].trim() : '',
            tipo: row[typeIdx] ? row[typeIdx].trim() : '',
            fecha: row[dateIdx] ? row[dateIdx].trim() : '',
            descripcion: row[descIdx] ? row[descIdx].trim() : '',
            ticketUrl: row[ticketIdx] ? row[ticketIdx].trim() : '',
            gratis: gratis
        });
    }
    return items;
}

// Fetch the CSV directly from the public Google Sheet and parse it
async function loadData() {
    console.log("Intentando descargar base de datos actualizada desde Google Sheets...");
    
    // Download both sheets in parallel with cache-busting
    const promises = [
        fetch(`${SHEET_CSV_URL}&t=${Date.now()}`).then(res => {
            if (!res.ok) throw new Error("Error en destinos");
            return res.text();
        }),
        fetch(`${SHEET_EVENTOS_URL}&t=${Date.now()}`).then(res => {
            if (!res.ok) throw new Error("Error en eventos");
            return res.text();
        })
    ];

    try {
        const [destinosCsv, eventosCsv] = await Promise.all(promises);

        // Process Destinos
        const parsedDestinos = processCSVData(destinosCsv);
        if (parsedDestinos && parsedDestinos.length > 0) {
            appDestinos = parsedDestinos;
            console.log(`Base de datos de destinos actualizada desde Google Sheets (${parsedDestinos.length} destinos).`);
            localStorage.setItem('uruexplorer_cached_data', JSON.stringify(parsedDestinos));
        }

        // Process Eventos
        const parsedEventos = processEventsCSVData(eventosCsv);
        if (parsedEventos && parsedEventos.length > 0) {
            appEventos = parsedEventos;
            console.log(`Base de datos de eventos actualizada desde Google Sheets (${parsedEventos.length} eventos).`);
            localStorage.setItem('uruexplorer_events_cached_data', JSON.stringify(parsedEventos));
        }
    } catch (e) {
        console.warn("No se pudo descargar la base de datos de Google Sheets. Usando base de datos local / caché.", e);
        
        // Load cache or fallback for Destinos
        const cachedDest = localStorage.getItem('uruexplorer_cached_data');
        if (cachedDest) {
            appDestinos = JSON.parse(cachedDest);
        } else {
            appDestinos = DESTINOS;
        }

        // Load cache or fallback for Eventos
        const cachedEv = localStorage.getItem('uruexplorer_events_cached_data');
        if (cachedEv) {
            appEventos = JSON.parse(cachedEv);
        } else {
            appEventos = EVENTOS;
        }
    }
}

// Helper to format dining and lodging options (cleaning Google Sheets prompt formulas and turning places into links)
function parsePlaces(text, destinationName, deptName, cardId) {
    if (!text || text.trim() === '' || text.toLowerCase().includes('generar')) {
        return `<span class="text-muted-italics">${TRANSLATIONS[currentLang].no_info}</span>`;
    }

    // Split by commas that are outside parentheses to isolate places
    const parts = text.split(/,(?![^(]*\))/);
    
    const formattedParts = parts.map(part => {
        part = part.trim();
        if (!part) return '';
        
        // Isolate place name and details in parentheses
        const parenIndex = part.indexOf('(');
        let name = part;
        let details = '';
        
        if (parenIndex !== -1) {
            name = part.substring(0, parenIndex).trim();
            details = part.substring(parenIndex).trim();
        }
        
        // Escape query string for Google Maps search link
        const query = encodeURIComponent(`${name}, ${destinationName}, ${deptName}, Uruguay`);
        
        // Render name as a clickable link that updates the embedded map in place
        return `<a href="https://www.google.com/maps/search/?api=1&query=${query}" target="_blank" class="place-link" onclick="updateEmbeddedMap(event, '${cardId}', '${name.replace(/'/g, "\\'")}, ${destinationName.replace(/'/g, "\\'")}')">${name}</a>${details}`;
    });
    
    return formattedParts.filter(p => p !== '').join(', ');
}

// Update the embedded iframe map to show a specific place
function updateEmbeddedMap(event, cardId, query) {
    event.preventDefault(); // Prevent opening a new tab
    
    const iframe = document.querySelector(`#map-container-${cardId} iframe`);
    if (iframe) {
        const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
        iframe.src = mapUrl;
        
        // Reveal the Reset Map button
        const resetBtn = document.getElementById(`reset-map-${cardId}`);
        if (resetBtn) {
            resetBtn.style.display = 'inline-flex';
        }
    }
}

// Reset the map back to the main coordinates of the destination
function resetEmbeddedMap(cardId, lat, lng) {
    const iframe = document.querySelector(`#map-container-${cardId} iframe`);
    if (iframe) {
        const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
        iframe.src = mapUrl;
        
        // Hide the Reset Map button
        const resetBtn = document.getElementById(`reset-map-${cardId}`);
        if (resetBtn) {
            resetBtn.style.display = 'none';
        }
    }
}

// Expose map functions to window scope for inline onclick handlers
window.updateEmbeddedMap = updateEmbeddedMap;
window.resetEmbeddedMap = resetEmbeddedMap;

// Apply current theme
function applyTheme() {
    const body = document.body;
    const btnDark = document.getElementById('theme-btn-dark');
    const btnLight = document.getElementById('theme-btn-light');

    if (currentTheme === 'light') {
        body.setAttribute('data-theme', 'light');
        if (btnLight) btnLight.classList.add('active');
        if (btnDark) btnDark.classList.remove('active');
    } else {
        body.removeAttribute('data-theme');
        if (btnDark) btnDark.classList.add('active');
        if (btnLight) btnLight.classList.remove('active');
    }
}

// Helper to convert Flatpickr local Date object to UTC Date at midnight (matching parseSpanishDate UTC representation)
function toUTCDate(localDate) {
    if (!localDate) return null;
    return new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));
}

// Initialize Flatpickr range selector with dynamic localization
function initFlatpickr() {
    if (eventDatePicker) {
        eventDatePicker.destroy();
    }
    const input = document.getElementById('filter-event-dates');
    if (!input) return;

    eventDatePicker = flatpickr(input, {
        mode: "range",
        dateFormat: "Y-m-d",
        locale: currentLang === 'es' ? 'es' : 'en',
        disableMobile: true // Forces custom calendar UI on touch screens, avoiding native iOS range input crashes
    });
}

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    applyTheme(); // Set initial theme
    detectLanguage();
    await loadData();
    initFilters();
    initEventFilters();
    applyTranslations();
    initFlatpickr(); // Initialize Flatpickr calendar
    renderFavorites();
    updateItineraryUI();
    renderItineraryTab(); // Render active itinerary and saved history on startup
    setupEventListeners();
    setupLanguageSwitcher();
    setupSwipeNavigation();
    requestUserLocation();
});

// Auto-detect browser/system language
function detectLanguage() {
    const sysLang = navigator.language || navigator.userLanguage;
    if (sysLang && sysLang.toLowerCase().startsWith('en')) {
        currentLang = 'en';
    } else {
        currentLang = 'es';
    }
}

// Add event listeners to manual language buttons
function setupLanguageSwitcher() {
    const btnEs = document.getElementById('lang-btn-es');
    const btnEn = document.getElementById('lang-btn-en');
    
    if (btnEs) {
        btnEs.addEventListener('click', () => {
            if (currentLang !== 'es') {
                currentLang = 'es';
                applyTranslations();
                initFilters();
                initEventFilters(); // Re-initialize events filter in Spanish
                initFlatpickr(); // Reinit Flatpickr with ES locale
                renderFavorites();
                updateItineraryUI();
                renderItineraryTab();
                if (currentResults.length > 0) {
                    renderResults();
                }
            }
        });
    }
    
    if (btnEn) {
        btnEn.addEventListener('click', () => {
            if (currentLang !== 'en') {
                currentLang = 'en';
                applyTranslations();
                initFilters();
                initEventFilters(); // Re-initialize events filter in English
                initFlatpickr(); // Reinit Flatpickr with EN locale
                renderFavorites();
                updateItineraryUI();
                renderItineraryTab();
                if (currentResults.length > 0) {
                    renderResults();
                }
            }
        });
    }
}

// Apply translations to static HTML and switcher buttons
function applyTranslations() {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['es'];

    // Update active state in switcher buttons
    const btnEs = document.getElementById('lang-btn-es');
    const btnEn = document.getElementById('lang-btn-en');
    if (btnEs && btnEn) {
        if (currentLang === 'es') {
            btnEs.classList.add('active');
            btnEn.classList.remove('active');
        } else {
            btnEn.classList.add('active');
            btnEs.classList.remove('active');
        }
    }

    // Static text translations
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });

    // Placeholder translations
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) {
            el.placeholder = dict[key];
        }
    });
}

// Helper to translate difficulty level display text
function translateDifficulty(dif) {
    if (currentLang === 'es') return dif;
    const difLower = dif.toLowerCase();
    if (difLower === 'fácil' || difLower === 'facil') return 'Easy';
    if (difLower === 'moderado') return 'Moderate';
    if (difLower === 'alto / exigente') return 'Hard / Demanding';
    if (difLower === 'moderado-alto') return 'Moderate-Hard';
    if (difLower === 'fácil-moderado') return 'Easy-Moderate';
    return dif;
}

// Request user location for routing
function requestUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log("Ubicación del usuario obtenida:", userLocation);
            },
            (error) => {
                console.warn("No se pudo obtener la ubicación:", error.message);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    }
}

// Populate search filters dynamically from DESTINOS database
function initFilters() {
    const deptoSelect = document.getElementById('filter-departamento');
    const dificultadSelect = document.getElementById('filter-dificultad');

    // Store currently selected values to restore them after rebuild
    const prevDepto = deptoSelect.value;
    const prevDif = dificultadSelect.value;

    deptoSelect.innerHTML = '';
    dificultadSelect.innerHTML = '';

    // Add translated default option
    const optDepto = document.createElement('option');
    optDepto.value = "";
    optDepto.setAttribute('data-i18n', 'opt_todos_deptos');
    optDepto.textContent = TRANSLATIONS[currentLang].opt_todos_deptos;
    deptoSelect.appendChild(optDepto);

    const optDif = document.createElement('option');
    optDif.value = "";
    optDif.setAttribute('data-i18n', 'opt_todos_grados');
    optDif.textContent = TRANSLATIONS[currentLang].opt_todos_grados;
    dificultadSelect.appendChild(optDif);

    // Extract unique values
    const departamentos = new Set();
    const dificultades = new Set();

    appDestinos.forEach(item => {
        if (item.departamento) departamentos.add(item.departamento.trim());
        if (item.dificultad) dificultades.add(item.dificultad.trim());
    });

    // Populate Departamento selector (sorted)
    Array.from(departamentos).sort().forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        option.setAttribute('translate', 'no');
        option.classList.add('notranslate');
        deptoSelect.appendChild(option);
    });

    // Populate Dificultad selector (sorted)
    Array.from(dificultades).sort().forEach(dif => {
        const option = document.createElement('option');
        option.value = dif;
        option.textContent = translateDifficulty(dif);
        dificultadSelect.appendChild(option);
    });

    // Restore selections if they still exist
    deptoSelect.value = prevDepto;
    dificultadSelect.value = prevDif;
}

// Set up UI navigation and actions
function setupEventListeners() {
    // Tabs Navigation
    document.getElementById('tab-turismo-btn').addEventListener('click', () => switchTab('turismo'));
    document.getElementById('tab-eventos-btn').addEventListener('click', () => switchTab('eventos'));
    document.getElementById('tab-resultados-btn').addEventListener('click', () => switchTab('resultados'));
    document.getElementById('tab-itinerario-btn').addEventListener('click', () => switchTab('itinerario'));

    // Search Actions
    document.getElementById('btn-buscar').addEventListener('click', () => {
        currentSearchMode = 'turismo';
        performSearch();
    });
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentSearchMode = 'turismo';
            performSearch();
        }
    });

    document.getElementById('btn-buscar-eventos').addEventListener('click', () => {
        currentSearchMode = 'eventos';
        performEventSearch();
    });
    document.getElementById('search-event-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentSearchMode = 'eventos';
            performEventSearch();
        }
    });

    // Modal Action Buttons
    const btnCerca = document.getElementById('btn-modal-cerca');
    const btnTodos = document.getElementById('btn-modal-todos');
    if (btnCerca) {
        btnCerca.addEventListener('click', () => {
            emptySearchCriterion = 'near';
            hideProximityModal();
            if (currentSearchMode === 'eventos') {
                performEventSearch();
            } else {
                performSearch();
            }
        });
    }
    if (btnTodos) {
        btnTodos.addEventListener('click', () => {
            emptySearchCriterion = 'all';
            hideProximityModal();
            if (currentSearchMode === 'eventos') {
                performEventSearch();
            } else {
                performSearch();
            }
        });
    }

    // Itinerary Bar Actions
    document.getElementById('btn-ver-itinerario-bar').addEventListener('click', () => switchTab('itinerario'));
    document.getElementById('btn-trazar-itinerario-bar').addEventListener('click', (e) => {
        e.stopPropagation();
        triggerItineraryRoute();
    });
    document.getElementById('btn-trazar-itinerario-tab').addEventListener('click', triggerItineraryRoute);
    document.getElementById('btn-clear-itinerary').addEventListener('click', clearItinerary);
    document.getElementById('btn-limpiar-itinerario-bar').addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the bar click switchTab
        clearItinerary();
    });
    document.getElementById('btn-limpiar-itinerario-resultados').addEventListener('click', clearItinerary);

    // Make the entire sticky bar clickable (especially useful on mobile)
    document.getElementById('itinerary-bar').addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            switchTab('itinerario');
        }
    });

    // Save Itinerary Submit Button
    const btnSaveIt = document.getElementById('btn-save-itinerary-submit');
    if (btnSaveIt) {
        btnSaveIt.addEventListener('click', saveCurrentItinerary);
    }
    const nameInput = document.getElementById('itinerary-name-input');
    if (nameInput) {
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveCurrentItinerary();
            }
        });
    }

    // Theme Switch Action
    const btnDark = document.getElementById('theme-btn-dark');
    const btnLight = document.getElementById('theme-btn-light');
    if (btnDark) {
        btnDark.addEventListener('click', () => {
            if (currentTheme !== 'dark') {
                currentTheme = 'dark';
                localStorage.setItem('uruexplorer_theme', 'dark');
                applyTheme();
            }
        });
    }
    if (btnLight) {
        btnLight.addEventListener('click', () => {
            if (currentTheme !== 'light') {
                currentTheme = 'light';
                localStorage.setItem('uruexplorer_theme', 'light');
                applyTheme();
            }
        });
    }
}

// Switch between view tabs
function switchTab(tabId) {
    // Remove active state from all buttons and views
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));

    // Activate selected tab and view
    if (tabId === 'turismo') {
        document.getElementById('tab-turismo-btn').classList.add('active');
        document.getElementById('view-turismo').classList.add('active');
    } else if (tabId === 'eventos') {
        document.getElementById('tab-eventos-btn').classList.add('active');
        document.getElementById('view-eventos').classList.add('active');
    } else if (tabId === 'resultados') {
        document.getElementById('tab-resultados-btn').classList.add('active');
        document.getElementById('view-resultados').classList.add('active');
    } else if (tabId === 'itinerario') {
        document.getElementById('tab-itinerario-btn').classList.add('active');
        document.getElementById('view-itinerario').classList.add('active');
        renderItineraryTab();
    }

    // Scroll back to top smoothly so the user doesn't stay scrolled down from previous view
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showProximityModal() {
    const modal = document.getElementById('proximity-modal');
    if (modal) {
        modal.classList.add('visible');
    }
}

function hideProximityModal() {
    const modal = document.getElementById('proximity-modal');
    if (modal) {
        modal.classList.remove('visible');
    }
}

// Calculate Haversine distance in km between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Remove accents/diacritics and convert to lowercase for search normalization
function removeAccents(str) {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Check if an event matches a destination card
function isEventMatch(ev, item) {
    const cleanEvDest = removeAccents(ev.destino);
    const cleanItemDest = removeAccents(item.destino);
    const cleanEvDept = removeAccents(ev.departamento);
    const cleanItemDept = removeAccents(item.departamento);

    // If departments mismatch, they don't match (unless one is empty)
    if (cleanEvDept && cleanItemDept && cleanEvDept !== cleanItemDept) {
        return false;
    }

    // 1. Exact match
    if (cleanEvDest === cleanItemDest) return true;

    // 2. Substring match (either way)
    if (cleanItemDest.includes(cleanEvDest) || cleanEvDest.includes(cleanItemDest)) return true;

    // 3. Department-wide / City-wide match:
    // If the event is registered for the whole department/city (e.g. destino is "Montevideo" or "Maldonado")
    if (cleanEvDest === cleanItemDept) return true;

    return false;
}

// Compute the Levenshtein edit distance between two strings
function levenshteinDistance(a, b) {
    const tmp = [];
    for (let i = 0; i <= a.length; i++) {
        tmp[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
        tmp[0][j] = j;
    }
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) {
                tmp[i][j] = tmp[i - 1][j - 1];
            } else {
                tmp[i][j] = Math.min(
                    tmp[i - 1][j] + 1, // deletion
                    tmp[i][j - 1] + 1, // insertion
                    tmp[i - 1][j - 1] + 1 // substitution
                );
            }
        }
    }
    return tmp[a.length][b.length];
}

// Calculate similarity score between search query and destination item
function calculateMatchScore(cleanQuery, item) {
    const cleanDest = removeAccents(item.destino);
    const cleanDepto = removeAccents(item.departamento);
    const cleanChar = removeAccents(item.caracteristicas);

    // 1. Exact phrase substring matches (Highest priority)
    if (cleanDest.includes(cleanQuery)) {
        return 100 - (cleanDest.length - cleanQuery.length); // Prefer exact/shorter matches
    }
    if (cleanDepto.includes(cleanQuery)) {
        return 80;
    }
    if (cleanChar.includes(cleanQuery)) {
        return 50;
    }

    // 2. Word-by-word fuzzy matches
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2); // Ignore very short words like 'de', 'la'
    if (queryWords.length === 0) return 0;

    const destWords = cleanDest.split(/\s+/).filter(w => w.length > 2);
    const deptoWords = cleanDepto.split(/\s+/).filter(w => w.length > 2);
    
    let matchedWordsCount = 0;
    let totalFuzzyScore = 0;

    queryWords.forEach(qw => {
        let bestWordScore = 0;
        
        // Match query word against destination words
        destWords.forEach(dw => {
            if (dw.includes(qw) || qw.includes(dw)) {
                bestWordScore = Math.max(bestWordScore, 0.9);
            } else {
                const maxLen = Math.max(qw.length, dw.length);
                const dist = levenshteinDistance(qw, dw);
                const similarity = (maxLen - dist) / maxLen;
                if (similarity >= 0.65) { // Similarity threshold
                    bestWordScore = Math.max(bestWordScore, similarity);
                }
            }
        });

        // Match query word against department words
        deptoWords.forEach(dw => {
            if (dw.includes(qw) || qw.includes(dw)) {
                bestWordScore = Math.max(bestWordScore, 0.8);
            } else {
                const maxLen = Math.max(qw.length, dw.length);
                const dist = levenshteinDistance(qw, dw);
                const similarity = (maxLen - dist) / maxLen;
                if (similarity >= 0.65) {
                    bestWordScore = Math.max(bestWordScore, similarity * 0.8);
                }
            }
        });

        if (bestWordScore > 0) {
            matchedWordsCount++;
            totalFuzzyScore += bestWordScore;
        }
    });

    // If at least one word matched, return fuzzy score mapped out of 40
    if (matchedWordsCount > 0) {
        const averageWordScore = totalFuzzyScore / queryWords.length;
        return averageWordScore * 40;
    }

    return 0;
}

// Perform search based on filters selected
function performSearch() {
    const searchText = document.getElementById('search-input').value.trim();
    const selectedDepto = document.getElementById('filter-departamento').value;
    const selectedDif = document.getElementById('filter-dificultad').value;

    // Get selected popularity levels from checkboxes
    const selectedPops = Array.from(document.querySelectorAll('.popularity-chips input[type="checkbox"]:checked')).map(cb => cb.value);

    // Trigger condition for broad search modal
    if (!searchText && !selectedDepto) {
        if (emptySearchCriterion === null) {
            showProximityModal();
            return;
        }
    }

    const cleanQuery = removeAccents(searchText);

    // Filter items and calculate matching scores
    const itemsWithScores = appDestinos.map(item => {
        let score = 100; // Default score if no search query
        if (cleanQuery) {
            score = calculateMatchScore(cleanQuery, item);
        }
        return { item, score };
    }).filter(row => {
        // If search text was entered, only include items with a match score > 0
        if (cleanQuery && row.score === 0) {
            return false;
        }
        // Departamento Filter
        if (selectedDepto && row.item.departamento.trim() !== selectedDepto) {
            return false;
        }
        // Grado de Dificultad Filter
        if (selectedDif && row.item.dificultad.trim() !== selectedDif) {
            return false;
        }
        // Popularidad Filter (Multi-select)
        if (selectedPops.length > 0) {
            if (!selectedPops.includes(row.item.popularidad)) {
                return false;
            }
        }
        return true;
    });

    // Map rows to results and store scores
    currentResults = itemsWithScores.map(row => {
        const item = row.item;
        item.distance = null;
        item.searchScore = row.score;
        return item;
    });

    // Clear distances from previous search
    currentResults.forEach(item => item.distance = null);

    // Sort by search score similarity or by proximity
    if (cleanQuery) {
        // Sort by search similarity score descending (highest score first)
        currentResults.sort((a, b) => b.searchScore - a.searchScore);
    } else if (!selectedDepto && emptySearchCriterion === 'near') {
        if (userLocation) {
            currentResults.forEach(item => {
                if (item.lat !== null && item.lng !== null) {
                    item.distance = calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng);
                }
            });
            // Sort ascending (closest first), placing nulls at the end
            currentResults.sort((a, b) => {
                if (a.distance === null && b.distance === null) return 0;
                if (a.distance === null) return 1;
                if (b.distance === null) return -1;
                return a.distance - b.distance;
            });
        }
    }

    // Reset the only events checkbox on new search
    const onlyEventsChk = document.getElementById('only-events-checkbox');
    if (onlyEventsChk) {
        onlyEventsChk.checked = false;
    }

    renderResults();
    switchTab('resultados');
}

// Render filtered destination or event blocks
function renderResults() {
    const grid = document.getElementById('results-grid');
    grid.innerHTML = '';

    const badge = document.getElementById('results-count-badge');
    if (currentResults.length > 0) {
        badge.textContent = currentResults.length;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }

    if (currentResults.length === 0) {
        grid.innerHTML = `
            <div class="empty-results">
                <h4 data-i18n="empty_results_title">${TRANSLATIONS[currentLang].empty_results_title}</h4>
                <p data-i18n="empty_results_text">${TRANSLATIONS[currentLang].empty_results_text}</p>
            </div>
        `;
        return;
    }

    if (currentSearchMode === 'eventos') {
        renderEventResults(grid);
    } else {
        renderDestinationResults(grid);
    }
}

// Render Destinations
function renderDestinationResults(grid) {
    currentResults.forEach(item => {
        const isFav = favorites.includes(item.id);
        const isInItinerary = itinerary.some(it => it.type === 'destination' && it.id === item.id);
        
        const card = document.createElement('div');
        card.className = 'result-card';
        card.dataset.id = item.id;

        // Clean coordinates to display Map
        const mapIframeUrl = `https://maps.google.com/maps?q=${item.lat},${item.lng}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

        const distanceBadgeText = (item.distance !== undefined && item.distance !== null) 
            ? TRANSLATIONS[currentLang].distance_badge.replace('{distance}', item.distance.toFixed(1))
            : '';
        const distanceBadge = distanceBadgeText ? `<span class="distance-badge">${distanceBadgeText}</span>` : '';
        const translatedPopularity = TRANSLATIONS[currentLang].popularity_levels[item.popularidad] || item.popularidad;
        const popularityText = item.popularidad ? ` • ${TRANSLATIONS[currentLang].popularity_badge}: ${translatedPopularity}` : '';

        card.innerHTML = `
            <div class="card-details">
                <div class="card-header-row">
                    <div class="card-title-group">
                        <div class="card-title"><span translate="no" class="notranslate">${item.destino}</span> ${distanceBadge}</div>
                        <div class="card-dept"><span translate="no" class="notranslate">${item.departamento}</span>${popularityText}</div>
                    </div>
                    <div class="card-actions-top">
                        <!-- Itinerary selection checkbox -->
                        <label class="route-checkbox-container ${isInItinerary ? 'selected' : ''}">
                            <input type="checkbox" class="route-check" ${isInItinerary ? 'checked' : ''} data-id="${item.id}">
                            <span data-i18n="card_route">${TRANSLATIONS[currentLang].card_route}</span>
                        </label>
                        <!-- Favorite star toggle -->
                        <button class="fav-toggle ${isFav ? 'active' : ''}" data-id="${item.id}" title="${isFav ? (currentLang === 'es' ? 'Quitar de favoritos' : 'Remove from favorites') : (currentLang === 'es' ? 'Agregar a favoritos' : 'Add to favorites')}">
                            ★
                        </button>
                    </div>
                </div>

                <div class="info-block">
                    <div class="info-item">
                        <span class="info-label" data-i18n="card_features">${TRANSLATIONS[currentLang].card_features}</span>
                        <span class="info-text features">${currentLang === 'en' && item.caracteristicas_en ? item.caracteristicas_en : item.caracteristicas}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label" data-i18n="card_accommodation">${TRANSLATIONS[currentLang].card_accommodation}</span>
                        <span class="info-text notranslate" translate="no">${parsePlaces(item.alojamiento, item.destino, item.departamento, item.id)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label" data-i18n="card_dining">${TRANSLATIONS[currentLang].card_dining}</span>
                        <span class="info-text notranslate" translate="no">${parsePlaces(item.comer, item.destino, item.departamento, item.id)}</span>
                    </div>
                    ${item.ubicacion ? `
                    <div class="info-item">
                        <span class="info-label" data-i18n="card_location">${TRANSLATIONS[currentLang].card_location}</span>
                        <span class="info-text notranslate" translate="no">${item.ubicacion}</span>
                    </div>` : ''}
                    ${item.contacto ? `
                    <div class="info-item">
                        <span class="info-label" data-i18n="card_contact">${TRANSLATIONS[currentLang].card_contact}</span>
                        <span class="info-text">${item.contacto}</span>
                    </div>` : ''}
                    ${item.web ? `
                    <div class="info-item">
                        <span class="info-label" data-i18n="card_website">${TRANSLATIONS[currentLang].card_website}</span>
                        <span class="info-text"><a href="${item.web.startsWith('http') ? item.web : 'http://' + item.web}" target="_blank">${item.web} ↗</a></span>
                    </div>` : ''}
                    <div class="report-link-container" style="margin-top: 12px; font-size: 0.85rem; border-top: 1px dashed var(--border); padding-top: 8px;">
                        <span class="info-text" style="color: var(--text-muted);">
                            ${currentLang === 'es' 
                                ? `¿Algún dato incorrecto? <a href="${REPORT_FORM_BASE_URL}${encodeURIComponent(item.destino)}" target="_blank" style="color: var(--primary); text-decoration: underline; font-weight: 500;">Reportar ↗</a>` 
                                : `Any incorrect data? <a href="${REPORT_FORM_BASE_URL}${encodeURIComponent(item.destino)}" target="_blank" style="color: var(--primary); text-decoration: underline; font-weight: 500;">Report ↗</a>`}
                        </span>
                    </div>
                </div>

                <!-- Action Buttons: Como Ir -->
                <div class="card-action-row" style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                    <button class="btn btn-primary btn-como-ir" data-lat="${item.lat}" data-lng="${item.lng}" data-name="${item.destino}" data-i18n="card_how_to_go" style="flex: 1; min-width: 140px;">
                        ${TRANSLATIONS[currentLang].card_how_to_go}
                    </button>
                </div>
            </div>

            <!-- Map Iframe with interactive controls -->
            <div class="card-map-wrapper">
                <div class="map-container" id="map-container-${item.id}">
                    <iframe src="${mapIframeUrl}" loading="lazy" allowfullscreen></iframe>
                </div>
                <div class="map-actions">
                    <!-- Reset Map Button (Hidden by default) -->
                    <button class="btn btn-secondary btn-reset-map" id="reset-map-${item.id}" onclick="resetEmbeddedMap('${item.id}', ${item.lat}, ${item.lng})" style="display: none; width: 100%;" data-i18n="card_reset_map">
                        ${TRANSLATIONS[currentLang].card_reset_map}
                    </button>
                </div>
            </div>
        `;

        // Favorite toggle
        card.querySelector('.fav-toggle').addEventListener('click', (e) => {
            toggleFavorite(item.id);
            e.currentTarget.classList.toggle('active');
        });

        // Itinerary checkbox
        const routeCheck = card.querySelector('.route-check');
        routeCheck.addEventListener('change', (e) => {
            toggleItinerary(item.id);
            const container = e.currentTarget.closest('.route-checkbox-container');
            if (e.currentTarget.checked) {
                container.classList.add('selected');
            } else {
                container.classList.remove('selected');
            }
        });

        // Geolocation "Cómo ir" button
        card.querySelector('.btn-como-ir').addEventListener('click', () => {
            getDirections(item.lat, item.lng, item.destino, item.departamento);
        });

        grid.appendChild(card);
    });
}

// Render Events
function renderEventResults(grid) {
    currentResults.forEach(ev => {
        const isSaved = itinerary.some(it => it.type === 'event' && it.id === ev.id);
        
        // Find destination coordinates to render map fallback
        const dest = appDestinos.find(d => removeAccents(d.destino) === removeAccents(ev.destino));
        const hasCoords = dest && dest.lat !== null && dest.lng !== null;
        
        const queryText = ev.local ? `${ev.local}, ${ev.destino}, ${ev.departamento}, Uruguay` : '';
        const mapIframeUrl = ev.local 
            ? `https://maps.google.com/maps?q=${encodeURIComponent(queryText)}&t=&z=14&ie=UTF8&iwloc=&output=embed`
            : (hasCoords ? `https://maps.google.com/maps?q=${dest.lat},${dest.lng}&t=&z=14&ie=UTF8&iwloc=&output=embed` : '');
        
        const showMap = ev.local || hasCoords;

        const badgeClass = `tipo-${ev.tipo.toLowerCase().replace(/ \/ /g, '-')}`;
        const typeLabel = TRANSLATIONS[currentLang].event_types[ev.tipo] || ev.tipo;
        const freeBadge = ev.gratis 
            ? `<span class="event-badge free">Gratis</span>` 
            : `<span class="event-badge paid">${currentLang === 'es' ? 'Pago' : 'Paid'}</span>`;

        const distanceBadgeText = (ev.distance !== undefined && ev.distance !== null) 
            ? TRANSLATIONS[currentLang].distance_badge.replace('{distance}', ev.distance.toFixed(1))
            : '';
        const distanceBadge = distanceBadgeText ? `<span class="distance-badge">${distanceBadgeText}</span>` : '';

        const ticketBtn = ev.ticketUrl 
            ? `<a href="${ev.ticketUrl}" target="_blank" class="btn-event-action btn-event-ticket">🎟️ ${TRANSLATIONS[currentLang].btn_buy_tickets}</a>`
            : '';

        const card = document.createElement('div');
        card.className = 'result-card event-result-card';
        card.dataset.id = ev.id;

        card.innerHTML = `
            <div class="card-details">
                <div class="card-header-row">
                    <div class="card-title-group">
                        <div class="card-title"><span translate="no" class="notranslate">${ev.titulo}</span> ${distanceBadge}</div>
                        <div class="card-dept">
                            <span class="event-badge ${badgeClass}">${typeLabel}</span> 
                            ${freeBadge} • <span translate="no" class="notranslate">${ev.destino}, ${ev.departamento}</span>
                        </div>
                    </div>
                    <div class="card-actions-top">
                        <!-- Itinerary selection checkbox -->
                        <label class="route-checkbox-container ${isSaved ? 'selected' : ''}">
                            <input type="checkbox" class="route-check" ${isSaved ? 'checked' : ''} data-id="${ev.id}">
                            <span data-i18n="card_route">${TRANSLATIONS[currentLang].card_route}</span>
                        </label>
                    </div>
                </div>

                <div class="info-block" style="margin-top: 10px;">
                    <div class="event-meta-line" style="font-weight: 500;">
                        📅 <span class="event-date">${ev.fecha}</span>
                    </div>
                    ${ev.local ? `
                    <div class="event-meta-line venue">
                        📍 <span translate="no" class="notranslate">${ev.local}</span>
                    </div>` : ''}
                    <div class="event-desc-text" style="margin-top: 5px;">
                        ${ev.descripcion}
                    </div>
                </div>

                <!-- Action Buttons: Como Ir -->
                <div class="card-action-row" style="display: flex; gap: 10px; margin-top: 15px;">
                    ${showMap ? `
                    <button class="btn btn-primary btn-como-ir" style="flex: 1;">
                        ${TRANSLATIONS[currentLang].card_how_to_go}
                    </button>` : ''}
                    ${ticketBtn}
                </div>
            </div>

            <!-- Map Iframe -->
            ${showMap ? `
            <div class="card-map-wrapper">
                <div class="map-container" id="map-container-event-${ev.id}">
                    <iframe src="${mapIframeUrl}" loading="lazy" allowfullscreen></iframe>
                </div>
            </div>` : ''}
        `;

        // Itinerary checkbox
        const routeCheck = card.querySelector('.route-check');
        routeCheck.addEventListener('change', (e) => {
            toggleEventItinerary(ev.id);
            const container = e.currentTarget.closest('.route-checkbox-container');
            if (e.currentTarget.checked) {
                container.classList.add('selected');
            } else {
                container.classList.remove('selected');
            }
        });

        // Geolocation "Cómo ir" button
        if (showMap) {
            card.querySelector('.btn-como-ir').addEventListener('click', () => {
                if (ev.local) {
                    getDirectionsToLocal(queryText, ev.departamento);
                } else if (hasCoords) {
                    getDirections(dest.lat, dest.lng, ev.titulo, ev.departamento);
                }
            });
        }

        grid.appendChild(card);
    });
}

// Toggle Favorites
function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    if (index === -1) {
        favorites.push(id);
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('uruexplorer_favorites', JSON.stringify(favorites));
    renderFavorites();
    
    // Sync star state in Results View if active
    const resultsStar = document.querySelector(`.results-grid .fav-toggle[data-id="${id}"]`);
    if (resultsStar) {
        if (favorites.includes(id)) {
            resultsStar.classList.add('active');
        } else {
            resultsStar.classList.remove('active');
        }
    }
}

// Render default Favorites Shelf
function renderFavorites() {
    const grid = document.getElementById('favorites-grid');
    grid.innerHTML = '';

    const favDestinos = appDestinos.filter(item => favorites.includes(item.id));

    if (favDestinos.length === 0) {
        grid.innerHTML = `
            <div class="no-favorites" data-i18n="no_favorites">${TRANSLATIONS[currentLang].no_favorites}</div>
        `;
        return;
    }

    favDestinos.forEach(item => {
        const card = document.createElement('div');
        card.className = 'favorite-mini-card';
        card.innerHTML = `
            <div class="fav-info" style="cursor: pointer;">
                <div class="fav-title notranslate" translate="no">${item.destino}</div>
                <div class="fav-dept notranslate" translate="no">${item.departamento}</div>
            </div>
            <button class="btn-mini-fav" title="${currentLang === 'es' ? 'Quitar de favoritos' : 'Remove from favorites'}">★</button>
        `;

        // Click favorite info to search and show details immediately
        card.querySelector('.fav-info').addEventListener('click', () => {
            currentResults = [item];
            renderResults();
            switchTab('resultados');
        });

        // Remove from favorites directly
        card.querySelector('.btn-mini-fav').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(item.id);
        });

        grid.appendChild(card);
    });
}

// Toggle Itinerary
function toggleItinerary(id) {
    const index = itinerary.findIndex(item => item.type === 'destination' && item.id === id);
    if (index === -1) {
        itinerary.push({ type: 'destination', id: id });
    } else {
        itinerary.splice(index, 1);
    }
    localStorage.setItem('uruexplorer_itinerary', JSON.stringify(itinerary));
    updateItineraryUI();
}

// Toggle Event Itinerary
function toggleEventItinerary(id) {
    const index = itinerary.findIndex(item => item.type === 'event' && item.id === id);
    if (index === -1) {
        itinerary.push({ type: 'event', id: id });
    } else {
        itinerary.splice(index, 1);
    }
    localStorage.setItem('uruexplorer_itinerary', JSON.stringify(itinerary));
    updateItineraryUI();
}

// Clear itinerary
function clearItinerary() {
    itinerary = [];
    localStorage.setItem('uruexplorer_itinerary', JSON.stringify(itinerary));
    
    // Uncheck all active result cards
    document.querySelectorAll('.route-check').forEach(chk => {
        chk.checked = false;
        chk.closest('.route-checkbox-container').classList.remove('selected');
    });
    
    updateItineraryUI();
    renderItineraryTab();
}

// Update sticky itinerary bar and tab badges
function updateItineraryUI() {
    const count = itinerary.length;
    const bar = document.getElementById('itinerary-bar');
    const barCountBadge = document.getElementById('itinerary-bar-count');
    const tabBadge = document.getElementById('itinerary-tab-badge');
    const barList = document.getElementById('itinerary-bar-list');

    // Update numbers
    barCountBadge.textContent = count;
    
    // Update count label text translation
    const labelEl = document.getElementById('itinerary-bar-count-label');
    if (labelEl) {
        labelEl.innerHTML = TRANSLATIONS[currentLang].itinerary_bar_count.replace('{count}', `<span id="itinerary-bar-count">${count}</span>`);
    }

    const btnClearRes = document.getElementById('btn-limpiar-itinerario-resultados');
    if (count > 0) {
        tabBadge.textContent = count;
        tabBadge.style.display = 'inline-block';
        
        // Populate text names
        const names = itinerary.map(step => {
            if (step.type === 'destination') {
                const dest = appDestinos.find(d => d.id === step.id);
                return dest ? dest.destino : '';
            } else if (step.type === 'event') {
                const ev = appEventos.find(e => e.id === step.id);
                return ev ? ev.titulo : '';
            }
            return '';
        }).filter(n => n !== '').join(', ');
        
        barList.innerHTML = `<span translate="no" class="notranslate">${names}</span>`;

        // Show sticky bar
        bar.classList.add('visible');
        if (btnClearRes) btnClearRes.style.display = 'block';
    } else {
        tabBadge.style.display = 'none';
        bar.classList.remove('visible');
        if (btnClearRes) btnClearRes.style.display = 'none';
        barList.textContent = TRANSLATIONS[currentLang].itinerary_bar_none;
    }
}

// Render "Mi Itinerario" tab details
function renderItineraryTab() {
    const stepsList = document.getElementById('itinerary-steps-list');
    stepsList.innerHTML = '';

    if (itinerary.length === 0) {
        stepsList.innerHTML = `
            <div class="no-favorites" style="padding: 50px;" data-i18n="empty_itinerary_text">
                ${TRANSLATIONS[currentLang].empty_itinerary_text}
            </div>
        `;
        document.getElementById('btn-trazar-itinerario-tab').style.display = 'none';
        document.getElementById('itinerary-events-section').style.display = 'none';
        
        const saveForm = document.getElementById('save-itinerary-form');
        if (saveForm) saveForm.style.display = 'none';
        
        renderSavedItinerariesHistory();
        return;
    }

    document.getElementById('btn-trazar-itinerario-tab').style.display = 'block';

    itinerary.forEach((step, index) => {
        const stepCard = document.createElement('div');
        stepCard.className = 'itinerary-step-card';
        
        if (step.type === 'destination') {
            const item = appDestinos.find(d => d.id === step.id);
            if (!item) return;
            stepCard.innerHTML = `
                <div class="step-num">${index + 1}</div>
                <div class="step-details">
                    <div class="step-name notranslate" translate="no">${item.destino}</div>
                    <div class="step-dept notranslate" translate="no">${item.departamento}</div>
                </div>
                <button class="btn-remove-step" data-type="destination" data-id="${item.id}" title="${currentLang === 'es' ? 'Eliminar del recorrido' : 'Remove from route'}">✕</button>
            `;
        } else if (step.type === 'event') {
            const ev = appEventos.find(e => e.id === step.id);
            if (!ev) return;
            const badgeClass = `tipo-${ev.tipo.toLowerCase().replace(/ \/ /g, '-')}`;
            const typeLabel = TRANSLATIONS[currentLang].event_types[ev.tipo] || ev.tipo;
            stepCard.innerHTML = `
                <div class="step-num" style="background: var(--primary-hover); color: var(--bg-main);">${index + 1}</div>
                <div class="step-details">
                    <div class="step-name">${ev.titulo}</div>
                    <div class="step-dept"><span class="event-badge ${badgeClass}" style="display:inline-block; margin-right:5px; padding: 1px 4px; font-size:0.6rem;">${typeLabel}</span> ${ev.destino} (${ev.fecha})${ev.local ? ` • 📍 ${ev.local}` : ''}</div>
                </div>
                <button class="btn-remove-step" data-type="event" data-id="${ev.id}" title="${currentLang === 'es' ? 'Eliminar del recorrido' : 'Remove from route'}">✕</button>
            `;
        }

        stepCard.querySelector('.btn-remove-step').addEventListener('click', (e) => {
            const type = e.currentTarget.getAttribute('data-type');
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            
            if (type === 'destination') {
                toggleItinerary(id);
                // Uncheck in results
                const chk = document.querySelector(`.results-grid .route-check[data-id="${id}"]:not(.event-result-card .route-check)`);
                if (chk) {
                    chk.checked = false;
                    chk.closest('.route-checkbox-container').classList.remove('selected');
                }
            } else if (type === 'event') {
                toggleEventItinerary(id);
                const chk = document.querySelector(`.results-grid .event-result-card .route-check[data-id="${id}"]`);
                if (chk) {
                    chk.checked = false;
                    chk.closest('.route-checkbox-container').classList.remove('selected');
                }
            }
            renderItineraryTab();
        });

        stepsList.appendChild(stepCard);
    });

    // Hide old separate itinerary events section
    document.getElementById('itinerary-events-section').style.display = 'none';

    // Toggle save itinerary form
    const saveForm = document.getElementById('save-itinerary-form');
    if (saveForm) {
        saveForm.style.display = 'block';
    }

    renderSavedItinerariesHistory();
}

// Directions ("Cómo ir") for a single destination
function getDirections(lat, lng, name, departamento) {
    let url = 'https://www.google.com/maps/dir/?api=1&';
    
    if (userLocation) {
        url += `origin=${userLocation.lat},${userLocation.lng}&`;
    }
    
    // Preguntar si desea agregar estaciones de recarga eléctrica
    const includeEV = confirm(
        currentLang === 'es' 
            ? '¿Deseas incluir estaciones de recarga para vehículos eléctricos (UTE) en tu ruta?' 
            : 'Do you want to include electric vehicle charging stations (UTE) along your route?'
    );

    const CHARGERS_MAP = {
        'montevideo': 'Estación de carga de vehículos eléctricos, Montevideo, Uruguay',
        'canelones': 'Estación de carga de vehículos eléctricos, Canelones, Uruguay',
        'maldonado': 'Estación de carga de vehículos eléctricos, Punta del Este, Uruguay',
        'rocha': 'Estación de carga de vehículos eléctricos, Rocha, Uruguay',
        'colonia': 'Estación de carga de vehículos eléctricos, Colonia del Sacramento, Uruguay',
        'san josé': 'Estación de carga de vehículos eléctricos, San José, Uruguay',
        'san jose': 'Estación de carga de vehículos eléctricos, San José, Uruguay',
        'soriano': 'Estación de carga de vehículos eléctricos, Mercedes, Uruguay',
        'río negro': 'Estación de carga de vehículos eléctricos, Fray Bentos, Uruguay',
        'rio negro': 'Estación de carga de vehículos eléctricos, Fray Bentos, Uruguay',
        'paysandú': 'Estación de carga de vehículos eléctricos, Paysandú, Uruguay',
        'paysandu': 'Estación de carga de vehículos eléctricos, Paysandú, Uruguay',
        'salto': 'Estación de carga de vehículos eléctricos, Salto, Uruguay',
        'artigas': 'Estación de carga de vehículos eléctricos, Artigas, Uruguay',
        'rivera': 'Estación de carga de vehículos eléctricos, Rivera, Uruguay',
        'tacuarembó': 'Estación de carga de vehículos eléctricos, Tacuarembó, Uruguay',
        'tacuarembo': 'Estación de carga de vehículos eléctricos, Tacuarembó, Uruguay',
        'cerro largo': 'Estación de carga de vehículos eléctricos, Melo, Uruguay',
        'treinta y tres': 'Estación de carga de vehículos eléctricos, Treinta y Tres, Uruguay',
        'lavalleja': 'Estación de carga de vehículos eléctricos, Minas, Uruguay',
        'florida': 'Estación de carga de vehículos eléctricos, Florida, Uruguay',
        'flores': 'Estación de carga de vehículos eléctricos, Trinidad, Uruguay',
        'durazno': 'Estación de carga de vehículos eléctricos, Durazno, Uruguay'
    };

    url += `destination=${lat},${lng}`;

    if (includeEV && departamento) {
        const deptoKey = departamento.trim().toLowerCase();
        if (CHARGERS_MAP[deptoKey]) {
            url += `&waypoints=${encodeURIComponent(CHARGERS_MAP[deptoKey])}`;
        }
    }
    
    window.open(url, '_blank');
}

// Directions ("Cómo ir") to a specific venue/local
function getDirectionsToLocal(query, departamento) {
    let url = 'https://www.google.com/maps/dir/?api=1&';
    
    if (userLocation) {
        url += `origin=${userLocation.lat},${userLocation.lng}&`;
    }
    
    // Preguntar si desea agregar estaciones de recarga eléctrica
    const includeEV = confirm(
        currentLang === 'es' 
            ? '¿Deseas incluir estaciones de recarga para vehículos eléctricos (UTE) en tu ruta?' 
            : 'Do you want to include electric vehicle charging stations (UTE) along your route?'
    );

    const CHARGERS_MAP = {
        'montevideo': 'Estación de carga de vehículos eléctricos, Montevideo, Uruguay',
        'canelones': 'Estación de carga de vehículos eléctricos, Canelones, Uruguay',
        'maldonado': 'Estación de carga de vehículos eléctricos, Punta del Este, Uruguay',
        'rocha': 'Estación de carga de vehículos eléctricos, Rocha, Uruguay',
        'colonia': 'Estación de carga de vehículos eléctricos, Colonia del Sacramento, Uruguay',
        'san josé': 'Estación de carga de vehículos eléctricos, San José, Uruguay',
        'san jose': 'Estación de carga de vehículos eléctricos, San José, Uruguay',
        'soriano': 'Estación de carga de vehículos eléctricos, Mercedes, Uruguay',
        'río negro': 'Estación de carga de vehículos eléctricos, Fray Bentos, Uruguay',
        'rio negro': 'Estación de carga de vehículos eléctricos, Fray Bentos, Uruguay',
        'paysandú': 'Estación de carga de vehículos eléctricos, Paysandú, Uruguay',
        'paysandu': 'Estación de carga de vehículos eléctricos, Paysandú, Uruguay',
        'salto': 'Estación de carga de vehículos eléctricos, Salto, Uruguay',
        'artigas': 'Estación de carga de vehículos eléctricos, Artigas, Uruguay',
        'rivera': 'Estación de carga de vehículos eléctricos, Rivera, Uruguay',
        'tacuarembó': 'Estación de carga de vehículos eléctricos, Tacuarembó, Uruguay',
        'tacuarembo': 'Estación de carga de vehículos eléctricos, Tacuarembó, Uruguay',
        'cerro largo': 'Estación de carga de vehículos eléctricos, Melo, Uruguay',
        'treinta y tres': 'Estación de carga de vehículos eléctricos, Treinta y Tres, Uruguay',
        'lavalleja': 'Estación de carga de vehículos eléctricos, Minas, Uruguay',
        'florida': 'Estación de carga de vehículos eléctricos, Florida, Uruguay',
        'flores': 'Estación de carga de vehículos eléctricos, Trinidad, Uruguay',
        'durazno': 'Estación de carga de vehículos eléctricos, Durazno, Uruguay'
    };

    url += `destination=${encodeURIComponent(query)}`;

    if (includeEV && departamento) {
        const deptoKey = departamento.trim().toLowerCase();
        if (CHARGERS_MAP[deptoKey]) {
            url += `&waypoints=${encodeURIComponent(CHARGERS_MAP[deptoKey])}`;
        }
    }
    
    window.open(url, '_blank');
}

// Generate multi-point route on Google Maps ("Itinerario")
function triggerItineraryRoute() {
    if (itinerary.length === 0) return;

    // Preguntar si desea agregar estaciones de recarga eléctrica
    const includeEV = confirm(
        currentLang === 'es' 
            ? '¿Deseas incluir estaciones de recarga para vehículos eléctricos (UTE) en tu ruta?' 
            : 'Do you want to include electric vehicle charging stations (UTE) along your route?'
    );

    const CHARGERS_MAP = {
        'montevideo': 'Estación de carga de vehículos eléctricos, Montevideo, Uruguay',
        'canelones': 'Estación de carga de vehículos eléctricos, Canelones, Uruguay',
        'maldonado': 'Estación de carga de vehículos eléctricos, Punta del Este, Uruguay',
        'rocha': 'Estación de carga de vehículos eléctricos, Rocha, Uruguay',
        'colonia': 'Estación de carga de vehículos eléctricos, Colonia del Sacramento, Uruguay',
        'san josé': 'Estación de carga de vehículos eléctricos, San José, Uruguay',
        'san jose': 'Estación de carga de vehículos eléctricos, San José, Uruguay',
        'soriano': 'Estación de carga de vehículos eléctricos, Mercedes, Uruguay',
        'río negro': 'Estación de carga de vehículos eléctricos, Fray Bentos, Uruguay',
        'rio negro': 'Estación de carga de vehículos eléctricos, Fray Bentos, Uruguay',
        'paysandú': 'Estación de carga de vehículos eléctricos, Paysandú, Uruguay',
        'paysandu': 'Estación de carga de vehículos eléctricos, Paysandú, Uruguay',
        'salto': 'Estación de carga de vehículos eléctricos, Salto, Uruguay',
        'artigas': 'Estación de carga de vehículos eléctricos, Artigas, Uruguay',
        'rivera': 'Estación de carga de vehículos eléctricos, Rivera, Uruguay',
        'tacuarembó': 'Estación de carga de vehículos eléctricos, Tacuarembó, Uruguay',
        'tacuarembo': 'Estación de carga de vehículos eléctricos, Tacuarembó, Uruguay',
        'cerro largo': 'Estación de carga de vehículos eléctricos, Melo, Uruguay',
        'treinta y tres': 'Estación de carga de vehículos eléctricos, Treinta y Tres, Uruguay',
        'lavalleja': 'Estación de carga de vehículos eléctricos, Minas, Uruguay',
        'florida': 'Estación de carga de vehículos eléctricos, Florida, Uruguay',
        'flores': 'Estación de carga de vehículos eléctricos, Trinidad, Uruguay',
        'durazno': 'Estación de carga de vehículos eléctricos, Durazno, Uruguay'
    };

    const points = [];
    const addedChargerDepts = new Set();

    itinerary.forEach(step => {
        let depto = '';
        if (step.type === 'destination') {
            const dest = appDestinos.find(d => d.id === step.id);
            if (dest && dest.lat !== null && dest.lng !== null) {
                points.push(`${dest.lat},${dest.lng}`);
                depto = dest.departamento;
            }
        } else if (step.type === 'event') {
            const ev = appEventos.find(e => e.id === step.id);
            if (ev) {
                depto = ev.departamento;
                if (ev.local) {
                    points.push(`${ev.local}, ${ev.destino}, ${ev.departamento}, Uruguay`);
                } else {
                    const dest = appDestinos.find(d => removeAccents(d.destino) === removeAccents(ev.destino));
                    if (dest && dest.lat !== null && dest.lng !== null) {
                        points.push(`${dest.lat},${dest.lng}`);
                    } else {
                        points.push(`${ev.destino}, Uruguay`);
                    }
                }
            }
        }

        // Agregar cargador de UTE si se solicitó y aún no se agregó para este departamento
        if (includeEV && depto) {
            const deptoKey = depto.trim().toLowerCase();
            if (CHARGERS_MAP[deptoKey] && !addedChargerDepts.has(deptoKey)) {
                points.push(CHARGERS_MAP[deptoKey]);
                addedChargerDepts.add(deptoKey);
            }
        }
    });

    if (points.length === 0) return;

    let url = 'https://www.google.com/maps/dir/?api=1&';
    if (userLocation) {
        url += `origin=${userLocation.lat},${userLocation.lng}&`;
    }

    const finalDest = points[points.length - 1];
    url += `destination=${encodeURIComponent(finalDest)}`;

    if (points.length > 1) {
        const waypoints = points.slice(0, -1)
            .map(p => encodeURIComponent(p))
            .join('|');
        url += `&waypoints=${waypoints}`;
    }

    window.open(url, '_blank');
}

// Toggle card events list expansion
function toggleCardEvents(cardId) {
    const el = document.getElementById(`events-section-${cardId}`);
    const btn = document.querySelector(`.result-card[data-id="${cardId}"] .btn-toggle-events`);
    if (el) {
        const isExpanded = el.classList.toggle('expanded');
        if (btn) {
            btn.classList.toggle('active', isExpanded);
        }
        if (isExpanded) {
            // Render events with the currently selected filter (default 'Todos')
            const filter = cardEventFilters[cardId] || 'Todos';
            updateCardEventsList(cardId, filter);
        }
    }
}
window.toggleCardEvents = toggleCardEvents;

// Filter events of a card
function filterCardEvents(event, cardId, tipo) {
    event.stopPropagation(); // Avoid triggering header click
    
    cardEventFilters[cardId] = tipo;
    
    // Update active class on chips
    const section = document.getElementById(`events-section-${cardId}`);
    if (section) {
        section.querySelectorAll('.event-filter-chip').forEach(chip => {
            if (chip.getAttribute('data-type') === tipo) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
    }
    
    updateCardEventsList(cardId, tipo);
}
window.filterCardEvents = filterCardEvents;

// Helper to render filtered event cards list inside a destination card
function updateCardEventsList(cardId, filter) {
    const listEl = document.getElementById(`events-list-${cardId}`);
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    // Find the destination item
    const destItem = appDestinos.find(d => d.id == cardId);
    if (!destItem) return;
    
    // Get matched events
    let events = appEventos.filter(ev => isEventMatch(ev, destItem));
    
    // Apply type filter if not 'Todos'
    if (filter !== 'Todos') {
        events = events.filter(ev => ev.tipo === filter);
    }
    
    if (events.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; padding: 15px; color: var(--text-muted); font-size: 0.8rem;">No hay eventos en esta categoría.</div>`;
        return;
    }
    
    events.forEach(ev => {
        const isSaved = savedEvents.includes(ev.id);
        const typeLabel = TRANSLATIONS[currentLang].event_types[ev.tipo] || ev.tipo;
        
        const evCard = document.createElement('div');
        evCard.className = 'event-card';
        
        const badgeClass = `tipo-${ev.tipo.toLowerCase().replace(/ \/ /g, '-')}`;
        const freeBadge = ev.gratis 
            ? `<span class="event-badge free">Gratis</span>` 
            : `<span class="event-badge paid">${currentLang === 'es' ? 'Pago' : 'Paid'}</span>`;
            
        const ticketBtn = ev.ticketUrl 
            ? `<a href="${ev.ticketUrl}" target="_blank" class="btn-event-action btn-event-ticket">🎟️ ${TRANSLATIONS[currentLang].btn_buy_tickets}</a>`
            : '';
            
        evCard.innerHTML = `
            <div class="event-meta">
                <div class="event-type-row">
                    <span class="event-badge ${badgeClass}">${typeLabel}</span>
                    ${freeBadge}
                </div>
                <span class="event-date">${ev.fecha}</span>
            </div>
            <div class="event-title-text">${ev.titulo}</div>
            ${ev.local ? `<div class="event-local" style="font-size: 0.8rem; color: var(--primary); display: flex; align-items: center; gap: 4px; font-weight: 500; margin-top: -2px; margin-bottom: 2px;">📍 <span translate="no" class="notranslate">${ev.local}</span></div>` : ''}
            <div class="event-desc">${ev.descripcion}</div>
            <div class="event-actions">
                ${ticketBtn}
                <button class="btn-event-action btn-event-save ${isSaved ? 'saved' : ''}" onclick="handleSaveEventClick(event, ${ev.id}, '${cardId}')">
                    ${isSaved ? TRANSLATIONS[currentLang].btn_unsave_event : TRANSLATIONS[currentLang].btn_save_event}
                </button>
            </div>
        `;
        
        listEl.appendChild(evCard);
    });
}
window.updateCardEventsList = updateCardEventsList;

// Handle click to save event
function handleSaveEventClick(event, eventId, cardId) {
    event.stopPropagation();
    toggleSavedEvent(eventId);
    
    // Re-render the events list for this card to update save state
    const filter = cardEventFilters[cardId] || 'Todos';
    updateCardEventsList(cardId, filter);
}
window.handleSaveEventClick = handleSaveEventClick;

// Toggle saved state of event
function toggleSavedEvent(id) {
    const idx = savedEvents.indexOf(id);
    if (idx === -1) {
        savedEvents.push(id);
    } else {
        savedEvents.splice(idx, 1);
    }
    localStorage.setItem('uruexplorer_saved_events', JSON.stringify(savedEvents));
    
    // Sync with itinerary UI
    updateItineraryUI();
    renderItineraryTab();
}
window.toggleSavedEvent = toggleSavedEvent;

// Save the current active itinerary under a custom name
function saveCurrentItinerary() {
    const input = document.getElementById('itinerary-name-input');
    if (!input) return;
    
    const name = input.value.trim();
    if (!name) {
        alert(TRANSLATIONS[currentLang].msg_itinerary_enter_name);
        return;
    }
    
    if (itinerary.length === 0) {
        alert(TRANSLATIONS[currentLang].msg_itinerary_empty);
        return;
    }
    
    const newItineraryObj = {
        name: name,
        destinations: [...itinerary],
        date: new Date().toISOString()
    };
    
    savedItinerariesList.push(newItineraryObj);
    localStorage.setItem('uruexplorer_saved_itineraries_list', JSON.stringify(savedItinerariesList));
    
    input.value = '';
    alert(TRANSLATIONS[currentLang].msg_itinerary_saved);
    
    renderSavedItinerariesHistory();
}
window.saveCurrentItinerary = saveCurrentItinerary;

// Load a saved itinerary from history into the workspace
function loadSavedItinerary(index) {
    const itObj = savedItinerariesList[index];
    if (!itObj) return;
    
    if (itObj.destinations && itObj.destinations.length > 0 && typeof itObj.destinations[0] === 'number') {
        itinerary = itObj.destinations.map(id => ({ type: 'destination', id: id }));
        if (itObj.events) {
            itObj.events.forEach(id => {
                itinerary.push({ type: 'event', id: id });
            });
        }
    } else {
        itinerary = [...itObj.destinations];
    }
    
    localStorage.setItem('uruexplorer_itinerary', JSON.stringify(itinerary));
    
    // Sync all checkboxes in search results view
    document.querySelectorAll('.results-grid .route-check').forEach(chk => {
        const id = parseInt(chk.getAttribute('data-id'));
        const isEvent = chk.closest('.event-result-card') !== null;
        
        let isIn = false;
        if (isEvent) {
            isIn = itinerary.some(item => item.type === 'event' && item.id === id);
        } else {
            isIn = itinerary.some(item => item.type === 'destination' && item.id === id);
        }
        
        if (isIn) {
            chk.checked = true;
            chk.closest('.route-checkbox-container').classList.add('selected');
        } else {
            chk.checked = false;
            chk.closest('.route-checkbox-container').classList.remove('selected');
        }
    });
    
    updateItineraryUI();
    renderItineraryTab();
    switchTab('itinerary');
}
window.loadSavedItinerary = loadSavedItinerary;

// Delete a saved itinerary from history
function deleteSavedItinerary(index) {
    savedItinerariesList.splice(index, 1);
    localStorage.setItem('uruexplorer_saved_itineraries_list', JSON.stringify(savedItinerariesList));
    renderSavedItinerariesHistory();
}
window.deleteSavedItinerary = deleteSavedItinerary;

// Render history list of saved itineraries
function renderSavedItinerariesHistory() {
    const listEl = document.getElementById('saved-itineraries-list');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    if (savedItinerariesList.length === 0) {
        listEl.innerHTML = `<div class="no-saved-itineraries" data-i18n="no_saved_itineraries">${TRANSLATIONS[currentLang].no_saved_itineraries}</div>`;
        return;
    }
    
    savedItinerariesList.forEach((it, index) => {
        const card = document.createElement('div');
        card.className = 'saved-itinerary-card';
        
        const dateStr = new Date(it.date).toLocaleDateString(currentLang === 'es' ? 'es-UY' : 'en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        let destCount = 0;
        let evCount = 0;
        
        if (it.destinations && it.destinations.length > 0) {
            if (typeof it.destinations[0] === 'number') {
                destCount = it.destinations.length;
                evCount = it.events ? it.events.length : 0;
            } else {
                it.destinations.forEach(step => {
                    if (step.type === 'destination') destCount++;
                    else if (step.type === 'event') evCount++;
                });
            }
        }
        
        card.innerHTML = `
            <div class="saved-itinerary-info">
                <div class="saved-itinerary-title">${it.name}</div>
                <div class="saved-itinerary-meta">
                    <span>📅 ${dateStr}</span>
                    <span>📍 ${destCount} ${currentLang === 'es' ? 'destinos' : 'destinations'}</span>
                    <span>🎭 ${evCount} ${currentLang === 'es' ? 'eventos' : 'events'}</span>
                </div>
            </div>
            <div class="saved-itinerary-actions">
                <button class="btn btn-secondary" onclick="loadSavedItinerary(${index})" data-i18n="btn_load">${TRANSLATIONS[currentLang].btn_load}</button>
                <button class="btn btn-secondary" onclick="deleteSavedItinerary(${index})" style="border-color:#ff3333; color:#ff3333;" data-i18n="btn_delete">${TRANSLATIONS[currentLang].btn_delete}</button>
            </div>
        `;
        listEl.appendChild(card);
    });
}
window.renderSavedItinerariesHistory = renderSavedItinerariesHistory;

// Populate event search filters
function initEventFilters() {
    const deptoSelect = document.getElementById('filter-event-departamento');
    const tipoSelect = document.getElementById('filter-event-tipo');
    if (!deptoSelect || !tipoSelect) return;

    deptoSelect.innerHTML = '';
    tipoSelect.innerHTML = '';

    const optDepto = document.createElement('option');
    optDepto.value = "";
    optDepto.setAttribute('data-i18n', 'opt_todos_deptos');
    optDepto.textContent = TRANSLATIONS[currentLang].opt_todos_deptos;
    deptoSelect.appendChild(optDepto);

    const optTipo = document.createElement('option');
    optTipo.value = "";
    optTipo.setAttribute('data-i18n', 'opt_todos_tipos');
    optTipo.textContent = TRANSLATIONS[currentLang].opt_todos_tipos || "Todos los tipos";
    tipoSelect.appendChild(optTipo);

    const departamentos = new Set();
    const tipos = new Set();

    appEventos.forEach(item => {
        if (item.departamento) departamentos.add(item.departamento.trim());
        if (item.tipo) tipos.add(item.tipo.trim());
    });

    Array.from(departamentos).sort().forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        deptoSelect.appendChild(option);
    });

    Array.from(tipos).sort().forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = TRANSLATIONS[currentLang].event_types[tipo] || tipo;
        tipoSelect.appendChild(option);
    });
}

// Convert Spanish text date to standard Date object range
function parseSpanishDate(dateStr) {
    if (!dateStr) return { start: null, end: null };
    dateStr = dateStr.toLowerCase().trim();
    let year = 2026;
    
    const yearMatch = dateStr.match(/\b(202\d)\b/);
    if (yearMatch) {
        year = parseInt(yearMatch[1]);
    }
    
    dateStr = dateStr.replace(/^(estreno|diario durante temporada|todos los sábados de|fines de semana de|todos los domingos de tarde|todos los domingos|jueves y sábados de noche|semana de turismo|octubre de cada año|octubre)\s*:\s*/, '');
    
    const MONTHS = {
        'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
        'julio': 7, 'agosto': 8, 'septiembre': 9, 'setiembre': 9, 'octubre': 10,
        'noviembre': 11, 'diciembre': 12
    };
    
    let foundMonths = [];
    for (let monthName in MONTHS) {
        let regex = new RegExp('\\b' + monthName + '\\b', 'g');
        let match;
        while ((match = regex.exec(dateStr)) !== null) {
            foundMonths.push({ index: match.index, name: monthName, num: MONTHS[monthName] });
        }
    }
    foundMonths.sort((a, b) => a.index - b.index);
    
    let numbers = [];
    let numRegex = /\b\d+\b/g;
    let numMatch;
    while ((numMatch = numRegex.exec(dateStr)) !== null) {
        let val = parseInt(numMatch[0]);
        if (val !== year) {
            numbers.push(val);
        }
    }
    
    const pad = (n) => String(n).padStart(2, '0');
    
    // Case 1: "hasta el"
    if (dateStr.includes("hasta el") && foundMonths.length === 1 && numbers.length === 1) {
        let mNum = foundMonths[0].num;
        let d = numbers[0];
        return {
            start: new Date(`${year}-${pad(mNum)}-01`),
            end: new Date(`${year}-${pad(mNum)}-${pad(d)}`)
        };
    }
    
    // Case 2: Two different months
    if (foundMonths.length >= 2 && numbers.length >= 2) {
        let m1 = foundMonths[0].num;
        let m2 = foundMonths[1].num;
        let d1 = numbers[0];
        let d2 = numbers[1];
        return {
            start: new Date(`${year}-${pad(m1)}-${pad(d1)}`),
            end: new Date(`${year}-${pad(m2)}-${pad(d2)}`)
        };
    }
    
    // Case 3: One month, multiple days
    if (foundMonths.length === 1 && numbers.length >= 1) {
        let mNum = foundMonths[0].num;
        if (numbers.length >= 2) {
            let d1 = numbers[0];
            let d2 = numbers[numbers.length - 1];
            return {
                start: new Date(`${year}-${pad(mNum)}-${pad(d1)}`),
                end: new Date(`${year}-${pad(mNum)}-${pad(d2)}`)
            };
        } else {
            let d = numbers[0];
            return {
                start: new Date(`${year}-${pad(mNum)}-${pad(d)}`),
                end: new Date(`${year}-${pad(mNum)}-${pad(d)}`)
            };
        }
    }
    
    // Fallbacks
    if (foundMonths.length === 1) {
        let mNum = foundMonths[0].num;
        return {
            start: new Date(`${year}-${pad(mNum)}-01`),
            end: new Date(`${year}-${pad(mNum)}-30`)
        };
    } else if (foundMonths.length >= 2) {
        let m1 = foundMonths[0].num;
        let m2 = foundMonths[foundMonths.length - 1].num;
        return {
            start: new Date(`${year}-${pad(m1)}-01`),
            end: new Date(`${year}-${pad(m2)}-30`)
        };
    }
    
    return { start: null, end: null };
}

// Perform event search
function performEventSearch() {
    const searchText = document.getElementById('search-event-input').value.trim();
    const selectedDepto = document.getElementById('filter-event-departamento').value;
    const selectedTipo = document.getElementById('filter-event-tipo').value;
    
    let userStart = null;
    let userEnd = null;
    let hasDates = false;
    
    if (eventDatePicker && eventDatePicker.selectedDates.length > 0) {
        userStart = toUTCDate(eventDatePicker.selectedDates[0]);
        userEnd = eventDatePicker.selectedDates.length > 1 
            ? toUTCDate(eventDatePicker.selectedDates[1]) 
            : userStart;
        hasDates = true;
    }

    // Proximity modal trigger condition
    if (!searchText && !selectedDepto && !hasDates) {
        if (emptySearchCriterion === null) {
            currentSearchMode = 'eventos';
            showProximityModal();
            return;
        }
    }

    const cleanQuery = removeAccents(searchText);
    currentSearchMode = 'eventos';

    const matchedEvents = appEventos.filter(ev => {
        // 1. Text filter (titulo and local)
        if (cleanQuery) {
            const cleanTitle = removeAccents(ev.titulo);
            const cleanLocal = removeAccents(ev.local);
            if (!cleanTitle.includes(cleanQuery) && !cleanLocal.includes(cleanQuery)) {
                return false;
            }
        }
        // 2. Departamento filter
        if (selectedDepto && ev.departamento.trim() !== selectedDepto) {
            return false;
        }
        // 3. Tipo filter
        if (selectedTipo && ev.tipo.trim() !== selectedTipo) {
            return false;
        }
        // 4. Date filter
        if (userStart || userEnd) {
            const evDates = parseSpanishDate(ev.fecha);
            if (evDates.start && evDates.end) {
                if (userStart && evDates.end < userStart) {
                    return false;
                }
                if (userEnd && evDates.start > userEnd) {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    });

    // Distance calculation if proximity mode is active
    if (!selectedDepto && emptySearchCriterion === 'near') {
        matchedEvents.forEach(ev => {
            ev.distance = null;
            const dest = appDestinos.find(d => removeAccents(d.destino) === removeAccents(ev.destino));
            if (dest && dest.lat !== null && dest.lng !== null && userLocation) {
                ev.distance = calculateDistance(userLocation.lat, userLocation.lng, dest.lat, dest.lng);
            }
        });
        matchedEvents.sort((a, b) => {
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
        });
    } else {
        matchedEvents.forEach(ev => ev.distance = null);
    }

    currentResults = matchedEvents;
    renderResults();
    switchTab('resultados');
}

// Swipe Navigation
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}

function handleSwipe() {
    const minDistance = 120; // Increased threshold for a deliberate swipe
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    // Guard: If the vertical movement is greater than horizontal, it was a vertical scroll, not a swipe
    if (Math.abs(diffY) > Math.abs(diffX)) {
        return;
    }
    
    const activeTab = document.querySelector('.tab-btn.active');
    if (!activeTab) return;
    
    const activeId = activeTab.id;
    
    if (Math.abs(diffX) > minDistance) {
        if (diffX < 0) {
            // Swipe Left
            if (activeId === 'tab-turismo-btn') {
                switchTab('eventos');
            } else if (activeId === 'tab-eventos-btn') {
                switchTab('resultados');
            } else if (activeId === 'tab-resultados-btn') {
                switchTab('itinerario');
            }
        } else {
            // Swipe Right
            if (activeId === 'tab-itinerario-btn') {
                switchTab('resultados');
            } else if (activeId === 'tab-resultados-btn') {
                switchTab('eventos');
            } else if (activeId === 'tab-eventos-btn') {
                switchTab('turismo');
            }
        }
    }
}

function setupSwipeNavigation() {
    document.querySelectorAll('.tab-view').forEach(view => {
        view.addEventListener('touchstart', handleTouchStart, { passive: true });
        view.addEventListener('touchend', handleTouchEnd, { passive: true });
    });
}



