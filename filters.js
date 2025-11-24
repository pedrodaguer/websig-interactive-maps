// Sistema de filtros - Versao Final Corrigida

// Arrays para armazenar TODOS os marcadores
let todosMarcdoresEscolas = [];
let todosMarcadoresPostos = [];

// ============================================================================
// FILTROS DE ESCOLAS
// ============================================================================

function applyEscolasFilter() {
    // Ler estado dos checkboxes
    const filtros = {
        ciclo1: document.querySelector('.filter-escola[value="ciclo1"]')?.checked || false,
        ciclo2: document.querySelector('.filter-escola[value="ciclo2"]')?.checked || false,
        ciclo3: document.querySelector('.filter-escola[value="ciclo3"]')?.checked || false,
        secundario: document.querySelector('.filter-escola[value="secundario"]')?.checked || false,
        sede: document.querySelector('.filter-escola[value="sede"]')?.checked || false
    };

    // Se nenhum filtro marcado
    const algumFiltroAtivo = filtros.ciclo1 || filtros.ciclo2 || filtros.ciclo3 ||
        filtros.secundario || filtros.sede;

    // Limpar layer completamente
    escolasLayer.clearLayers();

    // Adicionar de volta apenas os que devem aparecer
    todosMarcdoresEscolas.forEach(function(marker) {
        if (!marker.escolaData) return;

        const escola = marker.escolaData;
        let mostrar = false;

        // Se nenhum filtro ativo, mostrar todas
        if (!algumFiltroAtivo) {
            mostrar = true;
        } else {
            // Mostrar se tiver qualquer ciclo marcado
            if (filtros.ciclo1 && escola.ciclo1 === true) mostrar = true;
            if (filtros.ciclo2 && escola.ciclo2 === true) mostrar = true;
            if (filtros.ciclo3 && escola.ciclo3 === true) mostrar = true;
            if (filtros.secundario && escola.secundario === true) mostrar = true;
            if (filtros.sede && escola.sedeAgrupamento === true) mostrar = true;
        }

        if (mostrar) {
            escolasLayer.addLayer(marker);
        }
    });
}

// ============================================================================
// FILTROS DE POSTOS
// ============================================================================

function applyPostosFilter() {
    // Obter bandeiras marcadas
    const bandeirasMarcadas = [];
    document.querySelectorAll('.filter-posto:checked').forEach(function(checkbox) {
        bandeirasMarcadas.push(checkbox.value);
    });

    // Limpar layer completamente
    postosLayer.clearLayers();

    // Adicionar de volta apenas os que devem aparecer
    todosMarcadoresPostos.forEach(function(marker) {
        if (!marker.postoData) return;

        const posto = marker.postoData;
        const mostrar = bandeirasMarcadas.includes(posto.bandeira);

        if (mostrar) {
            postosLayer.addLayer(marker);
        }
    });
}

// ============================================================================
// RESETAR FILTROS
// ============================================================================

function resetFilters() {
    // Marcar todos os checkboxes
    document.querySelectorAll('.filter-escola').forEach(function(checkbox) {
        checkbox.checked = true;
    });

    document.querySelectorAll('.filter-posto').forEach(function(checkbox) {
        checkbox.checked = true;
    });

    // Limpar layers
    escolasLayer.clearLayers();
    postosLayer.clearLayers();

    // Adicionar TODOS os marcadores de volta
    todosMarcdoresEscolas.forEach(function(marker) {
        escolasLayer.addLayer(marker);
    });

    todosMarcadoresPostos.forEach(function(marker) {
        postosLayer.addLayer(marker);
    });
}

// ============================================================================
// REGISTRAR MARCADORES (chamar quando criar marcadores)
// ============================================================================

function registrarMarcadorEscola(marker) {
    todosMarcdoresEscolas.push(marker);
}

function registrarMarcadorPosto(marker) {
    todosMarcadoresPostos.push(marker);
}

// ============================================================================
// INICIALIZACAO
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Conectar filtros
    document.querySelectorAll('.filter-escola').forEach(function(checkbox) {
        checkbox.addEventListener('change', applyEscolasFilter);
    });

    // Conectar reset
    const btnReset = document.getElementById('resetFiltersBtn');
    if (btnReset) {
        btnReset.addEventListener('click', resetFilters);
    }
});