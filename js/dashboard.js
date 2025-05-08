/**
 * Sistema de Quantificação Price Action Brooks
 * Lógica para a página de Dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar elementos da UI
    initUI();
    
    // Carregar dados para o dashboard
    loadDashboardData();
});

/**
 * Inicializa elementos de UI e eventos
 */
function initUI() {
    // Botão de novo trade
    const newTradeBtn = document.getElementById('new-trade-btn');
    const modal = document.getElementById('newTradeModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancel-btn');
    const tradeForm = document.getElementById('trade-form');
    
    // Abrir modal
    if (newTradeBtn) {
        newTradeBtn.addEventListener('click', function() {
            // Inicializar o formulário antes de abrir
            initializeTradeForm();
            modal.classList.remove('hidden');
        });
    }
    
    // Fechar modal
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            modal.classList.add('hidden');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
        });
    }
    
    // Enviar formulário
    if (tradeForm) {
        tradeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveTrade();
        });
    }
    
    // Configurar upload de screenshot
    setupScreenshotUpload();
}

/**
 * Configura o upload de screenshot
 */
function setupScreenshotUpload() {
    const uploadArea = document.getElementById('screenshot-upload');
    const fileInput = document.getElementById('screenshot-input');
    
    if (!uploadArea || !fileInput) return;
    
    // Abrir seletor de arquivo ao clicar na área
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Arrastar e soltar
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('border-blue-500', 'bg-blue-50');
    });
    
    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('border-blue-500', 'bg-blue-50');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('border-blue-500', 'bg-blue-50');
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            fileInput.files = e.dataTransfer.files;
            updateScreenshotPreview(e.dataTransfer.files[0]);
        }
    });
    
    // Atualizar preview quando arquivo for selecionado
    fileInput.addEventListener('change', function() {
        if (fileInput.files && fileInput.files[0]) {
            updateScreenshotPreview(fileInput.files[0]);
        }
    });
}

/**
 * Atualiza o preview da screenshot
 * @param {File} file - Arquivo de imagem
 */
function updateScreenshotPreview(file) {
    const uploadArea = document.getElementById('screenshot-upload');
    
    // Verificar se é uma imagem
    if (!file.type.match('image.*')) {
        Utils.showToast('O arquivo selecionado não é uma imagem.', 'error');
        return;
    }
    
    // Limpar conteúdo atual
    uploadArea.innerHTML = '';
    
    // Criar preview
    const img = document.createElement('img');
    img.classList.add('max-h-32', 'mx-auto', 'mt-2');
    img.file = file;
    
    // Adicionar ícone de remoção
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '<i class="fas fa-times-circle"></i>';
    removeBtn.classList.add('absolute', 'top-2', 'right-2', 'text-red-500', 'text-xl');
    removeBtn.onclick = function(e) {
        e.stopPropagation();
        resetScreenshotUpload();
    };
    
    const reader = new FileReader();
    reader.onload = (function(aImg) {
        return function(e) {
            aImg.src = e.target.result;
        };
    })(img);
    
    reader.readAsDataURL(file);
    
    // Adicionar elementos
    uploadArea.classList.add('relative');
    uploadArea.appendChild(img);
    uploadArea.appendChild(removeBtn);
    uploadArea.appendChild(document.createElement('input')).type = 'file';
}

/**
 * Reseta a área de upload de screenshot
 */
function resetScreenshotUpload() {
    const uploadArea = document.getElementById('screenshot-upload');
    const fileInput = document.getElementById('screenshot-input');
    
    fileInput.value = '';
    
    uploadArea.innerHTML = `
        <i class="fas fa-cloud-upload-alt text-gray-400 text-3xl mb-2"></i>
        <p class="text-sm text-gray-500">Arraste uma imagem ou clique para fazer upload</p>
        <input type="file" id="screenshot-input" class="hidden" accept="image/*">
    `;
    
    // Reconfigurar evento de clique
    document.getElementById('screenshot-input').addEventListener('change', function() {
        if (this.files && this.files[0]) {
            updateScreenshotPreview(this.files[0]);
        }
    });
}

/**
 * Inicializa o formulário de trade com dados de referência
 */
async function initializeTradeForm() {
    try {
        // Carregar dados para os selects
        const [pairs, patterns, contexts, cycles, timeframes] = await Promise.all([
            API.getPairs(),
            API.getPatterns(),
            API.getContexts(),
            API.getCycles(),
            API.getTimeframes()
        ]);
        
        // Preencher selects com os dados
        Utils.populateSelect('pair', pairs, 'Par', 'Par');
        Utils.populateSelect('pattern', patterns, 'Nome', 'Nome');
        Utils.populateSelect('context', contexts, 'Nome', 'Nome');
        Utils.populateSelect('market-cycle', cycles, 'Nome', 'Nome');
        Utils.populateSelect('timeframe', timeframes, 'Timeframe', 'Timeframe');
        
        // Resetar campos e formulário
        resetTradeForm();
    } catch (error) {
        console.error('Erro ao inicializar formulário:', error);
        Utils.showToast('Erro ao carregar dados para o formulário.', 'error');
    }
}

/**
 * Reseta o formulário de trade
 */
function resetTradeForm() {
    const tradeForm = document.getElementById('trade-form');
    
    if (tradeForm) {
        tradeForm.reset();
        resetScreenshotUpload();
    }
}

/**
 * Salva um novo trade com base nos dados do formulário
 */
async function saveTrade() {
    try {
        // Coletar dados do formulário
        const formData = {
            'Par de Moedas': document.getElementById('pair').value,
            'Timeframe': document.getElementById('timeframe').value,
            'Tipo de Atividade': document.getElementById('activity-type').value,
            'Padrão Brooks': document.getElementById('pattern').value,
            'Contexto de Mercado': document.getElementById('context').value,
            'Força do Contexto': document.getElementById('context-strength').value,
            'Ciclo de Mercado': document.getElementById('market-cycle').value,
            'Qualidade do Setup': document.getElementById('setup-quality').value,
            'Direção': document.querySelector('input[name="direction"]:checked')?.value || '',
            'Entrada': parseFloat(document.getElementById('entry-price').value),
            'Stop': parseFloat(document.getElementById('stop-loss').value),
            'Alvo': parseFloat(document.getElementById('take-profit').value),
            'Resultado (R)': parseFloat(document.getElementById('result').value),
            'Notas e Lições': document.getElementById('lessons').value || '',
            'Data e Hora': new Date().toISOString()
        };
        
        // Validar dados essenciais
        if (!formData['Par de Moedas'] || !formData['Padrão Brooks'] || !formData['Direção']) {
            Utils.showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        // Salvar trade no banco de dados
        const response = await API.saveTrade(formData);
        
        // Verificar se há screenshot para upload
        const fileInput = document.getElementById('screenshot-input');
        if (fileInput.files && fileInput.files[0]) {
            // Converter imagem para base64
            const base64Data = await Utils.fileToBase64(fileInput.files[0]);
            
            // Fazer upload da screenshot
            const screenshotUrl = await API.uploadScreenshot(base64Data, response.id);
            
            // Atualizar o trade com a URL da screenshot
            // Não implementado neste exemplo - exigiria outra chamada API para atualizar o trade
        }
        
        // Fechar modal e resetar formulário
        document.getElementById('newTradeModal').classList.add('hidden');
        resetTradeForm();
        
        // Exibir mensagem de sucesso
        Utils.showToast('Trade registrado com sucesso!', 'success');
        
        // Recarregar dados do dashboard para refletir o novo trade
        loadDashboardData();
    } catch (error) {
        console.error('Erro ao salvar trade:', error);
        Utils.showToast('Erro ao salvar o trade. Tente novamente.', 'error');
    }
}

/**
 * Carrega todos os dados necessários para o dashboard
 */
async function loadDashboardData() {
    // Mostrar indicador de carregamento
    document.getElementById('loading-indicator').classList.remove('hidden');
    
    try {
        // Carregar dados em paralelo
        const [stats, recentTrades, patternStats] = await Promise.all([
            API.getStatistics(),
            API.getTrades({ limit: CONFIG.RECENT_TRADES_LIMIT }),
            API.getPatternStatistics()
        ]);
        
        // Atualizar seções do dashboard com os dados
        updateStatsCards(stats);
        updateRecentTradesTable(recentTrades);
        updateSetupCards(patternStats);
        
        // Construir gráficos
        buildPatternPerformanceChart(patternStats);
        buildMarketCycleChart(recentTrades);
        
        // Esconder indicador de carregamento
        document.getElementById('loading-indicator').classList.add('hidden');
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        Utils.showToast('Erro ao carregar dados. Tente novamente.', 'error');
        
        // Esconder indicador de carregamento mesmo em caso de erro
        document.getElementById('loading-indicator').classList.add('hidden');
    }
}

/**
 * Atualiza os cards de estatísticas
 * @param {Object} stats - Dados de estatísticas
 */
function updateStatsCards(stats) {
    // Taxa de acerto
    document.getElementById('win-rate').textContent = Utils.formatPercentage(stats.winRate);
    document.getElementById('win-rate-change').textContent = '+4.2%'; // Exemplo - idealmente calcular dinamicamente
    
    // Fator de lucro
    document.getElementById('profit-factor').textContent = 
        typeof stats.profitFactor === 'string' ? stats.profitFactor : stats.profitFactor.toFixed(2);
    document.getElementById('profit-factor-change').textContent = '+0.23'; // Exemplo
    
    // Expectativa
    document.getElementById('expectancy').textContent = Utils.formatR(stats.expectancy);
    document.getElementById('expectancy-change').textContent = '-0.06R'; // Exemplo
    
    // Trades da semana
    document.getElementById('trades-week-count').textContent = '14'; // Exemplo - calcular com API
    document.getElementById('wins-week-count').textContent = '9';    // Exemplo
    document.getElementById('losses-week-count').textContent = '5';  // Exemplo
}

/**
 * Atualiza a tabela de trades recentes
 * @param {Array} trades - Lista de trades recentes
 */
function updateRecentTradesTable(trades) {
    const tableBody = document.getElementById('recent-trades-table');
    
    // Limpar conteúdo atual
    tableBody.innerHTML = '';
    
    // Verificar se há trades para mostrar
    if (!trades || trades.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="py-4 text-center text-gray-500">Nenhum trade registrado ainda.</td>
            </tr>
        `;
        return;
    }
    
    // Adicionar cada trade à tabela
    trades.forEach(trade => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        // Determinar classe para resultado
        const resultClass = parseFloat(trade['Resultado (R)']) > 0 ? 'text-green-500' : 'text-red-500';
        const resultText = parseFloat(trade['Resultado (R)']) > 0 ? 'Lucro' : 'Perda';
        
        // Determinar classe para direção
        const directionClass = trade['Direção'] === 'Long' ? 'text-green-500' : 'text-red-500';
        
        // Construir linha da tabela
        row.innerHTML = `
            <td class="py-2 px-4 text-sm">${Utils.formatDate(trade['Data e Hora'], 'short')}</td>
            <td class="py-2 px-4 text-sm">${trade['Par de Moedas']}</td>
            <td class="py-2 px-4 text-sm">${trade['Padrão Brooks']}</td>
            <td class="py-2 px-4 text-sm"><span class="${directionClass}">${trade['Direção']}</span></td>
            <td class="py-2 px-4 text-sm">${trade['Timeframe']}</td>
            <td class="py-2 px-4 text-sm"><span class="${resultClass}">${resultText}</span></td>
            <td class="py-2 px-4 text-sm ${resultClass}">${Utils.formatR(parseFloat(trade['Resultado (R)']))}</td>
            <td class="py-2 px-4 text-sm"><a href="#" class="text-blue-600 hover:underline" data-trade-id="${trade['ID']}">Ver</a></td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Adicionar eventos aos links "Ver"
    tableBody.querySelectorAll('a[data-trade-id]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tradeId = this.getAttribute('data-trade-id');
            // Implementar visualização detalhada do trade (modal ou página separada)
            alert(`Visualização detalhada do trade ${tradeId} será implementada posteriormente.`);
        });
    });
}

/**
 * Atualiza os cards de desempenho dos setups
 * @param {Array} patternStats - Estatísticas por padrão
 */
function updateSetupCards(patternStats) {
    const cardsContainer = document.getElementById('setup-cards');
    
    // Limpar conteúdo atual
    cardsContainer.innerHTML = '';
    
    // Verificar se há dados para mostrar
    if (!patternStats || patternStats.length === 0) {
        cardsContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-4">
                <p class="text-center text-gray-500">Nenhum dado disponível.</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por expectativa (mais alta primeiro)
    const sortedStats = [...patternStats]
        .filter(pattern => pattern['Total de Trades'] > 0) // Filtrar apenas padrões com trades
        .sort((a, b) => b['Expectativa (R)'] - a['Expectativa (R)']);
    
    // Limitar ao número máximo de cards
    const topPatterns = sortedStats.slice(0, CONFIG.TOP_PATTERNS_LIMIT);
    
    // Adicionar card para cada padrão
    topPatterns.forEach(pattern => {
        // Calcular taxa de acerto para exibição
        const winRate = pattern['Taxa de Acerto'];
        const winRateText = Utils.formatPercentage(winRate);
        
        // Determinar cor para a taxa de acerto
        const winRateColor = winRate >= 0.7 ? 'green' : (winRate >= 0.5 ? 'yellow' : 'red');
        const badgeClass = `text-xs bg-${winRateColor}-100 text-${winRateColor}-800 px-2 py-1 rounded`;
        
        // Gerar representação visual de candlesticks
        let candlesticksHTML = '';
        for (let i = 0; i < 5; i++) {
            const isBull = Math.random() > 0.4; // Apenas para visualização, seria baseado em dados reais
            const height = 30 + Math.random() * 20; // Altura aleatória entre 30 e 50px
            const candleClass = isBull ? 'candlestick-bull' : 'candlestick-bear';
            
            candlesticksHTML += `<div class="candlestick ${candleClass}" style="height: ${height}px;"></div>`;
        }
        
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md p-4 setup-card';
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-bold">${pattern['Padrão']}</h4>
                <span class="${badgeClass}">${winRateText} Acerto</span>
            </div>
            <div class="flex space-x-1 mb-2">
                ${candlesticksHTML}
            </div>
            <div class="text-sm text-gray-600">
                <p>Expectativa: ${Utils.formatR(pattern['Expectativa (R)'])}</p>
                <p>Trades: ${pattern['Total de Trades']}</p>
            </div>
        `;
        
        cardsContainer.appendChild(card);
    });
}

/**
 * Constrói o gráfico de desempenho por padrão
 * @param {Array} patternStats - Estatísticas por padrão
 */
function buildPatternPerformanceChart(patternStats) {
    const ctx = document.getElementById('patternPerformanceChart').getContext('2d');
    
    // Verificar se já existe um gráfico e destruí-lo
    if (window.patternChart) {
        window.patternChart.destroy();
    }
    
    // Verificar se há dados para mostrar
    if (!patternStats || patternStats.length === 0) {
        return;
    }
    
    // Filtrar padrões com mais de N trades e ordenar por expectativa
    const minTrades = 3;
    const topPatterns = patternStats
        .filter(pattern => pattern['Total de Trades'] >= minTrades)
        .sort((a, b) => b['Expectativa (R)'] - a['Expectativa (R)'])
        .slice(0, 6); // Limitar a 6 padrões para melhor visualização
    
    // Extrair dados para o gráfico
    const labels = topPatterns.map(pattern => pattern['Padrão']);
    const winRates = topPatterns.map(pattern => pattern['Taxa de Acerto']);
    const expectancies = topPatterns.map(pattern => pattern['Expectativa (R)']);
    
    // Criar o gráfico
    window.patternChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Taxa de Acerto (%)',
                    data: winRates.map(rate => rate * 100), // Converter para percentual
                    backgroundColor: CONFIG.CHART_COLORS.blue,
                    borderColor: CONFIG.CHART_COLORS.blue,
                    borderWidth: 1,
                    yAxisID: 'percentage'
                },
                {
                    label: 'Expectativa (R)',
                    data: expectancies,
                    backgroundColor: CONFIG.CHART_COLORS.green,
                    borderColor: CONFIG.CHART_COLORS.green,
                    borderWidth: 1,
                    yAxisID: 'expectancy'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
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
                    beginAtZero: true,
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
 * Constrói o gráfico de resultado por ciclo de mercado
 * @param {Array} trades - Lista de trades
 */
function buildMarketCycleChart(trades) {
    const ctx = document.getElementById('marketCycleChart').getContext('2d');
    
    // Verificar se já existe um gráfico e destruí-lo
    if (window.cycleChart) {
        window.cycleChart.destroy();
    }
    
    // Verificar se há dados para mostrar
    if (!trades || trades.length === 0) {
        return;
    }
    
    // Agrupar trades por ciclo de mercado
    const cycleData = {};
    let totalTrades = 0;
    
    trades.forEach(trade => {
        const cycle = trade['Ciclo de Mercado'];
        if (!cycle) return;
        
        if (!cycleData[cycle]) {
            cycleData[cycle] = { count: 0, percentage: 0 };
        }
        
        cycleData[cycle].count++;
        totalTrades++;
    });
    
    // Calcular percentuais
    for (const cycle in cycleData) {
        cycleData[cycle].percentage = (cycleData[cycle].count / totalTrades) * 100;
    }
    
    // Preparar dados para o gráfico
    const labels = Object.keys(cycleData);
    const data = labels.map(cycle => cycleData[cycle].percentage);
    
    // Gerar cores para o gráfico
    const backgroundColors = [
        CONFIG.CHART_COLORS.green,
        CONFIG.CHART_COLORS.red,
        CONFIG.CHART_COLORS.yellow,
        CONFIG.CHART_COLORS.purple,
        CONFIG.CHART_COLORS.blue,
        CONFIG.CHART_COLORS.indigo
    ];
    
    // Criar o gráfico
    window.cycleChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        boxWidth: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed.toFixed(1) + '%';
                            const count = cycleData[label].count;
                            return `${label}: ${value} (${count} trades)`;
                        }
                    }
                }
            }
        }
    });
}
