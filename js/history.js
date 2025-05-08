/**
 * Sistema de Quantificação Price Action Brooks
 * Lógica para a página de Histórico de Trades
 */

// Estado da página
const historyState = {
    allTrades: [],        // Todos os trades carregados
    filteredTrades: [],   // Trades após aplicação de filtros
    currentPage: 1,       // Página atual
    tradesPerPage: 20,    // Número de trades por página
    filters: {
        period: 'all',
        dateFrom: null,
        dateTo: null,
        pair: 'all',
        timeframe: 'all',
        pattern: 'all',
        type: 'all',
        result: 'all'
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar filtros
    initializeFilters();
    
    // Carregar dados
    loadTradesData();
    
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
    
    // Botão de novo trade
    const newTradeBtn = document.getElementById('new-trade-btn');
    if (newTradeBtn) {
        newTradeBtn.addEventListener('click', function() {
            window.location.href = 'register.html';
        });
    }
    
    // Botão de exportar
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTradesData);
    }
    
    // Paginação
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (historyState.currentPage > 1) {
                historyState.currentPage--;
                renderTradesTable();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(historyState.filteredTrades.length / historyState.tradesPerPage);
            if (historyState.currentPage < totalPages) {
                historyState.currentPage++;
                renderTradesTable();
            }
        });
    }
    
    // Fechar modal de detalhes
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            document.getElementById('trade-detail-modal').classList.add('hidden');
        });
    }
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('trade-detail-modal');
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

/**
 * Carrega os dados de trades do backend
 */
async function loadTradesData() {
    try {
        // Mostrar indicador de carregamento
        document.getElementById('loading-indicator').classList.remove('hidden');
        document.getElementById('trades-table-container').classList.add('hidden');
        document.getElementById('no-trades-message').classList.add('hidden');
        
        // Carregar dados em paralelo
        const [trades, patterns, pairs, timeframes] = await Promise.all([
            API.getTrades(),
            API.getPatterns(),
            API.getPairs(),
            API.getTimeframes()
        ]);
        
        // Armazenar dados para uso futuro
        historyState.allTrades = trades;
        historyState.filteredTrades = trades; // Inicialmente, todos os trades
        
        // Preencher filtros com opções
        populateFilterOptions('pattern-filter', patterns, 'Nome');
        populateFilterOptions('pair-filter', pairs, 'Par');
        populateFilterOptions('timeframe-filter', timeframes, 'Timeframe');
        
        // Atualizar estatísticas e tabela
        updateTradeStats();
        renderTradesTable();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        Utils.showToast('Erro ao carregar dados. Tente novamente.', 'error');
        
        // Esconder indicador de carregamento
        document.getElementById('loading-indicator').classList.add('hidden');
        
        // Mostrar mensagem de nenhum trade
        document.getElementById('no-trades-message').classList.remove('hidden');
    }
}

/**
 * Preenche as opções dos filtros
 * @param {string} filterId - ID do elemento select
 * @param {Array} options - Lista de opções
 * @param {string} field - Nome do campo para exibir/valor
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
        if (!option[field]) return;
        
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
    const patternFilter = document.getElementById('pattern-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    const resultFilter = document.getElementById('result-filter').value;
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
    
    // Atualizar os filtros no estado
    historyState.filters = {
        period: periodFilter,
        dateFrom: dateFrom,
        dateTo: dateTo,
        pair: pairFilter,
        timeframe: timeframeFilter,
        pattern: patternFilter,
        type: typeFilter,
        result: resultFilter
    };
    
    // Aplicar filtros aos trades
    filterTrades();
    
    // Resetar para a primeira página
    historyState.currentPage = 1;
    
    // Atualizar estatísticas e tabela
    updateTradeStats();
    renderTradesTable();
    
    // Exibir mensagem de sucesso
    Utils.showToast('Filtros aplicados com sucesso.', 'success');
}

/**
 * Filtra os trades com base nos filtros atuais
 */
function filterTrades() {
    const filters = historyState.filters;
    
    // Filtrar trades
    historyState.filteredTrades = historyState.allTrades.filter(trade => {
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
        
        // Filtro de padrão
        if (filters.pattern !== 'all' && trade['Padrão Brooks'] !== filters.pattern) {
            return false;
        }
        
        // Filtro de tipo
        if (filters.type !== 'all' && trade['Tipo de Atividade'] !== filters.type) {
            return false;
        }
        
        // Filtro de resultado
        if (filters.result !== 'all') {
            const result = parseFloat(trade['Resultado (R)']);
            
            if (filters.result === 'win' && result <= 0) {
                return false;
            } else if (filters.result === 'loss' && result >= 0) {
                return false;
            } else if (filters.result === 'be' && result !== 0) {
                return false;
            }
        }
        
        return true;
    });
}

/**
 * Atualiza as estatísticas com base nos trades filtrados
 */
function updateTradeStats() {
    const trades = historyState.filteredTrades;
    
    // Contar trades
    const totalTrades = trades.length;
    
    // Contar ganhos e perdas
    const winsCount = trades.filter(trade => parseFloat(trade['Resultado (R)']) > 0).length;
    const lossesCount = trades.filter(trade => parseFloat(trade['Resultado (R)']) < 0).length;
    
    // Calcular expectativa
    let expectancy = 0;
    if (totalTrades > 0) {
        const totalR = trades.reduce((sum, trade) => sum + parseFloat(trade['Resultado (R)']), 0);
        expectancy = totalR / totalTrades;
    }
    
    // Atualizar elementos na interface
    document.getElementById('total-trades').textContent = totalTrades;
    document.getElementById('wins-count').textContent = winsCount;
    document.getElementById('losses-count').textContent = lossesCount;
    document.getElementById('expectancy').textContent = Utils.formatR(expectancy);
}

/**
 * Renderiza a tabela de trades com paginação
 */
function renderTradesTable() {
    const trades = historyState.filteredTrades;
    const currentPage = historyState.currentPage;
    const tradesPerPage = historyState.tradesPerPage;
    
    // Verificar se há trades para mostrar
    if (trades.length === 0) {
        // Esconder indicador de carregamento e tabela
        document.getElementById('loading-indicator').classList.add('hidden');
        document.getElementById('trades-table-container').classList.add('hidden');
        
        // Mostrar mensagem de nenhum trade
        document.getElementById('no-trades-message').classList.remove('hidden');
        return;
    }
    
    // Calcular índices para paginação
    const startIndex = (currentPage - 1) * tradesPerPage;
    const endIndex = Math.min(startIndex + tradesPerPage, trades.length);
    const currentTrades = trades.slice(startIndex, endIndex);
    
    // Referência à tabela
    const tableBody = document.getElementById('trades-table');
    tableBody.innerHTML = '';
    
    // Adicionar cada trade à tabela
    currentTrades.forEach(trade => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        // Determinar classe para resultado
        const resultValue = parseFloat(trade['Resultado (R)']);
        const resultClass = resultValue > 0 ? 'text-green-500' : (resultValue < 0 ? 'text-red-500' : 'text-gray-500');
        const resultText = resultValue > 0 ? 'Lucro' : (resultValue < 0 ? 'Perda' : 'Empate');
        
        // Formatar data
        const date = Utils.formatDate(trade['Data e Hora'], 'short');
        
        // Construir linha da tabela
        row.innerHTML = `
            <td class="py-2 px-4 text-sm">${date}</td>
            <td class="py-2 px-4 text-sm">${trade['Par de Moedas'] || '-'}</td>
            <td class="py-2 px-4 text-sm">${trade['Padrão Brooks'] || '-'}</td>
            <td class="py-2 px-4 text-sm">${trade['Contexto de Mercado'] || '-'}</td>
            <td class="py-2 px-4 text-sm ${trade['Direção'] === 'Long' ? 'text-green-500' : 'text-red-500'}">${trade['Direção'] || '-'}</td>
            <td class="py-2 px-4 text-sm">${trade['Timeframe'] || '-'}</td>
            <td class="py-2 px-4 text-sm">${trade['Tipo de Atividade'] || '-'}</td>
            <td class="py-2 px-4 text-sm ${resultClass}">${resultText} (${Utils.formatR(resultValue)})</td>
            <td class="py-2 px-4 text-sm flex space-x-2">
                <button class="view-trade-btn text-blue-600 hover:text-blue-800" data-id="${trade['ID']}">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Adicionar eventos aos botões de visualização
    document.querySelectorAll('.view-trade-btn').forEach(button => {
        button.addEventListener('click', function() {
            const tradeId = parseInt(this.getAttribute('data-id'));
            showTradeDetails(tradeId);
        });
    });
    
    // Atualizar informações de paginação
    const totalPages = Math.ceil(trades.length / tradesPerPage);
    document.getElementById('pagination-info').textContent = `Exibindo ${startIndex + 1} a ${endIndex} de ${trades.length} trades`;
    
    // Habilitar/desabilitar botões de paginação
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
    
    // Renderizar números de página
    renderPageNumbers(currentPage, totalPages);
    
    // Esconder indicador de carregamento e mostrar tabela
    document.getElementById('loading-indicator').classList.add('hidden');
    document.getElementById('trades-table-container').classList.remove('hidden');
    document.getElementById('no-trades-message').classList.add('hidden');
}

/**
 * Renderiza os números de página para a paginação
 * @param {number} currentPage - Página atual
 * @param {number} totalPages - Total de páginas
 */
function renderPageNumbers(currentPage, totalPages) {
    const pageNumbers = document.getElementById('page-numbers');
    pageNumbers.innerHTML = '';
    
    // Determinar quais números de página exibir
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Ajustar se estamos perto do final
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Adicionar primeira página e ellipsis se necessário
    if (startPage > 1) {
        addPageButton(pageNumbers, 1, currentPage);
        
        if (startPage > 2) {
            addEllipsis(pageNumbers);
        }
    }
    
    // Adicionar números de página do intervalo
    for (let i = startPage; i <= endPage; i++) {
        addPageButton(pageNumbers, i, currentPage);
    }
    
    // Adicionar última página e ellipsis se necessário
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            addEllipsis(pageNumbers);
        }
        
        addPageButton(pageNumbers, totalPages, currentPage);
    }
}

/**
 * Adiciona um botão de página à paginação
 * @param {HTMLElement} container - Contêiner para adicionar o botão
 * @param {number} pageNumber - Número da página
 * @param {number} currentPage - Página atual
 */
function addPageButton(container, pageNumber, currentPage) {
    const button = document.createElement('button');
    button.textContent = pageNumber;
    button.className = 'px-3 py-1 rounded-md';
    
    if (pageNumber === currentPage) {
        button.classList.add('bg-blue-600', 'text-white');
    } else {
        button.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
        
        // Adicionar evento para ir para esta página
        button.addEventListener('click', function() {
            historyState.currentPage = pageNumber;
            renderTradesTable();
        });
    }
    
    container.appendChild(button);
}

/**
 * Adiciona uma ellipsis (reticências) à paginação
 * @param {HTMLElement} container - Contêiner para adicionar a ellipsis
 */
function addEllipsis(container) {
    const ellipsis = document.createElement('span');
    ellipsis.textContent = '...';
    ellipsis.className = 'px-2 py-1';
    container.appendChild(ellipsis);
}

/**
 * Exibe os detalhes de um trade específico
 * @param {number} tradeId - ID do trade a ser exibido
 */
function showTradeDetails(tradeId) {
    // Encontrar o trade pelo ID
    const trade = historyState.allTrades.find(t => t['ID'] === tradeId);
    
    if (!trade) {
        Utils.showToast('Trade não encontrado.', 'error');
        return;
    }
    
    // Referência ao contêiner de conteúdo do modal
    const contentContainer = document.getElementById('trade-detail-content');
    
    // Determinar cor com base no resultado
    const resultValue = parseFloat(trade['Resultado (R)']);
    const resultClass = resultValue > 0 ? 'text-green-500' : (resultValue < 0 ? 'text-red-500' : 'text-gray-500');
    
    // Construir conteúdo do modal
    let modalContent = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <h4 class="font-bold text-lg mb-2">Informações Básicas</h4>
                <div class="space-y-2">
                    <p><span class="font-medium">Data e Hora:</span> ${Utils.formatDate(trade['Data e Hora'], 'long')}</p>
                    <p><span class="font-medium">Par de Moedas:</span> ${trade['Par de Moedas'] || '-'}</p>
                    <p><span class="font-medium">Timeframe:</span> ${trade['Timeframe'] || '-'}</p>
                    <p><span class="font-medium">Tipo de Atividade:</span> ${trade['Tipo de Atividade'] || '-'}</p>
                    <p><span class="font-medium">Direção:</span> <span class="${trade['Direção'] === 'Long' ? 'text-green-500' : 'text-red-500'}">${trade['Direção'] || '-'}</span></p>
                </div>
            </div>
            
            <div>
                <h4 class="font-bold text-lg mb-2">Análise Técnica</h4>
                <div class="space-y-2">
                    <p><span class="font-medium">Padrão Brooks:</span> ${trade['Padrão Brooks'] || '-'}</p>
                    <p><span class="font-medium">Contexto de Mercado:</span> ${trade['Contexto de Mercado'] || '-'}</p>
                    <p><span class="font-medium">Força do Contexto:</span> ${trade['Força do Contexto'] || '-'}</p>
                    <p><span class="font-medium">Ciclo de Mercado:</span> ${trade['Ciclo de Mercado'] || '-'}</p>
                    <p><span class="font-medium">Qualidade do Setup:</span> ${trade['Qualidade do Setup'] || '-'}</p>
                </div>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <h4 class="font-bold text-lg mb-2">Detalhes da Operação</h4>
                <div class="space-y-2">
                    <p><span class="font-medium">Preço de Entrada:</span> ${trade['Entrada'] || '-'}</p>
                    <p><span class="font-medium">Stop Loss:</span> ${trade['Stop'] || '-'}</p>
                    <p><span class="font-medium">Take Profit:</span> ${trade['Alvo'] || '-'}</p>
                    <p><span class="font-medium">Resultado:</span> <span class="${resultClass}">${Utils.formatR(resultValue)}</span></p>
                </div>
            </div>
            
            <div>
                <h4 class="font-bold text-lg mb-2">Notas e Lições</h4>
                <div class="border p-3 rounded-md bg-gray-50 h-32 overflow-y-auto">
                    <p class="text-sm">${trade['Notas e Lições'] || 'Nenhuma nota registrada'}</p>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar seção de captura de tela, se disponível
    if (trade['Link Screenshot']) {
        modalContent += `
            <div class="mt-4">
                <h4 class="font-bold text-lg mb-2">Captura de Tela</h4>
                <div class="border p-1 rounded-md bg-gray-50 text-center">
                    <a href="${trade['Link Screenshot']}" target="_blank" class="inline-block">
                        <img src="${trade['Link Screenshot']}" alt="Captura de Tela" class="max-h-96 mx-auto">
                    </a>
                </div>
            </div>
        `;
    }
    
    // Adicionar botões de ação
    modalContent += `
        <div class="mt-6 flex justify-end space-x-3">
            <button class="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400" id="close-detail-modal">
                Fechar
            </button>
            <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" id="edit-trade-btn" data-id="${trade['ID']}">
                <i class="fas fa-edit mr-2"></i>Editar
            </button>
        </div>
    `;
    
    // Atualizar conteúdo do modal
    contentContainer.innerHTML = modalContent;
    
    // Adicionar evento ao botão de fechar
    document.getElementById('close-detail-modal').addEventListener('click', function() {
        document.getElementById('trade-detail-modal').classList.add('hidden');
    });
    
    // Adicionar evento ao botão de editar (a implementar futuramente)
    document.getElementById('edit-trade-btn').addEventListener('click', function() {
        const tradeId = this.getAttribute('data-id');
        alert(`A função de edição será implementada futuramente. ID do trade: ${tradeId}`);
    });
    
    // Mostrar modal
    document.getElementById('trade-detail-modal').classList.remove('hidden');
}

/**
 * Exporta os dados de trades em formato CSV
 */
function exportTradesData() {
    // Verificar se há dados para exportar
    if (historyState.filteredTrades.length === 0) {
        Utils.showToast('Não há dados para exportar.', 'error');
        return;
    }
    
    try {
        // Preparar título do arquivo com data atual
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `trades_price_action_brooks_${dateStr}.csv`;
        
        // Obter trades filtrados
        const trades = historyState.filteredTrades;
        
        // Criar cabeçalhos do CSV
        const headers = [
            'ID', 'Data e Hora', 'Par de Moedas', 'Timeframe', 'Tipo de Atividade',
            'Padrão Brooks', 'Contexto de Mercado', 'Força do Contexto', 'Ciclo de Mercado',
            'Qualidade do Setup', 'Direção', 'Entrada', 'Stop', 'Alvo',
            'Resultado (R)', 'Notas e Lições'
        ];
        
        // Iniciar conteúdo CSV com cabeçalhos
        let csv = headers.join(',') + '\n';
        
        // Adicionar cada trade
        trades.forEach(trade => {
            const row = headers.map(header => {
                // Tratar valores especiais
                if (header === 'Data e Hora') {
                    return Utils.formatDate(trade[header], 'timestamp');
                }
                
                // Colocar entre aspas para evitar problemas com vírgulas
                return `"${(trade[header] !== undefined && trade[header] !== null) ? String(trade[header]).replace(/"/g, '""') : ''}"`;
            });
            
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
        
        Utils.showToast('Dados exportados com sucesso.', 'success');
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        Utils.showToast('Erro ao exportar dados. Tente novamente.', 'error');
    }
}
