/**
 * Sistema de Quantificação Price Action Brooks
 * Arquivo de configuração principal
 */

const CONFIG = {
    // URL base para a API do Google Apps Script
    // IMPORTANTE: Você deve substituir pela URL da sua Web App após publicá-la
    API_BASE_URL: 'https://script.google.com/macros/s/AKfycbz2LVB2K8qyq_N0ISifebe7_Bx1D0589t1l7uthD6pZ95YapbaSYLaf3GR6HFkaR8qXOQ/exec',
    
    // Limites e configurações
    RECENT_TRADES_LIMIT: 5,
    TOP_PATTERNS_LIMIT: 4,
    
    // Configurações de cores para os gráficos
    CHART_COLORS: {
        blue: '#3b82f6',
        green: '#10b981',
        red: '#ef4444',
        yellow: '#f59e0b',
        purple: '#8b5cf6',
        indigo: '#6366f1',
        pink: '#ec4899',
        orange: '#f97316',
        // Cores mais claras para backgrounds
        blueLight: 'rgba(59, 130, 246, 0.2)',
        greenLight: 'rgba(16, 185, 129, 0.2)',
        redLight: 'rgba(239, 68, 68, 0.2)',
        yellowLight: 'rgba(245, 158, 11, 0.2)',
        purpleLight: 'rgba(139, 92, 246, 0.2)',
        indigoLight: 'rgba(99, 102, 241, 0.2)',
        pinkLight: 'rgba(236, 72, 153, 0.2)',
        orangeLight: 'rgba(249, 115, 22, 0.2)'
    },
    
    // Configurações para Chart.js
    CHART_OPTIONS: {
        bar: {
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
                                    label += (context.parsed.y * 100).toFixed(1) + '%';
                                } else {
                                    label += context.parsed.y.toFixed(2);
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
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        },
        pie: {
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
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.toFixed(1) + '%';
                            return label;
                        }
                    }
                }
            }
        }
    },
    
    // Mensagens de erro
    ERROR_MESSAGES: {
        LOAD_FAILED: 'Falha ao carregar dados. Verifique sua conexão e tente novamente.',
        SAVE_FAILED: 'Falha ao salvar os dados. Tente novamente mais tarde.',
        API_ERROR: 'Erro na comunicação com o servidor.',
        FORM_VALIDATION: 'Por favor, preencha todos os campos obrigatórios.'
    },
    
    // Outras configurações
    DATE_FORMAT: {
        short: 'DD/MM/YYYY',
        long: 'DD/MM/YYYY HH:mm',
        timestamp: 'YYYY-MM-DD HH:mm:ss'
    },
    
    // Mapeamento de cor para taxa de acerto e expectativa
    WIN_RATE_COLORS: [
        { threshold: 0.7, color: '#10b981' }, // Verde para taxas > 70%
        { threshold: 0.5, color: '#f59e0b' }, // Amarelo para taxas entre 50% e 70%
        { threshold: 0, color: '#ef4444' }    // Vermelho para taxas < 50%
    ],
    
    EXPECTANCY_COLORS: [
        { threshold: 0.5, color: '#10b981' }, // Verde para expectativa > 0.5R
        { threshold: 0, color: '#f59e0b' },   // Amarelo para expectativa entre 0 e 0.5R
        { threshold: -999, color: '#ef4444' } // Vermelho para expectativa negativa
    ]
};
