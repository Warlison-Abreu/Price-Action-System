/**
 * Sistema de Quantificação Price Action Brooks
 * Lógica para a página de Estatísticas
 */

// Armazenamento local para dados
const statsData = {
    allTrades: [],
    filteredTrades: [],
    patternStats: [],
    contextStats: [],
    matrix: null,
    currentFilters: {
        period: 'all',
        dateFrom: null,
        dateTo: null,
        pair: 'all',
        timeframe: 'all',
        type: 'all'
    },
    charts: {}
};

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar filtros
    initializeFilters();
    
    // Carregar dados
    loadAllData();
    
    // Configurar eventos
    setupEventListeners();
});

/**
 * Inicializa os filtros com valores padrão
 */
function initializeFilters() {
    // Configurar período personalizado com data atual e 3 meses atrás
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    // Formatar datas para input date (YYYY-MM-DD)
    const todayStr = today.toISOString().split('T')[0];
    const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];
    
    document.getElementById('date-to').value = todayStr;
    document.getElementById('date-from').value = threeMonthsAgoStr;
    
    // Configurar evento para mostrar/esconder período personalizado
    const periodFilter = document.getElementById('period-filter');
    periodFilter.addEventListener('change', function() {
        const customPeriod = document.getElementById('custom-period');
        if (this.value === 'custom') {
            customPeriod.classList.remove('hidden');
        } else {
            customPeriod.classList.add('hidden');
        }
    });
}

/**
 * Configura os event listeners da página
 */
function setupEventListeners() {
    // Formulário de filtros
    const filtersForm = document.getElementById('filters-form');
    if (filtersForm) {
        filtersForm.addEventListener('submit', function(e) {
            e.preventDefault();
            applyFilters();
        });
    }
    
    // Botões de período no gráfico de evolução
    document.querySelectorAll('[data-period]').forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe ativa de todos os botões
            document.querySelectorAll('[data-period]').forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-200');
            });
            
            // Adicionar classe ativa ao botão clicado
            this.classList.remove('bg-gray-200');
            this.classList.add('bg-blue-600', 'text-white');
            
            // Atualizar gráfico de evolução
            updateEvolutionChart(this.getAttribute('data-period'));
        });
    });
    
    // Botões de ordenação na tabela de padrões
    document.querySelectorAll('[data-sort]').forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe ativa de todos os botões
            document.querySelectorAll('[data-sort]').forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-200');
            });
            
            // Adicionar classe ativa ao botão clicado
            this.classList.remove('bg-gray-200');
            this.classList.add('bg-blue-600', 'text-white');
            
            // Ordenar tabela de padrões
            sortPatternTable(this.getAttribute('data-sort'));
        });
    });
    
    // Botões de matriz de probabilidade
    document.querySelectorAll('[data-matrix]').forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe ativa de todos os botões
            document.querySelectorAll('[data-matrix]').forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-200');
            });
            
            // Adicionar classe ativa ao botão clicado
            this.classList.remove('bg-gray-200');
            this.classList.add('bg-blue-600', 'text-white');
            
            // Atualizar matriz de probabilidade
            updateProbabilityMatrix(this.getAttribute('data-matrix'));
        });
    });
    
    // Botão de impressão
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
    
    // Botão de exportação
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportStatisticsData();
        });
    }
}

/**
 * Carrega todos os dados necessários para a página
 */
async function loadAllData() {
    try {
        // Mostrar indicador de carregamento
        document.getElementById('loading-indicator').classList.remove('hidden');
        document.getElementById('stats-container').classList.add('hidden');
        
        // Carregar dados em paralelo
        const [trades, patternStats, contextStats, matrix, pairs, timeframes] = await Promise.all([
            API.getTrades(),
            API.getPatternStatistics(),
            API.getContextStatistics(),
            API.getCrossMatrix(),
            API.getPairs(),
            API.getTimeframes()
        ]);
        
        // Armazenar dados para uso futuro
        statsData.allTrades = trades;
        statsData.filteredTrades = trades; // Inicialmente, todos os trades
        statsData.patternStats = patternStats;
        statsData.contextStats = contextStats;
        statsData.matrix = matrix;
        
        // Preencher filtros de pares e timeframes
        populateFilterOptions('pair-filter', pairs, 'Par');
        populateFilterOptions('timeframe-filter', timeframes, 'Timeframe');
        
        // Atualizar estatísticas e gráficos
        updateStatistics();
        
        // Esconder indicador de carregamento e mostrar conteúdo
        document.getElementById('loading-indicator').classList.add('hidden');
        document.getElementById('stats-container').classList.remove('hidden');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        Utils.showToast('Erro ao carregar dados. Tente novamente.', 'error');
        
        // Exibir mensagem de erro no lugar do conteúdo
        document.getElementById('loading-indicator').classList.add('hidden');
        document.getElementById('stats-container').innerHTML = `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p class="font-bold">Erro ao carregar dados</p>
                <p>Ocorreu um erro ao carregar os dados estatísticos. Por favor, tente novamente mais tarde.</p>
                <button class="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onclick="loadAllData()">
                    Tentar Novamente
                </button>
            </div>
        `;
        document.getElementById('stats-container').classList.remove('hidden');
    }
}

/**
 * Preenche as opções dos filtros de pares e timeframes
 * @param {string} filterId - ID do elemento select do filtro
 * @param {Array} options - Lista de opções
 * @param {string} field - Nome do campo para exibir
 */
function populateFilterOptions(filterId, options, field) {
    const select = document.getElementById(filterId);
    
    if (!select || !options || !options.length) return;
    
    // Preservar a primeira opção (Todos)
    const firstOption = select.options[0];
    
    // Limpar opções existentes
    select.innerHTML = '';
    
    // Adicionar opção "Todos" de volta
    select.appendChild(firstOption);
    
    // Adicionar novas opções
    options.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option[field];
        optElement.textContent = option[field];
        select.appendChild(optElement);
    });
}

/**
 * Aplica os filtros selecionados e atualiza a visualização
 */
function applyFilters() {
    // Obter valores dos filtros
    const periodFilter = document.getElementById('period-filter').value;
    const pairFilter = document.getElementById('pair-filter').value;
    const timeframeFilter = document.getElementById('timeframe-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    let dateFrom = null;
    let dateTo = null;
    
    // Se período personalizado, obter datas
    if (periodFilter === 'custom') {
        dateFrom = document.getElementById('date-from').value;
        dateTo = document.getElementById('date-to').value;
    } else {
        // Calcular datas com base no período selecionado
        const today = new Date();
        dateTo = today.toISOString().split('T')[0];
        
        switch (periodFilter) {
            case 'month':
                const monthAgo = new Date();
                monthAgo.setMonth(today.getMonth() - 1);
                dateFrom = monthAgo.toISOString().split('T')[0];
                break;
            case '3months':
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(today.getMonth() - 3);
                dateFrom = threeMonthsAgo.toISOString().split('T')[0];
                break;
            case '6months':
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(today.getMonth() - 6);
                dateFrom = sixMonthsAgo.toISOString().split('T')[0];
                break;
            case 'year':
                const yearAgo = new Date();
                yearAgo.setFullYear(today.getFullYear() - 1);
                dateFrom = yearAgo.toISOString().split('T')[0];
                break;
            default:
                // Para "all", não define datas
                dateFrom = null;
                dateTo = null;
        }
    }
    
    // Armazenar filtros atuais
    statsData.currentFilters = {
        period: periodFilter,
        dateFrom: dateFrom,
        dateTo: dateTo,
        pair: pairFilter,
        timeframe: timeframeFilter,
        type: typeFilter
    };
    
    // Aplicar filtros aos dados
    filterTrades();
    
    // Atualizar estatísticas e gráficos
    updateStatistics();
    
    // Exibir mensagem de sucesso
    Utils.showToast('Filtros aplicados com sucesso.', 'success');
}

/**
 * Filtra os trades com base nos filtros atuais
 */
function filterTrades() {
    const filters = statsData.currentFilters;
    
    // Filtrar trades
    statsData.filteredTrades = statsData.allTrades.filter(trade => {
        // Filtro de data
        if (filters.dateFrom && filters.dateTo) {
            const tradeDate = new Date(trade['Data e Hora']);
            const fromDate = new Date(filters.dateFrom);
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59); // Definir para o final do dia
            
            if (tradeDate < fromDate || tradeDate > toDate) {
                return false;
            }
        }
        
        // Filtro de par
        if (filters.pair !== 'all' && trade['Par de Moedas'] !== filters.pair) {
            return false;
        }
        
        // Filtro de timeframe
        if (filters.timeframe !== 'all' && trade['Timeframe'] !== filters.timeframe) {
            return false;
        }
        
        // Filtro de tipo
        if (filters.type !== 'all' && trade['Tipo de Atividade'] !== filters.type) {
            return false;
        }
        
        return true;
    });
}

/**
 * Atualiza todas as estatísticas e gráficos
 */
function updateStatistics() {
    // Destruir gráficos existentes
    for (const chartId in statsData.charts) {
        if (statsData.charts[chartId]) {
            statsData.charts[chartId].destroy();
        }
    }
    
    // Calcular estatísticas com base nos trades filtrados
    const stats = calculateStatistics(statsData.filteredTrades);
    
    // Atualizar resumo
    updateSummary(stats);
    
    // Atualizar gráficos
    createDistributionCharts(stats);
    updateEvolutionChart('month'); // Inicialmente, mostrar evolução mensal
    updatePatternsTable(statsData.patternStats, statsData.filteredTrades);
    createTopPatternsChart(statsData.patternStats, statsData.filteredTrades);
    createPatternsScatterChart(statsData.patternStats, statsData.filteredTrades);
    updateProbabilityMatrix('winrate'); // Inicialmente, mostrar matriz de taxa de acerto
    createContextPerformanceChart(statsData.contextStats, statsData.filteredTrades);
    createCyclePerformanceChart(statsData.filteredTrades);
    createComparisonCharts(statsData.filteredTrades);
    generateRecommendations(stats, statsData.patternStats, statsData.contextStats);
}

/**
 * Calcula estatísticas gerais com base nos trades
 * @param {Array} trades - Lista de trades
 * @returns {Object} - Estatísticas calculadas
 */
function calculateStatistics(trades) {
    // Se não houver trades, retornar estatísticas vazias
    if (!trades || trades.length === 0) {
        return {
            totalTrades: 0,
            winRate: 0,
            expectancy: 0,
            profitFactor: 0,
            winsCount: 0,
            lossesCount: 0,
            beCount: 0,
            avgWin: 0,
            avgLoss: 0,
            bestTrade: 0,
            worstTrade: 0
        };
    }
    
    // Contar trades por resultado
    const winsCount = trades.filter(trade => parseFloat(trade['Resultado (R)']) > 0).length;
    const lossesCount = trades.filter(trade => parseFloat(trade['Resultado (R)']) < 0).length;
    const beCount = trades.filter(trade => parseFloat(trade['Resultado (R)']) === 0).length;
    
    // Calcular taxa de acerto
    const winRate = winsCount / trades.length;
    
    // Calcular expectativa
    const expectancy = trades.reduce((sum, trade) => sum + parseFloat(trade['Resultado (R)']), 0) / trades.length;
    
    // Calcular fator de lucro
    const totalWins = trades
        .filter(trade => parseFloat(trade['Resultado (R)']) > 0)
        .reduce((sum, trade) => sum + parseFloat(trade['Resultado (R)']), 0);
    
    const totalLosses = Math.abs(trades
        .filter(trade => parseFloat(trade['Resultado (R)']) < 0)
        .reduce((sum, trade) => sum + parseFloat(trade['Resultado (R)']), 0));
    
    const profitFactor = totalLosses === 0 ? Infinity : totalWins / totalLosses;
    
    // Calcular médias de ganhos e perdas
    const winningTrades = trades.filter(trade => parseFloat(trade['Resultado (R)']) > 0);
    const losingTrades = trades.filter(trade => parseFloat(trade['Resultado (R)']) < 0);
    
    const avgWin = winningTrades.length > 0 ? 
        winningTrades.reduce((sum, trade) => sum + parseFloat(trade['Resultado (R)']), 0) / winningTrades.length : 0;
    
    const avgLoss = losingTrades.length > 0 ? 
        losingTrades.reduce((sum, trade) => sum + parseFloat(trade['Resultado (R)']), 0) / losingTrades.length : 0;
    
    // Encontrar melhor e pior trade
    const bestTrade = trades.reduce((max, trade) => 
        Math.max(max, parseFloat(trade['Resultado (R)'])), -Infinity);
    
    const worstTrade = trades.reduce((min, trade) => 
        Math.min(min, parseFloat(trade['Resultado (R)'])), Infinity);
    
    return {
        totalTrades: trades.length,
        winRate,
        expectancy,
        profitFactor,
        winsCount,
        lossesCount,
        beCount,
        avgWin,
        avgLoss,
        bestTrade,
        worstTrade
    };
}

/**
 * Atualiza o resumo de estatísticas
 * @param {Object} stats - Estatísticas calculadas
 */
function updateSummary(stats) {
    // Atualizar números básicos
    document.getElementById('total-trades').textContent = stats.totalTrades;
    document.getElementById('win-rate').textContent = Utils.formatPercentage(stats.winRate);
    document.getElementById('expectancy').textContent = Utils.formatR(stats.expectancy);
    document.getElementById('profit-factor').textContent = 
        stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2);
    
    // Atualizar distribuição de trades
    document.getElementById('wins-count').textContent = stats.winsCount;
    document.getElementById('losses-count').textContent = stats.lossesCount;
    document.getElementById('be-count').textContent = stats.beCount;
    
    // Atualizar valores R médios
    document.getElementById('avg-win').textContent = Utils.formatR(stats.avgWin);
    document.getElementById('avg-loss').textContent = Utils.formatR(stats.avgLoss);
    document.getElementById('best-trade').textContent = Utils.formatR(stats.bestTrade);
}

/**
 * Cria os gráficos de distribuição
 * @param {Object} stats - Estatísticas calculadas
 */
function createDistributionCharts(stats) {
    // Gráfico de distribuição de trades
    const distributionCtx = document.getElementById('tradesDistributionChart').getContext('2d');
    statsData.charts.distribution = new Chart(distributionCtx, {
        type: 'doughnut',
        data: {
            labels: ['Ganhos', 'Perdas', 'Empates'],
            datasets: [{
                data: [stats.winsCount, stats.lossesCount, stats.beCount],
                backgroundColor: [
                    CONFIG.CHART_COLORS.green,
                    CONFIG.CHART_COLORS.red,
                    CONFIG.CHART_COLORS.blue
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Gráfico de valores R
    const rValuesCtx = document.getElementById('rValuesChart').getContext('2d');
    statsData.charts.rValues = new Chart(rValuesCtx, {
        type: 'bar',
        data: {
            labels: ['Ganhos', 'Perdas'],
            datasets: [{
                label: 'Valor R médio',
                data: [stats.avgWin, stats.avgLoss],
                backgroundColor: [
                    CONFIG.CHART_COLORS.green,
                    CONFIG.CHART_COLORS.red
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Atualiza o gráfico de evolução ao longo do tempo
 * @param {string} period - Período para visualização ('week', 'month', 'quarter', 'year', 'all')
 */
function updateEvolutionChart(period) {
    const trades = statsData.filteredTrades;
    
    if (!trades || trades.length === 0) {
        return;
    }
    
    // Ordenar trades por data
    const sortedTrades = [...trades].sort((a, b) => 
        new Date(a['Data e Hora']) - new Date(b['Data e Hora']));
    
    // Determinar agrupamento com base no período
    let groupingFormat;
    let labelFormat;
    
    switch(period) {
        case 'week':
            groupingFormat = 'YYYY-MM-DD'; // Agrupar por dia
            labelFormat = 'DD/MM';
            break;
        case 'month':
            groupingFormat = 'YYYY-MM-DD'; // Agrupar por dia
            labelFormat = 'DD/MM';
            break;
        case 'quarter':
            groupingFormat = 'YYYY-MM'; // Agrupar por mês
            labelFormat = 'MM/YYYY';
            break;
        case 'year':
            groupingFormat = 'YYYY-MM'; // Agrupar por mês
            labelFormat = 'MM/YYYY';
            break;
        case 'all':
        default:
            groupingFormat = 'YYYY-MM'; // Agrupar por mês
            labelFormat = 'MM/YYYY';
    }
    
    // Agrupar dados por período
    const groupedData = {};
    
    sortedTrades.forEach(trade => {
        const date = new Date(trade['Data e Hora']);
        // Simplificação: usar data formatada como YYYY-MM-DD ou YYYY-MM
        let groupKey;
        
        if (groupingFormat === 'YYYY-MM-DD') {
            groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        } else {
            groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
        
        if (!groupedData[groupKey]) {
            groupedData[groupKey] = {
                trades: 0,
                wins: 0,
                winRate: 0,
                expectancy: 0,
                results: []
            };
        }
        
        // Adicionar dados
        groupedData[groupKey].trades++;
        
        const result = parseFloat(trade['Resultado (R)']);
        if (result > 0) {
            groupedData[groupKey].wins++;
        }
        
        groupedData[groupKey].results.push(result);
    });
    
    // Calcular métricas para cada grupo
    Object.keys(groupedData).forEach(key => {
        const group = groupedData[key];
        group.winRate = group.wins / group.trades;
        group.expectancy = group.results.reduce((sum, val) => sum + val, 0) / group.trades;
    });
    
    // Preparar dados para o gráfico
    const labels = Object.keys(groupedData).sort();
    const winRates = labels.map(key => groupedData[key].winRate * 100);
    const expectancies = labels.map(key => groupedData[key].expectancy);
    const cumulativeExpectancy = [];
    let cumulative = 0;
    
    expectancies.forEach(exp => {
        cumulative += exp;
        cumulativeExpectancy.push(cumulative);
    });
    
    // Formatar labels
    const formattedLabels = labels.map(label => {
        if (groupingFormat === 'YYYY-MM-DD') {
            // Exemplo: converter 2025-05-07 para 07/05
            const parts = label.split('-');
            return `${parts[2]}/${parts[1]}`;
        } else {
            // Exemplo: converter 2025-05 para 05/2025
            const parts = label.split('-');
            return `${parts[1]}/${parts[0]}`;
        }
    });
    
    // Criar ou atualizar gráfico
    const ctx = document.getElementById('evolutionChart').getContext('2d');
    
    if (statsData.charts.evolution) {
        statsData.charts.evolution.destroy();
    }
    
    statsData.charts.evolution = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [
                {
                    label: 'Taxa de Acerto (%)',
                    data: winRates,
                    backgroundColor: CONFIG.CHART_COLORS.blueLight,
                    borderColor: CONFIG.CHART_COLORS.blue,
                    borderWidth: 2,
                    tension: 0.1,
                    yAxisID: 'percentage'
                },
                {
                    label: 'Expectativa (R)',
                    data: expectancies,
                    backgroundColor: CONFIG.CHART_COLORS.greenLight,
                    borderColor: CONFIG.CHART_COLORS.green,
                    borderWidth: 2,
                    tension: 0.1,
                    yAxisID: 'expectancy'
                },
                {
                    label: 'Expectativa Cumulativa (R)',
                    data: cumulativeExpectancy,
                    backgroundColor: CONFIG.CHART_COLORS.purpleLight,
                    borderColor: CONFIG.CHART_COLORS.purple,
                    borderWidth: 2,
                    tension: 0.1,
                    yAxisID: 'expectancy'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.dataset.yAxisID === 'percentage') {
                                    label += context.parsed.y.toFixed(1) + '%';
                                } else {
                                    label += context.parsed.y.toFixed(2) + 'R';
                                }
                            }
                            return label;
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
                percentage: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Taxa de Acerto (%)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                expectancy: {
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
 * Atualiza a tabela de padrões
 * @param {Array} patternStats - Estatísticas por padrão
 * @param {Array} trades - Lista de trades filtrados
 */
function updatePatternsTable(patternStats, trades) {
    if (!patternStats || patternStats.length === 0) {
        return;
    }
    
    const tableBody = document.getElementById('patterns-table');
    tableBody.innerHTML = '';
    
    // Contar trades por padrão nos trades filtrados
    const patternCounts = {};
    trades.forEach(trade => {
        const pattern = trade['Padrão Brooks'];
        if (!pattern) return;
        
        if (!patternCounts[pattern]) {
            patternCounts[pattern] = {
                count: 0,
                wins: 0,
                losses: 0,
                results: []
            };
        }
        
        patternCounts[pattern].count++;
        
        const result = parseFloat(trade['Resultado (R)']);
        patternCounts[pattern].results.push(result);
        
        if (result > 0) {
            patternCounts[pattern].wins++;
        } else if (result < 0) {
            patternCounts[pattern].losses++;
        }
    });
    
    // Filtrar padrões que aparecem nos trades filtrados
    const filteredPatternStats = patternStats.filter(pattern => 
        patternCounts[pattern['Padrão']] && patternCounts[pattern['Padrão']].count > 0);
    
    // Ordenar por expectativa (maior primeiro)
    filteredPatternStats.sort((a, b) => b['Expectativa (R)'] - a['Expectativa (R)']);
    
    // Adicionar linhas na tabela
    filteredPatternStats.forEach(pattern => {
        const patternName = pattern['Padrão'];
        const counts = patternCounts[patternName];
        
        if (!counts) return;
        
        // Calcular estatísticas com base nos trades filtrados
        const winRate = counts.wins / counts.count;
        const expectancy = counts.results.reduce((sum, val) => sum + val, 0) / counts.count;
        
        // Calcular médias de ganhos e perdas
        const gains = counts.results.filter(result => result > 0);
        const losses = counts.results.filter(result => result < 0);
        
        const avgGain = gains.length > 0 ? gains.reduce((sum, val) => sum + val, 0) / gains.length : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((sum, val) => sum + val, 0) / losses.length : 0;
        
        // Calcular desvio padrão
        let stdDev = 0;
        if (counts.results.length > 1) {
            const mean = expectancy;
            const squareDiffs = counts.results.map(result => Math.pow(result - mean, 2));
            const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
            stdDev = Math.sqrt(avgSquareDiff);
        }
        
        // Determinar cor com base na taxa de acerto
        const winRateColor = Utils.getWinRateColor(winRate);
        const expectancyColor = Utils.getExpectancyColor(expectancy);
        
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-2 px-4 text-sm">${patternName}</td>
            <td class="py-2 px-4 text-sm">${counts.count}</td>
            <td class="py-2 px-4 text-sm"><span style="color: ${winRateColor}">${Utils.formatPercentage(winRate)}</span></td>
            <td class="py-2 px-4 text-sm"><span style="color: ${expectancyColor}">${Utils.formatR(expectancy)}</span></td>
            <td class="py-2 px-4 text-sm">${Utils.formatR(avgGain)}</td>
            <td class="py-2 px-4 text-sm">${Utils.formatR(avgLoss)}</td>
            <td class="py-2 px-4 text-sm">${stdDev.toFixed(2)}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Se a tabela estiver vazia, exibir mensagem
    if (filteredPatternStats.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" class="py-4 text-center text-gray-500">Nenhum dado disponível para os filtros selecionados.</td>
        `;
        tableBody.appendChild(row);
    }
}

/**
 * Ordena a tabela de padrões
 * @param {string} sortBy - Critério de ordenação ('expectancy', 'winrate', 'trades', 'alpha')
 */
function sortPatternTable(sortBy) {
    const tableBody = document.getElementById('patterns-table');
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    
    // Excluir a linha de "Nenhum dado disponível", se existir
    const dataRows = rows.filter(row => row.cells && row.cells.length > 1);
    
    if (dataRows.length === 0) return;
    
    // Ordenar as linhas
    dataRows.sort((a, b) => {
        switch (sortBy) {
            case 'expectancy':
                // Coluna 3 (índice 3) - Expectativa
                const expA = parseFloat(a.cells[3].textContent.replace(/[+R%]/g, ''));
                const expB = parseFloat(b.cells[3].textContent.replace(/[+R%]/g, ''));
                return expB - expA;
            
            case 'winrate':
                // Coluna 2 (índice 2) - Taxa de Acerto
                const winA = parseFloat(a.cells[2].textContent.replace('%', '')) / 100;
                const winB = parseFloat(b.cells[2].textContent.replace('%', '')) / 100;
                return winB - winA;
            
            case 'trades':
                // Coluna 1 (índice 1) - Trades
                const tradesA = parseInt(a.cells[1].textContent);
                const tradesB = parseInt(b.cells[1].textContent);
                return tradesB - tradesA;
            
            case 'alpha':
            default:
                // Coluna 0 (índice 0) - Padrão
                return a.cells[0].textContent.localeCompare(b.cells[0].textContent);
        }
    });
    
    // Limpar tabela e adicionar as linhas ordenadas
    tableBody.innerHTML = '';
    dataRows.forEach(row => tableBody.appendChild(row));
}

/**
 * Cria o gráfico de top padrões por expectativa
 * @param {Array} patternStats - Estatísticas por padrão
 * @param {Array} trades - Lista de trades filtrados
 */
function createTopPatternsChart(patternStats, trades) {
    if (!patternStats || patternStats.length === 0) {
        return;
    }
    
    // Contar trades por padrão nos trades filtrados
    const patternCounts = {};
    trades.forEach(trade => {
        const pattern = trade['Padrão Brooks'];
        if (!pattern) return;
        
        if (!patternCounts[pattern]) {
            patternCounts[pattern] = {
                count: 0,
                wins: 0,
                results: []
            };
        }
        
        patternCounts[pattern].count++;
        
        const result = parseFloat(trade['Resultado (R)']);
        patternCounts[pattern].results.push(result);
        
        if (result > 0) {
            patternCounts[pattern].wins++;
        }
    });
    
    // Filtrar padrões que aparecem nos trades filtrados
    const filteredPatternStats = patternStats.filter(pattern => 
        patternCounts[pattern['Padrão']] && patternCounts[pattern['Padrão']].count >= 3); // Mínimo de 3 trades
    
    // Calcular expectativa com base nos trades filtrados
    filteredPatternStats.forEach(pattern => {
        const patternName = pattern['Padrão'];
        const counts = patternCounts[patternName];
        
        if (counts) {
            pattern.filteredExpectancy = counts.results.reduce((sum, val) => sum + val, 0) / counts.count;
            pattern.filteredWinRate = counts.wins / counts.count;
            pattern.filteredCount = counts.count;
        }
    });
    
    // Ordenar por expectativa (maior primeiro)
    filteredPatternStats.sort((a, b) => b.filteredExpectancy - a.filteredExpectancy);
    
    // Limitar a 10 padrões
    const topPatterns = filteredPatternStats.slice(0, 10);
    
    // Preparar dados para o gráfico
    const labels = topPatterns.map(pattern => pattern['Padrão']);
    const expectancies = topPatterns.map(pattern => pattern.filteredExpectancy);
    const winRates = topPatterns.map(pattern => pattern.filteredWinRate * 100);
    
    // Criar ou atualizar gráfico
    const ctx = document.getElementById('topPatternsChart').getContext('2d');
    
    if (statsData.charts.topPatterns) {
        statsData.charts.topPatterns.destroy();
    }
    
    statsData.charts.topPatterns = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Expectativa (R)',
                    data: expectancies,
                    backgroundColor: CONFIG.CHART_COLORS.green,
                    borderColor: CONFIG.CHART_COLORS.green,
                    borderWidth: 1,
                    yAxisID: 'expectancy'
                },
                {
                    label: 'Taxa de Acerto (%)',
                    data: winRates,
                    backgroundColor: CONFIG.CHART_COLORS.blue,
                    borderColor: CONFIG.CHART_COLORS.blue,
                    borderWidth: 1,
                    yAxisID: 'percentage'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.x !== null) {
                                if (context.dataset.yAxisID === 'percentage') {
                                    label += context.parsed.x.toFixed(1) + '%';
                                } else {
                                    label += context.parsed.x.toFixed(2) + 'R';
                                }
                            }
                            return label;
                        },
                        afterBody: function(tooltipItems) {
                            const dataIndex = tooltipItems[0].dataIndex;
                            const pattern = topPatterns[dataIndex];
                            return `Trades: ${pattern.filteredCount}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                },
                expectancy: {
                    position: 'top',
                    title: {
                        display: true,
                        text: 'Expectativa (R)'
                    },
                    grid: {
                        display: false
                    }
                },
                percentage: {
                    position: 'bottom',
                    max: 100,
                    title: {
                        display: true,
                        text: 'Taxa de Acerto (%)'
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
 * Cria o gráfico de scatter de padrões
 * @param {Array} patternStats - Estatísticas por padrão
 * @param {Array} trades - Lista de trades filtrados
 */
function createPatternsScatterChart(patternStats, trades) {
    if (!patternStats || patternStats.length === 0) {
        return;
    }
    
    // Contar trades por padrão nos trades filtrados
    const patternCounts = {};
    trades.forEach(trade => {
        const pattern = trade['Padrão Brooks'];
        if (!pattern) return;
        
        if (!patternCounts[pattern]) {
            patternCounts[pattern] = {
                count: 0,
                wins: 0,
                results: []
            };
        }
        
        patternCounts[pattern].count++;
        
        const result = parseFloat(trade['Resultado (R)']);
        patternCounts[pattern].results.push(result);
        
        if (result > 0) {
            patternCounts[pattern].wins++;
        }
    });
    
    // Filtrar padrões que aparecem nos trades filtrados
    const filteredPatternStats = patternStats.filter(pattern => 
        patternCounts[pattern['Padrão']] && patternCounts[pattern['Padrão']].count > 0);
    
    // Calcular estatísticas com base nos trades filtrados
    filteredPatternStats.forEach(pattern => {
        const patternName = pattern['Padrão'];
        const counts = patternCounts[patternName];
        
        if (counts) {
            pattern.filteredExpectancy = counts.results.reduce((sum, val) => sum + val, 0) / counts.count;
            pattern.filteredWinRate = counts.wins / counts.count;
            pattern.filteredCount = counts.count;
        }
    });
    
    // Preparar dados para o gráfico
    const data = filteredPatternStats.map(pattern => ({
        x: pattern.filteredWinRate * 100, // Taxa de acerto (%)
        y: pattern.filteredExpectancy, // Expectativa (R)
        r: Math.min(Math.max(pattern.filteredCount * 2, 5), 20), // Tamanho do ponto baseado no número de trades (min 5, max 20)
        label: pattern['Padrão'],
        count: pattern.filteredCount
    }));
    
    // Criar ou atualizar gráfico
    const ctx = document.getElementById('patternsScatterChart').getContext('2d');
    
    if (statsData.charts.patternsScatter) {
        statsData.charts.patternsScatter.destroy();
    }
    
    statsData.charts.patternsScatter = new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'Padrões',
                data: data,
                backgroundColor: data.map(point => {
                    // Cor baseada na expectativa
                    if (point.y >= 0.5) return CONFIG.CHART_COLORS.greenLight;
                    if (point.y >= 0) return CONFIG.CHART_COLORS.yellowLight;
                    return CONFIG.CHART_COLORS.redLight;
                }),
                borderColor: data.map(point => {
                    // Cor da borda baseada na expectativa
                    if (point.y >= 0.5) return CONFIG.CHART_COLORS.green;
                    if (point.y >= 0) return CONFIG.CHART_COLORS.yellow;
                    return CONFIG.CHART_COLORS.red;
                }),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            return `${point.label}`;
                        },
                        afterLabel: function(context) {
                            const point = context.raw;
                            return [
                                `Taxa de Acerto: ${point.x.toFixed(1)}%`,
                                `Expectativa: ${point.y.toFixed(2)}R`,
                                `Trades: ${point.count}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Taxa de Acerto (%)'
                    },
                    min: 0,
                    max: 100
                },
                y: {
                    title: {
                        display: true,
                        text: 'Expectativa (R)'
                    },
                    suggestedMin: -1
                }
            }
        }
    });
}

/**
 * Atualiza a matriz de probabilidade
 * @param {string} type - Tipo de matriz ('winrate', 'expectancy', 'volume')
 */
function updateProbabilityMatrix(type) {
    const matrixContainer = document.getElementById('probability-matrix');
    const matrix = statsData.matrix;
    
    if (!matrix || !matrix.patterns || !matrix.contexts) {
        matrixContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Dados insuficientes para exibir a matriz.</p>';
        return;
    }
    
    // Determinar quais dados da matriz exibir
    const matrixData = type === 'expectancy' ? matrix.expectancyMatrix : 
                      (type === 'volume' ? null : matrix.winRateMatrix); // Padrão é winrate
    
    // Filtrar padrões e contextos com base nos trades filtrados
    const patterns = [];
    const contexts = [];
    
    // Contar trades por combinação padrão/contexto
    const combinationCounts = {};
    
    statsData.filteredTrades.forEach(trade => {
        const pattern = trade['Padrão Brooks'];
        const context = trade['Contexto de Mercado'];
        
        if (!pattern || !context) return;
        
        const key = `${pattern}|${context}`;
        
        if (!combinationCounts[key]) {
            combinationCounts[key] = {
                count: 0,
                wins: 0,
                results: []
            };
        }
        
        combinationCounts[key].count++;
        
        const result = parseFloat(trade['Resultado (R)']);
        combinationCounts[key].results.push(result);
        
        if (result > 0) {
            combinationCounts[key].wins++;
        }
        
        if (!patterns.includes(pattern)) {
            patterns.push(pattern);
        }
        
        if (!contexts.includes(context)) {
            contexts.push(context);
        }
    });
    
    // Calcular estatísticas por combinação
    const combinationStats = {};
    
    Object.keys(combinationCounts).forEach(key => {
        const [pattern, context] = key.split('|');
        const counts = combinationCounts[key];
        
        if (counts.count < 3) return; // Mínimo de 3 trades
        
        combinationStats[key] = {
            winRate: counts.wins / counts.count,
            expectancy: counts.results.reduce((sum, val) => sum + val, 0) / counts.count,
            count: counts.count
        };
    });
    
    // Construir a tabela HTML para a matriz
    let html = `
        <table class="min-w-full border">
            <thead>
                <tr>
                    <th class="py-2 px-4 border bg-gray-100"></th>
    `;
    
    // Adicionar cabeçalhos de contextos
    contexts.forEach(context => {
        html += `<th class="py-2 px-4 border bg-gray-100 text-sm">${context}</th>`;
    });
    
    html += `
                </tr>
            </thead>
            <tbody>
    `;
    
    // Adicionar linhas para cada padrão
    patterns.forEach(pattern => {
        html += `
            <tr>
                <th class="py-2 px-4 border bg-gray-100 text-sm text-left">${pattern}</th>
        `;
        
        // Adicionar células para cada contexto
        contexts.forEach(context => {
            const key = `${pattern}|${context}`;
            const stats = combinationStats[key];
            
            if (!stats) {
                html += `<td class="py-2 px-4 border text-center text-gray-400">-</td>`;
                return;
            }
            
            // Determinar valor a ser exibido e cor
            let value, color;
            
            if (type === 'expectancy') {
                value = Utils.formatR(stats.expectancy);
                color = Utils.getExpectancyColor(stats.expectancy);
            } else if (type === 'volume') {
                value = stats.count;
                color = '#3b82f6'; // Azul
            } else { // winrate
                value = Utils.formatPercentage(stats.winRate);
                color = Utils.getWinRateColor(stats.winRate);
            }
            
            // Gerar célula com valor e estilo
            html += `
                <td class="py-2 px-4 border text-center" style="background-color: ${color}20;">
                    <span style="color: ${color};" class="font-medium">${value}</span>
                    <span class="block text-xs text-gray-500">${stats.count} trades</span>
                </td>
            `;
        });
        
        html += `</tr>`;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    // Atualizar container
    matrixContainer.innerHTML = html;
}

/**
 * Cria o gráfico de desempenho por contexto
 * @param {Array} contextStats - Estatísticas por contexto
 * @param {Array} trades - Lista de trades filtrados
 */
function createContextPerformanceChart(contextStats, trades) {
    if (!contextStats || contextStats.length === 0) {
        return;
    }
    
    // Contar trades por contexto nos trades filtrados
    const contextCounts = {};
    trades.forEach(trade => {
        const context = trade['Contexto de Mercado'];
        if (!context) return;
        
        if (!contextCounts[context]) {
            contextCounts[context] = {
                count: 0,
                wins: 0,
                results: []
            };
        }
        
        contextCounts[context].count++;
        
        const result = parseFloat(trade['Resultado (R)']);
        contextCounts[context].results.push(result);
        
        if (result > 0) {
            contextCounts[context].wins++;
        }
    });
    
    // Filtrar contextos que aparecem nos trades filtrados
    const filteredContextStats = contextStats.filter(context => 
        contextCounts[context['Contexto']] && contextCounts[context['Contexto']].count >= 3); // Mínimo de 3 trades
    
    // Calcular estatísticas com base nos trades filtrados
    filteredContextStats.forEach(context => {
        const contextName = context['Contexto'];
        const counts = contextCounts[contextName];
        
        if (counts) {
            context.filteredExpectancy = counts.results.reduce((sum, val) => sum + val, 0) / counts.count;
            context.filteredWinRate = counts.wins / counts.count;
            context.filteredCount = counts.count;
        }
    });
    
    // Ordenar por expectativa (maior primeiro)
    filteredContextStats.sort((a, b) => b.filteredExpectancy - a.filteredExpectancy);
    
    // Preparar dados para o gráfico
    const labels = filteredContextStats.map(context => context['Contexto']);
    const expectancies = filteredContextStats.map(context => context.filteredExpectancy);
    const winRates = filteredContextStats.map(context => context.filteredWinRate * 100);
    const counts = filteredContextStats.map(context => context.filteredCount);
    
    // Criar ou atualizar gráfico
    const ctx = document.getElementById('contextPerformanceChart').getContext('2d');
    
    if (statsData.charts.contextPerformance) {
        statsData.charts.contextPerformance.destroy();
    }
    
    statsData.charts.contextPerformance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Expectativa (R)',
                    data: expectancies,
                    backgroundColor: CONFIG.CHART_COLORS.green,
                    borderColor: CONFIG.CHART_COLORS.green,
                    borderWidth: 1,
                    yAxisID: 'expectancy'
                },
                {
                    label: 'Taxa de Acerto (%)',
                    data: winRates,
                    backgroundColor: CONFIG.CHART_COLORS.blue,
                    borderColor: CONFIG.CHART_COLORS.blue,
                    borderWidth: 1,
                    yAxisID: 'percentage'
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
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.dataset.yAxisID === 'percentage') {
                                    label += context.parsed.y.toFixed(1) + '%';
                                } else {
                                    label += context.parsed.y.toFixed(2) + 'R';
                                }
                            }
                            return label;
                        },
                        afterBody: function(tooltipItems) {
                            const dataIndex = tooltipItems[0].dataIndex;
                            return `Trades: ${counts[dataIndex]}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                },
                expectancy: {
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Expectativa (R)'
                    },
                    grid: {
                        display: false
                    }
                },
                percentage: {
                    position: 'right',
                    max: 100,
                    title: {
                        display: true,
                        text: 'Taxa de Acerto (%)'
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
 * Cria o gráfico de desempenho por ciclo de mercado
 * @param {Array} trades - Lista de trades filtrados
 */
function createCyclePerformanceChart(trades) {
    // Contar trades por ciclo
    const cycleCounts = {};
    trades.forEach(trade => {
        const cycle = trade['Ciclo de Mercado'];
        if (!cycle) return;
        
        if (!cycleCounts[cycle]) {
            cycleCounts[cycle] = {
                count: 0,
                wins: 0,
                results: []
            };
        }
        
        cycleCounts[cycle].count++;
        
        const result = parseFloat(trade['Resultado (R)']);
        cycleCounts[cycle].results.push(result);
        
        if (result > 0) {
            cycleCounts[cycle].wins++;
        }
    });
    
    // Calcular estatísticas
    const cycleStats = [];
    
    Object.keys(cycleCounts).forEach(cycle => {
        const counts = cycleCounts[cycle];
        
        if (counts.count < 3) return; // Mínimo de 3 trades
        
        cycleStats.push({
            cycle: cycle,
            count: counts.count,
            winRate: counts.wins / counts.count,
            expectancy: counts.results.reduce((sum, val) => sum + val, 0) / counts.count
        });
    });
    
    // Ordenar por expectativa (maior primeiro)
    cycleStats.sort((a, b) => b.expectancy - a.expectancy);
    
    // Preparar dados para o gráfico
    const labels = cycleStats.map(stat => stat.cycle);
    const expectancies = cycleStats.map(stat => stat.expectancy);
    const winRates = cycleStats.map(stat => stat.winRate * 100);
    const counts = cycleStats.map(stat => stat.count);
    
    // Criar ou atualizar gráfico
    const ctx = document.getElementById('cyclePerformanceChart').getContext('2d');
    
    if (statsData.charts.cyclePerformance) {
        statsData.charts.cyclePerformance.destroy();
    }
    
    statsData.charts.cyclePerformance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Expectativa (R)',
                    data: expectancies,
                    backgroundColor: CONFIG.CHART_COLORS.purple,
                    borderColor: CONFIG.CHART_COLORS.purple,
                    borderWidth: 1,
                    yAxisID: 'expectancy'
                },
                {
                    label: 'Taxa de Acerto (%)',
                    data: winRates,
                    backgroundColor: CONFIG.CHART_COLORS.indigo,
                    borderColor: CONFIG.CHART_COLORS.indigo,
                    borderWidth: 1,
                    yAxisID: 'percentage'
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
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.dataset.yAxisID === 'percentage') {
                                    label += context.parsed.y.toFixed(1) + '%';
                                } else {
                                    label += context.parsed.y.toFixed(2) + 'R';
                                }
                            }
                            return label;
                        },
                        afterBody: function(tooltipItems) {
                            const dataIndex = tooltipItems[0].dataIndex;
                            return `Trades: ${counts[dataIndex]}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                },
                expectancy: {
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Expectativa (R)'
                    },
                    grid: {
                        display: false
                    }
                },
                percentage: {
                    position: 'right',
                    max: 100,
                    title: {
                        display: true,
                        text: 'Taxa de Acerto (%)'
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
 * Cria os gráficos de comparação (pares, timeframes, tipos de atividade)
 * @param {Array} trades - Lista de trades filtrados
 */
function createComparisonCharts(trades) {
    // Criar gráfico de comparação por par
    createPairsComparisonChart(trades);
    
    // Criar gráfico de comparação por timeframe
    createTimeframeComparisonChart(trades);
    
    // Criar gráfico de comparação por tipo de atividade
    createActivityComparisonChart(trades);
}

/**
 * Cria o gráfico de comparação por par
 * @param {Array} trades - Lista de trades filtrados
 */
function createPairsComparisonChart(trades) {
    // Contar trades por par
    const pairCounts = {};
    trades.forEach(trade => {
        const pair = trade['Par de Moedas'];
        if (!pair) return;
        
        if (!pairCounts[pair]) {
            pairCounts[pair] = {
                count: 0,
                wins: 0,
                results: []
            };
        }
        
        pairCounts[pair].count++;
        
        const result = parseFloat(trade['Resultado (R)']);
        pairCounts[pair].results.push(result);
        
        if (result > 0) {
            pairCounts[pair].wins++;
        }
    });
    
    // Calcular estatísticas
    const pairStats = [];
    
    Object.keys(pairCounts).forEach(pair => {
        const counts = pairCounts[pair];
        
        if (counts.count < 3) return; // Mínimo de 3 trades
        
        pairStats.push({
            pair: pair,
            count: counts.count,
            winRate: counts.wins / counts.count,
            expectancy: counts.results.reduce((sum, val) => sum + val, 0) / counts.count
        });
    });
    
    // Ordenar por expectativa (maior primeiro)
    pairStats.sort((a, b) => b.expectancy - a.expectancy);
    
    // Preparar dados para o gráfico
    const labels = pairStats.map(stat => stat.pair);
    const winRates = pairStats.map(stat => stat.winRate * 100);
    const expectancies = pairStats.map(stat => stat.expectancy);
    const counts = pairStats.map(stat => stat.count);
    
    // Criar ou atualizar gráfico
    const ctx = document.getElementById('pairsComparisonChart').getContext('2d');
    
    if (statsData.charts.pairsComparison) {
        statsData.charts.pairsComparison.destroy();
    }
    
    statsData.charts.pairsComparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Expectativa (R)',
                    data: expectancies,
                    backgroundColor: CONFIG.CHART_COLORS.green,
                    borderColor: CONFIG.CHART_COLORS.green,
                    yAxisID: 'expectancy'
                },
                {
                    label: 'Volume',
                    data: counts,
                    backgroundColor: CONFIG.CHART_COLORS.yellow,
                    borderColor: CONFIG.CHART_COLORS.yellow,
                    yAxisID: 'volume',
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
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.dataset.yAxisID === 'expectancy') {
                                    label += context.parsed.y.toFixed(2) + 'R';
                                } else if (context.dataset.yAxisID === 'volume') {
                                    label += context.parsed.y + ' trades';
                                }
                            }
                            return label;
                        },
                        afterBody: function(tooltipItems) {
                            const dataIndex = tooltipItems[0].dataIndex;
                            return `Taxa de Acerto: ${winRates[dataIndex].toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                expectancy: {
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Expectativa (R)'
                    }
                },
                volume: {
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Volume (trades)'
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
 * Cria o gráfico de comparação por timeframe
 * @param {Array} trades - Lista de trades filtrados
 */
function createTimeframeComparisonChart(trades) {
    // Contar trades por timeframe
    const timeframeCounts = {};
    trades.forEach(trade => {
        const timeframe = trade['Timeframe'];
        if (!timeframe) return;
        
        if (!timeframeCounts[timeframe]) {
            timeframeCounts[timeframe] = {
                count: 0,
                wins: 0,
                results: []
            };
        }
        
        timeframeCounts[timeframe].count++;
        
        const result = parseFloat(trade['Resultado (R)']);
        timeframeCounts[timeframe].results.push(result);
        
        if (result > 0) {
            timeframeCounts[timeframe].wins++;
        }
    });
    
    // Calcular estatísticas
    const timeframeStats = [];
    
    Object.keys(timeframeCounts).forEach(timeframe => {
        const counts = timeframeCounts[timeframe];
        
        if (counts.count < 3) return; // Mínimo de 3 trades
        
        timeframeStats.push({
            timeframe: timeframe,
            count: counts.count,
            winRate: counts.wins / counts.count,
            expectancy: counts.results.reduce((sum, val) => sum + val, 0) / counts.count
        });
    });
    
    // Ordenar por expectativa (maior primeiro)
    timeframeStats.sort((a, b) => b.expectancy - a.expectancy);
    
    // Preparar dados para o gráfico
    const labels = timeframeStats.map(stat => stat.timeframe);
    const winRates = timeframeStats.map(stat => stat.winRate * 100);
    const expectancies = timeframeStats.map(stat => stat.expectancy);
    const counts = timeframeStats.map(stat => stat.count);
    
    // Criar ou atualizar gráfico
    const ctx = document.getElementById('timeframeComparisonChart').getContext('2d');
    
    if (statsData.charts.timeframeComparison) {
        statsData.charts.timeframeComparison.destroy();
    }
    
    statsData.charts.timeframeComparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Taxa de Acerto (%)',
                    data: winRates,
                    backgroundColor: CONFIG.CHART_COLORS.blue,
                    borderColor: CONFIG.CHART_COLORS.blue,
                    yAxisID: 'percentage'
                },
                {
                    label: 'Volume',
                    data: counts,
                    backgroundColor: CONFIG.CHART_COLORS.orange,
                    borderColor: CONFIG.CHART_COLORS.orange,
                    yAxisID: 'volume',
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
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.dataset.yAxisID === 'percentage') {
                                    label += context.parsed.y.toFixed(1) + '%';
                                } else if (context.dataset.yAxisID === 'volume') {
                                    label += context.parsed.y + ' trades';
                                }
                            }
                            return label;
                        },
                        afterBody: function(tooltipItems) {
                            const dataIndex = tooltipItems[0].dataIndex;
                            return `Expectativa: ${expectancies[dataIndex].toFixed(2)}R`;
                        }
                    }
                }
            },
            scales: {
                percentage: {
                    position: 'left',
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Taxa de Acerto (%)'
                    }
                },
                volume: {
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Volume (trades)'
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
 * Cria o gráfico de comparação por tipo de atividade
 * @param {Array} trades - Lista de trades filtrados
 */
function createActivityComparisonChart(trades) {
    // Contar trades por tipo de atividade
    const activityCounts = {};
    trades.forEach(trade => {
        const activity = trade['Tipo de Atividade'];
        if (!activity) return;
        
        if (!activityCounts[activity]) {
            activityCounts[activity] = {
                count: 0,
                wins: 0,
                results: []
            };
        }
        
        activityCounts[activity].count++;
        
        const result = parseFloat(trade['Resultado (R)']);
        activityCounts[activity].results.push(result);
        
        if (result > 0) {
            activityCounts[activity].wins++;
        }
    });
    
    // Calcular estatísticas
    const activityStats = [];
    
    Object.keys(activityCounts).forEach(activity => {
        const counts = activityCounts[activity];
        
        if (counts.count < 3) return; // Mínimo de 3 trades
        
        activityStats.push({
            activity: activity,
            count: counts.count,
            winRate: counts.wins / counts.count,
            expectancy: counts.results.reduce((sum, val) => sum + val, 0) / counts.count
        });
    });
    
    // Ordenar por expectativa (maior primeiro)
    activityStats.sort((a, b) => b.expectancy - a.expectancy);
    
    // Preparar dados para o gráfico
    const labels = activityStats.map(stat => stat.activity);
    const winRates = activityStats.map(stat => stat.winRate * 100);
    const expectancies = activityStats.map(stat => stat.expectancy);
    const counts = activityStats.map(stat => stat.count);
    
    // Definir cores específicas para cada tipo de atividade
    const backgroundColors = labels.map(label => {
        if (label === 'Estudo') return CONFIG.CHART_COLORS.blue;
        if (label === 'Simulação') return CONFIG.CHART_COLORS.purple;
        if (label === 'Real') return CONFIG.CHART_COLORS.green;
        return CONFIG.CHART_COLORS.gray;
    });
    
    // Criar ou atualizar gráfico
    const ctx = document.getElementById('activityComparisonChart').getContext('2d');
    
    if (statsData.charts.activityComparison) {
        statsData.charts.activityComparison.destroy();
    }
    
    statsData.charts.activityComparison = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const dataIndex = context.dataIndex;
                            const count = counts[dataIndex];
                            const percentage = (count / counts.reduce((a, b) => a + b, 0) * 100).toFixed(1);
                            return `${context.label}: ${count} trades (${percentage}%)`;
                        },
                        afterLabel: function(context) {
                            const dataIndex = context.dataIndex;
                            return [
                                `Taxa de Acerto: ${winRates[dataIndex].toFixed(1)}%`,
                                `Expectativa: ${expectancies[dataIndex].toFixed(2)}R`
                            ];
                        }
                    }
                },
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

/**
 * Gera recomendações e insights com base nos dados
 * @param {Object} stats - Estatísticas gerais
 * @param {Array} patternStats - Estatísticas por padrão
 * @param {Array} contextStats - Estatísticas por contexto
 */
function generateRecommendations(stats, patternStats, contextStats) {
    // Listas para armazenar pontos fortes e áreas para melhoria
    const strengths = [];
    const improvements = [];
    
    // Verificar se há dados suficientes
    if (statsData.filteredTrades.length < 5) {
        document.getElementById('strengths-list').innerHTML = '<li>Dados insuficientes para análise.</li>';
        document.getElementById('improvements-list').innerHTML = '<li>Registre mais trades para obter insights.</li>';
        document.getElementById('recommendations-text').textContent = 'Continue registrando seus trades para acumular dados suficientes para análise.';
        return;
    }
    
    // Analisar estatísticas gerais
    if (stats.winRate >= 0.6) {
        strengths.push('Alta taxa de acerto: ' + Utils.formatPercentage(stats.winRate));
    } else if (stats.winRate < 0.4) {
        improvements.push('Taxa de acerto abaixo do ideal: ' + Utils.formatPercentage(stats.winRate));
    }
    
    if (stats.expectancy >= 0.5) {
        strengths.push('Boa expectativa geral: ' + Utils.formatR(stats.expectancy));
    } else if (stats.expectancy < 0) {
        improvements.push('Expectativa negativa: ' + Utils.formatR(stats.expectancy));
    }
    
    if (stats.profitFactor >= 2) {
        strengths.push('Excelente fator de lucro: ' + (stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)));
    } else if (stats.profitFactor < 1) {
        improvements.push('Fator de lucro abaixo de 1: ' + stats.profitFactor.toFixed(2));
    }
    
    // Analisar relação entre ganhos e perdas
    const rRatio = stats.avgWin / Math.abs(stats.avgLoss);
    
    if (rRatio >= 2) {
        strengths.push('Excelente relação ganho/perda: ' + rRatio.toFixed(2) + ':1');
    } else if (rRatio < 1) {
        improvements.push('Ganhos médios menores que perdas médias: ' + rRatio.toFixed(2) + ':1');
    }
    
    // Analisar padrões
    if (patternStats && patternStats.length > 0) {
        // Contar trades por padrão nos trades filtrados
        const patternCounts = {};
        
        statsData.filteredTrades.forEach(trade => {
            const pattern = trade['Padrão Brooks'];
            if (!pattern) return;
            
            if (!patternCounts[pattern]) {
                patternCounts[pattern] = {
                    count: 0,
                    wins: 0,
                    results: []
                };
            }
            
            patternCounts[pattern].count++;
            
            const result = parseFloat(trade['Resultado (R)']);
            patternCounts[pattern].results.push(result);
            
            if (result > 0) {
                patternCounts[pattern].wins++;
            }
        });
        
        // Encontrar melhores e piores padrões
        const patternPerformance = [];
        
        Object.keys(patternCounts).forEach(pattern => {
            const counts = patternCounts[pattern];
            
            if (counts.count < 3) return; // Mínimo de 3 trades
            
            patternPerformance.push({
                pattern: pattern,
                count: counts.count,
                winRate: counts.wins / counts.count,
                expectancy: counts.results.reduce((sum, val) => sum + val, 0) / counts.count
            });
        });
        
        // Ordenar por expectativa (maior primeiro)
        patternPerformance.sort((a, b) => b.expectancy - a.expectancy);
        
        // Adicionar melhores padrões aos pontos fortes
        const bestPatterns = patternPerformance.slice(0, 3);
        
        bestPatterns.forEach(pattern => {
            if (pattern.expectancy > 0) {
                strengths.push(`${pattern.pattern} tem boa performance: ${Utils.formatR(pattern.expectancy)} (${Utils.formatPercentage(pattern.winRate)} acerto, ${pattern.count} trades)`);
            }
        });
        
        // Adicionar piores padrões às áreas para melhoria
        const worstPatterns = [...patternPerformance].sort((a, b) => a.expectancy - b.expectancy).slice(0, 3);
        
        worstPatterns.forEach(pattern => {
            if (pattern.expectancy < 0 && pattern.count >= 5) {
                improvements.push(`${pattern.pattern} tem baixa performance: ${Utils.formatR(pattern.expectancy)} (${Utils.formatPercentage(pattern.winRate)} acerto, ${pattern.count} trades)`);
            }
        });
    }
    
    // Analisar contextos
    if (contextStats && contextStats.length > 0) {
        // Contar trades por contexto nos trades filtrados
        const contextCounts = {};
        
        statsData.filteredTrades.forEach(trade => {
            const context = trade['Contexto de Mercado'];
            if (!context) return;
            
            if (!contextCounts[context]) {
                contextCounts[context] = {
                    count: 0,
                    wins: 0,
                    results: []
                };
            }
            
            contextCounts[context].count++;
            
            const result = parseFloat(trade['Resultado (R)']);
            contextCounts[context].results.push(result);
            
            if (result > 0) {
                contextCounts[context].wins++;
            }
        });
        
        // Encontrar melhores e piores contextos
        const contextPerformance = [];
        
        Object.keys(contextCounts).forEach(context => {
            const counts = contextCounts[context];
            
            if (counts.count < 3) return; // Mínimo de 3 trades
            
            contextPerformance.push({
                context: context,
                count: counts.count,
                winRate: counts.wins / counts.count,
                expectancy: counts.results.reduce((sum, val) => sum + val, 0) / counts.count
            });
        });
        
        // Ordenar por expectativa (maior primeiro)
        contextPerformance.sort((a, b) => b.expectancy - a.expectancy);
        
        // Adicionar melhores contextos aos pontos fortes
        const bestContexts = contextPerformance.slice(0, 2);
        
        bestContexts.forEach(context => {
            if (context.expectancy > 0) {
                strengths.push(`Bom desempenho no contexto ${context.context}: ${Utils.formatR(context.expectancy)} (${Utils.formatPercentage(context.winRate)} acerto, ${context.count} trades)`);
            }
        });
        
        // Adicionar piores contextos às áreas para melhoria
        const worstContexts = [...contextPerformance].sort((a, b) => a.expectancy - b.expectancy).slice(0, 2);
        
        worstContexts.forEach(context => {
            if (context.expectancy < 0 && context.count >= 5) {
                improvements.push(`Evite operar no contexto ${context.context}: ${Utils.formatR(context.expectancy)} (${Utils.formatPercentage(context.winRate)} acerto, ${context.count} trades)`);
            }
        });
    }
    
    // Adicionar pontos genéricos se a análise não gerou suficientes
    if (strengths.length === 0) {
        strengths.push('Continue registrando trades para obter uma análise mais completa.');
    }
    
    if (improvements.length === 0) {
        improvements.push('Continue registrando trades para identificar áreas específicas para melhoria.');
    }
    
    // Atualizar listas na interface
    const strengthsList = document.getElementById('strengths-list');
    const improvementsList = document.getElementById('improvements-list');
    
    strengthsList.innerHTML = '';
    improvementsList.innerHTML = '';
    
    strengths.forEach(strength => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas fa-check-circle text-green-500 mr-2"></i>${strength}`;
        strengthsList.appendChild(li);
    });
    
    improvements.forEach(improvement => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas fa-exclamation-circle text-red-500 mr-2"></i>${improvement}`;
        improvementsList.appendChild(li);
    });
    
    // Gerar recomendações personalizadas
    let recommendationsText = 'Com base na análise dos seus dados, recomendamos: ';
    
    // Recomendar ações com base nos pontos fortes e áreas para melhoria
    if (improvements.some(imp => imp.includes('Taxa de acerto'))) {
        recommendationsText += 'Foque em melhorar sua seletividade de trades. Seja mais rigoroso nos critérios de entrada e busque setups de maior qualidade. ';
    }
    
    if (improvements.some(imp => imp.includes('Ganhos médios menores'))) {
        recommendationsText += 'Trabalhe para melhorar sua relação risco/recompensa. Considere alvos mais ambiciosos ou stops mais ajustados. ';
    }
    
    if (worstPatterns && worstPatterns.length > 0) {
        recommendationsText += `Considere evitar ou reduzir a frequência de trading com os padrões de menor desempenho como ${worstPatterns[0].pattern}. `;
    }
    
    if (bestPatterns && bestPatterns.length > 0) {
        recommendationsText += `Foque mais nos padrões com melhor desempenho como ${bestPatterns[0].pattern}. `;
    }
    
    if (stats.totalTrades < 50) {
        recommendationsText += 'Continue registrando trades para obter uma base estatística mais robusta para análise. ';
    }
    
    // Atualizar texto de recomendações
    document.getElementById('recommendations-text').textContent = recommendationsText;
}

/**
 * Exporta os dados estatísticos em formato CSV
 */
function exportStatisticsData() {
    // Verificar se há dados para exportar
    if (!statsData.filteredTrades || statsData.filteredTrades.length === 0) {
        Utils.showToast('Não há dados para exportar.', 'error');
        return;
    }
    
    try {
        // Preparar título do arquivo com data atual
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `estatisticas_price_action_brooks_${dateStr}.csv`;
        
        // Criar CSV para os trades
        let csv = 'Data,Par,Timeframe,Padrão,Contexto,Ciclo,Direção,Resultado(R)\n';
        
        statsData.filteredTrades.forEach(trade => {
            const date = trade['Data e Hora'] ? new Date(trade['Data e Hora']).toLocaleDateString() : '';
            const pair = trade['Par de Moedas'] || '';
            const timeframe = trade['Timeframe'] || '';
            const pattern = trade['Padrão Brooks'] || '';
            const context = trade['Contexto de Mercado'] || '';
            const cycle = trade['Ciclo de Mercado'] || '';
            const direction = trade['Direção'] || '';
            const result = trade['Resultado (R)'] || '0';
            
            csv += `${date},${pair},${timeframe},${pattern},${context},${cycle},${direction},${result}\n`;
        });
        
        // Criar estatísticas resumidas
        csv += '\n\nEstatísticas Resumidas\n';
        csv += `Total de Trades,${statsData.filteredTrades.length}\n`;
        
        const stats = calculateStatistics(statsData.filteredTrades);
        csv += `Taxa de Acerto,${Utils.formatPercentage(stats.winRate)}\n`;
        csv += `Expectativa,${Utils.formatR(stats.expectancy)}\n`;
        csv += `Fator de Lucro,${stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}\n`;
        csv += `Ganhos,${stats.winsCount}\n`;
        csv += `Perdas,${stats.lossesCount}\n`;
        csv += `Média de Ganhos,${Utils.formatR(stats.avgWin)}\n`;
        csv += `Média de Perdas,${Utils.formatR(stats.avgLoss)}\n`;
        
        // Criar CSV para estatísticas por padrão
        csv += '\n\nDesempenho por Padrão\n';
        csv += 'Padrão,Trades,Taxa de Acerto,Expectativa\n';
        
        // Contar trades por padrão nos trades filtrados
        const patternCounts = {};
        
        statsData.filteredTrades.forEach(trade => {
            const pattern = trade['Padrão Brooks'];
            if (!pattern) return;
            
            if (!patternCounts[pattern]) {
                patternCounts[pattern] = {
                    count: 0,
                    wins: 0,
                    results: []
                };
            }
            
            patternCounts[pattern].count++;
            
            const result = parseFloat(trade['Resultado (R)']);
            patternCounts[pattern].results.push(result);
            
            if (result > 0) {
                patternCounts[pattern].wins++;
            }
        });
        
        // Calcular estatísticas por padrão
        const patternPerformance = [];
        
        Object.keys(patternCounts).forEach(pattern => {
            const counts = patternCounts[pattern];
            
            if (counts.count < 3) return; // Mínimo de 3 trades
            
            patternPerformance.push({
                pattern: pattern,
                count: counts.count,
                winRate: counts.wins / counts.count,
                expectancy: counts.results.reduce((sum, val) => sum + val, 0) / counts.count
            });
        });
        
        // Ordenar por expectativa (maior primeiro)
        patternPerformance.sort((a, b) => b.expectancy - a.expectancy);
        
        // Adicionar padrões ao CSV
        patternPerformance.forEach(pattern => {
            csv += `${pattern.pattern},${pattern.count},${Utils.formatPercentage(pattern.winRate)},${Utils.formatR(pattern.expectancy)}\n`;
        });
        
        // Criar elemento de download
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
        
        Utils.showToast('Dados exportados com sucesso.', 'success');
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        Utils.showToast('Erro ao exportar dados. Tente novamente.', 'error');
    }
}
