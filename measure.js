// Sistema de medicao de distancias

let measureMode = false;
let measurePoints = [];
let measureLine = null;
let measureMarkers = [];

// Ativar/desativar modo de medicao
function toggleMeasure() {
    measureMode = !measureMode;
    const btn = document.getElementById('measureBtn');
    
    if (measureMode) {
        btn.classList.add('active');
        btn.textContent = 'Cancelar Medicao';
        map.getContainer().style.cursor = 'crosshair';
        document.getElementById('measureResult').textContent = 'Clique no mapa para medir distancia';
    } else {
        btn.classList.remove('active');
        btn.textContent = 'Medir Distancia';
        map.getContainer().style.cursor = '';
        clearMeasure();
    }
}

// Adicionar ponto de medicao
function addMeasurePoint(latlng) {
    if (!measureMode) return;

    measurePoints.push(latlng);

    // Adicionar marcador
    const marker = L.circleMarker(latlng, {
        radius: 5,
        color: '#ff0000',
        fillColor: '#ff0000',
        fillOpacity: 1
    }).addTo(map);
    measureMarkers.push(marker);

    // Se houver 2 pontos, calcular distancia
    if (measurePoints.length === 2) {
        const distance = map.distance(measurePoints[0], measurePoints[1]);
        
        // Desenhar linha
        measureLine = L.polyline(measurePoints, {
            color: '#ff0000',
            weight: 3,
            dashArray: '5, 10'
        }).addTo(map);

        // Mostrar resultado
        const distanceKm = (distance / 1000).toFixed(2);
        const distanceM = distance.toFixed(0);
        document.getElementById('measureResult').innerHTML = `
            <strong>Distancia:</strong><br>
            ${distanceKm} km (${distanceM} m)
        `;

        // Desativar modo
        measureMode = false;
        document.getElementById('measureBtn').classList.remove('active');
        document.getElementById('measureBtn').textContent = 'Medir Distancia';
        map.getContainer().style.cursor = '';
    }
}

// Limpar medicao
function clearMeasure() {
    measurePoints = [];
    
    if (measureLine) {
        map.removeLayer(measureLine);
        measureLine = null;
    }
    
    measureMarkers.forEach(marker => map.removeLayer(marker));
    measureMarkers = [];
    
    document.getElementById('measureResult').textContent = '';
}

// Event listener para cliques no mapa
map.on('click', function(e) {
    addMeasurePoint(e.latlng);
});
