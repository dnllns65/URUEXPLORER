// UruExplorer - Application Logic

// State management
let favorites = JSON.parse(localStorage.getItem('uruexplorer_favorites')) || [];
let itinerary = JSON.parse(localStorage.getItem('uruexplorer_itinerary')) || [];
let savedEvents = JSON.parse(localStorage.getItem('uruexplorer_saved_events')) || [];
let savedItinerariesList = JSON.parse(localStorage.getItem('uruexplorer_saved_itineraries_list')) || [];
let cardEventFilters = {}; // Tracks active category filters per card: { cardId: 'Todos' }
let currentResults = [];
let userLocation = null;
let emptySearchCriterion = null; // Session empty search behavior ('near' or 'all')
let currentLang = 'es'; // default
let currentTheme = localStorage.getItem('uruexplorer_theme') || 'dark';

// Localization Dictionary
const TRANSLATIONS = {
    es: {
        tagline: "Explorá Uruguay de forma minimalista",
        tab_explorar: "Explorar",
        tab_resultados: "Resultados",
        tab_itinerario: "Mi Itinerario",
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
        btn_trazar_itinerario: "🚙 Trazar Itinerario Completo en Google Maps",
        empty_itinerary_text: "No tienes destinos seleccionados para tu recorrido. Busca destinos y marca la casilla \"Recorrido\" en los resultados de búsqueda para agregarlos aquí.",
        itinerary_bar_count: "Itinerario: {count} destinos seleccionados",
        itinerary_bar_none: "Ninguno seleccionado",
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
        event_types: {
            "Concierto": "Concierto",
            "Feria": "Feria",
            "Fiesta": "Fiesta",
            "Teatro": "Teatro",
            "Cine": "Cine",
            "Cultural": "Cultural"
        }
    },
    en: {
        tagline: "Explore Uruguay in a minimalist way",
        tab_explorar: "Explore",
        tab_resultados: "Results",
        tab_itinerario: "My Itinerary",
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
        btn_trazar_itinerario: "🚙 Trace Complete Itinerary on Google Maps",
        empty_itinerary_text: "You have no destinations selected for your route. Search for destinations and check the \"Route\" box in the search results to add them here.",
        itinerary_bar_count: "Itinerary: {count} destinations selected",
        itinerary_bar_none: "None selected",
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
        event_types: {
            "Concierto": "Concert",
            "Feria": "Fair",
            "Fiesta": "Festival",
            "Teatro": "Theater",
            "Cine": "Cinema",
            "Cultural": "Cultural"
        }
    }
};

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1pgmc3TXHNXbtWecKiZYmPRK-_hkKwfujFKvbubIPpjU/export?format=csv';
const SHEET_EVENTOS_URL = 'https://docs.google.com/spreadsheets/d/1pgmc3TXHNXbtWecKiZYmPRK-_hkKwfujFKvbubIPpjU/export?format=csv&gid=1960694185';
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

        items.push({
            id: i,
            destino: row[destIdx] ? row[destIdx].trim() : '',
            departamento: row[deptIdx] ? row[deptIdx].trim() : '',
            dificultad: row[difIdx] ? row[difIdx].trim() : '',
            caracteristicas: row[charIdx] ? row[charIdx].trim() : '',
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
    
    // Download both sheets in parallel
    const promises = [
        fetch(SHEET_CSV_URL).then(res => {
            if (!res.ok) throw new Error("Error en destinos");
            return res.text();
        }),
        fetch(SHEET_EVENTOS_URL).then(res => {
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

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    applyTheme(); // Set initial theme
    detectLanguage();
    await loadData();
    initFilters();
    applyTranslations();
    renderFavorites();
    updateItineraryUI();
    renderItineraryTab(); // Render active itinerary and saved history on startup
    setupEventListeners();
    setupLanguageSwitcher();
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
    document.getElementById('tab-explorar-btn').addEventListener('click', () => switchTab('explorar'));
    document.getElementById('tab-resultados-btn').addEventListener('click', () => switchTab('resultados'));
    document.getElementById('tab-itinerario-btn').addEventListener('click', () => switchTab('itinerario'));

    // Search Action
    document.getElementById('btn-buscar').addEventListener('click', performSearch);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Modal Action Buttons
    const btnCerca = document.getElementById('btn-modal-cerca');
    const btnTodos = document.getElementById('btn-modal-todos');
    if (btnCerca) {
        btnCerca.addEventListener('click', () => {
            emptySearchCriterion = 'near';
            hideProximityModal();
            performSearch();
        });
    }
    if (btnTodos) {
        btnTodos.addEventListener('click', () => {
            emptySearchCriterion = 'all';
            hideProximityModal();
            performSearch();
        });
    }

    // Itinerary Bar Actions
    document.getElementById('btn-ver-itinerario-bar').addEventListener('click', () => switchTab('itinerario'));
    document.getElementById('btn-trazar-itinerario-bar').addEventListener('click', triggerItineraryRoute);
    document.getElementById('btn-trazar-itinerario-tab').addEventListener('click', triggerItineraryRoute);
    document.getElementById('btn-clear-itinerary').addEventListener('click', clearItinerary);
    document.getElementById('btn-limpiar-itinerario-bar').addEventListener('click', clearItinerary);
    document.getElementById('btn-limpiar-itinerario-resultados').addEventListener('click', clearItinerary);

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

    // Close Map Lightbox on clicking overlay

    // Only Events Checkbox Listener
    const onlyEventsChk = document.getElementById('only-events-checkbox');
    if (onlyEventsChk) {
        onlyEventsChk.addEventListener('change', renderResults);
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
    if (tabId === 'explorar') {
        document.getElementById('tab-explorar-btn').classList.add('active');
        document.getElementById('view-explorar').classList.add('active');
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

// Render filtered destination blocks
function renderResults() {
    const grid = document.getElementById('results-grid');
    grid.innerHTML = '';

    // Determine if any destination in currentResults has events
    const hasAnyEvents = currentResults.some(item => 
        appEventos.some(ev => isEventMatch(ev, item))
    );

    const toggleContainer = document.getElementById('only-events-toggle-container');
    if (toggleContainer) {
        toggleContainer.style.display = hasAnyEvents ? 'inline-flex' : 'none';
    }

    const onlyEventsChk = document.getElementById('only-events-checkbox');
    const filterOnlyEvents = onlyEventsChk && onlyEventsChk.checked;

    let itemsToRender = currentResults;
    if (filterOnlyEvents) {
        itemsToRender = currentResults.filter(item => 
            appEventos.some(ev => isEventMatch(ev, item))
        );
    }

    const badge = document.getElementById('results-count-badge');
    if (itemsToRender.length > 0) {
        badge.textContent = itemsToRender.length;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }

    if (itemsToRender.length === 0) {
        grid.innerHTML = `
            <div class="empty-results">
                <h4 data-i18n="empty_results_title">${TRANSLATIONS[currentLang].empty_results_title}</h4>
                <p data-i18n="empty_results_text">${TRANSLATIONS[currentLang].empty_results_text}</p>
            </div>
        `;
        return;
    }

    itemsToRender.forEach(item => {
        const isFav = favorites.includes(item.id);
        const isInItinerary = itinerary.includes(item.id);
        
        const card = document.createElement('div');
        card.className = 'result-card';
        card.dataset.id = item.id;

        // Find events associated with this destination
        const matchedEvents = appEventos.filter(ev => isEventMatch(ev, item));

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
                        <span class="info-text features">${item.caracteristicas}</span>
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
                </div>

                <!-- Action Buttons: Como Ir & Eventos -->
                <div class="card-action-row" style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                    <button class="btn btn-primary btn-como-ir" data-lat="${item.lat}" data-lng="${item.lng}" data-name="${item.destino}" data-i18n="card_how_to_go" style="flex: 1; min-width: 140px;">
                        ${TRANSLATIONS[currentLang].card_how_to_go}
                    </button>
                    ${matchedEvents.length > 0 ? `
                    <button class="btn btn-secondary btn-toggle-events" onclick="toggleCardEvents('${item.id}')" style="flex: 1; min-width: 140px; display: inline-flex; justify-content: center; gap: 8px;">
                        📅 <span data-i18n="events_title">${TRANSLATIONS[currentLang].events_title}</span> (${matchedEvents.length}) <span class="events-toggle-icon" style="transition: transform 0.3s ease;">▼</span>
                    </button>
                    ` : ''}
                </div>

                <!-- Events Section -->
                ${matchedEvents.length > 0 ? `
                <div class="events-section" id="events-section-${item.id}">
                    <div class="events-container" id="events-container-${item.id}">
                        <!-- Category Filter Chips -->
                        <div class="events-filter-bar" style="margin-top: 10px;">
                            <span class="event-filter-chip active" data-type="Todos" onclick="filterCardEvents(event, '${item.id}', 'Todos')">${TRANSLATIONS[currentLang].events_filter_all}</span>
                            ${[...new Set(matchedEvents.map(e => e.tipo))].map(tipo => {
                                const label = TRANSLATIONS[currentLang].event_types[tipo] || tipo;
                                return `<span class="event-filter-chip" data-type="${tipo}" onclick="filterCardEvents(event, '${item.id}', '${tipo}')">${label}</span>`;
                            }).join('')}
                        </div>
                        <div class="events-list" id="events-list-${item.id}">
                            <!-- Event cards will be rendered dynamically here -->
                        </div>
                    </div>
                </div>
                ` : ''}
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

        // Wire up card internal events
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
            getDirections(item.lat, item.lng, item.destino);
        });

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
    const index = itinerary.indexOf(id);
    if (index === -1) {
        itinerary.push(id);
    } else {
        itinerary.splice(index, 1);
    }
    localStorage.setItem('uruexplorer_itinerary', JSON.stringify(itinerary));
    updateItineraryUI();
}

// Clear itinerary
function clearItinerary() {
    itinerary = [];
    savedEvents = [];
    localStorage.setItem('uruexplorer_itinerary', JSON.stringify(itinerary));
    localStorage.setItem('uruexplorer_saved_events', JSON.stringify(savedEvents));
    
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
        const names = appDestinos
            .filter(item => itinerary.includes(item.id))
            .map(item => item.destino)
            .join(', ');
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

    const itineraryDestinos = appDestinos.filter(item => itinerary.includes(item.id));

    if (itineraryDestinos.length === 0) {
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

    itineraryDestinos.forEach((item, index) => {
        const stepCard = document.createElement('div');
        stepCard.className = 'itinerary-step-card';
        stepCard.innerHTML = `
            <div class="step-num">${index + 1}</div>
            <div class="step-details">
                <div class="step-name notranslate" translate="no">${item.destino}</div>
                <div class="step-dept notranslate" translate="no">${item.departamento}</div>
            </div>
            <button class="btn-remove-step" data-id="${item.id}" title="${currentLang === 'es' ? 'Eliminar del recorrido' : 'Remove from route'}">✕</button>
        `;

        stepCard.querySelector('.btn-remove-step').addEventListener('click', () => {
            // Remove check in results if visible
            const chk = document.querySelector(`.results-grid .route-check[data-id="${item.id}"]`);
            if (chk) {
                chk.checked = false;
                chk.closest('.route-checkbox-container').classList.remove('selected');
            }
            toggleItinerary(item.id);
            renderItineraryTab();
        });

        stepsList.appendChild(stepCard);
    });

    // Render saved events for this itinerary
    const activeSavedEvents = appEventos.filter(ev => savedEvents.includes(ev.id));
    const eventsSection = document.getElementById('itinerary-events-section');
    const eventsList = document.getElementById('itinerary-events-list');

    if (activeSavedEvents.length > 0) {
        eventsSection.style.display = 'block';
        eventsList.innerHTML = '';
        activeSavedEvents.forEach((ev) => {
            const typeLabel = TRANSLATIONS[currentLang].event_types[ev.tipo] || ev.tipo;
            const badgeClass = `tipo-${ev.tipo.toLowerCase().replace(/ \/ /g, '-')}`;
            
            const stepCard = document.createElement('div');
            stepCard.className = 'itinerary-step-card';
            stepCard.innerHTML = `
                <div class="step-num" style="background: var(--border); color: var(--text-muted); font-size: 0.75rem;">📅</div>
                <div class="step-details">
                    <div class="step-name">${ev.titulo}</div>
                    <div class="step-dept"><span class="event-badge ${badgeClass}" style="display:inline-block; margin-right:5px; padding: 1px 4px; font-size:0.6rem;">${typeLabel}</span> ${ev.destino} (${ev.fecha})${ev.local ? ` • 📍 ${ev.local}` : ''}</div>
                </div>
                <button class="btn-remove-step" onclick="toggleSavedEvent(${ev.id})" title="${currentLang === 'es' ? 'Eliminar evento' : 'Remove event'}">✕</button>
            `;
            eventsList.appendChild(stepCard);
        });
    } else {
        eventsSection.style.display = 'none';
    }

    // Toggle save itinerary form
    const saveForm = document.getElementById('save-itinerary-form');
    if (saveForm) {
        if (itineraryDestinos.length > 0) {
            saveForm.style.display = 'block';
        } else {
            saveForm.style.display = 'none';
        }
    }

    // Render Saved History
    renderSavedItinerariesHistory();
}

// Directions ("Cómo ir") for a single destination
function getDirections(lat, lng, name) {
    let url = 'https://www.google.com/maps/dir/?api=1&';
    
    if (userLocation) {
        url += `origin=${userLocation.lat},${userLocation.lng}&`;
    }
    
    url += `destination=${lat},${lng}`;
    window.open(url, '_blank');
}

// Generate multi-point route on Google Maps ("Itinerario")
function triggerItineraryRoute() {
    if (itinerary.length === 0) return;

    const itineraryDestinos = appDestinos.filter(item => itinerary.includes(item.id));
    
    // Define origin
    let url = 'https://www.google.com/maps/dir/?api=1&';
    if (userLocation) {
        url += `origin=${userLocation.lat},${userLocation.lng}&`;
    }

    // Google Maps dir API supports:
    // destination = final point
    // waypoints = pipe-separated (|) list of stops
    const finalDest = itineraryDestinos[itineraryDestinos.length - 1];
    
    url += `destination=${finalDest.lat},${finalDest.lng}`;

    if (itineraryDestinos.length > 1) {
        // Waypoints are all stops except the final one
        const waypoints = itineraryDestinos.slice(0, -1)
            .map(item => `${item.lat},${item.lng}`)
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
        events: [...savedEvents],
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
    
    itinerary = [...itObj.destinations];
    savedEvents = itObj.events ? [...itObj.events] : [];
    
    localStorage.setItem('uruexplorer_itinerary', JSON.stringify(itinerary));
    localStorage.setItem('uruexplorer_saved_events', JSON.stringify(savedEvents));
    
    // Sync all checkboxes in search results view
    document.querySelectorAll('.results-grid .route-check').forEach(chk => {
        const id = parseInt(chk.getAttribute('data-id'));
        if (itinerary.includes(id)) {
            chk.checked = true;
            chk.closest('.route-checkbox-container').classList.add('selected');
        } else {
            chk.checked = false;
            chk.closest('.route-checkbox-container').classList.remove('selected');
        }
    });
    
    // Update UIs
    updateItineraryUI();
    renderItineraryTab();
    
    // Go to itinerary tab so the user sees the loaded itinerary details
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
        
        const destCount = it.destinations.length;
        const evCount = it.events ? it.events.length : 0;
        
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



