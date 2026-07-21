// UruExplorer - Application Logic

// Helper to track custom events in Google Analytics (GA4) asynchronously
function trackEvent(name, params = {}) {
    if (typeof gtag === 'function') {
        gtag('event', name, params);
    }
}

// Check and show the quick guide once per day
function checkAndShowGuide() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    const lastDate = localStorage.getItem('uruexplorer_last_guide_date');
    if (lastDate !== today) {
        const overlay = document.getElementById('guide-overlay');
        if (overlay) {
            // Apply localized translation
            const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['es'];
            const titleEl = document.getElementById('guide-title');
            const bodyEl = document.getElementById('guide-steps-body');
            const closeBtn = document.getElementById('btn-cerrar-guia');
            
            if (titleEl) titleEl.textContent = dict.guide_title;
            if (bodyEl) bodyEl.innerHTML = dict.guide_steps;
            if (closeBtn) closeBtn.textContent = dict.btn_guide_understand;
            
            // Set close behavior
            closeBtn.onclick = () => {
                overlay.classList.remove('visible');
                localStorage.setItem('uruexplorer_last_guide_date', today);
            };
            
            // Show modal
            overlay.classList.add('visible');
        }
    }
}

// Configuración de Reportes de Error (Google Form pre-llenado)
const REPORT_FORM_BASE_URL = 'https://docs.google.com/forms/d/1uLhJ2kcy8byCfyRoP68m5nX_R7XWU45-islcbMFTM5U/viewform?entry.1878222161=';

// WhatsApp SVG Icon
const WHATSAPP_ICON_SVG = `<svg class="wa-icon-svg" width="22" height="22" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; display: inline-block;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.197 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

// State management
let favorites = JSON.parse(localStorage.getItem('uruexplorer_favorites')) || [];
let favoriteEvents = JSON.parse(localStorage.getItem('uruexplorer_favorite_events')) || [];
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
let displayedDestinationsCount = 10;
let displayedEventsCount = 10;
let userLocation = null;
let emptySearchCriterion = null; // Session empty search behavior ('near' or 'all')
let currentLang = 'es'; // default
let currentTheme = localStorage.getItem('uruexplorer_theme') || 'dark';
let eventDatePicker = null;
const TABS = ['turismo', 'eventos', 'resultados', 'itinerario', 'emergencias'];
let activeTabId = 'turismo';

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
        title_favorite_events: "★ Mis Eventos Favoritos",
        no_favorites: "Aún no tienes destinos favoritos guardados. ¡Agrega algunos marcando la estrella en los bloques de resultados!",
        no_favorite_events: "Aún no tienes eventos favoritos guardados. ¡Agrega algunos marcando la estrella en las tarjetas de eventos!",
        btn_share: "Compartir 📲",
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
        itinerary_mobile_link: "Mis rutas ➔",
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
        card_view_photos: "Ver Fotos",
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
        lbl_event_sources_intro: "Fuentes de información de eventos:",
        tab_emergencias: "Emergencias",
        lbl_gps_status: "Estado del GPS",
        lbl_gps_active: "Ubicación activa",
        lbl_gps_inactive: "Ubicación inactiva",
        btn_detect_location: "Detectar mi ubicación",
        title_emergencias_cerca: "Servicios Cercanos (Radio 200 km)",
        btn_search_police: "Puestos de Policía",
        btn_search_medical: "Atención Médica",
        btn_search_mechanics: "Mecánica y Auxilio",
        btn_search_chargers: "Recarga y Combustible",
        title_itinerary_emergencies: "Emergencias en tu Recorrido",
        empty_itinerary_emergencies: "No tienes destinos en tu recorrido para calcular servicios en ruta.",
        title_police_list: "Seccionales de Policía Cercanas (Top 5)",
        no_gps_police_list: "Por favor active su GPS para ver las seccionales de policía más cercanas ordenadas por distancia.",
        title_medical_list: "Hospitales y Policlínicas Cercanos (Top 5)",
        no_gps_medical_list: "Por favor active su GPS para ver los centros de salud más cercanos ordenados por distancia.",
        title_chargers_list: "Estaciones de Recarga y Combustible Cercanas (Top 5 de cada tipo)",
        no_gps_chargers_list: "Por favor active su GPS para ver las estaciones de recarga y combustible más cercanas.",
        no_chargers_100km: "No se encontraron estaciones de recarga o servicio cerca de tu ubicación.",
        btn_more_police_maps: "🔍 Buscar todas las seccionales en Google Maps",
        btn_more_medical_maps: "🔍 Buscar más centros de salud en Google Maps",
        btn_more_chargers_maps: "🔍 Buscar estaciones y cargadores en Google Maps",
        lbl_loading_gps: "Obteniendo ubicación GPS...",
        btn_load_more: "Más resultados",
        ad_loading_title: "Buscando coincidencias...",
        ad_loading_desc: "Espere un momento mientras organizamos los mejores resultados para ti.",
        btn_ad_continue: "Ver resultados",
        guide_title: "🗺️ Guía Rápida de UruExplorer",
        guide_steps: `<div class="guide-step-item"><strong>1. 🔍 Buscar Destinos</strong>Encuentra playas, cerros o museos. Filtra por departamento, dificultad o popularidad en la pestaña <strong>Turismo</strong>.</div><div class="guide-step-item"><strong>2. 🎟️ Agenda de Eventos</strong>Consulta la cartelera de cines, recitales y espectáculos (Sodre, Antel Arena) en la pestaña <strong>Eventos</strong>.</div><div class="guide-step-item"><strong>3. 🚗 Armar Itinerario</strong>Marca la casilla <code>Recorrido</code> en lo que te interese. Presiona <strong>Establecer Ruta</strong> para abrir tu mapa de viaje en Google Maps.</div><div class="guide-step-item"><strong>4. 🚨 Emergencias y Utilidades</strong>Toca la sirena <code>🚨</code> para ubicar al instante comisarías, hospitales, gasolineras y cargadores eléctricos más cercanos a tu posición.</div>`,
        btn_guide_understand: "Entendido"
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
        title_favorite_events: "★ My Favorite Events",
        no_favorites: "You don't have favorite destinations saved yet. Add some by marking the star in the result blocks!",
        no_favorite_events: "You don't have favorite events saved yet. Add some by marking the star in the event cards!",
        btn_share: "Share 📲",
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
        itinerary_mobile_link: "My Routes ➔",
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
        card_view_photos: "View Photos",
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
        lbl_event_sources_intro: "Event information sources:",
        tab_emergencias: "Emergencies",
        lbl_gps_status: "GPS Status",
        lbl_gps_active: "Location active",
        lbl_gps_inactive: "Location inactive",
        btn_detect_location: "Detect my location",
        title_emergencias_cerca: "Nearby Services (200 km Radius)",
        btn_search_police: "Police Stations",
        btn_search_medical: "Medical Attention",
        btn_search_mechanics: "Mechanic & Towing",
        btn_search_chargers: "Charging & Fuel",
        title_itinerary_emergencies: "Emergencies along your Route",
        empty_itinerary_emergencies: "You have no destinations in your route to calculate roadside services.",
        title_police_list: "Nearby Police Stations (Top 5)",
        no_gps_police_list: "Please activate your GPS to see the nearest police stations sorted by distance.",
        title_medical_list: "Nearby Hospitals & Clinics (Top 5)",
        no_gps_medical_list: "Please activate your GPS to see the nearest medical centers sorted by distance.",
        title_chargers_list: "Closest Charging & Fuel Stations (Top 5 of each type)",
        no_gps_chargers_list: "Please activate your GPS to see the closest charging and fuel stations.",
        no_chargers_100km: "No charging or service stations found near your location.",
        btn_more_police_maps: "🔍 Search all police stations on Google Maps",
        btn_more_medical_maps: "🔍 Search more medical centers on Google Maps",
        btn_more_chargers_maps: "🔍 Search charging and service stations on Google Maps",
        lbl_loading_gps: "Acquiring GPS location...",
        btn_load_more: "More results",
        ad_loading_title: "Searching matches...",
        ad_loading_desc: "Please wait a moment while we organize the best results for you.",
        btn_ad_continue: "View results",
        guide_title: "🗺️ UruExplorer Quick Guide",
        guide_steps: `<div class="guide-step-item"><strong>1. 🔍 Search Destinations</strong>Find beaches, hills, or museums. Filter by department, difficulty, or popularity in the <strong>Tourism</strong> tab.</div><div class="guide-step-item"><strong>2. 🎟️ Event Agenda</strong>Check movie schedules, concerts, and shows (Sodre, Antel Arena) in the <strong>Events</strong> tab.</div><div class="guide-step-item"><strong>3. 🚗 Plan Itinerary</strong>Check the <code>Route</code> box on your items. Press <strong>Set Route</strong> to open your travel map in Google Maps.</div><div class="guide-step-item"><strong>4. 🚨 Emergencies & Utilities</strong>Tap the siren <code>🚨</code> to instantly find the nearest police stations, hospitals, gas stations, and EV chargers.</div>`,
        btn_guide_understand: "Understood"
    },
    pt: {
        tagline: "Explore o Uruguai de forma minimalista",
        tab_explorar: "Explorar",
        tab_resultados: "Resultados",
        tab_itinerario: "Minhas rotas",
        lbl_buscar_destino: "Buscar Destino ou Característica",
        placeholder_buscar: "Ex: Cabo Polonio, praia, cachoeira...",
        lbl_departamento: "Departamento",
        lbl_dificultad: "Grau de Dificuldade",
        lbl_popularidad: "Popularidade",
        opt_todos_deptos: "Todos os departamentos",
        opt_todos_grados: "Todos os graus",
        btn_buscar: "Buscar Coincidências",
        title_favoritos: "★ Seus Destinos Favoritos",
        title_favorite_events: "★ Meus Eventos Favoritos",
        no_favorites: "Você ainda não tem destinos favoritos salvos. Adicione alguns marcando a estrela nos blocos de resultados!",
        no_favorite_events: "Você ainda não tem eventos favoritos salvos. Adicione alguns marcando a estrela nos cartões de eventos!",
        btn_share: "Compartilhar 📲",
        results_header: "Resultados da Busca",
        btn_limpiar_itinerario: "✕ Limpar Seleção",
        lbl_only_events: "Apenas com eventos",
        empty_results_title: "Nenhum destino encontrado",
        empty_results_text: "Tente ajustar os critérios de busca ou selecionar outros filtros.",
        itinerary_header: "Roteiro Selecionado",
        btn_clear_all: "Limpar Tudo",
        card_report_error: "Algum dado incorreto? Reportar",
        btn_trazar_itinerario: "🚙 Traçar Roteiro Completo no Google Maps",
        empty_itinerary_text: "Você não tem destinos selecionados para o seu roteiro. Busque destinos e marque a caixa \"Roteiro\" nos resultados de busca para adicioná-los aqui.",
        itinerary_bar_count: "Roteiro: {count} destinos selecionados",
        itinerary_bar_none: "Nenhum selecionado",
        itinerary_mobile_link: "Minhas rotas ➔",
        btn_limpiar: "✕ Limpar",
        btn_ver_detalles: "Ver Detalhes",
        btn_establecer_ruta: "Estabelecer Rota",
        modal_title: "📍 Busca ampla",
        modal_body: "Você não especificou um destino nem um departamento. O que prefere ver?",
        btn_modal_cerca: "📍 Buscar perto da minha posição",
        btn_modal_todos: "🌍 Mostrar todos os disponíveis",
        card_features: "Características",
        card_accommodation: "Hospedagem",
        card_dining: "Onde comer",
        card_location: "Localização",
        card_contact: "Contato principal",
        card_website: "Sítio Web",
        card_how_to_go: "Como ir",
        card_view_photos: "Ver Fotos",
        card_reset_map: "🔄 Redefinir Mapa",
        card_route: "Roteiro",
        distance_badge: "📍 a {distance} km",
        popularity_badge: "Popularidade",
        pop_alta: "Alta",
        pop_moderada: "Moderada",
        pop_emergente: "Emergente",
        no_info: "Consultar informações locais ou sítio web",
        popularity_levels: {
            "Alta": "Alta",
            "Moderada": "Moderada",
            "Emergente": "Emergente"
        },
        itinerary_events_header: "Eventos Agendados",
        title_save_itinerary: "Salvar Roteiro Atual",
        placeholder_itinerary_name: "Ex: Viagem Rocha Janeiro...",
        btn_save: "Salvar",
        title_saved_itineraries: "Meus Roteiros Salvos",
        no_saved_itineraries: "Você não tem roteiros salvos neste dispositivo.",
        btn_search_events: "📅 Buscar Eventos",
        btn_load: "Carregar",
        btn_delete: "Excluir",
        events_title: "Eventos Disponíveis",
        events_filter_all: "Todos",
        events_filter_concerts: "Shows",
        events_filter_fairs: "Feiras",
        events_filter_festivals: "Festas",
        events_filter_theater_cine: "Teatro / Cinema",
        events_filter_cultural: "Culturais",
        btn_buy_tickets: "🎟️ Comprar Ingressos",
        btn_save_event: "⭐ Salvar Evento",
        btn_unsave_event: "⭐ Salvo",
        msg_itinerary_saved: "Roteiro salvo com sucesso!",
        msg_itinerary_empty: "Não há destinos no roteiro para salvar.",
        msg_itinerary_enter_name: "Por favor, insira um nome para o roteiro.",
        tab_turismo: "Turismo",
        tab_eventos: "Eventos",
        lbl_buscar_evento: "Nome do Evento ou Característica",
        placeholder_buscar_evento: "Ex: Show, Teatro Solís...",
        lbl_tipo_evento: "Tipo de Evento",
        opt_todos_tipos: "Todos os tipos",
        lbl_fecha_inicio: "Data de Início",
        lbl_fecha_fin: "Data de Término",
        lbl_fecha_rango: "Intervalo de Datas",
        placeholder_fecha_rango: "Selecione o período de busca...",
        btn_buscar_eventos: "Buscar Eventos",
        event_types: {
            "Concierto": "Show",
            "Feria": "Feira",
            "Fiesta": "Festa",
            "Teatro": "Teatro",
            "Cine": "Cinema",
            "Cultural": "Cultural"
        },
        lbl_event_sources_intro: "Fontes de informação sobre eventos:",
        tab_emergencias: "Emergências",
        lbl_gps_status: "Status do GPS",
        lbl_gps_active: "Localização ativa",
        lbl_gps_inactive: "Localização inativa",
        btn_detect_location: "Detectar minha localização",
        title_emergencias_cerca: "Serviços Próximos (Raio de 200 km)",
        btn_search_police: "Postos de Polícia",
        btn_search_medical: "Atendimento Médico",
        btn_search_mechanics: "Mecânica e Reboque",
        btn_search_chargers: "Recarga e Combustível",
        title_itinerary_emergencies: "Emergências ao longo do seu Roteiro",
        empty_itinerary_emergencies: "Você não tem destinos no seu roteiro para calcular serviços na estrada.",
        title_police_list: "Postos de Polícia Próximos (Top 5)",
        no_gps_police_list: "Por favor, ative seu GPS para ver os postos de polícia mais próximos ordenados por distância.",
        title_medical_list: "Hospitais e Policlínicas Próximos (Top 5)",
        no_gps_medical_list: "Por favor, ative seu GPS para ver os centros de saúde mais próximos ordenados por distância.",
        title_chargers_list: "Estações de Recarga e Combustível Próximas (Top 5 de cada tipo)",
        no_gps_chargers_list: "Por favor, ative seu GPS para ver as estações de recarga e combustível mais próximas.",
        no_chargers_100km: "Nenhuma estação de recarga ou serviço encontrada próxima de sua localização.",
        btn_more_police_maps: "🔍 Buscar todos os postos de polícia no Google Maps",
        btn_more_medical_maps: "🔍 Buscar mais centros médicos no Google Maps",
        btn_more_chargers_maps: "🔍 Buscar estações e carregadores no Google Maps",
        lbl_loading_gps: "Obtendo localização GPS...",
        btn_load_more: "Mais resultados",
        ad_loading_title: "Buscando coincidências...",
        ad_loading_desc: "Aguarde um momento enquanto organizamos os melhores resultados para você.",
        btn_ad_continue: "Ver resultados",
        guide_title: "🗺️ Guia Rápido do UruExplorer",
        guide_steps: `<div class="guide-step-item"><strong>1. 🔍 Buscar Destinos</strong>Encontre praias, morros ou museus. Filtre por departamento, dificuldade ou popularidade na aba <strong>Turismo</strong>.</div><div class="guide-step-item"><strong>2. 🎟️ Agenda de Eventos</strong>Consulte a programação de cinemas, shows e espetáculos (Sodre, Antel Arena) na aba <strong>Eventos</strong>.</div><div class="guide-step-item"><strong>3. 🚗 Planejar Roteiro</strong>Marque a caixa <code>Rota</code> nos seus itens. Pressione <strong>Traçar Rota</strong> para abrir o mapa de viagem no Google Maps.</div><div class="guide-step-item"><strong>4. 🚨 Emergências e Utilidades</strong>Toque na sirene <code>🚨</code> para localizar comissariados, hospitais, postos de combustíveis e carregadores elétricos mais próximos.</div>`,
        btn_guide_understand: "Entendido"
    },
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
            caracteristicas_pt: localDest && localDest.caracteristicas_pt ? localDest.caracteristicas_pt : '',
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
        locale: currentLang === 'es' ? 'es' : (currentLang === 'pt' ? 'pt' : 'en'),
        disableMobile: true // Forces custom calendar UI on touch screens, avoiding native iOS range input crashes
    });
}

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    applyTheme(); // Set initial theme
    detectLanguage();
    checkAndShowGuide(); // Show guide once per day during data load
    await loadData();
    initFilters();
    initEventFilters();
    applyTranslations();
    initFlatpickr(); // Initialize Flatpickr calendar
    renderFavorites();
    renderFavoriteEvents();
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
    const btnPt = document.getElementById('lang-btn-pt');
    
    if (btnEs) {
        btnEs.addEventListener('click', () => {
            if (currentLang !== 'es') {
                currentLang = 'es';
                applyTranslations();
                initFilters();
                initEventFilters(); // Re-initialize events filter in Spanish
                initFlatpickr(); // Reinit Flatpickr with ES locale
                renderFavorites();
                renderFavoriteEvents();
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
                renderFavoriteEvents();
                updateItineraryUI();
                renderItineraryTab();
                if (currentResults.length > 0) {
                    renderResults();
                }
            }
        });
    }

    if (btnPt) {
        btnPt.addEventListener('click', () => {
            if (currentLang !== 'pt') {
                currentLang = 'pt';
                applyTranslations();
                initFilters();
                initEventFilters(); // Re-initialize events filter in Portuguese
                initFlatpickr(); // Reinit Flatpickr with PT locale
                renderFavorites();
                renderFavoriteEvents();
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
    const btnPt = document.getElementById('lang-btn-pt');
    if (btnEs && btnEn && btnPt) {
        btnEs.classList.remove('active');
        btnEn.classList.remove('active');
        btnPt.classList.remove('active');
        if (currentLang === 'es') {
            btnEs.classList.add('active');
        } else if (currentLang === 'en') {
            btnEn.classList.add('active');
        } else if (currentLang === 'pt') {
            btnPt.classList.add('active');
        }
    }

    // Static text translations
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            if (key === 'guide_steps') {
                el.innerHTML = dict[key];
            } else {
                el.textContent = dict[key];
            }
        }
    });

    // Placeholder translations
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) {
            el.placeholder = dict[key];
        }
    });

    // Update active tab title translation in the unified header
    const titleTextEl = document.getElementById('nav-title-text');
    if (titleTextEl && typeof activeTabId !== 'undefined') {
        const key = 'tab_' + activeTabId;
        if (dict[key]) {
            titleTextEl.textContent = dict[key];
        }
    }
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
                if (activeTabId === 'emergencias') {
                    renderEmergenciesTab();
                }
            },
            (error) => {
                console.warn("No se pudo obtener la ubicación:", error.message);
                if (activeTabId === 'emergencias') {
                    renderEmergenciesTab();
                }
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
    // Tabs Navigation via Arrows
    function navigateTab(direction) {
        const currentIndex = TABS.indexOf(activeTabId);
        let nextIndex = currentIndex + direction;
        if (nextIndex >= 0 && nextIndex < TABS.length) {
            switchTab(TABS[nextIndex]);
        }
    }

    document.getElementById('nav-arrow-left').addEventListener('click', () => navigateTab(-1));
    document.getElementById('nav-arrow-right').addEventListener('click', () => navigateTab(1));

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
            
            if (!userLocation) {
                // If user location is null, display a temporary loading state in the grid
                const grid = document.getElementById(currentSearchMode === 'eventos' ? 'events-grid' : 'results-grid');
                if (grid) {
                    grid.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-main); font-weight: 500;">${TRANSLATIONS[currentLang].lbl_loading_gps}</div>`;
                }
                showTransitionAd();
                
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            userLocation = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            };
                            console.log("Ubicación del usuario obtenida desde el modal:", userLocation);
                            renderEmergenciesTab(); // update GPS dot in emergencies tab too!
                            
                            if (currentSearchMode === 'eventos') {
                                performEventSearch();
                            } else {
                                performSearch();
                            }
                        },
                        (error) => {
                            console.warn("No se pudo obtener la ubicación para la búsqueda amplia:", error.message);
                            if (currentSearchMode === 'eventos') {
                                performEventSearch();
                            } else {
                                performSearch();
                            }
                        },
                        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                    );
                } else {
                    if (currentSearchMode === 'eventos') {
                        performEventSearch();
                    } else {
                        performSearch();
                    }
                }
            } else {
                if (currentSearchMode === 'eventos') {
                    performEventSearch();
                } else {
                    performSearch();
                }
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

    // Emergencies Card Event Listeners
    const btnEmergencyGps = document.getElementById('btn-detect-gps');
    if (btnEmergencyGps) {
        btnEmergencyGps.addEventListener('click', () => {
            requestUserLocation();
        });
    }

    const btnEmergencyPolice = document.getElementById('btn-emergency-police');
    if (btnEmergencyPolice) {
        btnEmergencyPolice.addEventListener('click', () => {
            showPoliceStationsList();
        });
    }

    const btnEmergencyMedical = document.getElementById('btn-emergency-medical');
    if (btnEmergencyMedical) {
        btnEmergencyMedical.addEventListener('click', () => {
            showMedicalCentersList();
        });
    }

    const btnEmergencyMechanic = document.getElementById('btn-emergency-mechanic');
    if (btnEmergencyMechanic) {
        btnEmergencyMechanic.addEventListener('click', () => openEmergencySearch('mechanic'));
    }

    const btnEmergencyChargers = document.getElementById('btn-emergency-chargers');
    if (btnEmergencyChargers) {
        btnEmergencyChargers.addEventListener('click', () => {
            showEVChargersList();
        });
    }

    const btnQuickEmergency = document.getElementById('btn-quick-emergency');
    if (btnQuickEmergency) {
        btnQuickEmergency.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('emergencias');
        });
    }
}

// Switch between view tabs
function switchTab(tabId) {
    activeTabId = tabId;
    trackEvent('tab_viewed', { tab_id: tabId });

    // Remove active state from all views
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));

    // Activate selected view
    if (tabId === 'turismo') {
        document.getElementById('view-turismo').classList.add('active');
    } else if (tabId === 'eventos') {
        document.getElementById('view-eventos').classList.add('active');
    } else if (tabId === 'resultados') {
        document.getElementById('view-resultados').classList.add('active');
    } else if (tabId === 'emergencias') {
        document.getElementById('view-emergencias').classList.add('active');
        renderEmergenciesTab();
    } else if (tabId === 'itinerario') {
        document.getElementById('view-itinerario').classList.add('active');
        renderItineraryTab();
    } else if (tabId === 'publicidad') {
        document.getElementById('view-publicidad').classList.add('active');
    }

    // Update navigation header title text
    const titleTextEl = document.getElementById('nav-title-text');
    if (titleTextEl) {
        let key = 'tab_' + tabId;
        const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['es'];
        titleTextEl.textContent = dict[key] || (tabId === 'publicidad' ? (dict['ad_loading_title'] || 'Buscando coincidencias...') : tabId);
    }

    // Show/hide arrow buttons based on position (using visibility to keep center alignment)
    const currentIndex = TABS.indexOf(tabId);
    const leftArrow = document.getElementById('nav-arrow-left');
    const rightArrow = document.getElementById('nav-arrow-right');
    
    if (leftArrow) {
        leftArrow.style.visibility = (currentIndex === 0 || tabId === 'publicidad') ? 'hidden' : 'visible';
    }
    if (rightArrow) {
        rightArrow.style.visibility = (currentIndex === TABS.length - 1 || tabId === 'publicidad') ? 'hidden' : 'visible';
    }

    // Update visibility of the badges next to the title
    const resBadge = document.getElementById('results-count-badge');
    const itBadge = document.getElementById('itinerary-tab-badge');
    if (resBadge) {
        resBadge.style.display = (tabId === 'resultados' && currentResults.length > 0) ? 'inline-block' : 'none';
    }
    if (itBadge) {
        itBadge.style.display = (tabId === 'itinerario' && itinerary.length > 0) ? 'inline-block' : 'none';
    }

    // Scroll back to top smoothly so the user doesn't stay scrolled down from previous view
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show the advertisement transition view before displaying search results
function showTransitionAd() {
    // 1. Switch to the advertisement tab
    switchTab('publicidad');
    
    // 2. Start a countdown
    const countdownEl = document.getElementById('ad-countdown');
    const continueBtn = document.getElementById('btn-ad-continue');
    
    if (countdownEl && continueBtn) {
        continueBtn.disabled = true;
        let seconds = 3; // 3-second countdown
        
        // Translate button text and set initial countdown
        const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['es'];
        const textSpan = continueBtn.querySelector('[data-i18n="btn_ad_continue"]');
        if (textSpan) {
            textSpan.textContent = dict['btn_ad_continue'] || 'Ver resultados';
        }
        countdownEl.textContent = ` (${seconds}s)`;
        
        const interval = setInterval(() => {
            seconds--;
            if (seconds > 0) {
                countdownEl.textContent = ` (${seconds}s)`;
            } else {
                clearInterval(interval);
                countdownEl.textContent = '';
                continueBtn.disabled = false;
                // Automatically redirect after countdown
                switchTab('resultados');
            }
        }, 1000);
        
        // Save interval so we can clear it if they click "Continuar" early or search again
        if (window.adInterval) clearInterval(window.adInterval);
        window.adInterval = interval;
        
        continueBtn.onclick = () => {
            clearInterval(window.adInterval);
            switchTab('resultados');
        };
    } else {
        // Fallback if elements don't exist
        switchTab('resultados');
    }
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

// Find user's current department based on the closest destination in appDestinos
function getUserDepartment() {
    if (!userLocation || !appDestinos || appDestinos.length === 0) return null;
    let closestDept = null;
    let minDist = Infinity;
    appDestinos.forEach(d => {
        if (d.lat !== null && d.lng !== null) {
            const dist = calculateDistance(userLocation.lat, userLocation.lng, d.lat, d.lng);
            if (dist < minDist) {
                minDist = dist;
                closestDept = d.departamento;
            }
        }
    });
    return closestDept;
}

// Find the distance to the closest coordinate inside a specific department
function getDistanceToDepartment(userLat, userLng, departamento) {
    if (!departamento) return null;
    const cleanTargetDept = removeAccents(departamento).trim().toLowerCase();
    let minDist = Infinity;
    appDestinos.forEach(d => {
        if (d.departamento && d.lat !== null && d.lng !== null) {
            const cleanDept = removeAccents(d.departamento).trim().toLowerCase();
            if (cleanDept === cleanTargetDept) {
                const dist = calculateDistance(userLat, userLng, d.lat, d.lng);
                if (dist < minDist) {
                    minDist = dist;
                }
            }
        }
    });
    return minDist === Infinity ? null : minDist;
}

// Remove accents/diacritics and convert to lowercase for search normalization
function removeAccents(str) {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Format raw Date strings and DD/MM/YYYY strings to clean localized texts
function formatEventDate(fechaStr, lang) {
    if (!fechaStr) return '';
    
    // 1. Check for DD/MM/YYYY format
    const slashRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const slashMatch = fechaStr.match(slashRegex);
    if (slashMatch) {
        const day = parseInt(slashMatch[1], 10);
        const month = parseInt(slashMatch[2], 10) - 1;
        const year = parseInt(slashMatch[3], 10);
        const parsedDate = new Date(year, month, day);
        if (!isNaN(parsedDate.getTime())) {
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            let locale = 'es-UY';
            if (lang === 'en') locale = 'en-US';
            if (lang === 'pt') locale = 'pt-BR';
            try {
                return new Intl.DateTimeFormat(locale, options).format(parsedDate);
            } catch (e) {
                return fechaStr;
            }
        }
    }
    
    // 2. Check for raw JS Date string format (e.g. "Fri Jul 31 2026...") or ISO format
    const isJSDate = /^[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d+\s+\d{4}/.test(fechaStr) || /^\d{4}-\d{2}-\d{2}/.test(fechaStr);
    if (isJSDate) {
        const parsedDate = new Date(fechaStr);
        if (!isNaN(parsedDate.getTime())) {
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            let locale = 'es-UY';
            if (lang === 'en') locale = 'en-US';
            if (lang === 'pt') locale = 'pt-BR';
            try {
                return new Intl.DateTimeFormat(locale, options).format(parsedDate);
            } catch (e) {
                return fechaStr;
            }
        }
    }
    
    return fechaStr;
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

// Spanish articles, prepositions, and conjunctions (stop words) to ignore when entered alone
const SPANISH_STOPWORDS = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'al', 'del',
    'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde', 
    'durante', 'en', 'entre', 'hacia', 'hasta', 'mediante', 'para', 
    'por', 'segun', 'sin', 'so', 'sobre', 'tras', 'versus', 'via',
    'y', 'o', 'u', 'e', 'que', 'ni'
]);

function getMeaningfulWords(text) {
    if (!text) return [];
    const clean = removeAccents(text.toLowerCase()).trim();
    if (!clean) return [];
    return clean.split(/\s+/).filter(w => w && !SPANISH_STOPWORDS.has(w));
}

// Calculate similarity score between search query and destination item
function calculateMatchScore(cleanQuery, item) {
    const meaningfulQueryWords = getMeaningfulWords(cleanQuery);
    // Ignore queries that consist ONLY of articles or prepositions
    if (meaningfulQueryWords.length === 0) {
        return 0;
    }

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

    // 2. Word-by-word fuzzy matches using meaningful words only
    const queryWords = meaningfulQueryWords;

    const destWords = getMeaningfulWords(item.destino);
    const deptoWords = getMeaningfulWords(item.departamento);
    
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
    displayedDestinationsCount = 10;
    const searchText = document.getElementById('search-input').value.trim();
    const selectedDepto = document.getElementById('filter-departamento').value;
    const selectedDif = document.getElementById('filter-dificultad').value;

    if (searchText || selectedDepto || selectedDif) {
        trackEvent('search_performed', {
            search_text: searchText || '(none)',
            department: selectedDepto || 'Todos',
            difficulty: selectedDif || 'Todos'
        });
    }

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
    let itemsWithScores = appDestinos.map(item => {
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

    // If there is an exact/complete match on destination or department name, filter out partial matches
    if (cleanQuery) {
        const hasCompleteMatch = itemsWithScores.some(row => {
            const cleanDest = removeAccents(row.item.destino).trim();
            const cleanDepto = removeAccents(row.item.departamento).trim();
            return cleanDest === cleanQuery || cleanDepto === cleanQuery;
        });
        
        if (hasCompleteMatch) {
            itemsWithScores = itemsWithScores.filter(row => {
                const cleanDest = removeAccents(row.item.destino).trim();
                const cleanDepto = removeAccents(row.item.departamento).trim();
                return cleanDest === cleanQuery || cleanDepto === cleanQuery;
            });
        }
    }

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
    showTransitionAd();
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
    const sliced = currentResults.slice(0, displayedDestinationsCount);
    sliced.forEach(item => {
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
                <div class="card-header-row" style="flex-wrap: wrap; gap: 8px; width: 100%;">
                    <div class="card-title-group" style="flex: 1; min-width: 200px;">
                        <div class="card-title"><span translate="no" class="notranslate">${item.destino}</span> ${distanceBadge}</div>
                        <div class="card-dept"><span translate="no" class="notranslate">${item.departamento}</span>${popularityText}</div>
                    </div>
                    <div class="card-actions-top">
                        <!-- Ver Fotos button -->
                        <button class="btn-ver-fotos-header btn-ver-fotos" data-i18n="card_view_photos">
                            📷 ${TRANSLATIONS[currentLang].card_view_photos}
                        </button>
                        <!-- Favorite star toggle -->
                        <button class="fav-toggle ${isFav ? 'active' : ''}" data-id="${item.id}" title="${isFav ? (currentLang === 'es' ? 'Quitar de favoritos' : 'Remove from favorites') : (currentLang === 'es' ? 'Agregar a favoritos' : 'Add to favorites')}">
                            ★
                        </button>
                        <!-- Share button -->
                        <button class="btn-share-icon" title="${currentLang === 'es' ? 'Compartir por WhatsApp' : 'Share via WhatsApp'}" onclick="shareDestination(${item.id}, event)" style="background: none; border: none; cursor: pointer; padding: 4px; display: inline-flex; align-items: center; justify-content: center;">
                            ${WHATSAPP_ICON_SVG}
                        </button>
                        <!-- Itinerary selection checkbox -->
                        <label class="route-checkbox-container ${isInItinerary ? 'selected' : ''}">
                            <input type="checkbox" class="route-check" ${isInItinerary ? 'checked' : ''} data-id="${item.id}">
                            <span data-i18n="card_route">${TRANSLATIONS[currentLang].card_route}</span>
                        </label>
                    </div>
                </div>

                <div class="info-block">
                    <div class="info-item">
                        <span class="info-label" data-i18n="card_features">${TRANSLATIONS[currentLang].card_features}</span>
                        <span class="info-text features">${currentLang === 'en' && item.caracteristicas_en ? item.caracteristicas_en : (currentLang === 'pt' && item.caracteristicas_pt ? item.caracteristicas_pt : item.caracteristicas)}</span>
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
                    <button class="btn btn-primary btn-como-ir" data-lat="${item.lat}" data-lng="${item.lng}" data-name="${item.destino}" data-i18n="card_how_to_go" style="width: 100%;">
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

        // "Ver Fotos" button
        card.querySelector('.btn-ver-fotos').addEventListener('click', () => {
            viewPhotos(item.destino, item.departamento);
        });

        grid.appendChild(card);
    });

    // Pagination: Load more button
    if (currentResults.length > displayedDestinationsCount) {
        const loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'load-more-container';
        loadMoreContainer.style.textAlign = 'center';
        loadMoreContainer.style.width = '100%';
        loadMoreContainer.style.marginTop = '20px';
        loadMoreContainer.style.marginBottom = '20px';
        
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'btn btn-secondary btn-load-more';
        loadMoreBtn.textContent = TRANSLATIONS[currentLang].btn_load_more;
        
        loadMoreBtn.onclick = () => {
            displayedDestinationsCount += 10;
            renderResults();
            
            // Smoothly scroll to the first newly added item
            const newIndex = displayedDestinationsCount - 10;
            if (grid.children[newIndex]) {
                grid.children[newIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
        
        loadMoreContainer.appendChild(loadMoreBtn);
        grid.appendChild(loadMoreContainer);
    }
}

// Render Events
function renderEventResults(grid) {
    const sliced = currentResults.slice(0, displayedEventsCount);
    sliced.forEach(ev => {
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
                    <div class="card-actions-top" style="display: flex; align-items: center; gap: 8px;">
                        <!-- Favorite star toggle for Event -->
                        <button class="fav-toggle event-fav-toggle ${favoriteEvents.includes(ev.id) ? 'active' : ''}" data-id="${ev.id}" title="${favoriteEvents.includes(ev.id) ? (currentLang === 'es' ? 'Quitar de favoritos' : 'Remove from favorites') : (currentLang === 'es' ? 'Agregar a favoritos' : 'Add to favorites')}">
                            ★
                        </button>
                        <!-- Share button for Event -->
                        <button class="btn-share-icon" title="${currentLang === 'es' ? 'Compartir por WhatsApp' : 'Share via WhatsApp'}" onclick="shareEvent(${ev.id}, event)" style="background: none; border: none; cursor: pointer; padding: 4px; display: inline-flex; align-items: center; justify-content: center;">
                            ${WHATSAPP_ICON_SVG}
                        </button>
                        <!-- Itinerary selection checkbox -->
                        <label class="route-checkbox-container ${isSaved ? 'selected' : ''}">
                            <input type="checkbox" class="route-check" ${isSaved ? 'checked' : ''} data-id="${ev.id}">
                            <span data-i18n="card_route">${TRANSLATIONS[currentLang].card_route}</span>
                        </label>
                    </div>
                </div>

                <div class="info-block" style="margin-top: 10px;">
                    <div class="event-meta-line" style="font-weight: 500;">
                        📅 <span class="event-date">${formatEventDate(ev.fecha, currentLang)}</span>
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
                <div class="card-action-row" style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                    ${showMap ? `
                    <button class="btn btn-primary btn-como-ir" style="flex: 1; min-width: 120px;">
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

        // Event Favorite toggle
        card.querySelector('.event-fav-toggle').addEventListener('click', (e) => {
            toggleFavoriteEvent(ev.id);
        });

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

        // No Ver Fotos button for events

        grid.appendChild(card);
    });

    // Pagination: Load more button
    if (currentResults.length > displayedEventsCount) {
        const loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'load-more-container';
        loadMoreContainer.style.textAlign = 'center';
        loadMoreContainer.style.width = '100%';
        loadMoreContainer.style.marginTop = '20px';
        loadMoreContainer.style.marginBottom = '20px';
        
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'btn btn-secondary btn-load-more';
        loadMoreBtn.textContent = TRANSLATIONS[currentLang].btn_load_more;
        
        loadMoreBtn.onclick = () => {
            displayedEventsCount += 10;
            renderResults();
            
            // Smoothly scroll to the first newly added item
            const newIndex = displayedEventsCount - 10;
            if (grid.children[newIndex]) {
                grid.children[newIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
        
        loadMoreContainer.appendChild(loadMoreBtn);
        grid.appendChild(loadMoreContainer);
    }
}

// Toggle Favorites
function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    if (index === -1) {
        favorites.push(id);
        const item = appDestinos.find(d => d.id === id);
        if (item) {
            trackEvent('add_to_favorites', {
                item_name: item.destino,
                department: item.departamento
            });
        }
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('uruexplorer_favorites', JSON.stringify(favorites));
    renderFavorites();
    
    // Sync star state in Results View and mini cards
    const resultsStars = document.querySelectorAll(`.fav-toggle[data-id="${id}"]`);
    resultsStars.forEach(star => {
        if (favorites.includes(id)) {
            star.classList.add('active');
            star.setAttribute('title', currentLang === 'es' ? 'Quitar de favoritos' : 'Remove from favorites');
        } else {
            star.classList.remove('active');
            star.setAttribute('title', currentLang === 'es' ? 'Agregar a favoritos' : 'Add to favorites');
        }
    });
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
            <div style="display: flex; align-items: center; gap: 4px;">
                <button class="btn-share-icon" title="${currentLang === 'es' ? 'Compartir' : 'Share'}" onclick="shareDestination(${item.id}, event)" style="background: none; border: none; cursor: pointer; padding: 4px; display: inline-flex; align-items: center; justify-content: center;">${WHATSAPP_ICON_SVG}</button>
                <button class="btn-mini-fav" title="${currentLang === 'es' ? 'Quitar de favoritos' : 'Remove from favorites'}">★</button>
            </div>
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

// Toggle Event Favorite
function toggleFavoriteEvent(id) {
    const index = favoriteEvents.indexOf(id);
    if (index === -1) {
        favoriteEvents.push(id);
        const ev = appEventos.find(e => e.id === id);
        if (ev) {
            trackEvent('add_event_to_favorites', {
                event_title: ev.titulo,
                department: ev.departamento
            });
        }
    } else {
        favoriteEvents.splice(index, 1);
    }
    localStorage.setItem('uruexplorer_favorite_events', JSON.stringify(favoriteEvents));
    renderFavoriteEvents();

    const eventStars = document.querySelectorAll(`.event-fav-toggle[data-id="${id}"]`);
    eventStars.forEach(star => {
        if (favoriteEvents.includes(id)) {
            star.classList.add('active');
            star.setAttribute('title', currentLang === 'es' ? 'Quitar de favoritos' : 'Remove from favorites');
        } else {
            star.classList.remove('active');
            star.setAttribute('title', currentLang === 'es' ? 'Agregar a favoritos' : 'Add to favorites');
        }
    });
}

// Render Event Favorites Shelf
function renderFavoriteEvents() {
    const shelf = document.getElementById('favorite-events-shelf');
    const grid = document.getElementById('favorite-events-grid');
    if (!shelf || !grid) return;

    grid.innerHTML = '';
    const favEvents = appEventos.filter(ev => favoriteEvents.includes(ev.id));

    if (favEvents.length === 0) {
        shelf.style.display = 'none';
        return;
    }

    shelf.style.display = 'block';
    favEvents.forEach(ev => {
        const card = document.createElement('div');
        card.className = 'favorite-mini-card';
        card.innerHTML = `
            <div class="fav-info" style="cursor: pointer;">
                <div class="fav-title notranslate" translate="no">${ev.titulo}</div>
                <div class="fav-dept notranslate" translate="no">${ev.destino}, ${ev.departamento} • ${formatEventDate(ev.fecha, currentLang)}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
                <button class="btn-share-icon" title="${currentLang === 'es' ? 'Compartir' : 'Share'}" onclick="shareEvent(${ev.id}, event)" style="background: none; border: none; cursor: pointer; padding: 4px; display: inline-flex; align-items: center; justify-content: center;">${WHATSAPP_ICON_SVG}</button>
                <button class="btn-mini-fav" title="${currentLang === 'es' ? 'Quitar de favoritos' : 'Remove from favorites'}">★</button>
            </div>
        `;

        card.querySelector('.fav-info').addEventListener('click', () => {
            currentResults = [ev];
            currentSearchMode = 'eventos';
            renderResults();
            switchTab('resultados');
        });

        card.querySelector('.btn-mini-fav').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavoriteEvent(ev.id);
        });

        grid.appendChild(card);
    });
}

// Share Destination via Web Share API or WhatsApp
function shareDestination(id, e) {
    if (e) e.stopPropagation();
    const item = appDestinos.find(d => d.id === id);
    if (!item) return;

    const photoUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(item.destino + ' ' + item.departamento + ' Uruguay')}`;
    
    let text = `🇺🇾 *UruExplorer - Destino Favorito*\n`;
    text += `📍 *${item.destino}* (${item.departamento})\n`;
    if (item.caracteristicas) {
        text += `✨ *Características*: ${item.caracteristicas}\n`;
    }
    text += `📸 *Ver fotos*: ${photoUrl}\n\n`;
    text += `¡Descubre Uruguay en UruExplorer!`;

    if (navigator.share) {
        navigator.share({
            title: item.destino,
            text: text,
            url: window.location.href
        }).catch(err => {
            console.log("Share cancelled or not supported, opening WhatsApp:", err);
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
        });
    } else {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
    trackEvent('share_destination', { destination_id: id, destination_name: item.destino });
}

// Share Event via Web Share API or WhatsApp
function shareEvent(id, e) {
    if (e) e.stopPropagation();
    const ev = appEventos.find(item => item.id === id);
    if (!ev) return;

    let text = `🇺🇾 *UruExplorer - Evento Favorito*\n`;
    text += `🎉 *${ev.titulo}*\n`;
    text += `📍 *Lugar*: ${ev.local || ev.destino} (${ev.departamento})\n`;
    text += `📅 *Fecha*: ${formatEventDate(ev.fecha, currentLang)}\n`;
    if (ev.ticketUrl) {
        text += `🎟️ *Entradas*: ${ev.ticketUrl}\n`;
    } else {
        const infoUrl = `https://www.google.com/search?q=${encodeURIComponent(ev.titulo + ' ' + ev.destino + ' Uruguay')}`;
        text += `📸 *Fotos e Info*: ${infoUrl}\n`;
    }
    text += `\n¡Descubre más eventos en UruExplorer!`;

    if (navigator.share) {
        navigator.share({
            title: ev.titulo,
            text: text,
            url: window.location.href
        }).catch(err => {
            console.log("Share cancelled or not supported, opening WhatsApp:", err);
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
        });
    } else {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
    trackEvent('share_event', { event_id: id, event_title: ev.titulo });
}

// Toggle Itinerary
function toggleItinerary(id) {
    const index = itinerary.findIndex(item => item.type === 'destination' && item.id === id);
    if (index === -1) {
        itinerary.push({ type: 'destination', id: id });
        const item = appDestinos.find(d => d.id === id);
        if (item) {
            trackEvent('add_to_itinerary', {
                item_name: item.destino,
                item_type: 'destination',
                department: item.departamento
            });
        }
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
        const ev = appEventos.find(e => e.id === id);
        if (ev) {
            trackEvent('add_to_itinerary', {
                item_name: ev.titulo,
                item_type: 'event',
                department: ev.departamento
            });
        }
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
                    <div class="step-dept"><span class="event-badge ${badgeClass}" style="display:inline-block; margin-right:5px; padding: 1px 4px; font-size:0.6rem;">${typeLabel}</span> ${ev.destino} (${formatEventDate(ev.fecha, currentLang)})${ev.local ? ` • 📍 ${ev.local}` : ''}</div>
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

// Search Google Images for a destination photos
function viewPhotos(destino, departamento) {
    const query = `${destino}, ${departamento}, Uruguay`;
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
}

// Directions ("Cómo ir") for a single destination
function getDirections(lat, lng, name, address, departamento) {
    let url = 'https://www.google.com/maps/dir/?api=1&';
    
    if (userLocation) {
        url += `origin=${userLocation.lat},${userLocation.lng}&`;
    }
    
    let finalDestination = '';
    
    if (address && departamento) {
        // 5-parameter call from Emergencies list: (lat, lng, name, address, depto)
        const decName = decodeURIComponent(name);
        const decAddress = decodeURIComponent(address);
        const decDepto = decodeURIComponent(departamento);
        finalDestination = `${decName}, ${decAddress}, ${decDepto}, Uruguay`;
    } else {
        // 4-parameter call from destinations/events: (lat, lng, name, depto)
        // Here we use coordinates directly
        finalDestination = `${lat},${lng}`;
    }
    
    url += `destination=${encodeURIComponent(finalDestination)}`;
    window.open(url, '_blank');
}

// Directions ("Cómo ir") to a specific venue/local
function getDirectionsToLocal(query, departamento) {
    let url = 'https://www.google.com/maps/dir/?api=1&';
    
    if (userLocation) {
        url += `origin=${userLocation.lat},${userLocation.lng}&`;
    }
    
    url += `destination=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
}

// Generate multi-point route on Google Maps ("Itinerario")
function triggerItineraryRoute() {
    if (itinerary.length === 0) return;

    trackEvent('route_plotted', {
        destinations_count: itinerary.filter(s => s.type === 'destination').length,
        events_count: itinerary.filter(s => s.type === 'event').length,
        total_count: itinerary.length
    });

    const points = [];

    itinerary.forEach(step => {
        if (step.type === 'destination') {
            const dest = appDestinos.find(d => d.id === step.id);
            if (dest && dest.lat !== null && dest.lng !== null) {
                points.push(`${dest.lat},${dest.lng}`);
            }
        } else if (step.type === 'event') {
            const ev = appEventos.find(e => e.id === step.id);
            if (ev) {
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
                <span class="event-date">${formatEventDate(ev.fecha, currentLang)}</span>
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
    displayedEventsCount = 10;
    const searchText = document.getElementById('search-event-input').value.trim();
    const selectedDepto = document.getElementById('filter-event-departamento').value;
    const selectedTipo = document.getElementById('filter-event-tipo').value;

    if (searchText || selectedDepto || selectedTipo) {
        trackEvent('event_search_performed', {
            search_text: searchText || '(none)',
            department: selectedDepto || 'Todos',
            event_type: selectedTipo || 'Todos'
        });
    }
    
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
            const meaningful = getMeaningfulWords(cleanQuery);
            if (meaningful.length === 0) {
                return false; // Exclude if query contains only articles or prepositions
            }
            const cleanTitle = removeAccents(ev.titulo);
            const cleanLocal = removeAccents(ev.local);
            if (!cleanTitle.includes(cleanQuery) && !cleanLocal.includes(cleanQuery)) {
                const matchesAnyWord = meaningful.some(w => cleanTitle.includes(w) || cleanLocal.includes(w));
                if (!matchesAnyWord) {
                    return false;
                }
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

    // Distance calculation if userLocation is available
    if (userLocation) {
        const userDept = getUserDepartment();
        matchedEvents.forEach(ev => {
            ev.distance = null;
            // 1. Try to find the specific destination coordinates
            const dest = appDestinos.find(d => removeAccents(d.destino) === removeAccents(ev.destino));
            if (dest && dest.lat !== null && dest.lng !== null) {
                ev.distance = calculateDistance(userLocation.lat, userLocation.lng, dest.lat, dest.lng);
            } else {
                // 2. Fallback: if no specific destination, use event's department
                if (userDept && ev.departamento) {
                    if (userDept.trim().toLowerCase() === ev.departamento.trim().toLowerCase()) {
                        ev.distance = 0; // Same department as user! Sort first!
                    } else {
                        // Calculate distance to closest point in that other department
                        ev.distance = getDistanceToDepartment(userLocation.lat, userLocation.lng, ev.departamento);
                    }
                }
            }
        });
        // Sort by proximity ascending
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
    showTransitionAd();
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
    
    if (Math.abs(diffX) > minDistance) {
        const currentIndex = TABS.indexOf(activeTabId);
        if (diffX < 0) {
            // Swipe Left (advance to next tab)
            if (currentIndex !== -1 && currentIndex < TABS.length - 1) {
                switchTab(TABS[currentIndex + 1]);
            }
        } else {
            if (currentIndex !== -1 && currentIndex > 0) {
                switchTab(TABS[currentIndex - 1]);
            }
        }
    }
}

const POLICE_STATIONS = [
    { name: 'Jefatura de Policía de Montevideo', depto: 'Montevideo', lat: -34.8698, lng: -56.1481, address: 'Av. José Pedro Varela 3440, Montevideo' },
    { name: 'Seccional 4ª de Policía (Cordón)', depto: 'Montevideo', lat: -34.8932, lng: -56.1770, address: 'Miguelete 1973, Montevideo' },
    { name: 'Seccional 13ª de Policía (Aguada)', depto: 'Montevideo', lat: -34.8698, lng: -56.1716, address: 'Bulevar General Artigas 3145, Montevideo' },
    { name: 'Seccional 10ª de Policía (Pocitos)', depto: 'Montevideo', lat: -34.9081, lng: -56.1511, address: 'Gabriel A. Pereira 3131, Montevideo' },
    { name: 'Seccional 14ª de Policía (Carrasco)', depto: 'Montevideo', lat: -34.8872, lng: -56.0903, address: 'Av. Italia 5727, Montevideo' },
    { name: 'Seccional 5ª de Policía (Cordón)', depto: 'Montevideo', lat: -34.9022, lng: -56.1711, address: 'Joaquín de Salterain 1210, Montevideo' },
    { name: 'Seccional 9ª de Policía (Parque Batlle)', depto: 'Montevideo', lat: -34.8911, lng: -56.1528, address: 'Av. Centenario 2743, Montevideo' },
    { name: 'Seccional 10ª - Punta del Este', depto: 'Maldonado', lat: -34.9631, lng: -54.9431, address: 'Calle 28 y 24, Punta del Este' },
    { name: 'Seccional 11ª - Piriápolis', depto: 'Maldonado', lat: -34.8631, lng: -55.2714, address: 'Simón del Pino, Piriápolis' },
    { name: 'Jefatura de Policía de Maldonado', depto: 'Maldonado', lat: -34.9083, lng: -54.9583, address: '18 de Julio y Ledesma, Maldonado' },
    { name: 'Subcomisaría Cabo Polonio', depto: 'Rocha', lat: -34.4011, lng: -53.7844, address: 'Cabo Polonio, Rocha' },
    { name: 'Comisaría La Paloma (Seccional 11ª)', depto: 'Rocha', lat: -34.6586, lng: -54.1611, address: 'Av. Nicolás Solari, La Paloma' },
    { name: 'Subcomisaría Punta del Diablo', depto: 'Rocha', lat: -34.0436, lng: -53.5414, address: 'Punta del Diablo, Rocha' },
    { name: 'Jefatura de Policía de Rocha', depto: 'Rocha', lat: -34.4819, lng: -54.3328, address: '18 de Julio 93, Rocha' },
    { name: 'Jefatura de Policía de Canelones', depto: 'Canelones', lat: -34.5244, lng: -56.2778, address: 'Tomás Berreta 392, Canelones' },
    { name: 'Seccional 17ª - Atlántida', depto: 'Canelones', lat: -34.7725, lng: -55.7583, address: 'Calle 18 y Av. Artigas, Atlántida' },
    { name: 'Seccional 19ª - Las Piedras', depto: 'Canelones', lat: -34.7264, lng: -56.2208, address: 'Las Piedras, Canelones' },
    { name: 'Jefatura de Policía de Colonia', depto: 'Colonia', lat: -34.4719, lng: -57.8436, address: 'General Flores 388, Colonia del Sacramento' },
    { name: 'Seccional 14ª - Carmelo', depto: 'Colonia', lat: -34.0044, lng: -58.2861, address: '19 de Abril 350, Carmelo' },
    { name: 'Jefatura de Policía de San José', depto: 'San José', lat: -34.3389, lng: -56.7136, address: 'Artigas 300, San José de Mayo' },
    { name: 'Jefatura de Policía de Soriano', depto: 'Soriano', lat: -33.2522, lng: -58.0305, address: 'Giménez 700, Mercedes' },
    { name: 'Jefatura de Policía de Río Negro', depto: 'Río Negro', lat: -33.1311, lng: -58.2989, address: '25 de Mayo 3192, Fray Bentos' },
    { name: 'Jefatura de Policía de Paysandú', depto: 'Paysandú', lat: -32.3219, lng: -58.0778, address: 'Leandro Gómez 990, Paysandú' },
    { name: 'Jefatura de Policía de Salto', depto: 'Salto', lat: -31.3839, lng: -57.9656, address: 'Artigas 350, Salto' },
    { name: 'Jefatura de Policía de Artigas', depto: 'Artigas', lat: -30.4006, lng: -56.4678, address: 'Lecueder 450, Artigas' },
    { name: 'Jefatura de Policía de Rivera', depto: 'Rivera', lat: -30.9028, lng: -55.5511, address: 'Agraciada 710, Rivera' },
    { name: 'Jefatura de Policía de Tacuarembó', depto: 'Tacuarembó', lat: -31.7144, lng: -55.9794, address: '18 de Julio 250, Tacuarembó' },
    { name: 'Jefatura de Policía de Cerro Largo', depto: 'Cerro Largo', lat: -32.3719, lng: -54.1844, address: 'Justo de Muto 400, Melo' },
    { name: 'Jefatura de Policía de Treinta y Tres', depto: 'Treinta y Tres', lat: -33.2344, lng: -54.3811, address: 'Manuel Meléndez 120, Treinta y Tres' },
    { name: 'Jefatura de Policía de Lavalleja', depto: 'Lavalleja', lat: -34.3769, lng: -55.2361, address: 'Batlle y Ordóñez 540, Minas' },
    { name: 'Jefatura de Policía de Florida', depto: 'Florida', lat: -34.0992, lng: -56.2136, address: 'Independencia 390, Florida' },
    { name: 'Jefatura de Policía de Flores', depto: 'Flores', lat: -33.5181, lng: -56.8989, address: 'Santísima Trinidad 510, Trinidad' },
    { name: 'Jefatura de Policía de Durazno', depto: 'Durazno', lat: -33.3828, lng: -56.5183, address: 'Artigas 450, Durazno' }
];

const MEDICAL_CENTERS = [
    { name: 'Hospital de Clínicas', depto: 'Montevideo', lat: -34.8919, lng: -56.1558, address: 'Av. Italia s/n, Montevideo' },
    { name: 'Hospital Maciel', depto: 'Montevideo', lat: -34.9083, lng: -56.2081, address: '25 de Mayo 172, Montevideo' },
    { name: 'Hospital Pereira Rossell', depto: 'Montevideo', lat: -34.8986, lng: -56.1633, address: 'Bulevar Artigas 1550, Montevideo' },
    { name: 'Hospital Pasteur', depto: 'Montevideo', lat: -34.8847, lng: -56.1389, address: 'Larravide 74, Montevideo' },
    { name: 'Médica Uruguaya (MUCAM)', depto: 'Montevideo', lat: -34.8914, lng: -56.1617, address: 'Av. 8 de Octubre 2492, Montevideo' },
    { name: 'Sanatorio Americano', depto: 'Montevideo', lat: -34.8991, lng: -56.1597, address: 'Isabelino Bosch 2466, Montevideo' },
    { name: 'Hospital Británico', depto: 'Montevideo', lat: -34.8919, lng: -56.1639, address: 'Av. Italia 2420, Montevideo' },
    { name: 'Hospital de Canelones', depto: 'Canelones', lat: -34.5275, lng: -56.2797, address: 'Dr. F. Soca 350, Canelones' },
    { name: 'Policlínica Médica Atlántida (ASSE)', depto: 'Canelones', lat: -34.7731, lng: -55.7602, address: 'Calle 18 y Roger Balet, Atlántida' },
    { name: 'Hospital de Maldonado', depto: 'Maldonado', lat: -34.9044, lng: -54.9622, address: 'Ventura Alegre s/n, Maldonado' },
    { name: 'Sanatorio Mautone', depto: 'Maldonado', lat: -34.9219, lng: -54.9458, address: 'Av. Roosevelt, Punta del Este' },
    { name: 'Hospital de Rocha', depto: 'Rocha', lat: -34.4814, lng: -54.3314, address: 'Treinta y Tres y 18 de Julio, Rocha' },
    { name: 'Policlínica ASSE La Paloma', depto: 'Rocha', lat: -34.6601, lng: -54.1614, address: 'Av. Nicolás Solari, La Paloma' },
    { name: 'Policlínica ASSE Punta del Diablo', depto: 'Rocha', lat: -34.0456, lng: -53.5422, address: 'Punta del Diablo, Rocha' },
    { name: 'Hospital de Colonia', depto: 'Colonia', lat: -34.4639, lng: -57.8389, address: 'Av. Franklin D. Roosevelt s/n, Colonia del Sacramento' },
    { name: 'Hospital de San José', depto: 'San José', lat: -34.3392, lng: -56.7114, address: 'A. Olarreaga s/n, San José de Mayo' },
    { name: 'Hospital de Soriano (Mercedes)', depto: 'Soriano', lat: -33.2536, lng: -58.0289, address: 'Sánchez s/n, Mercedes' },
    { name: 'Hospital de Río Negro (Fray Bentos)', depto: 'Río Negro', lat: -33.1328, lng: -58.3006, address: 'Av. 18 de Julio s/n, Fray Bentos' },
    { name: 'Hospital de Paysandú', depto: 'Paysandú', lat: -32.3236, lng: -58.0789, address: 'Montevideo s/n, Paysandú' },
    { name: 'Hospital de Salto', depto: 'Salto', lat: -31.3914, lng: -57.9628, address: 'Cervantes s/n, Salto' },
    { name: 'Hospital de Artigas', depto: 'Artigas', lat: -30.4022, lng: -56.4689, address: 'Lecueder s/n, Artigas' },
    { name: 'Hospital de Rivera', depto: 'Rivera', lat: -30.9044, lng: -55.5489, address: 'Av. Italia s/n, Rivera' },
    { name: 'Hospital de Tacuarembó', depto: 'Tacuarembó', lat: -31.7119, lng: -55.9772, address: 'Av. Oliver s/n, Tacuarembó' },
    { name: 'Hospital de Cerro Largo (Melo)', depto: 'Cerro Largo', lat: -32.3731, lng: -54.1856, address: 'Treinta y Tres s/n, Melo' },
    { name: 'Hospital de Treinta y Tres', depto: 'Treinta y Tres', lat: -33.2356, lng: -54.3822, address: 'Manuel Meléndez s/n, Treinta y Tres' },
    { name: 'Hospital de Lavalleja (Minas)', depto: 'Lavalleja', lat: -34.3789, lng: -55.2344, address: 'Av. Artigas s/n, Minas' },
    { name: 'Hospital de Florida', depto: 'Florida', lat: -34.0983, lng: -56.2114, address: 'General Flores s/n, Florida' },
    { name: 'Hospital de Flores (Trinidad)', depto: 'Flores', lat: -33.5197, lng: -56.8972, address: 'Santísima Trinidad s/n, Trinidad' },
    { name: 'Hospital de Durazno', depto: 'Durazno', lat: -33.3814, lng: -56.5197, address: '18 de Julio s/n, Durazno' }
];

const FUEL_STATIONS = [
    {
        "name": "ANCAP - Cabo Polonio",
        "depto": "Rocha",
        "lat": -34.40031,
        "lng": -53.78302,
        "address": "Centro o Ruta principal, Cabo Polonio"
    },
    {
        "name": "ANCAP - Quebrada de los Cuervos",
        "depto": "Treinta y Tres",
        "lat": -32.8542,
        "lng": -54.4568,
        "address": "Centro o Ruta principal, Quebrada de los Cuervos"
    },
    {
        "name": "ANCAP - Termas del Daymán",
        "depto": "Salto",
        "lat": -31.4208,
        "lng": -57.9042,
        "address": "Centro o Ruta principal, Termas del Daymán"
    },
    {
        "name": "ANCAP - Villa Serrana",
        "depto": "Lavalleja",
        "lat": -34.3267,
        "lng": -54.9856,
        "address": "Centro o Ruta principal, Villa Serrana"
    },
    {
        "name": "ANCAP - Cañadón de la Palma",
        "depto": "Maldonado",
        "lat": -34.7214,
        "lng": -55.3681,
        "address": "Centro o Ruta principal, Cañadón de la Palma"
    },
    {
        "name": "ANCAP - Quebradas del Norte",
        "depto": "Rivera",
        "lat": -31.1444,
        "lng": -55.9383,
        "address": "Centro o Ruta principal, Quebradas del Norte"
    },
    {
        "name": "ANCAP - Rincón de Franquía",
        "depto": "Artigas",
        "lat": -30.1872,
        "lng": -57.6253,
        "address": "Centro o Ruta principal, Rincón de Franquía"
    },
    {
        "name": "ANCAP - Ciudad Vieja",
        "depto": "Montevideo",
        "lat": -34.9064,
        "lng": -56.2045,
        "address": "Centro o Ruta principal, Ciudad Vieja"
    },
    {
        "name": "ANCAP - ANCAP Centro",
        "depto": "Montevideo",
        "lat": -34.9125,
        "lng": -56.1601,
        "address": "Av. 18 de Julio 1101, Rambla de Montevideo"
    },
    {
        "name": "DISA - DISA Pocitos",
        "depto": "Montevideo",
        "lat": -34.9145,
        "lng": -56.2001,
        "address": "Bvar. España 2602, Rambla de Montevideo"
    },
    {
        "name": "AXION - AXION Carrasco",
        "depto": "Montevideo",
        "lat": -34.8885,
        "lng": -56.0351,
        "address": "Av. Italia 5900, Rambla de Montevideo"
    },
    {
        "name": "ANCAP - ANCAP Tres Cruces",
        "depto": "Montevideo",
        "lat": -34.9005,
        "lng": -56.1271,
        "address": "Av. Italia 2402, Rambla de Montevideo"
    },
    {
        "name": "DISA - DISA Rambla",
        "depto": "Montevideo",
        "lat": -34.9025,
        "lng": -56.0681,
        "address": "Rambla O'Higgins 4902, Rambla de Montevideo"
    },
    {
        "name": "AXION - AXION Centro",
        "depto": "Montevideo",
        "lat": -34.9135,
        "lng": -56.1621,
        "address": "San José 901, Rambla de Montevideo"
    },
    {
        "name": "ANCAP - ANCAP Prado",
        "depto": "Montevideo",
        "lat": -34.8685,
        "lng": -56.1621,
        "address": "Av. Millán 3502, Rambla de Montevideo"
    },
    {
        "name": "ANCAP - ANCAP Paso de la Arena",
        "depto": "Montevideo",
        "lat": -34.8775,
        "lng": -56.2301,
        "address": "Av. Luis Batlle Berres 6200, Rambla de Montevideo"
    },
    {
        "name": "DISA - DISA Colón",
        "depto": "Montevideo",
        "lat": -34.8325,
        "lng": -56.1701,
        "address": "Av. Garzón 1802, Rambla de Montevideo"
    },
    {
        "name": "AXION - AXION Unión",
        "depto": "Montevideo",
        "lat": -34.9025,
        "lng": -56.1201,
        "address": "Av. 8 de Octubre 3602, Rambla de Montevideo"
    },
    {
        "name": "ANCAP - ANCAP Artigas",
        "depto": "Montevideo",
        "lat": -34.8878,
        "lng": -56.2575,
        "address": "Av. Lecueder, Museo Militar Fortaleza General Artigas (Cerro)"
    },
    {
        "name": "DISA - DISA Artigas Centro",
        "depto": "Montevideo",
        "lat": -34.8858,
        "lng": -56.2595,
        "address": "Av. Baltasar Brum, Museo Militar Fortaleza General Artigas (Cerro)"
    },
    {
        "name": "ANCAP - ANCAP Artigas",
        "depto": "Montevideo",
        "lat": -34.9065,
        "lng": -56.1998,
        "address": "Av. Lecueder, Monumento al Gral. José Gervasio Artigas"
    },
    {
        "name": "DISA - DISA Artigas Centro",
        "depto": "Montevideo",
        "lat": -34.9045,
        "lng": -56.2018,
        "address": "Av. Baltasar Brum, Monumento al Gral. José Gervasio Artigas"
    },
    {
        "name": "ANCAP - ANCAP Libertad",
        "depto": "Montevideo",
        "lat": -34.9058,
        "lng": -56.1914,
        "address": "Ruta 1 Km 51, Estatua de la Libertad (Plaza Cagancha)"
    },
    {
        "name": "ANCAP - ANCAP Las Piedras",
        "depto": "Canelones",
        "lat": -34.7264,
        "lng": -56.2189,
        "address": "Av. Instrucciones, Teatro Politeama de Las Piedras (Centro Cultural Carlitos)"
    },
    {
        "name": "AXION - AXION Las Piedras",
        "depto": "Canelones",
        "lat": -34.7244,
        "lng": -56.2209,
        "address": "Ruta 5 Km 21, Teatro Politeama de Las Piedras (Centro Cultural Carlitos)"
    },
    {
        "name": "ANCAP - ANCAP Atlántida",
        "depto": "Canelones",
        "lat": -34.7711,
        "lng": -55.7592,
        "address": "Ruta Interbalnearia Km 46.5, Centro Cultural Centro de Atlántida"
    },
    {
        "name": "AXION - AXION Atlántida",
        "depto": "Canelones",
        "lat": -34.7731,
        "lng": -55.7572,
        "address": "Ruta 11 y Ruta Interbalnearia, Centro Cultural Centro de Atlántida"
    },
    {
        "name": "ANCAP - ANCAP Santa Lucía",
        "depto": "Canelones",
        "lat": -34.4514,
        "lng": -56.4022,
        "address": "Av. Rivera, Anfiteatro del Río Santa Lucía"
    },
    {
        "name": "ANCAP - ANCAP Atlántida",
        "depto": "Canelones",
        "lat": -34.7725,
        "lng": -55.7622,
        "address": "Ruta Interbalnearia Km 46.5, Playa Mansa de Atlántida"
    },
    {
        "name": "AXION - AXION Atlántida",
        "depto": "Canelones",
        "lat": -34.7745,
        "lng": -55.7602,
        "address": "Ruta 11 y Ruta Interbalnearia, Playa Mansa de Atlántida"
    },
    {
        "name": "ANCAP - ANCAP Atlántida",
        "depto": "Canelones",
        "lat": -34.7703,
        "lng": -55.7489,
        "address": "Ruta Interbalnearia Km 46.5, Playa Brava de Atlántida"
    },
    {
        "name": "AXION - AXION Atlántida",
        "depto": "Canelones",
        "lat": -34.7723,
        "lng": -55.7469,
        "address": "Ruta 11 y Ruta Interbalnearia, Playa Brava de Atlántida"
    },
    {
        "name": "ANCAP - ANCAP Centro",
        "depto": "Canelones",
        "lat": -34.5244,
        "lng": -56.2811,
        "address": "Av. Martínez Butler, Museo Spikerman (Canelones Capital)"
    },
    {
        "name": "DISA - DISA Canelones",
        "depto": "Canelones",
        "lat": -34.5204,
        "lng": -56.2851,
        "address": "Ruta 5 Km 45, Museo Spikerman (Canelones Capital)"
    },
    {
        "name": "ANCAP - ANCAP Las Piedras",
        "depto": "Canelones",
        "lat": -34.7231,
        "lng": -56.2164,
        "address": "Av. Instrucciones, Museo de la Uva y el Vino (Las Piedras)"
    },
    {
        "name": "AXION - AXION Las Piedras",
        "depto": "Canelones",
        "lat": -34.7211,
        "lng": -56.2184,
        "address": "Ruta 5 Km 21, Museo de la Uva y el Vino (Las Piedras)"
    },
    {
        "name": "ANCAP - ANCAP Atlántida",
        "depto": "Canelones",
        "lat": -34.7736,
        "lng": -55.7661,
        "address": "Ruta Interbalnearia Km 46.5, Museo Pablo Neruda (Atlántida)"
    },
    {
        "name": "AXION - AXION Atlántida",
        "depto": "Canelones",
        "lat": -34.7756,
        "lng": -55.7641,
        "address": "Ruta 11 y Ruta Interbalnearia, Museo Pablo Neruda (Atlántida)"
    },
    {
        "name": "ANCAP - ANCAP Santa Lucía",
        "depto": "Canelones",
        "lat": -34.4539,
        "lng": -56.3958,
        "address": "Av. Rivera, Museo Histórico Municipal de Santa Lucía (Quinta Capurro)"
    },
    {
        "name": "ANCAP - ANCAP Atlántida",
        "depto": "Canelones",
        "lat": -34.7706,
        "lng": -55.7767,
        "address": "Ruta Interbalnearia Km 46.5, El Águila (Atlántida)"
    },
    {
        "name": "AXION - AXION Atlántida",
        "depto": "Canelones",
        "lat": -34.7726,
        "lng": -55.7747,
        "address": "Ruta 11 y Ruta Interbalnearia, El Águila (Atlántida)"
    },
    {
        "name": "ANCAP - ANCAP Parque del Plata",
        "depto": "Canelones",
        "lat": -34.7572,
        "lng": -55.6881,
        "address": "Ruta Interbalnearia Km 49, Parque del Plata (Desembocadura Solís Chico)"
    },
    {
        "name": "ANCAP - ANCAP Atlántida",
        "depto": "Canelones",
        "lat": -34.7397,
        "lng": -55.7667,
        "address": "Ruta Interbalnearia Km 46.5, Iglesia Cristo Obrero (Estación Atlántida)"
    },
    {
        "name": "AXION - AXION Atlántida",
        "depto": "Canelones",
        "lat": -34.7417,
        "lng": -55.7647,
        "address": "Ruta 11 y Ruta Interbalnearia, Iglesia Cristo Obrero (Estación Atlántida)"
    },
    {
        "name": "ANCAP - ANCAP Santa Lucía",
        "depto": "Canelones",
        "lat": -34.6189,
        "lng": -56.3533,
        "address": "Av. Rivera, Cerrillos y Humedales del Santa Lucía"
    },
    {
        "name": "ANCAP - Punta de la Salina",
        "depto": "Maldonado",
        "lat": -34.9642,
        "lng": -54.9492,
        "address": "Centro o Ruta principal, Punta de la Salina"
    },
    {
        "name": "ANCAP - ANCAP Pan de Azúcar",
        "depto": "Maldonado",
        "lat": -34.8136,
        "lng": -55.2575,
        "address": "Ruta 9 y Ruta 37, Cerro Pan de Azúcar y Reserva"
    },
    {
        "name": "ANCAP - Casapueblo",
        "depto": "Maldonado",
        "lat": -34.9083,
        "lng": -55.0444,
        "address": "Centro o Ruta principal, Casapueblo"
    },
    {
        "name": "ANCAP - Isla Gorriti",
        "depto": "Maldonado",
        "lat": -34.9583,
        "lng": -54.9694,
        "address": "Centro o Ruta principal, Isla Gorriti"
    },
    {
        "name": "ANCAP - Castillo de Piria",
        "depto": "Maldonado",
        "lat": -34.8433,
        "lng": -55.2444,
        "address": "Centro o Ruta principal, Castillo de Piria"
    },
    {
        "name": "ANCAP - Museo Ralli",
        "depto": "Maldonado",
        "lat": -34.9297,
        "lng": -54.9219,
        "address": "Centro o Ruta principal, Museo Ralli"
    },
    {
        "name": "ANCAP - ANCAP Centro",
        "depto": "Maldonado",
        "lat": -34.7972,
        "lng": -54.9189,
        "address": "Av. Ceberio, Museo Regional Carolino (San Carlos)"
    },
    {
        "name": "AXION - AXION San Carlos",
        "depto": "Maldonado",
        "lat": -34.8002,
        "lng": -54.9169,
        "address": "Ruta 39 Km 13, Museo Regional Carolino (San Carlos)"
    },
    {
        "name": "ANCAP - ANCAP Gorlero",
        "depto": "Maldonado",
        "lat": -34.9636,
        "lng": -54.9472,
        "address": "Av. Gorlero y Calle 30, Museo Paseo Neruda (Punta del Este)"
    },
    {
        "name": "AXION - AXION Roosevelt",
        "depto": "Maldonado",
        "lat": -34.9276,
        "lng": -54.9532,
        "address": "Av. Roosevelt y Parada 16, Museo Paseo Neruda (Punta del Este)"
    },
    {
        "name": "ANCAP - ANCAP Gorlero",
        "depto": "Maldonado",
        "lat": -34.9458,
        "lng": -54.9411,
        "address": "Av. Gorlero y Calle 30, Playa Mansa (Punta del Este)"
    },
    {
        "name": "AXION - AXION Roosevelt",
        "depto": "Maldonado",
        "lat": -34.9098,
        "lng": -54.9471,
        "address": "Av. Roosevelt y Parada 16, Playa Mansa (Punta del Este)"
    },
    {
        "name": "DISA - DISA Roosevelt",
        "depto": "Maldonado",
        "lat": -34.9025,
        "lng": -54.9575,
        "address": "Av. Roosevelt y Camacho, Teatro de la Casa de la Cultura (Maldonado)"
    },
    {
        "name": "ANCAP - ANCAP Centro",
        "depto": "Maldonado",
        "lat": -34.8925,
        "lng": -54.9375,
        "address": "Av. Batlle y Ordóñez, Teatro de la Casa de la Cultura (Maldonado)"
    },
    {
        "name": "ANCAP - ANCAP Centro",
        "depto": "Maldonado",
        "lat": -34.7958,
        "lng": -54.9214,
        "address": "Av. Ceberio, Teatro Club Unión de San Carlos"
    },
    {
        "name": "AXION - AXION San Carlos",
        "depto": "Maldonado",
        "lat": -34.7988,
        "lng": -54.9194,
        "address": "Ruta 39 Km 13, Teatro Club Unión de San Carlos"
    },
    {
        "name": "ANCAP - ANCAP La Barra",
        "depto": "Maldonado",
        "lat": -34.9161,
        "lng": -54.8847,
        "address": "Ruta 10 Km 160, Puente Ondulante de La Barra"
    },
    {
        "name": "ANCAP - ANCAP Rambla",
        "depto": "Canelones",
        "lat": -34.8431,
        "lng": -55.2441,
        "address": "Rambla De Los Argentinos y Manuel Freire, Museo Didáctico Artiguista (Piriápolis)"
    },
    {
        "name": "DISA - DISA Artigas",
        "depto": "Canelones",
        "lat": -34.8491,
        "lng": -55.2381,
        "address": "Av. Artigas y Misiones, Museo Didáctico Artiguista (Piriápolis)"
    },
    {
        "name": "ANCAP - ANCAP Gorlero",
        "depto": "Maldonado",
        "lat": -34.9644,
        "lng": -54.9419,
        "address": "Av. Gorlero y Calle 30, Playa De los Ingleses (Punta del Este)"
    },
    {
        "name": "AXION - AXION Roosevelt",
        "depto": "Maldonado",
        "lat": -34.9284,
        "lng": -54.9479,
        "address": "Av. Roosevelt y Parada 16, Playa De los Ingleses (Punta del Este)"
    },
    {
        "name": "ANCAP - ANCAP Rambla",
        "depto": "Maldonado",
        "lat": -34.8664,
        "lng": -55.2758,
        "address": "Rambla De Los Argentinos y Manuel Freire, Playa Piriápolis (Rambla de los Argentinos)"
    },
    {
        "name": "DISA - DISA Artigas",
        "depto": "Maldonado",
        "lat": -34.8724,
        "lng": -55.2698,
        "address": "Av. Artigas y Misiones, Playa Piriápolis (Rambla de los Argentinos)"
    },
    {
        "name": "ANCAP - Boca del Cufré",
        "depto": "San José",
        "lat": -34.4442,
        "lng": -57.1519,
        "address": "Centro o Ruta principal, Boca del Cufré"
    },
    {
        "name": "ANCAP - Sierras de Mahoma",
        "depto": "San José",
        "lat": -34.0683,
        "lng": -56.9114,
        "address": "Centro o Ruta principal, Sierras de Mahoma"
    },
    {
        "name": "ANCAP - Picada Varela",
        "depto": "San José",
        "lat": -34.3122,
        "lng": -56.7015,
        "address": "Centro o Ruta principal, Picada Varela"
    },
    {
        "name": "DISA - DISA San José",
        "depto": "San José",
        "lat": -34.3375,
        "lng": -56.7136,
        "address": "Ruta 3 Km 92, San José de Mayo (Centro Histórico)"
    },
    {
        "name": "ANCAP - ANCAP San José Centro",
        "depto": "San José",
        "lat": -34.3355,
        "lng": -56.7116,
        "address": "Av. Manuel D. Rodríguez, San José de Mayo (Centro Histórico)"
    },
    {
        "name": "DISA - DISA San José",
        "depto": "San José",
        "lat": -34.3233,
        "lng": -56.7214,
        "address": "Ruta 3 Km 92, Parque Rodó (San José de Mayo)"
    },
    {
        "name": "ANCAP - ANCAP San José Centro",
        "depto": "San José",
        "lat": -34.3213,
        "lng": -56.7194,
        "address": "Av. Manuel D. Rodríguez, Parque Rodó (San José de Mayo)"
    },
    {
        "name": "ANCAP - Quinta del Horno",
        "depto": "San José",
        "lat": -34.3441,
        "lng": -56.7225,
        "address": "Centro o Ruta principal, Quinta del Horno"
    },
    {
        "name": "ANCAP - ANCAP Santa Lucía",
        "depto": "San José",
        "lat": -34.7814,
        "lng": -56.3497,
        "address": "Av. Rivera, Isla de Flores (Río Santa Lucía)"
    },
    {
        "name": "ANCAP - ANCAP Santa Lucía",
        "depto": "San José",
        "lat": -34.7719,
        "lng": -56.3561,
        "address": "Av. Rivera, Humedales del Santa Lucía (Sector San José)"
    },
    {
        "name": "ANCAP - Termas del Arapey",
        "depto": "Salto",
        "lat": -30.9342,
        "lng": -57.5189,
        "address": "Centro o Ruta principal, Termas del Arapey"
    },
    {
        "name": "ANCAP - ANCAP Salto",
        "depto": "Salto",
        "lat": -31.2711,
        "lng": -57.9405,
        "address": "Av. Blandengues y Av. Batlle, Represa de Salto Grande"
    },
    {
        "name": "DISA - DISA Salto Barbieri",
        "depto": "Salto",
        "lat": -31.2821,
        "lng": -57.9325,
        "address": "Av. Barbieri y Gualeguay, Represa de Salto Grande"
    },
    {
        "name": "AXION - AXION Salto Centro",
        "depto": "Salto",
        "lat": -31.2661,
        "lng": -57.9455,
        "address": "Uruguay y Larrañaga, Represa de Salto Grande"
    },
    {
        "name": "ANCAP - ANCAP Salto",
        "depto": "Salto",
        "lat": -31.3755,
        "lng": -57.9672,
        "address": "Av. Blandengues y Av. Batlle, Costanera Norte de Salto"
    },
    {
        "name": "DISA - DISA Salto Barbieri",
        "depto": "Salto",
        "lat": -31.3865,
        "lng": -57.9592,
        "address": "Av. Barbieri y Gualeguay, Costanera Norte de Salto"
    },
    {
        "name": "AXION - AXION Salto Centro",
        "depto": "Salto",
        "lat": -31.3705,
        "lng": -57.9722,
        "address": "Uruguay y Larrañaga, Costanera Norte de Salto"
    },
    {
        "name": "ANCAP - ANCAP Treinta y Tres",
        "depto": "Salto",
        "lat": -31.3889,
        "lng": -57.9622,
        "address": "Ruta 8 Km 286, Plaza Treinta y Tres Orientales"
    },
    {
        "name": "DISA - DISA Treinta y Tres",
        "depto": "Salto",
        "lat": -31.3869,
        "lng": -57.9642,
        "address": "Av. Juan Antonio Lavalleja, Plaza Treinta y Tres Orientales"
    },
    {
        "name": "ANCAP - ANCAP Salto",
        "depto": "Salto",
        "lat": -31.1891,
        "lng": -57.9912,
        "address": "Av. Blandengues y Av. Batlle, Meseta de Artigas (Sector Salto / Río Uruguay)"
    },
    {
        "name": "DISA - DISA Salto Barbieri",
        "depto": "Salto",
        "lat": -31.2001,
        "lng": -57.9832,
        "address": "Av. Barbieri y Gualeguay, Meseta de Artigas (Sector Salto / Río Uruguay)"
    },
    {
        "name": "AXION - AXION Salto Centro",
        "depto": "Salto",
        "lat": -31.1841,
        "lng": -57.9962,
        "address": "Uruguay y Larrañaga, Meseta de Artigas (Sector Salto / Río Uruguay)"
    },
    {
        "name": "ANCAP - ANCAP Salto",
        "depto": "Salto",
        "lat": -31.3894,
        "lng": -57.9619,
        "address": "Av. Blandengues y Av. Batlle, Ateneo de Salto"
    },
    {
        "name": "DISA - DISA Salto Barbieri",
        "depto": "Salto",
        "lat": -31.4004,
        "lng": -57.9539,
        "address": "Av. Barbieri y Gualeguay, Ateneo de Salto"
    },
    {
        "name": "AXION - AXION Salto Centro",
        "depto": "Salto",
        "lat": -31.3844,
        "lng": -57.9669,
        "address": "Uruguay y Larrañaga, Ateneo de Salto"
    },
    {
        "name": "ANCAP - ANCAP Salto",
        "depto": "Salto",
        "lat": -31.3856,
        "lng": -57.9547,
        "address": "Av. Blandengues y Av. Batlle, Estación Central de Trenes de Salto"
    },
    {
        "name": "DISA - DISA Salto Barbieri",
        "depto": "Salto",
        "lat": -31.3966,
        "lng": -57.9467,
        "address": "Av. Barbieri y Gualeguay, Estación Central de Trenes de Salto"
    },
    {
        "name": "AXION - AXION Salto Centro",
        "depto": "Salto",
        "lat": -31.3806,
        "lng": -57.9597,
        "address": "Uruguay y Larrañaga, Estación Central de Trenes de Salto"
    },
    {
        "name": "ANCAP - ANCAP Salto",
        "depto": "Salto",
        "lat": -31.3514,
        "lng": -57.9611,
        "address": "Av. Blandengues y Av. Batlle, Salto Chico (Saltos del Río Uruguay)"
    },
    {
        "name": "DISA - DISA Salto Barbieri",
        "depto": "Salto",
        "lat": -31.3624,
        "lng": -57.9531,
        "address": "Av. Barbieri y Gualeguay, Salto Chico (Saltos del Río Uruguay)"
    },
    {
        "name": "AXION - AXION Salto Centro",
        "depto": "Salto",
        "lat": -31.3464,
        "lng": -57.9661,
        "address": "Uruguay y Larrañaga, Salto Chico (Saltos del Río Uruguay)"
    },
    {
        "name": "ANCAP - Ecoparque Tálice",
        "depto": "Flores",
        "lat": -33.5678,
        "lng": -56.9123,
        "address": "Centro o Ruta principal, Ecoparque Tálice"
    },
    {
        "name": "ANCAP - Lagos de Andresito",
        "depto": "Flores",
        "lat": -33.1023,
        "lng": -57.1721,
        "address": "Centro o Ruta principal, Lagos de Andresito"
    },
    {
        "name": "ANCAP - Balneario Don Ricardo",
        "depto": "Flores",
        "lat": -33.4912,
        "lng": -56.8845,
        "address": "Centro o Ruta principal, Balneario Don Ricardo"
    },
    {
        "name": "ANCAP - Zooilógico del Futuro",
        "depto": "Flores",
        "lat": -33.5432,
        "lng": -56.9012,
        "address": "Centro o Ruta principal, Zooilógico del Futuro"
    },
    {
        "name": "ANCAP - Parque Centenario",
        "depto": "Flores",
        "lat": -33.5189,
        "lng": -56.8991,
        "address": "Centro o Ruta principal, Parque Centenario"
    },
    {
        "name": "ANCAP - ANCAP Trinidad",
        "depto": "Flores",
        "lat": -33.5165,
        "lng": -56.8973,
        "address": "Ruta 3 Km 189, Plaza Constitución de Trinidad"
    },
    {
        "name": "ANCAP - ANCAP Trinidad",
        "depto": "Flores",
        "lat": -33.5168,
        "lng": -56.8968,
        "address": "Ruta 3 Km 189, Parroquia Santísima Trinidad"
    },
    {
        "name": "ANCAP - Parque Bartolomé Hidalgo",
        "depto": "Flores",
        "lat": -33.1215,
        "lng": -57.195,
        "address": "Centro o Ruta principal, Parque Bartolomé Hidalgo"
    },
    {
        "name": "ANCAP - Piedra Alta",
        "depto": "Florida",
        "lat": -34.1039,
        "lng": -56.2231,
        "address": "Centro o Ruta principal, Piedra Alta"
    },
    {
        "name": "ANCAP - ANCAP Florida",
        "depto": "Florida",
        "lat": -34.0995,
        "lng": -56.2142,
        "address": "Ruta 5 Km 96, Catedral Basílica de Florida y Santuario de la Virgen de los Treinta y Tres"
    },
    {
        "name": "DISA - DISA Florida Centro",
        "depto": "Florida",
        "lat": -34.0965,
        "lng": -56.2172,
        "address": "Av. Zelmar Michelini, Catedral Basílica de Florida y Santuario de la Virgen de los Treinta y Tres"
    },
    {
        "name": "ANCAP - Capilla de San Cono",
        "depto": "Florida",
        "lat": -34.0911,
        "lng": -56.2105,
        "address": "Centro o Ruta principal, Capilla de San Cono"
    },
    {
        "name": "ANCAP - Camping Parque Robaina",
        "depto": "Florida",
        "lat": -34.1085,
        "lng": -56.2312,
        "address": "Centro o Ruta principal, Camping Parque Robaina"
    },
    {
        "name": "ANCAP - Capilla de Fenocchi",
        "depto": "Florida",
        "lat": -34.0622,
        "lng": -56.1118,
        "address": "Centro o Ruta principal, Capilla de Fenocchi"
    },
    {
        "name": "ANCAP - Represa de Paso Severino",
        "depto": "Florida",
        "lat": -34.3639,
        "lng": -56.2417,
        "address": "Centro o Ruta principal, Represa de Paso Severino"
    },
    {
        "name": "ANCAP - ANCAP Treinta y Tres",
        "depto": "Florida",
        "lat": -34.1812,
        "lng": -56.1745,
        "address": "Ruta 8 Km 286, Capilla de la Virgen de los Treinta y Tres (Pintado)"
    },
    {
        "name": "DISA - DISA Treinta y Tres",
        "depto": "Florida",
        "lat": -34.1792,
        "lng": -56.1765,
        "address": "Av. Juan Antonio Lavalleja, Capilla de la Virgen de los Treinta y Tres (Pintado)"
    },
    {
        "name": "ANCAP - Termas de Almirón",
        "depto": "Paysandú",
        "lat": -32.3686,
        "lng": -57.1583,
        "address": "Centro o Ruta principal, Termas de Almirón"
    },
    {
        "name": "ANCAP - ANCAP Artigas",
        "depto": "Paysandú",
        "lat": -31.6214,
        "lng": -57.9458,
        "address": "Av. Lecueder, Meseta de Artigas"
    },
    {
        "name": "DISA - DISA Artigas Centro",
        "depto": "Paysandú",
        "lat": -31.6194,
        "lng": -57.9478,
        "address": "Av. Baltasar Brum, Meseta de Artigas"
    },
    {
        "name": "ANCAP - Castillo Morató",
        "depto": "Paysandú",
        "lat": -31.8542,
        "lng": -56.8124,
        "address": "Centro o Ruta principal, Castillo Morató"
    },
    {
        "name": "ANCAP - ANCAP Guichón",
        "depto": "Paysandú",
        "lat": -32.3489,
        "lng": -57.2014,
        "address": "Av. Artigas, Ruta de los Murales de San Javier y Guichón"
    },
    {
        "name": "ANCAP - Teatro Florencio Sánchez",
        "depto": "Paysandú",
        "lat": -32.3167,
        "lng": -58.0789,
        "address": "Centro o Ruta principal, Teatro Florencio Sánchez"
    },
    {
        "name": "ANCAP - Montes del Queguay",
        "depto": "Paysandú",
        "lat": -32.2158,
        "lng": -57.4421,
        "address": "Centro o Ruta principal, Montes del Queguay"
    },
    {
        "name": "ANCAP - Monumento a Perpetuidad",
        "depto": "Paysandú",
        "lat": -32.3245,
        "lng": -58.0754,
        "address": "Centro o Ruta principal, Monumento a Perpetuidad"
    },
    {
        "name": "ANCAP - ANCAP Las Piedras",
        "depto": "Paysandú",
        "lat": -32.3124,
        "lng": -57.2514,
        "address": "Av. Instrucciones, Balneario Alternativo Paso de las Piedras"
    },
    {
        "name": "AXION - AXION Las Piedras",
        "depto": "Paysandú",
        "lat": -32.3104,
        "lng": -57.2534,
        "address": "Ruta 5 Km 21, Balneario Alternativo Paso de las Piedras"
    },
    {
        "name": "ANCAP - ANCAP Paysandú",
        "depto": "Paysandú",
        "lat": -32.3154,
        "lng": -58.0812,
        "address": "Ruta 3 Km 376, Museo Histórico de Paysandú"
    },
    {
        "name": "AXION - AXION Paysandú España",
        "depto": "Paysandú",
        "lat": -32.3204,
        "lng": -58.0702,
        "address": "Av. España y Felippone, Museo Histórico de Paysandú"
    },
    {
        "name": "DISA - DISA Paysandú Centro",
        "depto": "Paysandú",
        "lat": -32.3134,
        "lng": -58.0832,
        "address": "Av. 18 de Julio, Museo Histórico de Paysandú"
    },
    {
        "name": "ANCAP - ANCAP Paysandú",
        "depto": "Paysandú",
        "lat": -31.4512,
        "lng": -57.6541,
        "address": "Ruta 3 Km 376, Arapey Chico (Tramo Paysandú)"
    },
    {
        "name": "AXION - AXION Paysandú España",
        "depto": "Paysandú",
        "lat": -31.4562,
        "lng": -57.6431,
        "address": "Av. España y Felippone, Arapey Chico (Tramo Paysandú)"
    },
    {
        "name": "DISA - DISA Paysandú Centro",
        "depto": "Paysandú",
        "lat": -31.4492,
        "lng": -57.6561,
        "address": "Av. 18 de Julio, Arapey Chico (Tramo Paysandú)"
    },
    {
        "name": "ANCAP - Isla del Infante",
        "depto": "Río Negro",
        "lat": -32.9344,
        "lng": -58.0782,
        "address": "Centro o Ruta principal, Isla del Infante"
    },
    {
        "name": "ANCAP - ANCAP Fray Bentos",
        "depto": "Río Negro",
        "lat": -33.1224,
        "lng": -58.3142,
        "address": "Ruta 2 Km 309, Muelle Oficial de Fray Bentos"
    },
    {
        "name": "DISA - DISA Fray Bentos Centro",
        "depto": "Río Negro",
        "lat": -33.1204,
        "lng": -58.3162,
        "address": "Av. 18 de Julio, Muelle Oficial de Fray Bentos"
    },
    {
        "name": "ANCAP - Pueblo Grecco",
        "depto": "Río Negro",
        "lat": -32.7412,
        "lng": -57.1845,
        "address": "Centro o Ruta principal, Pueblo Grecco"
    },
    {
        "name": "ANCAP - ANCAP Fray Bentos",
        "depto": "Río Negro",
        "lat": -33.1284,
        "lng": -58.3121,
        "address": "Ruta 2 Km 309, Playa del Club Remeros Fray Bentos"
    },
    {
        "name": "DISA - DISA Fray Bentos Centro",
        "depto": "Río Negro",
        "lat": -33.1264,
        "lng": -58.3141,
        "address": "Av. 18 de Julio, Playa del Club Remeros Fray Bentos"
    },
    {
        "name": "ANCAP - Paso de los Mellizos",
        "depto": "Río Negro",
        "lat": -32.4912,
        "lng": -57.2941,
        "address": "Centro o Ruta principal, Paso de los Mellizos"
    },
    {
        "name": "ANCAP - Paraje Tres Quintas",
        "depto": "Río Negro",
        "lat": -32.7214,
        "lng": -58.0124,
        "address": "Centro o Ruta principal, Paraje Tres Quintas"
    },
    {
        "name": "ANCAP - ANCAP Fray Bentos",
        "depto": "Río Negro",
        "lat": -33.1167,
        "lng": -58.3167,
        "address": "Ruta 2 Km 309, Paisaje Cultural Fray Bentos (Ex Anglo)"
    },
    {
        "name": "DISA - DISA Fray Bentos Centro",
        "depto": "Río Negro",
        "lat": -33.1147,
        "lng": -58.3187,
        "address": "Av. 18 de Julio, Paisaje Cultural Fray Bentos (Ex Anglo)"
    },
    {
        "name": "ANCAP - ANCAP Young",
        "depto": "Río Negro",
        "lat": -32.6944,
        "lng": -57.6294,
        "address": "Ruta 3 Km 310, Paseo del Ferrocarril (Young)"
    },
    {
        "name": "ANCAP - ANCAP Fray Bentos",
        "depto": "Río Negro",
        "lat": -33.1252,
        "lng": -58.3075,
        "address": "Ruta 2 Km 309, Paseo de la Rambla (Fray Bentos)"
    },
    {
        "name": "DISA - DISA Fray Bentos Centro",
        "depto": "Río Negro",
        "lat": -33.1232,
        "lng": -58.3095,
        "address": "Av. 18 de Julio, Paseo de la Rambla (Fray Bentos)"
    },
    {
        "name": "ANCAP - ANCAP Young",
        "depto": "Río Negro",
        "lat": -33.1311,
        "lng": -58.3103,
        "address": "Ruta 3 Km 310, Teatro Young"
    },
    {
        "name": "ANCAP - Calle de los Suspiros",
        "depto": "Colonia",
        "lat": -34.4721,
        "lng": -57.8589,
        "address": "Centro o Ruta principal, Calle de los Suspiros"
    },
    {
        "name": "ANCAP - ANCAP Centro",
        "depto": "Colonia",
        "lat": -34.4378,
        "lng": -57.8614,
        "address": "Av. Ceberio, Plaza de Toros Real de San Carlos"
    },
    {
        "name": "AXION - AXION San Carlos",
        "depto": "Colonia",
        "lat": -34.4408,
        "lng": -57.8594,
        "address": "Ruta 39 Km 13, Plaza de Toros Real de San Carlos"
    },
    {
        "name": "ANCAP - ANCAP Colonia",
        "depto": "Colonia",
        "lat": -34.4724,
        "lng": -57.8593,
        "address": "Av. Roosevelt y Manuel Lobo, Faro de Colonia del Sacramento"
    },
    {
        "name": "DISA - DISA Real de San Carlos",
        "depto": "Colonia",
        "lat": -34.4984,
        "lng": -57.8373,
        "address": "Av. Mihanovich, Faro de Colonia del Sacramento"
    },
    {
        "name": "AXION - AXION Colonia",
        "depto": "Colonia",
        "lat": -34.4744,
        "lng": -57.8473,
        "address": "Ruta 1 Km 176, Faro de Colonia del Sacramento"
    },
    {
        "name": "ANCAP - Acuario de Colonia",
        "depto": "Colonia",
        "lat": -34.4714,
        "lng": -57.8569,
        "address": "Centro o Ruta principal, Acuario de Colonia"
    },
    {
        "name": "ANCAP - Balneario Santa Ana",
        "depto": "Colonia",
        "lat": -34.4533,
        "lng": -57.6989,
        "address": "Centro o Ruta principal, Balneario Santa Ana"
    },
    {
        "name": "ANCAP - ANCAP Nueva Helvecia",
        "depto": "Colonia",
        "lat": -34.3022,
        "lng": -57.2344,
        "address": "Av. Batlle y Ordóñez, Nueva Helvecia (Colonia Suiza)"
    },
    {
        "name": "ANCAP - ANCAP Carmelo",
        "depto": "Colonia",
        "lat": -34.0047,
        "lng": -58.2861,
        "address": "Av. Paraguay, Carmelo y su Puente Giratorio"
    },
    {
        "name": "DISA - DISA Carmelo",
        "depto": "Colonia",
        "lat": -34.0027,
        "lng": -58.2881,
        "address": "Ruta 21 Km 252, Carmelo y su Puente Giratorio"
    },
    {
        "name": "DISA - DISA Colonia Valdense",
        "depto": "Colonia",
        "lat": -34.3194,
        "lng": -57.2647,
        "address": "Ruta 1 Km 121, Colonia Valdense"
    },
    {
        "name": "ANCAP - ANCAP Rosario",
        "depto": "Colonia",
        "lat": -34.3136,
        "lng": -57.3483,
        "address": "Ruta 2 Km 130, Rosario (Rosario del Colla)"
    },
    {
        "name": "ANCAP - ANCAP Santa Lucía",
        "depto": "San José",
        "lat": -34.7861,
        "lng": -56.3508,
        "address": "Av. Rivera, Humedales del Santa Lucía (Sector San José)"
    },
    {
        "name": "DISA - DISA San José",
        "depto": "San José",
        "lat": -34.3408,
        "lng": -56.7131,
        "address": "Ruta 3 Km 92, Catedral Basílica de San José de Mayo"
    },
    {
        "name": "ANCAP - ANCAP San José Centro",
        "depto": "San José",
        "lat": -34.3388,
        "lng": -56.7111,
        "address": "Av. Manuel D. Rodríguez, Catedral Basílica de San José de Mayo"
    },
    {
        "name": "ANCAP - ANCAP Mercedes",
        "depto": "Soriano",
        "lat": -33.2505,
        "lng": -58.0311,
        "address": "Ruta 2 Km 278, Rambla de Mercedes"
    },
    {
        "name": "DISA - DISA Mercedes Centro",
        "depto": "Soriano",
        "lat": -33.2475,
        "lng": -58.0341,
        "address": "Av. Asencio, Rambla de Mercedes"
    },
    {
        "name": "ANCAP - Isla del Puerto",
        "depto": "Soriano",
        "lat": -33.2464,
        "lng": -58.0356,
        "address": "Centro o Ruta principal, Isla del Puerto"
    },
    {
        "name": "ANCAP - Castillo Mauá",
        "depto": "Soriano",
        "lat": -33.2547,
        "lng": -58.0714,
        "address": "Centro o Ruta principal, Castillo Mauá"
    },
    {
        "name": "ANCAP - ANCAP Dolores",
        "depto": "Soriano",
        "lat": -33.5358,
        "lng": -58.2144,
        "address": "Av. Artigas y Sotura, Dolores (Capital del Trigo)"
    },
    {
        "name": "ANCAP - ANCAP Cardona",
        "depto": "Soriano",
        "lat": -33.8822,
        "lng": -57.3811,
        "address": "Ruta 2 Km 180, Cardona"
    },
    {
        "name": "ANCAP - Museo Alejandro Berro",
        "depto": "Soriano",
        "lat": -33.2544,
        "lng": -58.0719,
        "address": "Centro o Ruta principal, Museo Alejandro Berro"
    },
    {
        "name": "ANCAP - Balneario El Edén",
        "depto": "Soriano",
        "lat": -33.5111,
        "lng": -58.1814,
        "address": "Centro o Ruta principal, Balneario El Edén"
    },
    {
        "name": "ANCAP - Sarandí del Yí",
        "depto": "Durazno",
        "lat": -33.3458,
        "lng": -55.6311,
        "address": "Centro o Ruta principal, Sarandí del Yí"
    },
    {
        "name": "ANCAP - ANCAP Rivera",
        "depto": "Durazno",
        "lat": -33.3856,
        "lng": -56.5222,
        "address": "Av. Sarandí y Paysandú, Museo Histórico \\\"Casa de Rivera\\"
    },
    {
        "name": "DISA - DISA Rivera Ruta 5",
        "depto": "Durazno",
        "lat": -33.3716,
        "lng": -56.5332,
        "address": "Ruta 5 Km 496, Museo Histórico \\\"Casa de Rivera\\"
    },
    {
        "name": "ANCAP - Grutas de Carlos Reyles",
        "depto": "Durazno",
        "lat": -33.0256,
        "lng": -56.5519,
        "address": "Centro o Ruta principal, Grutas de Carlos Reyles"
    },
    {
        "name": "ANCAP - ANCAP Durazno",
        "depto": "Durazno",
        "lat": -33.0983,
        "lng": -55.1111,
        "address": "Ruta 5 Km 183, Cerro Chato (Sector Durazno)"
    },
    {
        "name": "DISA - DISA Durazno Centro",
        "depto": "Durazno",
        "lat": -33.0963,
        "lng": -55.1131,
        "address": "Av. Churchill, Cerro Chato (Sector Durazno)"
    },
    {
        "name": "ANCAP - Parque Elías Regules",
        "depto": "Durazno",
        "lat": -33.3511,
        "lng": -55.6253,
        "address": "Centro o Ruta principal, Parque Elías Regules"
    },
    {
        "name": "ANCAP - ANCAP Durazno",
        "depto": "Durazno",
        "lat": -33.3844,
        "lng": -56.5211,
        "address": "Ruta 5 Km 183, Iglesia Parroquial de San Pedro de Durazno"
    },
    {
        "name": "DISA - DISA Durazno Centro",
        "depto": "Durazno",
        "lat": -33.3824,
        "lng": -56.5231,
        "address": "Av. Churchill, Iglesia Parroquial de San Pedro de Durazno"
    },
    {
        "name": "ANCAP - Valle Edén",
        "depto": "Tacuarembó",
        "lat": -31.8311,
        "lng": -56.1622,
        "address": "Centro o Ruta principal, Valle Edén"
    },
    {
        "name": "ANCAP - ANCAP San Gregorio",
        "depto": "Tacuarembó",
        "lat": -32.6122,
        "lng": -56.0311,
        "address": "Av. Arturo Mollo, San Gregorio de Polanco"
    },
    {
        "name": "ANCAP - Balneario Iporá",
        "depto": "Tacuarembó",
        "lat": -31.6522,
        "lng": -55.9458,
        "address": "Centro o Ruta principal, Balneario Iporá"
    },
    {
        "name": "ANCAP - Grutas de los Helechos",
        "depto": "Tacuarembó",
        "lat": -31.6211,
        "lng": -55.8989,
        "address": "Centro o Ruta principal, Grutas de los Helechos"
    },
    {
        "name": "ANCAP - Pozo de \\\"El Hongo\\",
        "depto": "Tacuarembó",
        "lat": -31.8358,
        "lng": -56.1664,
        "address": "Centro o Ruta principal, Pozo de \\\"El Hongo\\"
    },
    {
        "name": "ANCAP - Museo Carlos Gardel",
        "depto": "Tacuarembó",
        "lat": -31.8308,
        "lng": -56.1611,
        "address": "Centro o Ruta principal, Museo Carlos Gardel"
    },
    {
        "name": "ANCAP - ANCAP Tacuarembó",
        "depto": "Tacuarembó",
        "lat": -31.7136,
        "lng": -55.9822,
        "address": "Ruta 5 Km 388, Museo de Artes Plásticas de Tacuarembó (MUART)"
    },
    {
        "name": "DISA - DISA Tacuarembó Oribe",
        "depto": "Tacuarembó",
        "lat": -31.7026,
        "lng": -55.9892,
        "address": "Av. Oribe y Ruta 5, Museo de Artes Plásticas de Tacuarembó (MUART)"
    },
    {
        "name": "ANCAP - ANCAP Paso de los Toros",
        "depto": "Tacuarembó",
        "lat": -32.8111,
        "lng": -56.5125,
        "address": "Ruta 5 Km 249, Paso de los Toros"
    },
    {
        "name": "ANCAP - ANCAP Tacuarembó",
        "depto": "Tacuarembó",
        "lat": -31.9453,
        "lng": -56.2647,
        "address": "Ruta 5 Km 388, Tambores (Sector Tacuarembó)"
    },
    {
        "name": "DISA - DISA Tacuarembó Oribe",
        "depto": "Tacuarembó",
        "lat": -31.9343,
        "lng": -56.2717,
        "address": "Av. Oribe y Ruta 5, Tambores (Sector Tacuarembó)"
    },
    {
        "name": "ANCAP - ANCAP Tacuarembó",
        "depto": "Tacuarembó",
        "lat": -31.7142,
        "lng": -55.9814,
        "address": "Ruta 5 Km 388, Museo de Geociencias de Tacuarembó"
    },
    {
        "name": "DISA - DISA Tacuarembó Oribe",
        "depto": "Tacuarembó",
        "lat": -31.7032,
        "lng": -55.9884,
        "address": "Av. Oribe y Ruta 5, Museo de Geociencias de Tacuarembó"
    },
    {
        "name": "ANCAP - ANCAP Chuy",
        "depto": "Cerro Largo",
        "lat": -32.3556,
        "lng": -54.2614,
        "address": "Av. Brasil y Ruta 9, Posta del Chuy"
    },
    {
        "name": "DISA - DISA Chuy",
        "depto": "Cerro Largo",
        "lat": -32.3536,
        "lng": -54.2634,
        "address": "Av. General Artigas, Posta del Chuy"
    },
    {
        "name": "ANCAP - ANCAP Melo",
        "depto": "Cerro Largo",
        "lat": -32.3614,
        "lng": -54.1811,
        "address": "Ruta 8 Km 387, Parque Rivera de Melo"
    },
    {
        "name": "DISA - DISA Melo Centro",
        "depto": "Cerro Largo",
        "lat": -32.3594,
        "lng": -54.1831,
        "address": "Av. Aparicio Saravia, Parque Rivera de Melo"
    },
    {
        "name": "ANCAP - Balneario Lago Merín",
        "depto": "Cerro Largo",
        "lat": -32.6122,
        "lng": -53.1811,
        "address": "Centro o Ruta principal, Balneario Lago Merín"
    },
    {
        "name": "ANCAP - Sierra de Ríos",
        "depto": "Cerro Largo",
        "lat": -31.9889,
        "lng": -54.2458,
        "address": "Centro o Ruta principal, Sierra de Ríos"
    },
    {
        "name": "ANCAP - ANCAP Río Branco",
        "depto": "Cerro Largo",
        "lat": -32.5658,
        "lng": -53.3811,
        "address": "Av. Centenario y Ruta 26, Río Branco y Puente Internacional Barón de Mauá"
    },
    {
        "name": "ANCAP - ANCAP Melo",
        "depto": "Cerro Largo",
        "lat": -32.3756,
        "lng": -54.1622,
        "address": "Ruta 8 Km 387, Museo Histórico Regional de Melo"
    },
    {
        "name": "DISA - DISA Melo Centro",
        "depto": "Cerro Largo",
        "lat": -32.3736,
        "lng": -54.1642,
        "address": "Av. Aparicio Saravia, Museo Histórico Regional de Melo"
    },
    {
        "name": "ANCAP - ANCAP Melo",
        "depto": "Cerro Largo",
        "lat": -32.3733,
        "lng": -54.1611,
        "address": "Ruta 8 Km 387, Catedral de Melo"
    },
    {
        "name": "DISA - DISA Melo Centro",
        "depto": "Cerro Largo",
        "lat": -32.3713,
        "lng": -54.1631,
        "address": "Av. Aparicio Saravia, Catedral de Melo"
    },
    {
        "name": "ANCAP - ANCAP Río Branco",
        "depto": "Cerro Largo",
        "lat": -32.5653,
        "lng": -53.3828,
        "address": "Av. Centenario y Ruta 26, Paseo de los Murales de San Gregorio (Río Branco)"
    },
    {
        "name": "ANCAP - ANCAP La Barra",
        "depto": "Cerro Largo",
        "lat": -32.5814,
        "lng": -53.1622,
        "address": "Ruta 10 Km 160, Playa La Barra y Arroyo Chuy del Tacuarí"
    },
    {
        "name": "ANCAP - ANCAP Melo",
        "depto": "Cerro Largo",
        "lat": -32.3714,
        "lng": -54.1614,
        "address": "Ruta 8 Km 387, Plis de Melo (Centro de Fotografía Histórica)"
    },
    {
        "name": "DISA - DISA Melo Centro",
        "depto": "Cerro Largo",
        "lat": -32.3694,
        "lng": -54.1634,
        "address": "Av. Aparicio Saravia, Plis de Melo (Centro de Fotografía Histórica)"
    },
    {
        "name": "ANCAP - ANCAP Salto",
        "depto": "Lavalleja",
        "lat": -34.3333,
        "lng": -54.7667,
        "address": "Av. Blandengues y Av. Batlle, Salto del Penitente"
    },
    {
        "name": "DISA - DISA Salto Barbieri",
        "depto": "Lavalleja",
        "lat": -34.3443,
        "lng": -54.7587,
        "address": "Av. Barbieri y Gualeguay, Salto del Penitente"
    },
    {
        "name": "AXION - AXION Salto Centro",
        "depto": "Lavalleja",
        "lat": -34.3283,
        "lng": -54.7717,
        "address": "Uruguay y Larrañaga, Salto del Penitente"
    },
    {
        "name": "ANCAP - Represa de Aguas Blancas",
        "depto": "Lavalleja",
        "lat": -34.5167,
        "lng": -55.3833,
        "address": "Centro o Ruta principal, Represa de Aguas Blancas"
    },
    {
        "name": "ANCAP - ANCAP Minas",
        "depto": "Lavalleja",
        "lat": -34.3167,
        "lng": -54.85,
        "address": "Av. Varela y 25 de Mayo, Minas de Oro del Campanero"
    },
    {
        "name": "DISA - DISA Minas",
        "depto": "Lavalleja",
        "lat": -34.3307,
        "lng": -54.868,
        "address": "Ruta 8 Km 118, Minas de Oro del Campanero"
    },
    {
        "name": "ANCAP - ANCAP Artigas",
        "depto": "Lavalleja",
        "lat": -34.3708,
        "lng": -54.9194,
        "address": "Av. Lecueder, Cerro Artigas y Monumento Ecuestre"
    },
    {
        "name": "DISA - DISA Artigas Centro",
        "depto": "Lavalleja",
        "lat": -34.3688,
        "lng": -54.9214,
        "address": "Av. Baltasar Brum, Cerro Artigas y Monumento Ecuestre"
    },
    {
        "name": "ANCAP - ANCAP Solís de Mataojo",
        "depto": "Lavalleja",
        "lat": -34.5917,
        "lng": -55.4667,
        "address": "Ruta 8 Km 81, Solís de Mataojo"
    },
    {
        "name": "ANCAP - ANCAP Rosario",
        "depto": "Lavalleja",
        "lat": -34.2542,
        "lng": -55.1356,
        "address": "Ruta 2 Km 130, Villa del Rosario"
    },
    {
        "name": "ANCAP - ANCAP Minas",
        "depto": "Lavalleja",
        "lat": -34.3714,
        "lng": -54.9322,
        "address": "Av. Varela y 25 de Mayo, Casa de la Cultura de Minas"
    },
    {
        "name": "DISA - DISA Minas",
        "depto": "Lavalleja",
        "lat": -34.3854,
        "lng": -54.9502,
        "address": "Ruta 8 Km 118, Casa de la Cultura de Minas"
    },
    {
        "name": "ANCAP - Plaza Internacional",
        "depto": "Rivera",
        "lat": -30.8989,
        "lng": -55.5356,
        "address": "Centro o Ruta principal, Plaza Internacional"
    },
    {
        "name": "ANCAP - ANCAP Tranqueras",
        "depto": "Rivera",
        "lat": -31.2056,
        "lng": -55.7614,
        "address": "Av. 18 de Julio, Tranqueras (Capital de la Sandía)"
    },
    {
        "name": "ANCAP - ANCAP Rivera",
        "depto": "Rivera",
        "lat": -30.9028,
        "lng": -55.5414,
        "address": "Av. Sarandí y Paysandú, Paseo de Compras (Free Shops de Rivera)"
    },
    {
        "name": "DISA - DISA Rivera Ruta 5",
        "depto": "Rivera",
        "lat": -30.8888,
        "lng": -55.5524,
        "address": "Ruta 5 Km 496, Paseo de Compras (Free Shops de Rivera)"
    },
    {
        "name": "ANCAP - ANCAP Minas",
        "depto": "Rivera",
        "lat": -31.1356,
        "lng": -55.4689,
        "address": "Av. Varela y 25 de Mayo, Minas de Corrales (Pueblo Minero)"
    },
    {
        "name": "DISA - DISA Minas",
        "depto": "Rivera",
        "lat": -31.1496,
        "lng": -55.4869,
        "address": "Ruta 8 Km 118, Minas de Corrales (Pueblo Minero)"
    },
    {
        "name": "ANCAP - Vichadero",
        "depto": "Rivera",
        "lat": -31.7456,
        "lng": -54.6211,
        "address": "Centro o Ruta principal, Vichadero"
    },
    {
        "name": "ANCAP - ANCAP Minas",
        "depto": "Rivera",
        "lat": -31.1311,
        "lng": -55.4664,
        "address": "Av. Varela y 25 de Mayo, Museo del Patrimonio de Minas de Corrales"
    },
    {
        "name": "DISA - DISA Minas",
        "depto": "Rivera",
        "lat": -31.1451,
        "lng": -55.4844,
        "address": "Ruta 8 Km 118, Museo del Patrimonio de Minas de Corrales"
    },
    {
        "name": "ANCAP - ANCAP Rivera",
        "depto": "Rivera",
        "lat": -30.9011,
        "lng": -55.5389,
        "address": "Av. Sarandí y Paysandú, Teatro Municipal de Rivera"
    },
    {
        "name": "DISA - DISA Rivera Ruta 5",
        "depto": "Rivera",
        "lat": -30.8871,
        "lng": -55.5499,
        "address": "Ruta 5 Km 496, Teatro Municipal de Rivera"
    },
    {
        "name": "ANCAP - ANCAP Rivera",
        "depto": "Rivera",
        "lat": -30.8984,
        "lng": -55.5322,
        "address": "Av. Sarandí y Paysandú, Museo de Artes Plásticas de Rivera"
    },
    {
        "name": "DISA - DISA Rivera Ruta 5",
        "depto": "Rivera",
        "lat": -30.8844,
        "lng": -55.5432,
        "address": "Ruta 5 Km 496, Museo de Artes Plásticas de Rivera"
    },
    {
        "name": "ANCAP - ANCAP Bella Unión",
        "depto": "Artigas",
        "lat": -30.5358,
        "lng": -56.4568,
        "address": "Av. Artigas y Ruta 3, Rambla de los Constituyentes (Bella Unión)"
    },
    {
        "name": "ANCAP - Pueblo Tomás Gomensoro",
        "depto": "Artigas",
        "lat": -30.4442,
        "lng": -56.4419,
        "address": "Centro o Ruta principal, Pueblo Tomás Gomensoro"
    },
    {
        "name": "ANCAP - ANCAP Artigas",
        "depto": "Artigas",
        "lat": -30.7136,
        "lng": -56.5125,
        "address": "Av. Lecueder, Mercado Municipal de Artigas"
    },
    {
        "name": "DISA - DISA Artigas Centro",
        "depto": "Artigas",
        "lat": -30.7116,
        "lng": -56.5145,
        "address": "Av. Baltasar Brum, Mercado Municipal de Artigas"
    },
    {
        "name": "ANCAP - ANCAP Artigas",
        "depto": "Artigas",
        "lat": -30.3494,
        "lng": -56.8122,
        "address": "Av. Lecueder, Museo Histórico Municipal de Artigas"
    },
    {
        "name": "DISA - DISA Artigas Centro",
        "depto": "Artigas",
        "lat": -30.3474,
        "lng": -56.8142,
        "address": "Av. Baltasar Brum, Museo Histórico Municipal de Artigas"
    },
    {
        "name": "ANCAP - Sierras del Yacaré",
        "depto": "Artigas",
        "lat": -30.3125,
        "lng": -57.7211,
        "address": "Centro o Ruta principal, Sierras del Yacaré"
    },
    {
        "name": "ANCAP - ANCAP Artigas",
        "depto": "Artigas",
        "lat": -30.3111,
        "lng": -57.5622,
        "address": "Av. Lecueder, Teatro Municipal de Artigas"
    },
    {
        "name": "DISA - DISA Artigas Centro",
        "depto": "Artigas",
        "lat": -30.3091,
        "lng": -57.5642,
        "address": "Av. Baltasar Brum, Teatro Municipal de Artigas"
    },
    {
        "name": "ANCAP - ANCAP Rivera",
        "depto": "Artigas",
        "lat": -30.3989,
        "lng": -56.4689,
        "address": "Av. Sarandí y Paysandú, Bernabé Rivera (Pueblo Yacaré)"
    },
    {
        "name": "DISA - DISA Rivera Ruta 5",
        "depto": "Artigas",
        "lat": -30.3849,
        "lng": -56.4799,
        "address": "Ruta 5 Km 496, Bernabé Rivera (Pueblo Yacaré)"
    },
    {
        "name": "ANCAP - ANCAP Artigas",
        "depto": "Artigas",
        "lat": -30.6911,
        "lng": -56.2517,
        "address": "Av. Lecueder, Parque de la Tablada (Artigas)"
    },
    {
        "name": "DISA - DISA Artigas Centro",
        "depto": "Artigas",
        "lat": -30.6891,
        "lng": -56.2537,
        "address": "Av. Baltasar Brum, Parque de la Tablada (Artigas)"
    },
    {
        "name": "ANCAP - ANCAP Rocha",
        "depto": "Rocha",
        "lat": -30.4125,
        "lng": -56.4528,
        "address": "Ruta 9 Km 208, Laguna de Rocha"
    },
    {
        "name": "DISA - DISA Rocha",
        "depto": "Rocha",
        "lat": -30.4155,
        "lng": -56.4498,
        "address": "Av. Martínez Rodríguez, Laguna de Rocha"
    },
    {
        "name": "ANCAP - Fuerte de San Miguel",
        "depto": "Rocha",
        "lat": -33.6983,
        "lng": -53.5414,
        "address": "Centro o Ruta principal, Fuerte de San Miguel"
    },
    {
        "name": "ANCAP - Monte de Ombúes",
        "depto": "Rocha",
        "lat": -34.3411,
        "lng": -53.8122,
        "address": "Centro o Ruta principal, Monte de Ombúes"
    },
    {
        "name": "ANCAP - La Coronilla",
        "depto": "Rocha",
        "lat": -33.9111,
        "lng": -53.5125,
        "address": "Centro o Ruta principal, La Coronilla"
    },
    {
        "name": "DISA - DISA La Paloma",
        "depto": "Rocha",
        "lat": -34.6558,
        "lng": -54.1528,
        "address": "Av. Solari y Paloma, Puerto de La Paloma"
    },
    {
        "name": "ANCAP - ANCAP La Aguada",
        "depto": "Rocha",
        "lat": -34.6708,
        "lng": -54.1478,
        "address": "Ruta 15 Km 1.5, Puerto de La Paloma"
    },
    {
        "name": "ANCAP - ANCAP Chuy",
        "depto": "Rocha",
        "lat": -33.6911,
        "lng": -53.4614,
        "address": "Av. Brasil y Ruta 9, Chuy (Paseo de Compras Fronterizo)"
    },
    {
        "name": "DISA - DISA Chuy",
        "depto": "Rocha",
        "lat": -33.6891,
        "lng": -53.4634,
        "address": "Av. General Artigas, Chuy (Paseo de Compras Fronterizo)"
    },
    {
        "name": "DISA - DISA La Paloma",
        "depto": "Rocha",
        "lat": -34.6528,
        "lng": -54.1614,
        "address": "Av. Solari y Paloma, Museo de la Paloma (Centro Cultural)"
    },
    {
        "name": "ANCAP - ANCAP La Aguada",
        "depto": "Rocha",
        "lat": -34.6678,
        "lng": -54.1564,
        "address": "Ruta 15 Km 1.5, Museo de la Paloma (Centro Cultural)"
    },
    {
        "name": "ANCAP - ANCAP Castillos",
        "depto": "Rocha",
        "lat": -34.1622,
        "lng": -53.8822,
        "address": "Ruta 9 Km 267, Castillos (Ciudad de los Palmares)"
    },
    {
        "name": "ANCAP - ANCAP Castillos",
        "depto": "Rocha",
        "lat": -34.1814,
        "lng": -53.9453,
        "address": "Ruta 9 Km 267, Laguna de Castillos y Palmar del Norte"
    },
    {
        "name": "ANCAP - Parque Dionisio Díaz",
        "depto": "Treinta y Tres",
        "lat": -32.9358,
        "lng": -53.9458,
        "address": "Centro o Ruta principal, Parque Dionisio Díaz"
    },
    {
        "name": "ANCAP - Balneario Río Olimar",
        "depto": "Treinta y Tres",
        "lat": -33.2211,
        "lng": -54.3833,
        "address": "Centro o Ruta principal, Balneario Río Olimar"
    },
    {
        "name": "ANCAP - ANCAP Treinta y Tres",
        "depto": "Treinta y Tres",
        "lat": -33.0983,
        "lng": -55.1111,
        "address": "Ruta 8 Km 286, Cerro Chato (Sector Treinta y Tres)"
    },
    {
        "name": "DISA - DISA Treinta y Tres",
        "depto": "Treinta y Tres",
        "lat": -33.0963,
        "lng": -55.1131,
        "address": "Av. Juan Antonio Lavalleja, Cerro Chato (Sector Treinta y Tres)"
    },
    {
        "name": "ANCAP - Parque Centenario",
        "depto": "Treinta y Tres",
        "lat": -33.2142,
        "lng": -54.3814,
        "address": "Centro o Ruta principal, Parque Centenario"
    },
    {
        "name": "ANCAP - ANCAP Treinta y Tres",
        "depto": "Treinta y Tres",
        "lat": -33.2136,
        "lng": -54.3822,
        "address": "Ruta 8 Km 286, Museo de Bellas Artes e Histórico de Treinta y Tres"
    },
    {
        "name": "DISA - DISA Treinta y Tres",
        "depto": "Treinta y Tres",
        "lat": -33.2116,
        "lng": -54.3842,
        "address": "Av. Juan Antonio Lavalleja, Museo de Bellas Artes e Histórico de Treinta y Tres"
    },
    {
        "name": "ANCAP - ANCAP Treinta y Tres",
        "depto": "Treinta y Tres",
        "lat": -32.6911,
        "lng": -53.9453,
        "address": "Ruta 8 Km 286, Paso de la Laguna (Río Tacuarí - Sector Treinta y Tres)"
    },
    {
        "name": "DISA - DISA Treinta y Tres",
        "depto": "Treinta y Tres",
        "lat": -32.6891,
        "lng": -53.9473,
        "address": "Av. Juan Antonio Lavalleja, Paso de la Laguna (Río Tacuarí - Sector Treinta y Tres)"
    },
    {
        "name": "ANCAP - ANCAP Treinta y Tres",
        "depto": "Treinta y Tres",
        "lat": -32.8433,
        "lng": -54.4489,
        "address": "Ruta 8 Km 286, Cascada de los Helechos (Treinta y Tres)"
    },
    {
        "name": "DISA - DISA Treinta y Tres",
        "depto": "Treinta y Tres",
        "lat": -32.8413,
        "lng": -54.4509,
        "address": "Av. Juan Antonio Lavalleja, Cascada de los Helechos (Treinta y Tres)"
    }
];

const EV_CHARGERS = [
    { name: 'Montevideo Shopping (Cargador Privado)', depto: 'Montevideo', lat: -34.9038, lng: -56.1361, address: 'Av. Luis Alberto de Herrera 1290' },
    { name: 'Punta Carretas Shopping (Cargador Privado)', depto: 'Montevideo', lat: -34.9258, lng: -56.1583, address: 'José Ellauri 350' },
    { name: 'Tres Cruces Shopping (Cargador Privado)', depto: 'Montevideo', lat: -34.8942, lng: -56.1661, address: 'Bulevar Artigas 1825' },
    { name: 'Nuevocentro Shopping (Cargador Privado)', depto: 'Montevideo', lat: -34.8767, lng: -56.1692, address: 'Av. Luis Alberto de Herrera 3365' },
    { name: 'Costa Urbana Shopping (Cargador Privado)', depto: 'Canelones', lat: -34.8258, lng: -55.9922, address: 'Av. Giannattasio km 21' },
    { name: 'Car One Ciudad de la Costa (Cargador Privado)', depto: 'Canelones', lat: -34.7861, lng: -55.9758, address: 'Ruta Interbalnearia y Camino de los Horneros' },
    { name: 'Tienda Inglesa Car One (Cargador Privado)', depto: 'Canelones', lat: -34.7867, lng: -55.9761, address: 'Camino de los Horneros' },
    { name: 'Tienda Inglesa Roosevelt (Cargador Privado)', depto: 'Maldonado', lat: -34.9281, lng: -54.9392, address: 'Av. Roosevelt y Alpes' },
    { name: 'Punta Shopping (Cargador Privado)', depto: 'Maldonado', lat: -34.9289, lng: -54.9456, address: 'Av. Roosevelt y Parada 7' },
    { name: 'Colonia Shopping (Cargador Privado)', depto: 'Colonia', lat: -34.4606, lng: -57.8286, address: 'Av. Roosevelt 458' },
    { name: 'Enjoy Punta del Este (Cargador Privado)', depto: 'Maldonado', lat: -34.9372, lng: -54.9378, address: 'Rambla C. Williman, Parada 4' },
    { name: 'Jean Clevers Hotel (Cargador Privado)', depto: 'Maldonado', lat: -34.9297, lng: -54.9492, address: 'Bulevar Artigas y Av. del Canto' },
    { name: 'Hyatt Centric Montevideo (Cargador Privado)', depto: 'Montevideo', lat: -34.9089, lng: -56.1367, address: 'Rambla República del Perú 1479' },
    { name: 'Cargador UTE - Montevideo Centro', depto: 'Montevideo', lat: -34.9011, lng: -56.1645, address: 'Paraguay 2431' },
    { name: 'Cargador UTE - Atlántida', depto: 'Canelones', lat: -34.7719, lng: -55.7583, address: 'Ruta Interbalnearia km 46.500' },
    { name: 'Cargador UTE - Piriápolis', depto: 'Maldonado', lat: -34.8628, lng: -55.2708, address: 'Rambla de los Argentinos e Iglesia' },
    { name: 'Cargador UTE - Punta del Este', depto: 'Maldonado', lat: -34.9606, lng: -54.9419, address: 'Calle 24 (El Mesón) y Calle 25' },
    { name: 'Cargador UTE - Rocha Centro', depto: 'Rocha', lat: -34.4811, lng: -54.3319, address: '25 de Mayo y Julia Becerra' },
    { name: 'Cargador UTE - La Paloma', depto: 'Rocha', lat: -34.6592, lng: -54.1603, address: 'Av. Nicolás Solari y del Navío' },
    { name: 'Cargador UTE - Punta del Diablo', depto: 'Rocha', lat: -34.0442, lng: -53.5411, address: 'Av. Central y Bulevar Artigas' },
    { name: 'Cargador UTE - Chuy', depto: 'Rocha', lat: -33.6933, lng: -53.4611, address: 'Av. Brasil y Arachanes' },
    { name: 'Cargador UTE - Colonia Sacramento', depto: 'Colonia', lat: -34.4697, lng: -57.8419, address: 'Rivadavia y Washington Barbot' },
    { name: 'Cargador UTE - San José', depto: 'San José', lat: -34.3381, lng: -56.7125, address: 'Asamblea 498' },
    { name: 'Cargador UTE - Mercedes', depto: 'Soriano', lat: -33.2519, lng: -58.0294, address: 'Giménez y 28 de Febrero' },
    { name: 'Cargador UTE - Fray Bentos', depto: 'Río Negro', lat: -33.1306, lng: -58.2978, address: '18 de Julio y Treinta y Tres' },
    { name: 'Cargador UTE - Paysandú', depto: 'Paysandú', lat: -32.3211, lng: -58.0767, address: 'Zorrilla de San Martín y 19 de Abril' },
    { name: 'Cargador UTE - Salto', depto: 'Salto', lat: -31.3831, lng: -57.9647, address: '18 de Julio y Artigas' },
    { name: 'Cargador UTE - Artigas', depto: 'Artigas', lat: -30.4003, lng: -56.4658, address: 'Lecueder y Baldomir' },
    { name: 'Cargador UTE - Rivera', depto: 'Rivera', lat: -30.9022, lng: -55.5503, address: 'Uruguay y Paysandú' },
    { name: 'Cargador UTE - Tacuarembó', depto: 'Tacuarembó', lat: -31.7136, lng: -55.9786, address: '25 de Mayo y Joaquín Suárez' },
    { name: 'Cargador UTE - Melo', depto: 'Cerro Largo', lat: -32.3711, lng: -54.1836, address: 'General Artigas y Wilson Ferreira' },
    { name: 'Cargador UTE - Treinta y Tres', depto: 'Treinta y Tres', lat: -33.2339, lng: -54.3806, address: 'Manuel Meléndez y Juan Ortiz' },
    { name: 'Cargador UTE - Minas', depto: 'Lavalleja', lat: -34.3761, lng: -55.2356, address: 'Domingo Pérez y Washington Beltrán' },
    { name: 'Cargador UTE - Florida', depto: 'Florida', lat: -34.0989, lng: -56.2128, address: 'General Flores y Rivera' },
    { name: 'Cargador UTE - Trinidad', depto: 'Flores', lat: -33.5175, lng: -56.8978, address: 'Fondar y Francisco Fondar' },
    { name: 'Cargador UTE - Durazno', depto: 'Durazno', lat: -33.3822, lng: -56.5175, address: 'Eusebio Píriz y Artigas' }
];

function openEmergencySearch(type) {
    trackEvent('emergency_map_opened', { category: type });
    let query = '';
    if (type === 'police') query = 'policia';
    else if (type === 'medical') query = 'hospital';
    else if (type === 'mechanic') query = 'taller mecanico auxilio';
    else if (type === 'chargers') query = 'cargador auto electrico ute';

    let url = '';
    if (userLocation) {
        url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${userLocation.lat},${userLocation.lng},12z`;
    } else {
        url = `https://www.google.com/maps/search/${encodeURIComponent(query)}+uruguay`;
    }
    window.open(url, '_blank');
}

window.openSearchOnMaps = function(query) {
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
};

window.openSearchNearLocation = function(locationName, queryTerm) {
    const url = `https://www.google.com/maps/search/${encodeURIComponent(queryTerm)}+cerca+de+${locationName}`;
    window.open(url, '_blank');
};

function showPoliceStationsList() {
    trackEvent('emergency_police_viewed');
    // Hide other dynamic sections
    document.getElementById('section-medical-list').style.display = 'none';
    document.getElementById('section-chargers-list').style.display = 'none';

    const section = document.getElementById('section-police-list');
    const list = document.getElementById('emergency-police-list');
    if (!section || !list) return;

    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });

    list.innerHTML = '';

    if (!userLocation) {
        list.innerHTML = `<p class="empty-text">${TRANSLATIONS[currentLang].lbl_loading_gps}</p>`;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log("Ubicación del usuario obtenida dinámicamente:", userLocation);
                    renderEmergenciesTab();
                    showPoliceStationsList();
                },
                (error) => {
                    console.warn("No se pudo obtener la ubicación:", error.message);
                    list.innerHTML = `<p class="empty-text">${TRANSLATIONS[currentLang].no_gps_police_list}</p>`;
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            list.innerHTML = `<p class="empty-text">${TRANSLATIONS[currentLang].no_gps_police_list}</p>`;
        }
        return;
    }

    // Calculate distance to each police station and sort
    const sortedStations = POLICE_STATIONS.map(station => {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, station.lat, station.lng);
        return { ...station, distance: dist };
    });

    sortedStations.sort((a, b) => a.distance - b.distance);

    // Get Top 5 closest
    const top5 = sortedStations.slice(0, 5);

    top5.forEach(station => {
        const item = document.createElement('div');
        item.className = 'emergency-list-item';
        item.innerHTML = `
            <div class="emergency-item-info">
                <span class="emergency-item-name">${station.name}</span>
                <span class="emergency-item-detail">${station.address} (${station.depto}) • <b>${TRANSLATIONS[currentLang].distance_badge.replace('{distance}', station.distance.toFixed(1))}</b></span>
            </div>
            <button class="btn btn-primary btn-emergency-item" onclick="getDirections(${station.lat}, ${station.lng}, '${encodeURIComponent(station.name)}', '${encodeURIComponent(station.address)}', '${encodeURIComponent(station.depto)}')">
                ${TRANSLATIONS[currentLang].card_how_to_go}
            </button>
        `;
        list.appendChild(item);
    });

    // Add fallback search button
    const searchMoreBtn = document.createElement('button');
    searchMoreBtn.className = 'btn btn-secondary btn-emergency-item-more';
    searchMoreBtn.style.width = '100%';
    searchMoreBtn.style.marginTop = '15px';
    searchMoreBtn.style.fontSize = '0.9rem';
    searchMoreBtn.style.padding = '10px';
    searchMoreBtn.innerHTML = TRANSLATIONS[currentLang].btn_more_police_maps;
    searchMoreBtn.onclick = () => openEmergencySearch('police');
    list.appendChild(searchMoreBtn);
}

function showMedicalCentersList() {
    trackEvent('emergency_medical_viewed');
    // Hide other dynamic sections
    document.getElementById('section-police-list').style.display = 'none';
    document.getElementById('section-chargers-list').style.display = 'none';

    const section = document.getElementById('section-medical-list');
    const list = document.getElementById('emergency-medical-list');
    if (!section || !list) return;

    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });

    list.innerHTML = '';

    if (!userLocation) {
        list.innerHTML = `<p class="empty-text">${TRANSLATIONS[currentLang].lbl_loading_gps}</p>`;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log("Ubicación del usuario obtenida dinámicamente:", userLocation);
                    renderEmergenciesTab();
                    showMedicalCentersList();
                },
                (error) => {
                    console.warn("No se pudo obtener la ubicación:", error.message);
                    list.innerHTML = `<p class="empty-text">${TRANSLATIONS[currentLang].no_gps_medical_list}</p>`;
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            list.innerHTML = `<p class="empty-text">${TRANSLATIONS[currentLang].no_gps_medical_list}</p>`;
        }
        return;
    }

    // Calculate distance to each medical center and sort
    const sortedCenters = MEDICAL_CENTERS.map(center => {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, center.lat, center.lng);
        return { ...center, distance: dist };
    });

    sortedCenters.sort((a, b) => a.distance - b.distance);

    // Get Top 5 closest
    const top5 = sortedCenters.slice(0, 5);

    top5.forEach(center => {
        const item = document.createElement('div');
        item.className = 'emergency-list-item';
        item.innerHTML = `
            <div class="emergency-item-info">
                <span class="emergency-item-name">${center.name}</span>
                <span class="emergency-item-detail">${center.address} (${center.depto}) • <b>${TRANSLATIONS[currentLang].distance_badge.replace('{distance}', center.distance.toFixed(1))}</b></span>
            </div>
            <button class="btn btn-primary btn-emergency-item" onclick="getDirections(${center.lat}, ${center.lng}, '${encodeURIComponent(center.name)}', '${encodeURIComponent(center.address)}', '${encodeURIComponent(center.depto)}')">
                ${TRANSLATIONS[currentLang].card_how_to_go}
            </button>
        `;
        list.appendChild(item);
    });

    // Add fallback search button
    const searchMoreBtn = document.createElement('button');
    searchMoreBtn.className = 'btn btn-secondary btn-emergency-item-more';
    searchMoreBtn.style.width = '100%';
    searchMoreBtn.style.marginTop = '15px';
    searchMoreBtn.style.fontSize = '0.9rem';
    searchMoreBtn.style.padding = '10px';
    searchMoreBtn.innerHTML = TRANSLATIONS[currentLang].btn_more_medical_maps;
    searchMoreBtn.onclick = () => openEmergencySearch('medical');
    list.appendChild(searchMoreBtn);
}

function showEVChargersList() {
    trackEvent('emergency_chargers_viewed');
    // Hide other dynamic sections
    document.getElementById('section-police-list').style.display = 'none';
    document.getElementById('section-medical-list').style.display = 'none';

    const section = document.getElementById('section-chargers-list');
    const list = document.getElementById('emergency-chargers-list');
    if (!section || !list) return;

    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });

    list.innerHTML = '';

    if (!userLocation) {
        list.innerHTML = `<p class="empty-text">${TRANSLATIONS[currentLang].lbl_loading_gps}</p>`;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log("Ubicación del usuario obtenida dinámicamente:", userLocation);
                    renderEmergenciesTab();
                    showEVChargersList();
                },
                (error) => {
                    console.warn("No se pudo obtener la ubicación:", error.message);
                    list.innerHTML = `<p class="empty-text">${TRANSLATIONS[currentLang].no_gps_chargers_list}</p>`;
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            list.innerHTML = `<p class="empty-text">${TRANSLATIONS[currentLang].no_gps_chargers_list}</p>`;
        }
        return;
    }

    // 1. Calculate distance to all EV chargers and get top 5
    const nearbyEV = [];
    EV_CHARGERS.forEach(charger => {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, charger.lat, charger.lng);
        if (dist !== null) {
            nearbyEV.push({ ...charger, distance: dist, displayName: `⚡ ${charger.name}` });
        }
    });
    nearbyEV.sort((a, b) => a.distance - b.distance);
    const closestEV = nearbyEV.slice(0, 5);

    // 2. Calculate distance to all liquid fuel service stations and get top 5
    const nearbyFuel = [];
    FUEL_STATIONS.forEach(station => {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, station.lat, station.lng);
        if (dist !== null) {
            nearbyFuel.push({ ...station, distance: dist, displayName: `⛽ ${station.name}` });
        }
    });
    nearbyFuel.sort((a, b) => a.distance - b.distance);
    const closestFuel = nearbyFuel.slice(0, 5);

    // 3. Merge and sort both lists by distance
    const mergedList = [...closestEV, ...closestFuel];
    mergedList.sort((a, b) => a.distance - b.distance);

    if (mergedList.length > 0) {
        mergedList.forEach(charger => {
            const item = document.createElement('div');
            item.className = 'emergency-list-item';
            item.innerHTML = `
                <div class="emergency-item-info">
                    <span class="emergency-item-name">${charger.displayName}</span>
                    <span class="emergency-item-detail">${charger.address} (${charger.depto}) • <b>${TRANSLATIONS[currentLang].distance_badge.replace('{distance}', charger.distance.toFixed(1))}</b></span>
                </div>
                <button class="btn btn-primary btn-emergency-item" onclick="getDirections(${charger.lat}, ${charger.lng}, '${encodeURIComponent(charger.name)}', '${encodeURIComponent(charger.address)}', '${encodeURIComponent(charger.depto)}')">
                    ${TRANSLATIONS[currentLang].card_how_to_go}
                </button>
            `;
            list.appendChild(item);
        });
    } else {
        list.innerHTML = `<p class="empty-text">${TRANSLATIONS[currentLang].no_chargers_100km}</p>`;
    }

    // Add fallback search button
    const searchMoreBtn = document.createElement('button');
    searchMoreBtn.className = 'btn btn-secondary btn-emergency-item-more';
    searchMoreBtn.style.width = '100%';
    searchMoreBtn.style.marginTop = '15px';
    searchMoreBtn.style.fontSize = '0.9rem';
    searchMoreBtn.style.padding = '10px';
    searchMoreBtn.innerHTML = TRANSLATIONS[currentLang].btn_more_chargers_maps;
    searchMoreBtn.onclick = () => openEmergencySearch('chargers');
    list.appendChild(searchMoreBtn);
}

function renderEmergenciesTab() {
    // 1. Update GPS status card visual state
    const dot = document.getElementById('emergency-gps-dot');
    const text = document.getElementById('emergency-gps-text');
    if (dot && text) {
        if (userLocation) {
            dot.className = 'gps-dot green';
            text.textContent = `${TRANSLATIONS[currentLang].lbl_gps_active}: Lat ${userLocation.lat.toFixed(4)}, Lng ${userLocation.lng.toFixed(4)}`;
        } else {
            dot.className = 'gps-dot red';
            text.textContent = TRANSLATIONS[currentLang].lbl_gps_inactive;
        }
    }

    // Refresh active list dynamically if open
    const secPolice = document.getElementById('section-police-list');
    if (secPolice && secPolice.style.display === 'block') {
        showPoliceStationsList();
    }
    const secMedical = document.getElementById('section-medical-list');
    if (secMedical && secMedical.style.display === 'block') {
        showMedicalCentersList();
    }
    const secChargers = document.getElementById('section-chargers-list');
    if (secChargers && secChargers.style.display === 'block') {
        showEVChargersList();
    }

    // 2. Render Emergencies in Itinerary
    const itineraryList = document.getElementById('emergency-itinerary-list');
    if (itineraryList) {
        itineraryList.innerHTML = '';
        
        if (itinerary.length > 0) {
            itinerary.forEach(step => {
                let name = '';
                let depto = '';
                let querySearch = '';
                if (step.type === 'destination') {
                    const dest = appDestinos.find(d => d.id === step.id);
                    if (dest) {
                        name = dest.destino;
                        depto = dest.departamento;
                        querySearch = `${dest.destino}, ${dest.departamento}, Uruguay`;
                    }
                } else if (step.type === 'event') {
                    const ev = appEventos.find(e => e.id === step.id);
                    if (ev) {
                        name = ev.titulo;
                        depto = ev.departamento;
                        querySearch = ev.local ? `${ev.local}, ${ev.destino}, ${ev.departamento}, Uruguay` : `${ev.destino}, ${ev.departamento}, Uruguay`;
                    }
                }
                
                if (name) {
                    const item = document.createElement('div');
                    item.className = 'emergency-route-dest';
                    
                    const policeLabel = TRANSLATIONS[currentLang].btn_search_police;
                    const medicalLabel = TRANSLATIONS[currentLang].btn_search_medical;
                    const mechanicLabel = TRANSLATIONS[currentLang].btn_search_mechanics;
                    
                    item.innerHTML = `
                        <div class="emergency-route-dest-name">${name} (${depto})</div>
                        <div class="emergency-route-actions">
                            <button class="btn btn-secondary btn-route-emergency" onclick="openSearchNearLocation('${encodeURIComponent(querySearch)}', 'policia')">
                                👮 ${policeLabel}
                            </button>
                            <button class="btn btn-secondary btn-route-emergency" onclick="openSearchNearLocation('${encodeURIComponent(querySearch)}', 'hospital')">
                                🏥 ${medicalLabel}
                            </button>
                            <button class="btn btn-secondary btn-route-emergency" onclick="openSearchNearLocation('${encodeURIComponent(querySearch)}', 'taller mecanico auxilio')">
                                🔧 ${mechanicLabel}
                            </button>
                        </div>
                    `;
                    itineraryList.appendChild(item);
                }
            });
        } else {
            itineraryList.innerHTML = `<p class="empty-text">${TRANSLATIONS[currentLang].empty_itinerary_emergencies}</p>`;
        }
    }
}



