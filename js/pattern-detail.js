/**
 * Sistema de Quantificação Price Action Brooks
 * Lógica para a página de Detalhes do Padrão
 */

// Estado da página
const patternState = {
    pattern: null,        // Dados do padrão atual
    patternTrades: [],    // Trades com este padrão
    allPatterns: [],      // Todos os padrões (para relacionados)
    allContexts: [],      // Todos os contextos (para filtros)
    allTimeframes: [],    // Todos os timeframes (para filtros)
    filters: {
        period: 'all',
        context: 'all',
        timeframe: 'all'
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Obter ID do padrão da URL
    const urlParams = new URLSearchParams(window.location.search);
    const patternId = urlParams.get('id');
    
    if (!patternId) {
        Utils.showToast('ID do padrão não especificado.', 'error');
        redirectToDashboard();
        return;
    }
    
    // Carregar dados do padrão
    loadPatternData(patternId);
    
    // Configurar eventos
    setupEventListeners();
});

/**
 * Configura os event listeners da página
 */
function setupEventListeners() {
    // Botão de novo trade com este padrão
    const newTradeBtn = document.getElementById('new-trade-btn');
    if (newTradeBtn) {
        newTradeBtn.addEventListener('click', function() {
            if (patternState.pattern) {
                // Redirecionar para página de registro com padrão pré-selecionado
                window.location.href = `register.html?pattern=${patternState.pattern.ID}`;
            }
        });
    }
    
    // Botão de exportar estatísticas
    const exportStatsBtn = document.getElementById('export-stats-btn');
    if (exportStatsBtn) {
        exportStatsBtn.addEventListener('click', exportPatternStats);
    }
    
    // Link para ver todos os trades
    const viewAllTradesLink = document.getElementById('view-all-trades');
    if (viewAllTradesLink) {
        viewAllTradesLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (patternState.pattern) {
                // Redirecionar para página de histórico filtrada por este padrão
                window.location.href = `history.html?pattern=${patternState.pattern.Nome}`;
            }
        });
    }
    
    // Formulário de filtros
    const filtersForm = document.getElementById('filters-form');
    if (filtersForm) {
        filtersForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Atualizar filtros
            patternState.filters.period = document.getElementById('period-filter').value;
            patternState.filters.context = document.getElementById('context-filter').value;
            patternState.filters.timeframe = document.getElementById('timeframe-filter').value;
            
            // Recarregar dados com novos filtros
            if (patternState.pattern) {
                loadPatternTrades(patternState.pattern.ID);
            }
            
            Utils.showToast('Filtros aplicados com sucesso.', 'success');
        });
    }
}

/**
 * Carrega dados do padrão e informações relacionadas
 * @param {string} patternId - ID do padrão a ser carregado
 */
async function loadPatternData(patternId) {
    try {
        // Mostrar indicador de carregamento
        document.getElementById('loading-indicator').classList.remove('hidden');
        document.getElementById('pattern-content').classList.add('hidden');
        
        // Carregar dados em paralelo
        const [patterns, contexts, timeframes] = await Promise.all([
            API.getPatterns(),
            API.getContexts(),
            API.getTimeframes()
        ]);
        
        // Armazenar dados para uso futuro
        patternState.allPatterns = patterns;
        patternState.allContexts = contexts;
        patternState.allTimeframes = timeframes;
        
        // Encontrar padrão pelo ID
        const pattern = patterns.find(p => p.ID === patternId);
        
        if (!pattern) {
            Utils.showToast('Padrão não encontrado.', 'error');
            redirectToDashboard();
            return;
        }
        
        // Armazenar padrão atual
        patternState.pattern = pattern;
        
        // Carregar trades com este padrão
        await loadPatternTrades(patternId);
        
        // Preencher dados na interface
        updatePatternInfo(pattern);
        
        // Preencher opções de filtro
        populateFilterOptions();
        
        // Preencher sidebar com lista de padrões
        populatePatternsSidebar(patterns);
        
        // Esconder indicador de carregamento e mostrar conteúdo
        document.getElementById('loading-indicator').classList.add('hidden');
        document.getElementById('pattern-content').classList.remove('hidden');
    } catch (error) {
        console.error('Erro ao carregar dados do padrão:', error);
        Utils.showToast('Erro ao carregar dados. Tente novamente.', 'error');
        
        // Esconder indicador de carregamento
        document.getElementById('loading-indicator').classList.add('hidden');
    }
}

/**
 * Carrega trades com o padrão especificado
 * @param {string} patternId - ID do padrão
 */
async function loadPatternTrades(patternId) {
    try {
        // Construir parâmetros de filtro
        const filterParams = {
            pattern: patternState.pattern.Nome
        };
        
        // Aplicar filtros adicionais se não forem 'all'
        if (patternState.filters.context !== 'all') {
            filterParams.context = patternState.filters.context;
        }
        
        if (patternState.filters.timeframe !== 'all') {
            filterParams.timeframe = patternState.filters.timeframe;
        }
        
        // Calcular datas para filtro de período
        if (patternState.filters.period !== 'all') {
            const today = new Date();
            const dateFrom = new Date();
            
            switch (patternState.filters.period) {
                case 'month':
                    dateFrom.setMonth(today.getMonth() - 1);
                    break;
                case '3months':
                    dateFrom.setMonth(today.getMonth() - 3);
                    break;
                case '6months':
                    dateFrom.setMonth(today.getMonth() - 6);
                    break;
                case 'year':
                    dateFrom.setFullYear(today.getFullYear() - 1);
                    break;
            }
            
            // Adicionar datas ao filtro
            filterParams.dateFrom = dateFrom.toISOString().split('T')[0];
            filterParams.dateTo = today.toISOString().split('T')[0];
        }
        
        // Carregar trades filtrados
        const trades = await API.getTrades(filterParams);
        patternState.patternTrades = trades;
        
        // Atualizar visualizações com os dados
        updateTradesTable(trades);
        updatePerformanceCharts(trades);
        updateRMultipleChart(trades);
        updateWinRateByDirection(trades);
        
    } catch (error) {
        console.error('Erro ao carregar trades do padrão:', error);
        Utils.showToast('Erro ao carregar trades. Tente novamente.', 'error');
    }
}

/**
 * Preenche as informações do padrão na interface
 * @param {Object} pattern - Dados do padrão
 */
function updatePatternInfo(pattern) {
    // Informações básicas
    document.getElementById('pattern-name').textContent = pattern.Nome;
    document.getElementById('pattern-category').textContent = pattern.Categoria;
    document.getElementById('pattern-id').textContent = `ID: ${pattern.ID}`;
    document.getElementById('pattern-description').textContent = pattern.Descrição || 'Sem descrição disponível.';
    document.getElementById('pattern-ideal-context').textContent = pattern['Contexto Ideal'] || 'Não especificado.';
    
    // Força do padrão
    const strengthElement = document.getElementById('pattern-strength');
    if (pattern.Força) {
        strengthElement.textContent = pattern.Força;
        
        // Estilo baseado na força
        if (pattern.Força === 'A') {
            strengthElement.classList.add('bg-green-100', 'text-green-800');
        } else if (pattern.Força === 'B') {
            strengthElement.classList.add('bg-yellow-100', 'text-yellow-800');
        } else {
            strengthElement.classList.add('bg-red-100', 'text-red-800');
        }
    }
    
    // Probabilidade base
    document.getElementById('pattern-probability').textContent = pattern['Probabilidade Base'] || 'N/A';
    
    // Características (criamos uma lista de características a partir da descrição)
    const characteristicsList = document.getElementById('pattern-characteristics');
    characteristicsList.innerHTML = '';
    
    // Simples parsing de descrição para criar características
    // Na implementação real, idealmente teríamos um campo específico para isso
    if (pattern.Descrição) {
        const sentences = pattern.Descrição.split('.');
        sentences.forEach(sentence => {
            if (sentence.trim().length > 10) { // Apenas frases significativas
                const li = document.createElement('li');
                li.textContent = sentence.trim() + '.';
                characteristicsList.appendChild(li);
            }
        });
    }
    
    if (characteristicsList.children.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Características não disponíveis.';
        characteristicsList.appendChild(li);
    }
}

/**
 * Atualiza a tabela de trades recentes com o padrão
 * @param {Array} trades - Lista de trades
 */
function updateTradesTable(trades) {
    const tableBody = document.getElementById('pattern-trades-table');
    
    // Limpar tabela
    tableBody.innerHTML = '';
    
    // Verificar se há trades para mostrar
    if (!trades || trades.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="8" class="py-4 text-center text-gray-500">Nenhum trade encontrado com este padrão.</td>
        `;
        tableBody.appendChild(row);
        return;
    }
    
    // Ordenar por data (mais recente primeiro)
    const sortedTrades = [...trades].sort((a, b) => new Date(b['Data e Hora']) - new Date(a['Data e Hora']));
    
    // Limitar a no máximo 5 trades recentes para a tabela
    const recentTrades = sortedTrades.slice(0, 5);
    
    // Adicionar cada trade à tabela
    recentTrades.forEach(trade => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        // Determinar classe para resultado
        const resultValue = parseFloat(trade['Resultado (R)']);
        const resultClass = resultValue > 0 ? 'text-green-500' : (resultValue < 0 ? 'text-red-500' : 'text-gray-500');
        
        // Determinar classe para direção
        const directionClass = trade['Direção'] === 'Long' ? 'text-green-500' : 'text-red-500';
        
        // Construir linha da tabela
        row.innerHTML = `
            <td class="py-2 px-4 text-sm">${Utils.formatDate(trade['Data e Hora'], 'short')}</td>
            <td class="py-2 px-4 text-sm">${trade['Par de Moedas'] || '-'}</td>
            <td class="py-2 px-4 text-sm">${trade['Contexto de Mercado'] || '-'}</td>
            <td class="py-2 px-4 text-sm ${directionClass}">${trade['Direção'] || '-'}</td>
            <td class="py-2 px-4 text-sm">${trade['Timeframe'] || '-'}</td>
            <td class="py-2 px-4 text-sm">${trade['Qualidade do Setup'] || '-'}</td>
            <td class="py-2 px-4 text-sm ${resultClass}">${Utils.formatR(resultValue)}</td>
            <td class="py-2 px-4 text-sm">
                <a href="#" class="text-blue-600 hover:underline view-trade" data-id="${trade['ID']}">Ver</a>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Adicionar evento aos links "Ver"
    document.querySelectorAll('.view-trade').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tradeId = this.getAttribute('data-id');
            window.location.href = `history.html?trade=${tradeId}`;
        });
    });
    
    // Atualizar estatísticas do padrão
    updatePatternStats(trades);
}

/**
 * Atualiza as estatísticas do padrão na interface
 * @param {Array} trades - Lista de trades com o padrão
 */
function updatePatternStats(trades) {
    // Verificar se há trades para calcular estatísticas
    if (!trades || trades.length === 0) {
        document.getElementById('pattern-total-trades').textContent = '0';
        document.getElementById('pattern-win-rate').textContent = '0.0%';
        document.getElementById('pattern-expectancy').textContent = '0.00R';
        document.getElementById('pattern-win-rate-bar').style.width = '0%';
        document.getElementById('pattern-expectancy-bar').style.width = '0%';
        document.getElementById('pattern-long-win-rate').textContent = '0.0%';
        document.getElementById('pattern-short-win-rate').textContent = '0.0%';
        return;
    }
    
    // Total de trades
    const totalTrades = trades.length;
    document.getElementById('pattern-total-trades').textContent = totalTrades;
    
    // Calcular trades vencedores e taxa de acerto
    const winningTrades = trades.filter(trade => parseFloat(trade['Resultado (R)']) > 0);
    const winRate = winningTrades.length / totalTrades;
    document.getElementById('pattern-win-rate').textContent = Utils.formatPercentage(winRate);
    
    // Atualizar barra de taxa de acerto (0-100%)
    const winRateBar = document.getElementById('pattern-win-rate-bar');
    winRateBar.style.width = `${winRate * 100}%`;
    
    // Definir cor da barra com base na taxa de acerto
    if (winRate >= 0.6) {
        winRateBar.classList.remove('bg-red-600', 'bg-yellow-600');
        winRateBar.classList.add('bg-green-600');
    } else if (winRate >= 0.5) {
        winRateBar.classList.remove('bg-red-600', 'bg-green-600');
        winRateBar.classList.add('bg-yellow-600');
    } else {
        winRateBar.classList.remove('bg-green-600', 'bg-yellow-600');
        winRateBar.classList.add('bg-red-600');
    }
    
    // Calcular expectativa
    const expectancy = trades.reduce((sum, trade) => sum + parseFloat(trade['Resultado (R)']), 0) / totalTrades;
    document.getElementById('pattern-expectancy').textContent = Utils.formatR(expectancy);
    
    // Atualizar barra de expectativa (escala de -2R a +2R, onde 50% é 0R)
    const expectancyBar = document.getElementById('pattern-expectancy-bar');
    const expectancyWidth = Math.min(Math.max((expectancy + 2) / 4 * 100, 0), 100); // Mapear [-2, 2] para [0, 100]
    expectancyBar.style.width = `${expectancyWidth}%`;
    
    // Definir cor da barra com base na expectativa
    if (expectancy >= 0.5) {
        expectancyBar.classList.remove('bg-red-600', 'bg-yellow-600');
        expectancyBar.classList.add('bg-green-600');
    } else if (expectancy >= 0) {
        expectancyBar.classList.remove('bg-red-600', 'bg-green-600');
        expectancyBar.classList.add('bg-yellow-600');
    } else {
        expectancyBar.classList.remove('bg-green-600', 'bg-yellow-600');
        expectancyBar.classList.add('bg-red-600');
    }
    
    // Calcular taxa de acerto por direção
    const longTrades = trades.filter(trade => trade['Direção'] === 'Long');
    const shortTrades = trades.filter(trade => trade['Direção'] === 'Short');
    
    const longWinRate = longTrades.length > 0 
        ? longTrades.filter(trade => parseFloat(trade['Resultado (R)']) > 0).length / longTrades.length 
        : 0;
    
    const shortWinRate = shortTrades.length > 0 
        ? shortTrades.filter(trade => parseFloat(trade['Resultado (R)']) > 0).length / shortTrades.length 
        : 0;
    
    document.getElementById('pattern-long-win-rate').textContent = Utils.formatPercentage(longWinRate);
    document.getElementById('pattern-short-win-rate').textContent = Utils.formatPercentage(shortWinRate);
}

/**
 * Atualiza os gráficos de desempenho por contexto e timeframe
 * @param {Array} trades - Lista de trades
 */
function updatePerformanceCharts(trades) {
    // Criar gráfico de desempenho por contexto
    createContextPerformanceChart(trades);
    
    // Criar gráfico de desempenho por timeframe
    createTimeframePerformanceChart(trades);
    
    // Criar gráfico de padrões relacionados
    createRelatedPatternsSection();
}

/**
 * Cria o gráfico de desempenho por contexto
 * @param {Array} trades - Lista de trades
 */
function createContextPerformanceChart(trades) {
    // Agrupar trades por contexto
    const contextStats = {};
    
    trades.forEach(trade => {
        const context = trade['Contexto de Mercado'];
        if (!context) return;
        
        if (!contextStats[context]) {
            contextStats[context] = {
                count: 0,
                wins: 0,
                results: []
            };
        }
        
        contextStats[context].count++;
        
        const result = parseFloat(trade['Resultado (R)']);
        contextStats[context].results.push(result);
        
        if (result > 0) {
            contextStats[context].wins++;
        }
    });
    
    // Calcular taxa de acerto e expectativa para cada contexto
    const contexts = [];
    const winRates = [];
    const expectancies = [];
    const counts = [];
    
    Object.keys(contextStats).forEach(context => {
        const stats = contextStats[context];
        
        // Filtrar contextos com pelo menos 3 trades
        if (stats.count >= 3) {
            contexts.push(context);
            winRates.push((stats.wins / stats.count) * 100);
            expectancies.push(stats.results.reduce((sum, val) => sum + val, 0) / stats.count);
            counts.push(stats.count);
        }
    });
    
    // Ordenar arrays pelo número de trades (mais para menos)
    const indices = counts.map((_, i) => i);
    indices.sort((a, b) => counts[b] - counts[a]);
    
    const sortedContexts = indices.map(i => contexts[i]);
    const sortedWinRates = indices.map(i => winRates[i]);
    const sortedExpectancies = indices.map(i => expectancies[i]);
    const sortedCounts = indices.map(i => counts[i]);
    
    // Obter contexto do canvas
    const ctx = document.getElementById('contextPerformanceChart');
    
    // Destruir gráfico anterior se existir
    if (window.contextChart) {
        window.contextChart.destroy();
    }
    
    // Se não houver dados, mostrar mensagem
    if (sortedContexts.length === 0) {
        ctx.parentElement.innerHTML = '<p class="text-center text-gray-500 py-8">Dados insuficientes para gerar gráfico.</p>';
        return;
    }
    
    // Criar novo gráfico
    window.contextChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedContexts,
            datasets: [
                {
                    label: 'Taxa de Acerto (%)',
                    data: sortedWinRates,
                    backgroundColor: CONFIG.CHART_COLORS.blue,
                    borderColor: CONFIG.CHART_COLORS.blue,
                    yAxisID: 'y-winrate'
                },
                {
                    label: 'Expectativa (R)',
                    data: sortedExpectancies,
                    backgroundColor: CONFIG.CHART_COLORS.green,
                    borderColor: CONFIG.CHART_COLORS.green,
                    yAxisID: 'y-expectancy',
                    type: 'line'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const datasetLabel = context.dataset.label || '';
                            const value = context.parsed.y;
                            const index = context.dataIndex;
                            
                            if (context.dataset.yAxisID === 'y-winrate') {
                                return `${datasetLabel}: ${value.toFixed(1)}%`;
                            } else if (context.dataset.yAxisID === 'y-expectancy') {
                                return `${datasetLabel}: ${value.toFixed(2)}R`;
                            }
                        },
                        afterBody: function(tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            return `Trades: ${sortedCounts[index]}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                'y-winrate': {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Taxa de Acerto (%)'
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                'y-expectancy': {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Expectativa (R)'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Cria o gráfico de desempenho por timeframe
 * @param {Array} trades - Lista de trades
 */
function createTimeframePerformanceChart(trades) {
    // Agrupar trades por timeframe
    const timeframeStats = {};
    
    trades.forEach(trade => {
        const timeframe = trade['Timeframe'];
        if (!timeframe) return;
        
        if (!timeframeStats[timeframe]) {
            timeframeStats[timeframe] = {
                count: 0,
                wins: 0,
                results: []
            };
        }
        
        timeframeStats[timeframe].count++;
        
        const result = parseFloat(trade['Resultado (R)']);
        timeframeStats[timeframe].results.push(result);
        
        if (result > 0) {
            timeframeStats[timeframe].wins++;
        }
    });
    
    // Calcular taxa de acerto e expectativa para cada timeframe
    const timeframes = [];
    const winRates = [];
    const expectancies = [];
    const counts = [];
    
    Object.keys(timeframeStats).forEach(timeframe => {
        const stats = timeframeStats[timeframe];
        
        // Filtrar timeframes com pelo menos 3 trades
        if (stats.count >= 3) {
            timeframes.push(timeframe);
            winRates.push((stats.wins / stats.count) * 100);
            expectancies.push(stats.results.reduce((sum, val) => sum + val, 0) / stats.count);
            counts.push(stats.count);
        }
    });
    
    // Ordenar arrays pelo número de trades (mais para menos)
    const indices = counts.map((_, i) => i);
    indices.sort((a, b) => counts[b] - counts[a]);
    
    const sortedTimeframes = indices.map(i => timeframes[i]);
    const sortedWinRates = indices.map(i => winRates[i]);
    const sortedExpectancies = indices.map(i => expectancies[i]);
    const sortedCounts = indices.map(i => counts[i]);
    
    // Obter contexto do canvas
    const ctx = document.getElementById('timeframePerformanceChart');
    
    // Destruir gráfico anterior se existir
    if (window.timeframeChart) {
        window.timeframeChart.destroy();
    }
    
    // Se não houver dados, mostrar mensagem
    if (sortedTimeframes.length === 0) {
        ctx.parentElement.innerHTML = '<p class="text-center text-gray-500 py-8">Dados insuficientes para gerar gráfico.</p>';
        return;
    }
    
    // Criar novo gráfico
    window.timeframeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedTimeframes,
            datasets: [
                {
                    label: 'Taxa de Acerto (%)',
                    data: sortedWinRates,
                    backgroundColor: CONFIG.CHART_COLORS.purple,
                    borderColor: CONFIG.CHART_COLORS.purple,
                    yAxisID: 'y-winrate'
                },
                {
                    label: 'Expectativa (R)',
                    data: sortedExpectancies,
                    backgroundColor: CONFIG.CHART_COLORS.orange,
                    borderColor: CONFIG.CHART_COLORS.orange,
                    yAxisID: 'y-expectancy',
                    type: 'line'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const datasetLabel = context.dataset.label || '';
                            const value = context.parsed.y;
                            const index = context.dataIndex;
                            
                            if (context.dataset.yAxisID === 'y-winrate') {
                                return `${datasetLabel}: ${value.toFixed(1)}%`;
                            } else if (context.dataset.yAxisID === 'y-expectancy') {
                                return `${datasetLabel}: ${value.toFixed(2)}R`;
                            }
                        },
                        afterBody: function(tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            return `Trades: ${sortedCounts[index]}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                'y-winrate': {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Taxa de Acerto (%)'
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                'y-expectancy': {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Expectativa (R)'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Cria o gráfico de distribuição de R-múltiplos
 * @param {Array} trades - Lista de trades
 */
function updateRMultipleChart(trades) {
    // Obter todos os valores R
    const rValues = trades.map(trade => parseFloat(trade['Resultado (R)']));
    
    // Definir bins para histograma
    const minR = Math.floor(Math.min(...rValues));
    const maxR = Math.ceil(Math.max(...rValues));
    
    // Criar bins com intervalo de 0,5R, cobrindo o range de valores
    const binSize = 0.5;
    const bins = [];
    
    for (let r = minR; r <= maxR; r += binSize) {
        bins.push({
            min: r,
            max: r + binSize,
            count: 0,
            label: `${r.toFixed(1)}R a ${(r + binSize).toFixed(1)}R`
        });
    }
    
    // Contar trades em cada bin
    rValues.forEach(value => {
        const bin = bins.find(b => value >= b.min && value < b.max);
        if (bin) {
            bin.count++;
        }
    });
    
    // Filtrar bins com pelo menos um trade
    const filteredBins = bins.filter(bin => bin.count > 0);
    
    // Preparar dados para o gráfico
    const labels = filteredBins.map(bin => bin.label);
    const data = filteredBins.map(bin => bin.count);
    const colors = filteredBins.map(bin => {
        // Verde para bins positivos, vermelho para negativos, amarelo para os que incluem zero
        if (bin.min >= 0) {
            return CONFIG.CHART_COLORS.green;
        } else if (bin.max <= 0) {
            return CONFIG.CHART_COLORS.red;
        } else {
            return CONFIG.CHART_COLORS.yellow;
        }
    });
    
    // Obter contexto do canvas
    const ctx = document.getElementById('rMultipleChart');
    
    // Destruir gráfico anterior se existir
    if (window.rMultipleChart) {
        window.rMultipleChart.destroy();
    }
    
    // Se não houver dados, mostrar mensagem
    if (filteredBins.length === 0) {
        ctx.parentElement.innerHTML = '<p class="text-center text-gray-500 py-8">Dados insuficientes para gerar gráfico.</p>';
        return;
    }
    
    // Criar novo gráfico
    window.rMultipleChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Número de Trades',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace('0.2', '1')),
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} trades (${((context.parsed.y / trades.length) * 100).toFixed(1)}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Número de Trades'
                    },
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                }
            }
        }
    });
}

/**
 * Atualiza as estatísticas de win rate por direção
 * @param {Array} trades - Lista de trades
 */
function updateWinRateByDirection(trades) {
    // Separar trades por direção
    const longTrades = trades.filter(trade => trade['Direção'] === 'Long');
    const shortTrades = trades.filter(trade => trade['Direção'] === 'Short');
    
    // Calcular taxas de acerto
    const longWinRate = longTrades.length > 0 
        ? longTrades.filter(trade => parseFloat(trade['Resultado (R)']) > 0).length / longTrades.length 
        : 0;
    
    const shortWinRate = shortTrades.length > 0 
        ? shortTrades.filter(trade => parseFloat(trade['Resultado (R)']) > 0).length / shortTrades.length 
        : 0;
    
    // Atualizar na interface
    document.getElementById('pattern-long-win-rate').textContent = Utils.formatPercentage(longWinRate);
    document.getElementById('pattern-short-win-rate').textContent = Utils.formatPercentage(shortWinRate);
}

/**
 * Cria a seção de padrões relacionados
 */
function createRelatedPatternsSection() {
    // Verificar se temos o padrão atual e outros padrões
    if (!patternState.pattern || !patternState.allPatterns || patternState.allPatterns.length <= 1) {
        return;
    }
    
    const currentPattern = patternState.pattern;
    const container = document.getElementById('related-patterns-container');
    
    // Limpar container
    container.innerHTML = '';
    
    // Encontrar padrões relacionados
    // Critérios: mesma categoria ou contexto ideal semelhante
    const relatedPatterns = patternState.allPatterns.filter(pattern => {
        if (pattern.ID === currentPattern.ID) return false;
        
        // Relacionado por categoria
        if (pattern.Categoria === currentPattern.Categoria) return true;
        
        // Relacionado por contexto ideal similar
        if (pattern['Contexto Ideal'] && currentPattern['Contexto Ideal'] && 
            pattern['Contexto Ideal'].includes(currentPattern['Contexto Ideal'])) {
            return true;
        }
        
        return false;
    });
    
    // Limitar a no máximo 4 padrões relacionados
    const patternsToShow = relatedPatterns.slice(0, 4);
    
    // Se não houver padrões relacionados, mostrar mensagem
    if (patternsToShow.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">Nenhum padrão relacionado encontrado.</p>';
        return;
    }
    
    // Criar card para cada padrão relacionado
    patternsToShow.forEach(pattern => {
        const card = document.createElement('div');
        card.className = 'bg-white border rounded-lg p-4 hover:shadow-md transition-shadow';
        
        // Determinar classe para categoria
        let categoryClass;
        switch (pattern.Categoria) {
            case 'Reversão':
                categoryClass = 'bg-red-100 text-red-800';
                break;
            case 'Continuação':
                categoryClass = 'bg-green-100 text-green-800';
                break;
            case 'Projeção':
                categoryClass = 'bg-purple-100 text-purple-800';
                break;
            default:
                categoryClass = 'bg-gray-100 text-gray-800';
        }
        
        // Construir HTML do card
        card.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <h4 class="font-bold">${pattern.Nome}</h4>
                <span class="text-xs px-2 py-1 rounded-full ${categoryClass}">${pattern.Categoria}</span>
            </div>
            <p class="text-sm text-gray-600 mb-3">${Utils.truncateText(pattern.Descrição || 'Sem descrição disponível.', 100)}</p>
            <a href="pattern-detail.html?id=${pattern.ID}" class="text-blue-600 hover:underline text-sm">Ver detalhes</a>
        `;
        
        container.appendChild(card);
    });
}

/**
 * Preenche a lista de padrões na sidebar
 * @param {Array} patterns - Lista de padrões
 */
function populatePatternsSidebar(patterns) {
    const patternsList = document.querySelector('.patterns-list');
    
    if (!patternsList || !patterns || patterns.length === 0) {
        return;
    }
    
    // Limpar lista
    patternsList.innerHTML = '';
    
    // Agrupar padrões por categoria
    const patternsByCategory = {};
    
    patterns.forEach(pattern => {
        const category = pattern.Categoria || 'Outros';
        
        if (!patternsByCategory[category]) {
            patternsByCategory[category] = [];
        }
        
        patternsByCategory[category].push(pattern);
    });
    
    // Adicionar padrões agrupados por categoria
    Object.keys(patternsByCategory).forEach(category => {
        // Adicionar cabeçalho da categoria
        const categoryHeader = document.createElement('li');
        categoryHeader.className = 'text-xs text-gray-400 mt-2 mb-1 pl-2';
        categoryHeader.textContent = category.toUpperCase();
        patternsList.appendChild(categoryHeader);
        
        // Adicionar padrões desta categoria
        patternsByCategory[category].forEach(pattern => {
            const item = document.createElement('li');
            
            // Destacar padrão atual
            if (patternState.pattern && pattern.ID === patternState.pattern.ID) {
                item.className = 'bg-blue-600 p-2 rounded';
            } else {
                item.className = 'hover:bg-gray-700 p-2 rounded';
            }
            
            item.innerHTML = `<a href="pattern-detail.html?id=${pattern.ID}" class="block">${pattern.Nome}</a>`;
            patternsList.appendChild(item);
        });
    });
}

/**
 * Preenche as opções dos filtros
 */
function populateFilterOptions() {
    // Preencher opções de contexto
    const contextFilter = document.getElementById('context-filter');
    
    if (contextFilter && patternState.allContexts && patternState.allContexts.length > 0) {
        // Preservar a primeira opção (Todos)
        const firstOption = contextFilter.options[0];
        
        // Limpar opções existentes
        contextFilter.innerHTML = '';
        
        // Adicionar opção "Todos" de volta
        contextFilter.appendChild(firstOption);
        
        // Adicionar opções de contexto
        patternState.allContexts.forEach(context => {
            const option = document.createElement('option');
            option.value = context.Nome;
            option.textContent = context.Nome;
            contextFilter.appendChild(option);
        });
    }
    
    // Preencher opções de timeframe
    const timeframeFilter = document.getElementById('timeframe-filter');
    
    if (timeframeFilter && patternState.allTimeframes && patternState.allTimeframes.length > 0) {
        // Preservar a primeira opção (Todos)
        const firstOption = timeframeFilter.options[0];
        
        // Limpar opções existentes
        timeframeFilter.innerHTML = '';
        
        // Adicionar opção "Todos" de volta
        timeframeFilter.appendChild(firstOption);
        
        // Adicionar opções de timeframe
        patternState.allTimeframes.forEach(timeframe => {
            const option = document.createElement('option');
            option.value = timeframe.Timeframe;
            option.textContent = timeframe.Timeframe;
            timeframeFilter.appendChild(option);
        });
    }
}

/**
 * Exporta as estatísticas do padrão em formato CSV
 */
function exportPatternStats() {
    // Verificar se temos dados para exportar
    if (!patternState.pattern || !patternState.patternTrades || patternState.patternTrades.length === 0) {
        Utils.showToast('Não há dados para exportar.', 'error');
        return;
    }
    
    try {
        // Preparar título do arquivo com data atual e nome do padrão
        const dateStr = new Date().toISOString().split('T')[0];
        const patternName = patternState.pattern.Nome.replace(/\s+/g, '_');
        const fileName = `estatisticas_${patternName}_${dateStr}.csv`;
        
        // Criar CSV para os dados do padrão
        let csv = 'Estatísticas do Padrão\n';
        csv += `Nome,${patternState.pattern.Nome}\n`;
        csv += `ID,${patternState.pattern.ID}\n`;
        csv += `Categoria,${patternState.pattern.Categoria || 'N/A'}\n`;
        csv += `Descrição,"${(patternState.pattern.Descrição || 'N/A').replace(/"/g, '""')}"\n`;
        csv += `Probabilidade Base,${patternState.pattern['Probabilidade Base'] || 'N/A'}\n`;
        csv += `Contexto Ideal,"${(patternState.pattern['Contexto Ideal'] || 'N/A').replace(/"/g, '""')}"\n`;
        csv += `Força,${patternState.pattern.Força || 'N/A'}\n\n`;
        
        // Adicionar estatísticas de desempenho
        const trades = patternState.patternTrades;
        const totalTrades = trades.length;
        const winningTrades = trades.filter(trade => parseFloat(trade['Resultado (R)']) > 0).length;
        const winRate = winningTrades / totalTrades;
        const expectancy = trades.reduce((sum, trade) => sum + parseFloat(trade['Resultado (R)']), 0) / totalTrades;
        
        csv += 'Estatísticas de Desempenho\n';
        csv += `Total de Trades,${totalTrades}\n`;
        csv += `Trades Vencedores,${winningTrades}\n`;
        csv += `Trades Perdedores,${totalTrades - winningTrades}\n`;
        csv += `Taxa de Acerto,${(winRate * 100).toFixed(2)}%\n`;
        csv += `Expectativa,${expectancy.toFixed(2)}R\n\n`;
        
        // Adicionar estatísticas por direção
        const longTrades = trades.filter(trade => trade['Direção'] === 'Long');
        const shortTrades = trades.filter(trade => trade['Direção'] === 'Short');
        
        const longWinRate = longTrades.length > 0 
            ? longTrades.filter(trade => parseFloat(trade['Resultado (R)']) > 0).length / longTrades.length 
            : 0;
        
        const shortWinRate = shortTrades.length > 0 
            ? shortTrades.filter(trade => parseFloat(trade['Resultado (R)']) > 0).length / shortTrades.length 
            : 0;
        
        csv += 'Desempenho por Direção\n';
        csv += `Trades Long,${longTrades.length}\n`;
        csv += `Taxa de Acerto Long,${(longWinRate * 100).toFixed(2)}%\n`;
        csv += `Trades Short,${shortTrades.length}\n`;
        csv += `Taxa de Acerto Short,${(shortWinRate * 100).toFixed(2)}%\n\n`;
        
        // Adicionar lista de trades
        csv += 'Lista de Trades\n';
        csv += 'ID,Data,Par,Timeframe,Direção,Contexto,Qualidade,Entrada,Stop,Alvo,Resultado\n';
        
        trades.forEach(trade => {
            const row = [
                trade['ID'],
                Utils.formatDate(trade['Data e Hora'], 'short'),
                trade['Par de Moedas'],
                trade['Timeframe'],
                trade['Direção'],
                trade['Contexto de Mercado'],
                trade['Qualidade do Setup'],
                trade['Entrada'],
                trade['Stop'],
                trade['Alvo'],
                trade['Resultado (R)']
            ];
            
            csv += row.join(',') + '\n';
        });
        
        // Criar blob e link para download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        // Suporte para diferentes navegadores
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, fileName);
        } else {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        Utils.showToast('Estatísticas exportadas com sucesso.', 'success');
    } catch (error) {
        console.error('Erro ao exportar estatísticas:', error);
        Utils.showToast('Erro ao exportar estatísticas. Tente novamente.', 'error');
    }
}

/**
 * Redireciona para o dashboard
 */
function redirectToDashboard() {
    window.location.href = 'index.html';
}
