/**
 * Sistema de Quantificação Price Action Brooks
 * Lógica para otimização mobile
 * Adicionar este código como mobile.js
 */

document.addEventListener('DOMContentLoaded', function() {
    // Detectar se está em dispositivo móvel
    const isMobile = window.innerWidth < 768;
    
    // Inicializar componentes mobile
    if (isMobile) {
        initMobileUI();
    }
    
    // Adicionar evento de redimensionamento para atualizar UI
    window.addEventListener('resize', function() {
        const newIsMobile = window.innerWidth < 768;
        
        // Se houve mudança no estado mobile/desktop
        if (newIsMobile !== isMobile) {
            // Atualizar UI com base no novo estado
            if (newIsMobile) {
                initMobileUI();
            } else {
                resetMobileUI();
            }
        }
    });
});

/**
 * Inicializa a UI para dispositivos móveis
 */
function initMobileUI() {
    // Adicionar botão de menu
    addMobileMenuButton();
    
    // Adicionar classes móveis aos elementos
    addMobileClasses();
    
    // Configurar sidebar móvel
    setupMobileSidebar();
    
    // Ajustar gráficos para visualização móvel
    adjustChartsForMobile();
    
    // Otimizar formulários
    optimizeFormsForMobile();
    
    // Adicionar navegação por abas (se necessário)
    setupMobileTabs();
}

/**
 * Remove customizações de UI móvel
 */
function resetMobileUI() {
    // Remover botão de menu
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (menuBtn) {
        menuBtn.remove();
    }
    
    // Remover overlay
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    // Remover classes móveis
    document.querySelectorAll('.mobile-adjusted').forEach(el => {
        el.classList.remove('mobile-adjusted');
        // Remover outras classes específicas para mobile
    });
    
    // Resetar sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.remove('active');
        sidebar.style.transform = '';
    }
    
    // Resetar conteúdo
    const content = document.querySelector('.content');
    if (content) {
        content.classList.remove('content-pushed');
    }
}

/**
 * Adiciona o botão de menu móvel
 */
function addMobileMenuButton() {
    // Verificar se já existe um botão
    if (document.querySelector('.mobile-menu-btn')) {
        return;
    }
    
    // Criar botão
    const menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.innerHTML = '<i class="fas fa-bars fa-lg"></i>';
    menuBtn.setAttribute('aria-label', 'Abrir menu');
    
    // Adicionar evento
    menuBtn.addEventListener('click', toggleMobileSidebar);
    
    // Adicionar ao corpo
    document.body.appendChild(menuBtn);
}

/**
 * Adiciona classes responsivas aos elementos
 */
function addMobileClasses() {
    // Navbar
    document.querySelector('nav').classList.add('navbar-mobile-simplified', 'mobile-adjusted');
    
    // Toast
    document.getElementById('toast').classList.add('mobile', 'mobile-adjusted');
    
    // Grids
    document.querySelectorAll('.grid-cols-2, .grid-cols-3, .grid-cols-4').forEach(grid => {
        grid.classList.add('grid-mobile-1col', 'mobile-adjusted');
    });
    
    // Tabelas
    document.querySelectorAll('table').forEach(table => {
        const wrapper = table.parentElement;
        wrapper.classList.add('table-mobile-friendly', 'touch-table', 'mobile-adjusted');
    });
    
    // Gráficos
    document.querySelectorAll('.chart-container').forEach(chart => {
        chart.classList.add('chart-container-mobile', 'mobile-adjusted');
    });
    
    // Botões
    document.querySelectorAll('button').forEach(btn => {
        if (!btn.classList.contains('mobile-menu-btn')) {
            btn.classList.add('touch-target', 'btn-mobile-friendly', 'mobile-adjusted');
        }
    });
    
    // Links
    document.querySelectorAll('a').forEach(link => {
        link.classList.add('touch-target', 'mobile-adjusted');
    });
    
    // Formulários
    document.querySelectorAll('form').forEach(form => {
        form.classList.add('form-mobile-friendly', 'mobile-adjusted');
    });
}

/**
 * Configura a sidebar para dispositivos móveis
 */
function setupMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    
    if (!sidebar) return;
    
    // Adicionar overlay (se ainda não existir)
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', toggleMobileSidebar);
        document.body.appendChild(overlay);
    }
}

/**
 * Alterna a visibilidade da sidebar móvel
 */
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const content = document.querySelector('.content');
    
    if (!sidebar || !overlay) return;
    
    // Alternar classes
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Efeito de push no conteúdo (opcional)
    if (content) {
        content.classList.toggle('content-pushed');
    }
}

/**
 * Ajusta gráficos para dispositivos móveis
 */
function adjustChartsForMobile() {
    // Iterar sobre todos os gráficos na página
    for (const chartId in window) {
        const chartObj = window[chartId];
        
        // Verificar se é um objeto Chart.js
        if (chartObj && chartObj.type && chartObj.data && chartObj.options) {
            // Ajustar opções para melhor visualização móvel
            if (chartObj.options.plugins && chartObj.options.plugins.legend) {
                // Posicionar legenda embaixo em vez de ao lado
                chartObj.options.plugins.legend.position = 'bottom';
            }
            
            // Reduzir padding
            if (chartObj.options.layout && chartObj.options.layout.padding) {
                chartObj.options.layout.padding = {
                    top: 5,
                    right: 10,
                    bottom: 5,
                    left: 10
                };
            }
            
            // Reduzir tamanho do título e dos rótulos
            if (chartObj.options.scales) {
                Object.keys(chartObj.options.scales).forEach(scale => {
                    if (chartObj.options.scales[scale].title) {
                        chartObj.options.scales[scale].title.font = {
                            size: 10
                        };
                    }
                    
                    if (chartObj.options.scales[scale].ticks) {
                        chartObj.options.scales[scale].ticks.font = {
                            size: 9
                        };
                    }
                });
            }
            
            // Atualizar gráfico com as novas opções
            chartObj.update();
        }
    }
}

/**
 * Otimiza formulários para dispositivos móveis
 */
function optimizeFormsForMobile() {
    // Adicionar classe aos formulários
    document.querySelectorAll('form').forEach(form => {
        // Ajustar inputs para evitar zoom
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.classList.add('touch-padding', 'mobile-adjusted');
            
            // Para inputs de número, adicionar setas maiores
            if (input.type === 'number') {
                const wrapper = document.createElement('div');
                wrapper.className = 'relative mobile-adjusted';
                
                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(input);
                
                const upDownControls = document.createElement('div');
                upDownControls.className = 'absolute right-0 top-0 bottom-0 w-8 flex flex-col';
                
                const upBtn = document.createElement('button');
                upBtn.className = 'flex-1 bg-gray-200 text-gray-700 flex items-center justify-center';
                upBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
                upBtn.type = 'button';
                upBtn.addEventListener('click', () => {
                    input.stepUp();
                    input.dispatchEvent(new Event('change'));
                });
                
                const downBtn = document.createElement('button');
                downBtn.className = 'flex-1 bg-gray-200 text-gray-700 flex items-center justify-center';
                downBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
                downBtn.type = 'button';
                downBtn.addEventListener('click', () => {
                    input.stepDown();
                    input.dispatchEvent(new Event('change'));
                });
                
                upDownControls.appendChild(upBtn);
                upDownControls.appendChild(downBtn);
                wrapper.appendChild(upDownControls);
            }
        });
    });
}

/**
 * Configura navegação por abas para páginas complexas
 */
function setupMobileTabs() {
    // Verificar se estamos na página de estatísticas ou outra página complexa
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) return;
    
    // Criar navegação por abas
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs-mobile mb-4 bg-white rounded-lg shadow-md p-2 mobile-adjusted';
    
    // Definir abas
    const tabs = [
        { id: 'tab-summary', label: 'Resumo', target: '#summary-section' },
        { id: 'tab-evolution', label: 'Evolução', target: '#evolution-section' },
        { id: 'tab-patterns', label: 'Padrões', target: '#patterns-section' },
        { id: 'tab-matrix', label: 'Matriz', target: '#matrix-section' },
        { id: 'tab-context', label: 'Contextos', target: '#context-section' },
        { id: 'tab-comparison', label: 'Comparação', target: '#comparison-section' }
    ];
    
    // Adicionar abas ao container
    tabs.forEach(tab => {
        const tabButton = document.createElement('button');
        tabButton.id = tab.id;
        tabButton.className = 'tab-mobile text-gray-700 hover:text-blue-600 focus:text-blue-600';
        tabButton.textContent = tab.label;
        tabButton.dataset.target = tab.target;
        
        tabButton.addEventListener('click', function() {
            // Remover classe ativa de todas as abas
            document.querySelectorAll('.tab-mobile').forEach(t => {
                t.classList.remove('text-blue-600', 'font-bold', 'border-b-2', 'border-blue-600');
            });
            
            // Adicionar classe ativa à aba clicada
            this.classList.add('text-blue-600', 'font-bold', 'border-b-2', 'border-blue-600');
            
            // Esconder todas as seções
            document.querySelectorAll('.tab-section').forEach(section => {
                section.classList.add('hidden');
            });
            
            // Mostrar seção alvo
            const target = document.querySelector(this.dataset.target);
            if (target) {
                target.classList.remove('hidden');
                
                // Rolar para a seção
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        tabsContainer.appendChild(tabButton);
    });
    
    // Adicionar container de abas no início do container de estatísticas
    statsContainer.insertBefore(tabsContainer, statsContainer.firstChild);
    
    // Adicionar classes às seções para trabalhar com as abas
    document.querySelectorAll('.bg-white.rounded-lg.shadow-md').forEach((section, index) => {
        section.classList.add('tab-section');
        
        // Se não for a primeira seção, esconder inicialmente
        if (index > 0) {
            section.classList.add('hidden');
        }
        
        // Adicionar IDs às seções
        if (index === 0) section.id = 'summary-section';
        else if (index === 1) section.id = 'evolution-section';
        else if (index === 2) section.id = 'patterns-section';
        else if (index === 3) section.id = 'matrix-section';
        else if (index === 4) section.id = 'context-section';
        else if (index === 5) section.id = 'comparison-section';
    });
    
    // Ativar a primeira aba por padrão
    document.getElementById('tab-summary').classList.add('text-blue-600', 'font-bold', 'border-b-2', 'border-blue-600');
}
