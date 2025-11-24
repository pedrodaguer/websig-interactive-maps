// Inicializacao da aplicacao

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando aplicacao...');

    // Controle de camadas base
    document.querySelectorAll('input[name="baseLayer"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'osm') {
                map.removeLayer(satelliteLayer);
                map.addLayer(osmLayer);
            } else {
                map.removeLayer(osmLayer);
                map.addLayer(satelliteLayer);
            }
        });
    });

    // Controle de visibilidade das camadas
    document.getElementById('toggleEscolas').addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(escolasLayer);
        } else {
            map.removeLayer(escolasLayer);
        }
    });

    document.getElementById('togglePostos').addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(postosLayer);
        } else {
            map.removeLayer(postosLayer);
        }
    });

    document.getElementById('toggleCustom').addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(customLayer);
        } else {
            map.removeLayer(customLayer);
        }
    });

    // Botoes de ferramentas
    document.getElementById('measureBtn').addEventListener('click', toggleMeasure);
    document.getElementById('addPointBtn').addEventListener('click', toggleAddPoint);

    // Carregar dados do GeoServer
    try {
        await loadEscolas();
        await loadPostos();
        console.log('Dados carregados com sucesso');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
});
