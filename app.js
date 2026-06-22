// UruExplorer - Application Logic

// State management
let favorites = JSON.parse(localStorage.getItem('uruexplorer_favorites')) || [];
let itinerary = JSON.parse(localStorage.getItem('uruexplorer_itinerary')) || [];
let currentResults = [];
let userLocation = null;
let emptySearchCriterion = null; // Session empty search behavior ('near' or 'all')

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1pgmc3TXHNXbtWecKiZYmPRK-_hkKwfujFKvbubIPpjU/export?format=csv';
let appDestinos = DESTINOS; // Default fallback to destinos.js local data

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
async function loadData() {
    try {
        console.log("Intentando descargar base de datos actualizada desde Google Sheets...");
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) throw new Error("Error en la descarga del CSV");
        
        const csvText = await response.text();
        const parsedData = processCSVData(csvText);
        
        if (parsedData && parsedData.length > 0) {
            appDestinos = parsedData;
            console.log(`Base de datos actualizada con éxito desde Google Sheets (${parsedData.length} destinos).`);
            localStorage.setItem('uruexplorer_cached_data', JSON.stringify(parsedData));
        }
    } catch (e) {
        console.warn("No se pudo descargar la base de datos de Google Sheets (sin conexión o privada). Usando base de datos local / caché.", e);
        const cached = localStorage.getItem('uruexplorer_cached_data');
        if (cached) {
            appDestinos = JSON.parse(cached);
        } else {
            appDestinos = DESTINOS;
        }
    }
}

// Helper to format dining and lodging options (cleaning Google Sheets prompt formulas and turning places into links)
function parsePlaces(text, destinationName, deptName, cardId) {
    if (!text || text.trim() === '' || text.toLowerCase().includes('generar')) {
        return '<span class="text-muted-italics">Consultar información local o sitio web</span>';
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

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initFilters();
    renderFavorites();
    updateItineraryUI();
    setupEventListeners();
    requestUserLocation();
});

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
        deptoSelect.appendChild(option);
    });

    // Populate Dificultad selector (sorted)
    Array.from(dificultades).sort().forEach(dif => {
        const option = document.createElement('option');
        option.value = dif;
        option.textContent = dif;
        dificultadSelect.appendChild(option);
    });
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

    // Close Map Lightbox on clicking overlay
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

// Perform search based on filters selected
function performSearch() {
    const searchText = document.getElementById('search-input').value.trim().toLowerCase();
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

    currentResults = appDestinos.filter(item => {
        // Free text search by name, characteristics or department
        if (searchText) {
            const nameMatch = item.destino.toLowerCase().includes(searchText);
            const charMatch = item.caracteristicas.toLowerCase().includes(searchText);
            const deptoMatch = item.departamento.toLowerCase().includes(searchText);
            if (!nameMatch && !charMatch && !deptoMatch) {
                return false;
            }
        }
        // Departamento Filter
        if (selectedDepto && item.departamento.trim() !== selectedDepto) {
            return false;
        }
        // Grado de Dificultad Filter
        if (selectedDif && item.dificultad.trim() !== selectedDif) {
            return false;
        }
        // Popularidad Filter (Multi-select)
        if (selectedPops.length > 0) {
            if (!selectedPops.includes(item.popularidad)) {
                return false;
            }
        }
        return true;
    });

    // Clear distances from previous search
    currentResults.forEach(item => item.distance = null);

    // Sort by proximity if requested
    if (!searchText && !selectedDepto && emptySearchCriterion === 'near') {
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

    renderResults();
    switchTab('resultados');
}

// Render filtered destination blocks
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
                <h4>No se encontraron destinos</h4>
                <p>Intenta ajustar los criterios de búsqueda o seleccionar otros filtros.</p>
            </div>
        `;
        return;
    }

    currentResults.forEach(item => {
        const isFav = favorites.includes(item.id);
        const isInItinerary = itinerary.includes(item.id);
        
        const card = document.createElement('div');
        card.className = 'result-card';
        card.dataset.id = item.id;

        // Clean coordinates to display Map
        const mapIframeUrl = `https://maps.google.com/maps?q=${item.lat},${item.lng}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

        const distanceBadge = (item.distance !== undefined && item.distance !== null) 
            ? `<span class="distance-badge">📍 a ${item.distance.toFixed(1)} km</span>` 
            : '';
        const popularityText = item.popularidad ? ` • Popularidad: ${item.popularidad}` : '';

        card.innerHTML = `
            <div class="card-details">
                <div class="card-header-row">
                    <div class="card-title-group">
                        <div class="card-title">${item.destino} ${distanceBadge}</div>
                        <div class="card-dept">${item.departamento}${popularityText}</div>
                    </div>
                    <div class="card-actions-top">
                        <!-- Itinerary selection checkbox -->
                        <label class="route-checkbox-container ${isInItinerary ? 'selected' : ''}">
                            <input type="checkbox" class="route-check" ${isInItinerary ? 'checked' : ''} data-id="${item.id}">
                            <span>Recorrido</span>
                        </label>
                        <!-- Favorite star toggle -->
                        <button class="fav-toggle ${isFav ? 'active' : ''}" data-id="${item.id}" title="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                            ★
                        </button>
                    </div>
                </div>

                <div class="info-block">
                    <div class="info-item">
                        <span class="info-label">Características</span>
                        <span class="info-text features">${item.caracteristicas}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Alojamiento</span>
                        <span class="info-text">${parsePlaces(item.alojamiento, item.destino, item.departamento, item.id)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Dónde comer</span>
                        <span class="info-text">${parsePlaces(item.comer, item.destino, item.departamento, item.id)}</span>
                    </div>
                    ${item.ubicacion ? `
                    <div class="info-item">
                        <span class="info-label">Ubicación</span>
                        <span class="info-text">${item.ubicacion}</span>
                    </div>` : ''}
                    ${item.contacto ? `
                    <div class="info-item">
                        <span class="info-label">Contacto principal</span>
                        <span class="info-text">${item.contacto}</span>
                    </div>` : ''}
                    ${item.web ? `
                    <div class="info-item">
                        <span class="info-label">Sitio Web</span>
                        <span class="info-text"><a href="${item.web.startsWith('http') ? item.web : 'http://' + item.web}" target="_blank">${item.web} ↗</a></span>
                    </div>` : ''}
                </div>

                <!-- Directions Button -->
                <button class="btn btn-primary btn-como-ir" data-lat="${item.lat}" data-lng="${item.lng}" data-name="${item.destino}">
                    Cómo ir
                </button>
            </div>

            <!-- Map Iframe with interactive controls -->
            <div class="card-map-wrapper">
                <div class="map-container" id="map-container-${item.id}">
                    <iframe src="${mapIframeUrl}" loading="lazy" allowfullscreen></iframe>
                </div>
                <div class="map-actions">
                    <!-- Reset Map Button (Hidden by default) -->
                    <button class="btn btn-secondary btn-reset-map" id="reset-map-${item.id}" onclick="resetEmbeddedMap('${item.id}', ${item.lat}, ${item.lng})" style="display: none; width: 100%;">
                        🔄 Restablecer Mapa
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
            <div class="no-favorites">Aún no tienes destinos favoritos guardados. ¡Agrega algunos marcando la estrella en los bloques de resultados!</div>
        `;
        return;
    }

    favDestinos.forEach(item => {
        const card = document.createElement('div');
        card.className = 'favorite-mini-card';
        card.innerHTML = `
            <div class="fav-info" style="cursor: pointer;">
                <div class="fav-title">${item.destino}</div>
                <div class="fav-dept">${item.departamento}</div>
            </div>
            <button class="btn-mini-fav" title="Quitar de favoritos">★</button>
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
    
    const btnClearRes = document.getElementById('btn-limpiar-itinerario-resultados');
    if (count > 0) {
        tabBadge.textContent = count;
        tabBadge.style.display = 'inline-block';
        
        // Populate text names
        const names = appDestinos
            .filter(item => itinerary.includes(item.id))
            .map(item => item.destino)
            .join(', ');
        barList.textContent = names;

        // Show sticky bar
        bar.classList.add('visible');
        if (btnClearRes) btnClearRes.style.display = 'block';
    } else {
        tabBadge.style.display = 'none';
        bar.classList.remove('visible');
        if (btnClearRes) btnClearRes.style.display = 'none';
    }
}

// Render "Mi Itinerario" tab details
function renderItineraryTab() {
    const stepsList = document.getElementById('itinerary-steps-list');
    stepsList.innerHTML = '';

    const itineraryDestinos = appDestinos.filter(item => itinerary.includes(item.id));

    if (itineraryDestinos.length === 0) {
        stepsList.innerHTML = `
            <div class="no-favorites" style="padding: 50px;">
                No tienes destinos seleccionados para tu recorrido. 
                <br><br>
                Busca destinos y marca la casilla <strong>"Recorrido"</strong> en los resultados de búsqueda para agregarlos aquí.
            </div>
        `;
        document.getElementById('btn-trazar-itinerario-tab').style.display = 'none';
        return;
    }

    document.getElementById('btn-trazar-itinerario-tab').style.display = 'block';

    itineraryDestinos.forEach((item, index) => {
        const stepCard = document.createElement('div');
        stepCard.className = 'itinerary-step-card';
        stepCard.innerHTML = `
            <div class="step-num">${index + 1}</div>
            <div class="step-details">
                <div class="step-name">${item.destino}</div>
                <div class="step-dept">${item.departamento}</div>
            </div>
            <button class="btn-remove-step" data-id="${item.id}" title="Eliminar del recorrido">✕</button>
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


