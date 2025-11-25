/**
 * Sistema de Inventário Arbóreo Urbano
 * Recolha de dados georreferenciados de árvores em Faro
 * Armazenamento em localStorage como GeoJSON
 */

// Layer group para árvores
let arvoresLayer = L.layerGroup();

// Estado do modo de adição
let addArvoreMode = false;
let tempArvoreMarker = null;

// Chave do localStorage
const STORAGE_KEY = 'inventario_arboreo_faro';

/**
 * Inicializar o módulo de inventário arbóreo
 */
function initInventarioArboreo() {
    console.log('Inicializando inventário arbóreo...');
    
    // Adicionar layer ao mapa
    arvoresLayer.addTo(map);
    
    // Carregar dados salvos
    loadArvoresFromStorage();
    
    // Event listeners
    setupArvoreEventListeners();
    
    console.log(`Carregadas ${getArvoresCount()} árvores do inventário`);
}

/**
 * Configurar event listeners
 */
function setupArvoreEventListeners() {
    // Botão para adicionar árvore
    const btnAddArvore = document.getElementById('addArvoreBtn');
    if (btnAddArvore) {
        btnAddArvore.addEventListener('click', toggleAddArvoreMode);
    }
    
    // Formulário de árvore
    const form = document.getElementById('arvoreForm');
    if (form) {
        form.addEventListener('submit', saveArvore);
    }
    
    // Botões de modal
    const cancelBtn = document.getElementById('cancelArvoreBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeArvoreModal);
    }
    
    const closeBtn = document.querySelector('#arvoreModal .close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeArvoreModal);
    }
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('arvoreModal');
        if (e.target === modal) {
            closeArvoreModal();
        }
    });
    
    // Toggle de visibilidade da camada
    const toggleArvores = document.getElementById('toggleArvores');
    if (toggleArvores) {
        toggleArvores.addEventListener('change', (e) => {
            if (e.target.checked) {
                map.addLayer(arvoresLayer);
            } else {
                map.removeLayer(arvoresLayer);
            }
        });
    }
    
    // Botão de exportar dados
    const btnExport = document.getElementById('exportArvoresBtn');
    if (btnExport) {
        btnExport.addEventListener('click', exportarInventario);
    }
    
    // Botão de importar dados
    const btnImport = document.getElementById('importArvoresBtn');
    if (btnImport) {
        btnImport.addEventListener('click', () => {
            document.getElementById('importArvoresFile').click();
        });
    }
    
    const fileInput = document.getElementById('importArvoresFile');
    if (fileInput) {
        fileInput.addEventListener('change', importarInventario);
    }
}

/**
 * Ativar/desativar modo de adicionar árvore
 */
function toggleAddArvoreMode() {
    addArvoreMode = !addArvoreMode;
    const btn = document.getElementById('addArvoreBtn');
    
    if (addArvoreMode) {
        btn.classList.add('active');
        btn.textContent = '✖ Cancelar';
        map.getContainer().style.cursor = 'crosshair';
        
        // Adicionar listener de clique no mapa
        map.on('click', onMapClickArvore);
    } else {
        btn.classList.remove('active');
        btn.textContent = '🌳 Adicionar Árvore';
        map.getContainer().style.cursor = '';
        
        // Remover listener
        map.off('click', onMapClickArvore);
        
        // Remover marcador temporário
        if (tempArvoreMarker) {
            map.removeLayer(tempArvoreMarker);
            tempArvoreMarker = null;
        }
    }
}

/**
 * Handler de clique no mapa para adicionar árvore
 */
function onMapClickArvore(e) {
    if (!addArvoreMode) return;
    
    // Remover marcador temporário anterior
    if (tempArvoreMarker) {
        map.removeLayer(tempArvoreMarker);
    }
    
    // Criar marcador temporário
    tempArvoreMarker = L.marker(e.latlng, {
        icon: L.icon({
            iconUrl: 'https://img.icons8.com/?size=100&id=jD6t-ciF8Wat&format=png&color=000000',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map);
    
    // Abrir modal
    openArvoreModal(e.latlng);
}

/**
 * Abrir modal de cadastro de árvore
 */
function openArvoreModal(latlng) {
    const modal = document.getElementById('arvoreModal');
    modal.style.display = 'block';
    modal.dataset.lat = latlng.lat;
    modal.dataset.lng = latlng.lng;
    
    // Limpar formulário
    document.getElementById('arvoreForm').reset();
    
    // Focus no primeiro campo
    document.getElementById('arvoreEspecie').focus();
}

/**
 * Fechar modal de árvore
 */
function closeArvoreModal() {
    const modal = document.getElementById('arvoreModal');
    modal.style.display = 'none';
    document.getElementById('arvoreForm').reset();
    
    // Remover marcador temporário
    if (tempArvoreMarker) {
        map.removeLayer(tempArvoreMarker);
        tempArvoreMarker = null;
    }
    
    // Desativar modo de adição
    if (addArvoreMode) {
        toggleAddArvoreMode();
    }
}

/**
 * Salvar árvore no inventário
 */
function saveArvore(e) {
    e.preventDefault();
    
    const modal = document.getElementById('arvoreModal');
    const lat = parseFloat(modal.dataset.lat);
    const lng = parseFloat(modal.dataset.lng);
    
    // Coletar dados do formulário
    const arvoreData = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [lng, lat]
        },
        properties: {
            id: Date.now().toString(),
            especie: document.getElementById('arvoreEspecie').value,
            nome_comum: document.getElementById('arvoreNomeComum').value || '',
            altura: parseFloat(document.getElementById('arvoreAltura').value) || 0,
            diametro: parseFloat(document.getElementById('arvoreDiametro').value) || 0,
            estado: document.getElementById('arvoreEstado').value,
            localizacao: document.getElementById('arvoreLocalizacao').value || '',
            observacoes: document.getElementById('arvoreObservacoes').value || '',
            data_cadastro: new Date().toISOString(),
            cadastrado_por: document.getElementById('arvoreCadastradoPor').value || 'Anônimo'
        }
    };
    
    // Adicionar ao mapa
    addArvoreMarker(arvoreData);
    
    // Salvar no localStorage
    saveArvoreToStorage(arvoreData);
    
    // Fechar modal
    closeArvoreModal();
    
    // Feedback
    showNotification(`Árvore "${arvoreData.properties.especie}" adicionada com sucesso!`, 'success');
}

/**
 * Adicionar marcador de árvore no mapa
 */
function addArvoreMarker(arvoreData) {
    const props = arvoreData.properties;
    const coords = arvoreData.geometry.coordinates;
    
    // Definir cor do marcador baseado no estado
    const iconColors = {
        'excelente': 'green',
        'bom': 'blue',
        'regular': 'yellow',
        'ruim': 'orange',
        'critico': 'red'
    };
    
    const color = iconColors[props.estado] || 'green';
    
    const icon = L.icon({
        iconUrl: `https://img.icons8.com/?size=100&id=jD6t-ciF8Wat&format=png&color=000000`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    
    // Criar conteúdo do popup
    const estadoLabels = {
        'excelente': 'Excelente',
        'bom': 'Bom',
        'regular': 'Regular',
        'ruim': 'Ruim',
        'critico': 'Crítico'
    };
    
    const popupContent = `
        <div class="popup-title">🌳 ${props.especie}</div>
        ${props.nome_comum ? `<div class="popup-field"><strong>Nome Comum:</strong> ${props.nome_comum}</div>` : ''}
        <div class="popup-field"><strong>Altura:</strong> ${props.altura}m</div>
        <div class="popup-field"><strong>Diâmetro:</strong> ${props.diametro}cm</div>
        <div class="popup-field"><strong>Estado:</strong> <span style="color: ${color}">${estadoLabels[props.estado]}</span></div>
        ${props.localizacao ? `<div class="popup-field"><strong>Localização:</strong> ${props.localizacao}</div>` : ''}
        ${props.observacoes ? `<div class="popup-field"><strong>Observações:</strong> ${props.observacoes}</div>` : ''}
        <div class="popup-field" style="font-size: 11px; color: #888;">
            Cadastrado em: ${new Date(props.data_cadastro).toLocaleDateString('pt-PT')}
        </div>
        <div class="popup-field" style="font-size: 11px; color: #888;">
            Por: ${props.cadastrado_por}
        </div>
        <button onclick="deleteArvore('${props.id}')" 
                style="margin-top: 8px; padding: 5px 10px; background: #ff4444; color: white; 
                       border: none; border-radius: 4px; cursor: pointer;">
            Eliminar
        </button>
    `;
    
    const marker = L.marker([coords[1], coords[0]], { icon })
        .bindPopup(popupContent)
        .addTo(arvoresLayer);
    
    marker.arvoreData = arvoreData;
}

/**
 * Carregar árvores do localStorage
 */
function loadArvoresFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return;
        
        const geojson = JSON.parse(data);
        
        if (geojson.type === 'FeatureCollection') {
            geojson.features.forEach(feature => {
                addArvoreMarker(feature);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar inventário arbóreo:', error);
    }
}

/**
 * Salvar árvore no localStorage
 */
function saveArvoreToStorage(arvoreData) {
    try {
        // Carregar dados existentes
        let geojson = {
            type: 'FeatureCollection',
            features: []
        };
        
        const existing = localStorage.getItem(STORAGE_KEY);
        if (existing) {
            geojson = JSON.parse(existing);
        }
        
        // Adicionar nova árvore
        geojson.features.push(arvoreData);
        
        // Salvar
        localStorage.setItem(STORAGE_KEY, JSON.stringify(geojson));
        
        // Atualizar contador
        updateArvoresCount();
        
    } catch (error) {
        console.error('Erro ao salvar árvore:', error);
        showNotification('Erro ao salvar árvore no localStorage', 'error');
    }
}

/**
 * Eliminar árvore
 */
function deleteArvore(id) {
    if (!confirm('Tem certeza que deseja eliminar esta árvore do inventário?')) {
        return;
    }
    
    try {
        // Remover do mapa
        arvoresLayer.eachLayer(marker => {
            if (marker.arvoreData && marker.arvoreData.properties.id === id) {
                arvoresLayer.removeLayer(marker);
            }
        });
        
        // Remover do localStorage
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const geojson = JSON.parse(data);
            geojson.features = geojson.features.filter(f => f.properties.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(geojson));
        }
        
        // Fechar popup
        map.closePopup();
        
        // Atualizar contador
        updateArvoresCount();
        
        showNotification('Árvore eliminada com sucesso', 'success');
        
    } catch (error) {
        console.error('Erro ao eliminar árvore:', error);
        showNotification('Erro ao eliminar árvore', 'error');
    }
}

/**
 * Exportar inventário como GeoJSON
 */
function exportarInventario() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            showNotification('Não há dados para exportar', 'warning');
            return;
        }
        
        const geojson = JSON.parse(data);
        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventario_arboreo_faro_${new Date().toISOString().split('T')[0]}.geojson`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Inventário exportado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar:', error);
        showNotification('Erro ao exportar inventário', 'error');
    }
}

/**
 * Importar inventário de arquivo GeoJSON
 */
function importarInventario(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const geojson = JSON.parse(event.target.result);
            
            if (geojson.type !== 'FeatureCollection') {
                showNotification('Arquivo inválido. Deve ser um GeoJSON FeatureCollection', 'error');
                return;
            }
            
            // Limpar camada atual
            arvoresLayer.clearLayers();
            
            // Salvar no localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(geojson));
            
            // Carregar dados importados
            loadArvoresFromStorage();
            
            showNotification(`${geojson.features.length} árvores importadas com sucesso!`, 'success');
            
        } catch (error) {
            console.error('Erro ao importar:', error);
            showNotification('Erro ao importar arquivo. Verifique o formato.', 'error');
        }
    };
    reader.readAsText(file);
    
    // Limpar input
    e.target.value = '';
}

/**
 * Obter contagem de árvores
 */
function getArvoresCount() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return 0;
        
        const geojson = JSON.parse(data);
        return geojson.features ? geojson.features.length : 0;
    } catch (error) {
        return 0;
    }
}

/**
 * Atualizar contador de árvores
 */
function updateArvoresCount() {
    const countElement = document.getElementById('arvoresCount');
    if (countElement) {
        countElement.textContent = getArvoresCount();
    }
}

/**
 * Mostrar notificação
 */
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInventarioArboreo);
} else {
    initInventarioArboreo();
}
