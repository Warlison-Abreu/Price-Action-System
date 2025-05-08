/**
 * Sistema de Quantificação Price Action Brooks
 * Lógica para o Dashboard Personalizado
 */

// Configuração padrão do dashboard
const DEFAULT_DASHBOARD_CONFIG = {
    statsCards: {
        winRate: true,
        expectancy: true,
        profitFactor: true,
        tradesCount: true,
        avgWin: false,
        avgLoss: false,
        bestPattern: false,
        worstPattern: false
    },
    charts: {
        performance: true,
        patterns: true,
        timeframes: true,
        context: false,
        daily: false,
        rmultiple: false
    },
    sections: {
        recentTrades: true,
        topPatterns: true,
        journalEntries: false,
        marketContext: false
    },
    layout: {
        defaultPeriod: 'month',
        colorTheme: 'default'
    }
};

// Estado do dashboard
const dashboardState = {
    config: null,
    isConfigModalOpen: false
};

/**
 * Inicializa o dashboard personalizado
 */
function initDashboardConfig() {
    // Carregar configuração salva ou usar padrão
    loadDashboardConfig();
    
    // Configurar eventos
    setupDashboardConfigEvents();
    
    // Aplicar configuração inicial
    applyDashboardConfig();
}

/**
 * Carrega a configuração do dashboard do localStorage
 */
function loadDashboardConfig() {
    try {
        // Tentar obter configuração salva
        const savedConfig = localStorage.getItem('dashboardConfig');
        
        if (savedConfig) {
            dashboardState.config = JSON.parse(savedConfig);
        } else {
            // Usar configuração padrão se não houver salva
            dashboardState.config = { ...DEFAULT_DASHBOARD_CONFIG };
        }
    } catch (error) {
        console.error('Erro ao carregar configuração do dashboard:', error);
        // Usar configuração padrão em caso de erro
        dashboardState.config = { ...DEFAULT_DASHBOARD_CONFIG };
    }
}

/**
 * Configura os eventos do dashboard personalizado
 */
function setupDashboardConfigEvents() {
    // Botão de configurar dashboard
    const configBtn = document.getElementById('configure-dashboard-btn');
    if (configBtn) {
        configBtn.addEventListener('click', openDashboardConfigModal);
    }
    
    // Botão de fechar modal
    const closeModalBtn = document.getElementById('close-dashboard-config');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeDashboardConfigModal);
    }
    
    // Botão de resetar configuração
    const resetBtn = document.getElementById('reset-dashboard-config');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetDashboardConfig);
    }
    
    // Formulário de configuração
    const configForm = document.getElementById('dashboard-config-form');
    if (configForm) {
        configForm.addEventListener('submit', saveDashboardConfig);
    }
    
    // Alteração de tema de cores
    const colorThemeSelect = document.getElementById('color-theme');
    if (colorThemeSelect) {
        colorThemeSelect.addEventListener('change', function() {
            // Preview do tema de cores
            previewColorTheme(this.value);
        });
    }
}

/**
 * Abre o modal de configuração do dashboard
 */
function openDashboardConfigModal() {
    // Preencher formulário com configuração atual
    populateDashboardConfigForm();
    
    // Exibir modal
    const modal = document.getElementById('dashboard-config-modal');
    if (modal) {
        modal.classList.remove('hidden');
        dashboardState.isConfigModalOpen = true;
    }
}

/**
 * Fecha o modal de configuração do dashboard
 */
function closeDashboardConfigModal() {
    const modal = document.getElementById('dashboard-config-modal');
    if (modal) {
        modal.classList.add('hidden');
        dashboardState.isConfigModalOpen = false;
        
        // Se houve preview de tema, reverter para o tema atual
        applyColorTheme(dashboardState.config.layout.colorTheme);
    }
}

/**
 * Preenche o formulário de configuração com os valores atuais
 */
function populateDashboardConfigForm() {
    const config = dashboardState.config;
    
    // Configurar checkboxes de cartões de estatísticas
    document.getElementById('show-win-rate').checked = config.statsCards.winRate;
    document.getElementById('show-expectancy').checked = config.statsCards.expectancy;
    document.getElementById('show-profit-factor').checked = config.statsCards.profitFactor;
    document.getElementById('show-trades-count').checked = config.statsCards.tradesCount;
    document.getElementById('show-avg-win').checked = config.statsCards.avgWin;
    document.getElementById('show-avg-loss').checked = config.statsCards.avgLoss;
    document.getElementById('show-best-pattern').checked = config.statsCards.bestPattern;
    document.getElementById('show-worst-pattern').checked = config.statsCards.worstPattern;
    
    // Configurar checkboxes de gráficos
    document.getElementById('show-performance-chart').checked = config.charts.performance;
    document.getElementById('show-patterns-chart').checked = config.charts.patterns;
    document.getElementById('show-timeframes-chart').checked = config.charts.timeframes;
    document.getElementById('show-context-chart').checked = config.charts.context;
    document.getElementById('show-daily-chart').checked = config.charts.daily;
    document.getElementById('show-rmultiple-chart').checked = config.charts.rmultiple;
    
    // Configurar checkboxes de seções
    document.getElementById('show-recent-trades').checked = config.sections.recentTrades;
    document.getElementById('show-top-patterns').checked = config.sections.topPatterns;
    document.getElementById('show-journal-entries').checked = config.sections.journalEntries;
    document.getElementById('show-market-context').checked = config.sections.marketContext;
    
    // Configurar opções de layout
    document.getElementById('default-period').value = config.layout.defaultPeriod;
    document.getElementById('color-theme').value = config.layout.colorTheme;
}

/**
 * Salva a configuração do dashboard no localStorage
 * @param {Event} e - Evento de submit
 */
function saveDashboardConfig(e) {
    e.preventDefault();
    
    try {
        // Obter valores do formulário
        const config = {
            statsCards: {
                winRate: document.getElementById('show-win-rate').checked,
                expectancy: document.getElementById('show-expectancy').checked,
                profitFactor: document.getElementById('show-profit-factor').checked,
                tradesCount: document.getElementById('show-trades-count').checked,
                avgWin: document.getElementById('show-avg-win').checked,
                avgLoss: document.getElementById('show-avg-loss').checked,
                bestPattern: document.getElementById('show-best-pattern').checked,
                worstPattern: document.getElementById('show-worst-pattern').checked
            },
            charts: {
                performance: document.getElementById('show-performance-chart').checked,
                patterns: document.getElementById('show-patterns-chart').checked,
                timeframes: document.getElementById('show-timeframes-chart').checked,
                context: document.getElementById('show-context-chart').checked,
                daily: document.getElementById('show-daily-chart').checked,
                rmultiple: document.getElementById('show-rmultiple-chart').checked
            },
            sections: {
                recentTrades: document.getElementById('show-recent-trades').checked,
                topPatterns: document.getElementById('show-top-patterns').checked,
                journalEntries: document.getElementById('show-journal-entries').checked,
                marketContext: document.getElementById('show-market-context').checked
            },
            layout: {
                defaultPeriod: document.getElementById('default-period').value,
                colorTheme: document.getElementById('color-theme').value
            }
        };
        
        // Atualizar estado
        dashboardState.config = config;
        
        // Salvar no localStorage
        localStorage.setItem('dashboardConfig', JSON.stringify(config));
        
        // Aplicar configuração
        applyDashboardConfig();
        
        // Fechar modal
        closeDashboardConfigModal();
        
        // Mostrar mensagem de sucesso
        Utils.showToast('Configurações do dashboard salvas com sucesso.', 'success');
    } catch (error) {
        console.error('Erro ao salvar configuração do dashboard:', error);
        Utils.showToast('Erro ao salvar configurações. Tente novamente.', 'error');
    }
}

/**
 * Reseta a configuração do dashboard para os valores padrão
 */
function resetDashboardConfig() {
    // Restaurar configuração padrão
    dashboardState.config = { ...DEFAULT_DASHBOARD_CONFIG };
    
    // Atualizar formulário
    populateDashboardConfigForm();
    
    // Preview do tema padrão
    previewColorTheme(DEFAULT_DASHBOARD_CONFIG.layout.colorTheme);
    
    // Mostrar mensagem
    Utils.showToast('Configurações restauradas para o padrão.', 'info');
}

/**
 * Aplica a configuração atual ao dashboard
 */
function applyDashboardConfig() {
    try {
        // Aplicar visibilidade dos cartões de estatísticas
        applyStatsCardsVisibility();
        
        // Aplicar visibilidade dos gráficos
        applyChartsVisibility();
        
        // Aplicar visibilidade das seções
        applySectionsVisibility();
        
        // Aplicar tema de cores
        applyColorTheme(dashboardState.config.layout.colorTheme);
        
        // Aplicar período padrão (apenas na primeira carga)
        if (!dashboardState.hasAppliedDefaultPeriod) {
            applyDefaultPeriod();
            dashboardState.hasAppliedDefaultPeriod = true;
        }
    } catch (error) {
        console.error('Erro ao aplicar configuração do dashboard:', error);
    }
}

/**
 * Aplica a visibilidade dos cartões de estatísticas
 */
function applyStatsCardsVisibility() {
    const config = dashboardState.config.statsCards;
    
    // Aplicar visibilidade de cada cartão
    toggleElementVisibility('stats-card-win-rate', config.winRate);
    toggleElementVisibility('stats-card-expectancy', config.expectancy);
    toggleElementVisibility('stats-card-profit-factor', config.profitFactor);
    toggleElementVisibility('stats-card-trades-count', config.tradesCount);
    toggleElementVisibility('stats-card-avg-win', config.avgWin);
    toggleElementVisibility('stats-card-avg-loss', config.avgLoss);
    toggleElementVisibility('stats-card-best-pattern', config.bestPattern);
    toggleElementVisibility('stats-card-worst-pattern', config.worstPattern);
    
    // Reorganizar grid se necessário
    reorganizeStatsCards();
}

/**
 * Aplica a visibilidade dos gráficos
 */
function applyChartsVisibility() {
    const config = dashboardState.config.charts;
    
    // Aplicar visibilidade de cada gráfico
    toggleElementVisibility('performance-chart-container', config.performance);
    toggleElementVisibility('patterns-chart-container', config.patterns);
    toggleElementVisibility('timeframes-chart-container', config.timeframes);
    toggleElementVisibility('context-chart-container', config.context);
    toggleElementVisibility('daily-chart-container', config.daily);
    toggleElementVisibility('rmultiple-chart-container', config.rmultiple);
    
    // Reorganizar gráficos se necessário
    reorganizeCharts();
}

/**
 * Aplica a visibilidade das seções
 */
function applySectionsVisibility() {
    const config = dashboardState.config.sections;
    
    // Aplicar visibilidade de cada seção
    toggleElementVisibility('recent-trades-section', config.recentTrades);
    toggleElementVisibility('top-patterns-section', config.topPatterns);
    toggleElementVisibility('journal-entries-section', config.journalEntries);
    toggleElementVisibility('market-context-section', config.marketContext);
}

/**
 * Aplica o período padrão para o dashboard
 */
function applyDefaultPeriod() {
    const periodSelect = document.getElementById('period-filter');
    if (periodSelect) {
        // Definir valor do select para o período padrão
        periodSelect.value = dashboardState.config.layout.defaultPeriod;
        
        // Simular evento de alteração para aplicar o filtro
        const event = new Event('change');
        periodSelect.dispatchEvent(event);
    }
}

/**
 * Aplica o tema de cores
 * @param {string} theme - Nome do tema de cores
 */
function applyColorTheme(theme) {
    // Remover classes de tema atuais
    document.body.classList.remove('theme-default', 'theme-green', 'theme-purple', 'theme-dark');
    
    // Adicionar classe do novo tema
    document.body.classList.add(`theme-${theme}`);
    
    // Atualizar variáveis CSS de acordo com o tema
    switch (theme) {
        case 'green':
            document.documentElement.style.setProperty('--primary-color', '#10B981');
            document.documentElement.style.setProperty('--secondary-color', '#059669');
            document.documentElement.style.setProperty('--accent-color', '#047857');
            break;
        case 'purple':
            document.documentElement.style.setProperty('--primary-color', '#8B5CF6');
            document.documentElement.style.setProperty('--secondary-color', '#7C3AED');
            document.documentElement.style.setProperty('--accent-color', '#6D28D9');
            break;
        case 'dark':
            document.documentElement.style.setProperty('--primary-color', '#374151');
            document.documentElement.style.setProperty('--secondary-color', '#1F2937');
            document.documentElement.style.setProperty('--accent-color', '#111827');
            document.documentElement.style.setProperty('--text-color', '#F9FAFB');
            document.documentElement.style.setProperty('--bg-color', '#111827');
            break;
        default: // Tema padrão
            document.documentElement.style.setProperty('--primary-color', '#3B82F6');
            document.documentElement.style.setProperty('--secondary-color', '#2563EB');
            document.documentElement.style.setProperty('--accent-color', '#1D4ED8');
            document.documentElement.style.setProperty('--text-color', '#1F2937');
            document.documentElement.style.setProperty('--bg-color', '#F3F4F6');
    }
    
    // Atualizar cores dos gráficos
    updateChartColors(theme);
}

/**
 * Preview do tema de cores sem aplicar permanentemente
 * @param {string} theme - Nome do tema de cores
 */
function previewColorTheme(theme) {
    // Aplicar tema temporariamente
    applyColorTheme(theme);
}

/**
 * Atualiza as cores dos gráficos de acordo com o tema
 * @param {string} theme - Nome do tema de cores
 */
function updateChartColors(theme) {
    // Definir novas cores para os gráficos com base no tema
    let colors;
    
    switch (theme) {
        case 'green':
            colors = {
                primary: '#10B981',
                secondary: '#059669',
                success: '#047857',
                danger: '#EF4444',
                warning: '#F59E0B',
                info: '#3B82F6'
            };
            break;
        case 'purple':
            colors = {
                primary: '#8B5CF6',
                secondary: '#7C3AED',
                success: '#10B981',
                danger: '#EF4444',
                warning: '#F59E0B',
                info: '#3B82F6'
            };
            break;
        case 'dark':
            colors = {
                primary: '#60A5FA',
                secondary: '#93C5FD',
                success: '#34D399',
                danger: '#F87171',
                warning: '#FBBF24',
                info: '#A5B4FC'
            };
            break;
        default: // Tema padrão
            colors = {
                primary: '#3B82F6',
                secondary: '#60A5FA',
                success: '#10B981',
                danger: '#EF4444',
                warning: '#F59E0B',
                info: '#6366F1'
            };
    }
    
    // Atualizar cores dos gráficos existentes
    for (const chartId in window) {
        const chartObj = window[chartId];
        
        // Verificar se é um objeto Chart.js
        if (chartObj && chartObj.type && chartObj.data && chartObj.options) {
            let updated = false;
            
            // Atualizar cores dos datasets
            if (chartObj.data.datasets && chartObj.data.datasets.length > 0) {
                chartObj.data.datasets.forEach((dataset, index) => {
                    // Aplicar cores diferentes para cada dataset
                    if (index === 0) {
                        dataset.backgroundColor = hexToRgba(colors.primary, 0.7);
                        dataset.borderColor = colors.primary;
                    } else if (index === 1) {
                        dataset.backgroundColor = hexToRgba(colors.secondary, 0.7);
                        dataset.borderColor = colors.secondary;
                    } else if (index === 2) {
                        dataset.backgroundColor = hexToRgba(colors.success, 0.7);
                        dataset.borderColor = colors.success;
                    } else if (index === 3) {
                        dataset.backgroundColor = hexToRgba(colors.info, 0.7);
                        dataset.borderColor = colors.info;
                    } else {
                        // Cores alternadas para datasets adicionais
                        const colorKeys = Object.keys(colors);
                        const colorKey = colorKeys[index % colorKeys.length];
                        dataset.backgroundColor = hexToRgba(colors[colorKey], 0.7);
                        dataset.borderColor = colors[colorKey];
                    }
                });
                
                updated = true;
            }
            
            // Atualizar gráfico se houve mudanças
            if (updated) {
                chartObj.update();
            }
        }
    }
    
    // Atualizar variáveis de configuração global do Chart.js
    Chart.defaults.color = theme === 'dark' ? '#F9FAFB' : '#1F2937';
    Chart.defaults.borderColor = theme === 'dark' ? '#4B5563' : '#E5E7EB';
}

/**
 * Converte cor hex para rgba
 * @param {string} hex - Cor em formato hex
 * @param {number} alpha - Valor alpha (0-1)
 * @returns {string} - Cor em formato rgba
 */
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Alterna a visibilidade de um elemento
 * @param {string} elementId - ID do elemento
 * @param {boolean} visible - Se o elemento deve estar visível
 */
function toggleElementVisibility(elementId, visible) {
    const element = document.getElementById(elementId);
    
    if (element) {
        if (visible) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    }
}

/**
 * Reorganiza os cartões de estatísticas com base na visibilidade
 */
function reorganizeStatsCards() {
    const statsGrid = document.getElementById('stats-grid');
    
    if (statsGrid) {
        // Contar cartões visíveis
        const visibleCards = statsGrid.querySelectorAll('.stats-card:not(.hidden)').length;
        
        // Remover classes de grid atuais
        statsGrid.classList.remove('grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4');
        
        // Adicionar classe apropriada com base no número de cartões visíveis
        if (visibleCards <= 2) {
            statsGrid.classList.add('grid-cols-2');
        } else if (visibleCards <= 4) {
            statsGrid.classList.add('grid-cols-2');
        } else {
            statsGrid.classList.add('grid-cols-4');
        }
    }
}

/**
 * Reorganiza os gráficos com base na visibilidade
 */
function reorganizeCharts() {
    const chartsGrid = document.getElementById('charts-grid');
    
    if (chartsGrid) {
        // Contar gráficos visíveis
        const visibleCharts = chartsGrid.querySelectorAll('.chart-container:not(.hidden)').length;
        
        // Remover classes de grid atuais
        chartsGrid.classList.remove('grid-cols-1', 'grid-cols-2');
        
        // Adicionar classe apropriada com base no número de gráficos visíveis
        if (visibleCharts === 1) {
            chartsGrid.classList.add('grid-cols-1');
        } else {
            chartsGrid.classList.add('grid-cols-2');
        }
    }
}

// Inicialização global
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar configuração do dashboard se estiver na página do dashboard
    if (document.querySelector('.dashboard-container')) {
        initDashboardConfig();
    }
});
