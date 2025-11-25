// Carregar dados do GeoServer

// Funcao para carregar escolas
async function loadEscolas() {
    try {
        const wfsUrl = `${GEOSERVER_CONFIG.url}/${GEOSERVER_CONFIG.workspace}/ows?` +
            `service=WFS&` +
            `version=1.0.0&` +
            `request=GetFeature&` +
            `typeName=${GEOSERVER_CONFIG.layers.escolas}&` +
            `outputFormat=application/json&` +
            `srsName=EPSG:4326`;

        console.log('Carregando escolas de:', wfsUrl);

        const response = await fetch(wfsUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Escolas carregadas:', data.features.length);

        data.features.forEach(feature => {
            const props = feature.properties;

            // Calcular centroide do polígono (para dados internos)
            const coords = feature.geometry.coordinates[0];
            const centroid = calculateCentroid(coords);

            const escola = {
                id: props.escola_id,
                nome: props.nome || 'Sem nome',
                morada: props.morada || 'Não especificada',
                ciclo1: props.ciclo_1 || false,
                ciclo2: props.ciclo_2 || false,
                ciclo3: props.ciclo_3 || false,
                secundario: props.secundario || false,
                agrupamento: props.agrupamento || 'Não especificado',
                sedeAgrupamento: props.sede_agrupameno || false,
                coords: centroid,
                geometry: feature.geometry  // Guardar geometria completa
            };

            escolasData.push(escola);
            addEscolaPolygon(escola);  // Exibir polígono em vez de marcador
        });

    } catch (error) {
        console.error('Erro ao carregar escolas:', error);
        alert('Erro ao conectar ao GeoServer para carregar escolas: ' + error.message);
    }
}

// Funcao para carregar postos
async function loadPostos() {
    try {
        const wfsUrl = `${GEOSERVER_CONFIG.url}/${GEOSERVER_CONFIG.workspace}/ows?` +
            `service=WFS&` +
            `version=1.0.0&` +
            `request=GetFeature&` +
            `typeName=${GEOSERVER_CONFIG.layers.postos}&` +
            `outputFormat=application/json&` +
            `srsName=EPSG:4326`;

        console.log('Carregando postos de:', wfsUrl);

        const response = await fetch(wfsUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Verificar tipo de resposta
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Resposta não é JSON:', text.substring(0, 200));
            throw new Error('GeoServer retornou XML em vez de JSON. Verifique o nome da camada de postos.');
        }

        const data = await response.json();
        console.log('Postos carregados:', data.features.length);

        data.features.forEach(feature => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates;

            const posto = {
                id: props.postos_id,
                nome: props.nome || 'Sem nome',
                bandeira: props.bandeira || 'Não especificada',
                concessaoPetro: props.concessao_petro || false,
                morada: props.morada || 'Não especificada',
                coords: [coords[1], coords[0]] // Lat, Lng
            };

            postosData.push(posto);
            addPostoMarker(posto);
        });

        // Criar filtros de bandeira
        createBandeiraFilters();

    } catch (error) {
        console.error('Erro ao carregar postos:', error);
        alert('Erro ao carregar postos: ' + error.message + '\n\nVerifique se a camada "' + GEOSERVER_CONFIG.layers.postos + '" existe no GeoServer.');
    }
}

// Adicionar polígono de escola ao mapa
function addEscolaPolygon(escola) {
    // Converter coordenadas GeoJSON para formato Leaflet [lat, lng]
    const latlngs = escola.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);

    // Preparar conteúdo do popup
    const ciclos = [];
    if (escola.ciclo1) ciclos.push('1º Ciclo');
    if (escola.ciclo2) ciclos.push('2º Ciclo');
    if (escola.ciclo3) ciclos.push('3º Ciclo');
    if (escola.secundario) ciclos.push('Secundário');

    const popupContent = `
        <div class="popup-title">${escola.nome}</div>
        <div class="popup-field"><strong>Morada:</strong> ${escola.morada}</div>
        <div class="popup-field"><strong>Ciclos:</strong> ${ciclos.join(', ') || 'Não especificado'}</div>
        <div class="popup-field"><strong>Agrupamento:</strong> ${escola.agrupamento}</div>
        ${escola.sedeAgrupamento ? '<div class="popup-field"><strong>Sede de Agrupamento</strong></div>' : ''}
    `;

    // Criar polígono com estilo
    const polygon = L.polygon(latlngs, {
        color: '#3b82f6',        // Azul para borda
        fillColor: '#3b82f6',    // Azul para preenchimento
        fillOpacity: 0.3,         // Transparência do preenchimento
        weight: 2                 // Espessura da borda
    })
        .bindPopup(popupContent)
        .addTo(escolasLayer);

    // Adicionar dados ao polígono para compatibilidade com filtros
    polygon.escolaData = escola;

    // Armazenar referência ao polígono no objeto escola
    escola.polygon = polygon;

    // Registrar no sistema de filtros (se função existir)
    if (typeof registrarMarcadorEscola === 'function') {
        registrarMarcadorEscola(polygon);
    }
}

// Adicionar marcador de posto
function addPostoMarker(posto) {
    const icon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const tooltipContent = `
    <div class="posto-tooltip-inner">
        <div class="posto-tooltip-title">${posto.nome}</div>
        <div class="posto-tooltip-field">
            <span class="posto-tooltip-label">Bandeira:</span> 
            <span class="posto-tooltip-value">${posto.bandeira}</span>
        </div>
        <div class="posto-tooltip-field">
            <span class="posto-tooltip-label">Morada:</span> 
            <span class="posto-tooltip-value">${posto.morada}</span>
        </div>
        ${posto.concessaoPetro ? '<div class="posto-tooltip-badge">Concessão Petrolífera</div>' : ''}
    </div>
`;

    const marker = L.marker(posto.coords, { icon: icon })
        .bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top',
            offset: [0, -35],
            opacity: 0.95
        })
        .addTo(postosLayer);

    // Adicionar dados ao marcador
    marker.postoData = posto;

    // Armazenar referência
    posto.marker = marker;

    // Registrar no sistema de filtros (se função existir)
    if (typeof registrarMarcadorPosto === 'function') {
        registrarMarcadorPosto(marker);
    }
}

// Calcular centróide de um polígono
function calculateCentroid(coords) {
    let latSum = 0;
    let lngSum = 0;
    const numCoords = coords.length;

    coords.forEach(coord => {
        lngSum += coord[0];
        latSum += coord[1];
    });

    return [latSum / numCoords, lngSum / numCoords];
}

// Criar filtros de bandeira de postos
function createBandeiraFilters() {
    // Tentar encontrar o container com ID correto do HTML
    const container = document.getElementById('bandeira-filters');

    if (!container) {
        console.error('Container de filtros de bandeira não encontrado (ID: bandeira-filters)');
        return;
    }

    // Limpar filtros existentes
    container.innerHTML = '';

    // Obter lista única de bandeiras
    const bandeiras = [...new Set(postosData.map(p => p.bandeira))].sort();

    if (bandeiras.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">Nenhum posto carregado</p>';
        return;
    }

    bandeiras.forEach(bandeira => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" class="filter-posto" value="${bandeira}" checked>
            ${bandeira}
        `;
        container.appendChild(label);
    });

    console.log('Filtros de bandeira criados:', bandeiras);

    // Adicionar event listeners
    document.querySelectorAll('.filter-posto').forEach(checkbox => {
        checkbox.addEventListener('change', applyPostosFilter);
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadEscolas();
    loadPostos();
});