// Sistema de digitalizacao - LocalStorage

let addPointMode = false;
let tempMarker = null;

// Carregar pontos personalizados do LocalStorage
function loadCustomPoints() {
    const saved = localStorage.getItem('customPoints');
    if (saved) {
        const points = JSON.parse(saved);
        points.forEach(point => {
            addCustomMarker(point, false);
        });
        console.log(`Carregados ${points.length} pontos personalizados`);
    }
}

// Salvar pontos no LocalStorage
function saveCustomPoints() {
    const points = [];
    customLayer.eachLayer(marker => {
        if (marker.customData) {
            points.push(marker.customData);
        }
    });
    localStorage.setItem('customPoints', JSON.stringify(points));
}

// Ativar modo de adicionar ponto
function toggleAddPoint() {
    addPointMode = !addPointMode;
    const btn = document.getElementById('addPointBtn');
    
    if (addPointMode) {
        btn.classList.add('active');
        btn.textContent = 'Cancelar';
        map.getContainer().style.cursor = 'crosshair';
    } else {
        btn.classList.remove('active');
        btn.textContent = 'Adicionar Ponto';
        map.getContainer().style.cursor = '';
        if (tempMarker) {
            map.removeLayer(tempMarker);
            tempMarker = null;
        }
    }
}

// Adicionar ponto temporario
function addTempPoint(latlng) {
    if (!addPointMode) return;

    // Remover marcador temporario anterior
    if (tempMarker) {
        map.removeLayer(tempMarker);
    }

    // Adicionar marcador temporario
    tempMarker = L.marker(latlng, {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map);

    // Abrir modal
    openModal(latlng);
}

// Abrir modal
function openModal(latlng) {
    const modal = document.getElementById('addPointModal');
    modal.style.display = 'block';
    modal.dataset.lat = latlng.lat;
    modal.dataset.lng = latlng.lng;
}

// Fechar modal
function closeModal() {
    const modal = document.getElementById('addPointModal');
    modal.style.display = 'none';
    document.getElementById('pointForm').reset();
    
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
    
    addPointMode = false;
    document.getElementById('addPointBtn').classList.remove('active');
    document.getElementById('addPointBtn').textContent = 'Adicionar Ponto';
    map.getContainer().style.cursor = '';
}

// Salvar ponto
function savePoint(e) {
    e.preventDefault();
    
    const modal = document.getElementById('addPointModal');
    const point = {
        name: document.getElementById('pointName').value,
        category: document.getElementById('pointCategory').value,
        description: document.getElementById('pointDescription').value,
        coords: [parseFloat(modal.dataset.lat), parseFloat(modal.dataset.lng)],
        timestamp: new Date().toISOString()
    };

    addCustomMarker(point, true);
    closeModal();
}

// Adicionar marcador personalizado
function addCustomMarker(point, save) {
    const icon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const categoryLabels = {
        comercio: 'Comercio Tradicional',
        patrimonio: 'Patrimonio',
        arvore: 'Arvore',
        outro: 'Outro'
    };

    const popupContent = `
        <div class="popup-title">${point.name}</div>
        <div class="popup-field"><strong>Categoria:</strong> ${categoryLabels[point.category]}</div>
        ${point.description ? `<div class="popup-field"><strong>Descricao:</strong> ${point.description}</div>` : ''}
        <div class="popup-field" style="font-size: 11px; color: #888;">
            ${new Date(point.timestamp).toLocaleString('pt-PT')}
        </div>
        <button onclick="deleteCustomPoint(${point.coords[0]}, ${point.coords[1]})" 
                style="margin-top: 8px; padding: 5px 10px; background: #ff4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Eliminar
        </button>
    `;

    const marker = L.marker(point.coords, { icon: icon })
        .bindPopup(popupContent)
        .addTo(customLayer);

    marker.customData = point;

    if (save) {
        saveCustomPoints();
    }
}

// Eliminar ponto personalizado
function deleteCustomPoint(lat, lng) {
    customLayer.eachLayer(marker => {
        if (marker.customData && 
            marker.customData.coords[0] === lat && 
            marker.customData.coords[1] === lng) {
            customLayer.removeLayer(marker);
        }
    });
    saveCustomPoints();
    map.closePopup();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Modal
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('pointForm').addEventListener('submit', savePoint);
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('addPointModal');
        if (e.target === modal) {
            closeModal();
        }
    });

    // Carregar pontos salvos
    loadCustomPoints();
});

// Interceptar cliques no mapa para adicionar pontos
map.on('click', function(e) {
    if (addPointMode && !measureMode) {
        addTempPoint(e.latlng);
    }
});
