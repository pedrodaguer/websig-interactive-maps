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

            // Calcular centroide do poligono
            const coords = feature.geometry.coordinates[0];
            const centroid = calculateCentroid(coords);

            const escola = {
                id: props.escola_id,
                nome: props.nome || 'Sem nome',
                morada: props.morada || 'Nao especificada',
                ciclo1: props.ciclo_1 || false,
                ciclo2: props.ciclo_2 || false,
                ciclo3: props.ciclo_3 || false,
                secundario: props.secundario || false,
                agrupamento: props.agrupamento || 'Nao especificado',
                sedeAgrupamento: props.sede_agrupameno || false,
                coords: centroid
            };

            escolasData.push(escola);
            addEscolaMarker(escola);
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
            console.error('Resposta nao e JSON:', text.substring(0, 200));
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
                bandeira: props.bandeira || 'Nao especificada',
                concessaoPetro: props.concessao_petro || false,
                morada: props.morada || 'Nao especificada',
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

// Adicionar marcador de escola
function addEscolaMarker(escola) {
    const icon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const ciclos = [];
    if (escola.ciclo1) ciclos.push('1º Ciclo');
    if (escola.ciclo2) ciclos.push('2º Ciclo');
    if (escola.ciclo3) ciclos.push('3º Ciclo');
    if (escola.secundario) ciclos.push('Secundario');

    const popupContent = `
        <div class="popup-title">${escola.nome}</div>
        <div class="popup-field"><strong>Morada:</strong> ${escola.morada}</div>
        <div class="popup-field"><strong>Ciclos:</strong> ${ciclos.join(', ') || 'Nenhum'}</div>
        <div class="popup-field"><strong>Agrupamento:</strong> ${escola.agrupamento}</div>
        ${escola.sedeAgrupamento ? '<div class="popup-field" style="color: green;"><strong>Sede de Agrupamento</strong></div>' : ''}
    `;

    const marker = L.marker(escola.coords, { icon: icon })
        .bindPopup(popupContent);

    marker.escolaData = escola;
    marker.addTo(escolasLayer);

    // REGISTRAR no array global de filtros
    registrarMarcadorEscola(marker);
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
        <div class="tooltip-content">
            <strong>${posto.nome}</strong><br>
            ${posto.bandeira}
        </div>
    `;

    const popupContent = `
        <div class="popup-title">${posto.nome}</div>
        <div class="popup-field"><strong>Bandeira:</strong> ${posto.bandeira}</div>
        <div class="popup-field"><strong>Morada:</strong> ${posto.morada}</div>
        <div class="popup-field"><strong>Concessao Petro:</strong> ${posto.concessaoPetro ? 'Sim' : 'Nao'}</div>
    `;

    const marker = L.marker(posto.coords, { icon: icon })
        .bindTooltip(tooltipContent)
        .bindPopup(popupContent);

    marker.postoData = posto;
    marker.addTo(postosLayer);

    // REGISTRAR no array global de filtros
    registrarMarcadorPosto(marker);
}

// Calcular centroide de poligono
function calculateCentroid(coords) {
    let sumLat = 0, sumLng = 0;
    coords.forEach(coord => {
        sumLng += coord[0];
        sumLat += coord[1];
    });
    return [sumLat / coords.length, sumLng / coords.length];
}

// Criar filtros de bandeira dinamicamente
function createBandeiraFilters() {
    const bandeiras = [...new Set(postosData.map(p => p.bandeira))].sort();
    const container = document.getElementById('bandeira-filters');

    if (bandeiras.length === 0) {
        container.innerHTML = '<p style="color: #888; font-size: 12px;">Nenhum posto carregado</p>';
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

    // Adicionar event listeners
    document.querySelectorAll('.filter-posto').forEach(checkbox => {
        checkbox.addEventListener('change', applyPostosFilter);
    });
}