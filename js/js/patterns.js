/**
 * Sistema de Quantificação Price Action Brooks
 * Gerenciamento de Padrões
 */

// Dados de padrões (simulados para exemplo)
const PATTERNS_DATA = {
    "major-trend-reversals": {
        name: "Major Trend Reversals",
        category: "Reversão",
        description: "Padrões poderosos que sinalizam a reversão de uma tendência estabelecida...",
        stats: {
            winRate: 0.68,
            expectancy: 1.5,
            trades: 142,
            profitFactor: 2.4
        },
        contexts: [
            { name: "Final de Tendência", winRate: 0.75, expectancy: 1.8 },
            { name: "Após um Climax", winRate: 0.72, expectancy: 1.7 },
            { name: "Mercado em Range", winRate: 0.58, expectancy: 0.9 }
        ]
    },
    "final-flags": {
        name: "Final Flags",
        category: "Reversão",
        description: "Padrões que ocorrem no final de uma tendência...",
        stats: {
            winRate: 0.65,
            expectancy: 1.3,
            trades: 118,
            profitFactor: 2.1
        },
        contexts: [
            { name: "Final de Tendência", winRate: 0.72, expectancy: 1.6 },
            { name: "Alta Volatilidade", winRate: 0.68, expectancy: 1.5 },
            { name: "Baixa Volatilidade", winRate: 0.55, expectancy: 0.8 }
        ]
    },
    // Adicione dados para os outros padrões
};

/**
 * Carrega e exibe detalhes de um padrão específico
 * @param {string} patternId - ID do padrão
 */
function loadPatternDetails(patternId) {
    // Na implementação real, isso buscaria dados da API
    const pattern = PATTERNS_DATA[patternId];
    
    if (!pattern) {
        console.error(`Padrão não encontrado: ${patternId}`);
        return;
    }
    
    // Atualizar elementos da página
    document.querySelector('.pattern-category').textContent = pattern.category;
    document.querySelector('.pattern-title').textContent = pattern.name;
    document.querySelector('.pattern-description').innerHTML = pattern.description;
    
    // Atualizar estatísticas
    document.querySelector('.pattern-win-rate').textContent = `${(pattern.stats.winRate * 100).toFixed(1)}%`;
    document.querySelector('.pattern-win-rate-bar').style.width = `${pattern.stats.winRate * 100}%`;
    
    document.querySelector('.pattern-expectancy').textContent = `${pattern.stats.expectancy.toFixed(1)}R`;
    document.querySelector('.pattern-expectancy-bar').style.width = `${(pattern.stats.expectancy / 2) * 100}%`;
    
    document.querySelector('.pattern-trades').textContent = pattern.stats.trades;
    document.querySelector('.pattern-profit-factor').textContent = pattern.stats.profitFactor.toFixed(1);
    
    // Atualizar contextos
    const contextsContainer = document.querySelector('.pattern-contexts');
    contextsContainer.innerHTML = '';
    
    pattern.contexts.forEach(context => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-2 px-3 text-sm">${context.name}</td>
            <td class="py-2 px-3 text-sm">${(context.winRate * 100).toFixed(0)}%</td>
            <td class="py-2 px-3 text-sm">${context.expectancy.toFixed(1)}R</td>
        `;
        contextsContainer.appendChild(row);
    });
}

/**
 * Inicializa a página de padrões
 */
function initPatternsPage() {
    // Determinar qual padrão está sendo visualizado com base na URL
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    
    if (filename.startsWith('patterns-') && filename !== 'patterns-all.html') {
        const patternId = filename.replace('patterns-', '').replace('.html', '');
        loadPatternDetails(patternId);
    }
    
    // Se for a página "Ver Todos", carregar lista de todos os padrões
    if (filename === 'patterns-all.html') {
        loadAllPatterns();
    }
}

/**
 * Carrega e exibe todos os padrões disponíveis
 */
function loadAllPatterns() {
    // Implemente a lógica para listar todos os padrões
    console.log("Carregando todos os padrões...");
}

// Inicialização da página
document.addEventListener('DOMContentLoaded', initPatternsPage);
