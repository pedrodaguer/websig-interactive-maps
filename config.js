// Configuracao do GeoServer
const GEOSERVER_CONFIG = {
    url: 'http://localhost:2020/geoserver',
    workspace: 'faro',
    layers: {
        escolas: 'faro:escolas_faro',
        postos: 'faro:postos_faro'
    }
};

// Coordenadas de Faro
const FARO_CENTER = [37.0194, -7.9304];
const FARO_ZOOM = 13;

// Layer Groups
let escolasLayer = L.layerGroup();
let postosLayer = L.layerGroup();
let customLayer = L.layerGroup();

// Armazenamento de dados
let escolasData = [];
let postosData = [];

// Inicializar mapa
const map = L.map('map').setView(FARO_CENTER, FARO_ZOOM);

// Camada base OpenStreetMap
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Camada satelite - ORTOFOTOMAPA PORTUGAL (DGTerritório 2023)
const satelliteLayer = L.tileLayer.wms('https://ortos.dgterritorio.gov.pt/wms/ortosat2023', {
    layers: 'ortoSat2023-CorVerdadeira',
    format: 'image/png',
    transparent: false,
    attribution: '© <a href="https://www.dgterritorio.gov.pt/">DGTerritório</a> - Ortofotomapa 2023',
    maxZoom: 19,
    tileSize: 256
});

// Adicionar layer groups ao mapa
escolasLayer.addTo(map);
postosLayer.addTo(map);
customLayer.addTo(map);