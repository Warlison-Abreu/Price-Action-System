/**
 * Sistema de Quantificação Price Action Brooks
 * Testes automatizados
 */

// Suite de testes
const TEST_SUITE = {
    // Manter registro dos testes
    tests: [],
    passed: 0,
    failed: 0,
    
    // Adicionar um teste
    addTest: function(name, testFn) {
        this.tests.push({ name, testFn });
    },
    
    // Executar todos os testes
    runAllTests: async function() {
        console.log('Iniciando suite de testes...');
        this.passed = 0;
        this.failed = 0;
        const startTime = performance.now();
        
        for (const test of this.tests) {
            try {
                console.log(`Executando teste: ${test.name}`);
                await test.testFn();
                console.log(`✓ ${test.name} - Aprovado`);
                this.passed++;
            } catch (error) {
                console.error(`✗ ${test.name} - Falhou: ${error.message}`);
                console.error(error);
                this.failed++;
            }
        }
        
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log('--------------------------------------');
        console.log(`Resultados: ${this.tests.length} testes executados em ${duration}s`);
        console.log(`Aprovados: ${this.passed}, Falhos: ${this.failed}`);
        console.log('--------------------------------------');
        
        // Exibir resultados na UI
        updateTestResults(this.passed, this.failed, duration);
    }
};

// Função para verificar igualdade
function assertEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message || 'Assertion failed'}: esperado ${JSON.stringify(expected)}, mas recebeu ${JSON.stringify(actual)}`);
    }
}

// Função para verificar se um valor é verdadeiro
function assertTrue(value, message) {
    if (!value) {
        throw new Error(message || 'Valor esperado ser verdadeiro, mas é falso');
    }
}

// Função para verificar se um valor é falso
function assertFalse(value, message) {
    if (value) {
        throw new Error(message || 'Valor esperado ser falso, mas é verdadeiro');
    }
}

// Atualizar resultados na interface
function updateTestResults(passed, failed, duration) {
    const resultsContainer = document.getElementById('test-results');
    
    if (!resultsContainer) return;
    
    const total = passed + failed;
    const passPercentage = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    let statusClass = 'text-green-600';
    if (failed > 0) {
        statusClass = passPercentage >= 80 ? 'text-yellow-600' : 'text-red-600';
    }
    
    resultsContainer.innerHTML = `
        <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
                <h4 class="font-bold">Resumo dos testes</h4>
                <span class="${statusClass} font-bold">${passPercentage}% aprovados</span>
            </div>
            <div class="bg-gray-200 rounded-full h-2.5">
                <div class="${statusClass === 'text-green-600' ? 'bg-green-600' : statusClass === 'text-yellow-600' ? 'bg-yellow-600' : 'bg-red-600'} h-2.5 rounded-full" style="width: ${passPercentage}%"></div>
            </div>
        </div>
        <div class="grid grid-cols-3 gap-3 mb-4">
            <div class="bg-white rounded-lg shadow-sm p-3 text-center">
                <p class="text-gray-500 text-sm">Total</p>
                <p class="font-bold text-lg">${total}</p>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-3 text-center">
                <p class="text-gray-500 text-sm">Aprovados</p>
                <p class="font-bold text-lg text-green-600">${passed}</p>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-3 text-center">
                <p class="text-gray-500 text-sm">Falhos</p>
                <p class="font-bold text-lg ${failed > 0 ? 'text-red-600' : 'text-gray-600'}">${failed}</p>
            </div>
        </div>
        <div class="text-gray-500 text-sm text-right">
            Duração: ${duration}s
        </div>
    `;
}

// Definir os testes

// 1. Teste de API - Obtenção de dados
TEST_SUITE.addTest('API - Obtenção de padrões', async function() {
    const patterns = await API.getPatterns();
    assertTrue(Array.isArray(patterns), 'Padrões devem ser um array');
    assertTrue(patterns.length > 0, 'Deve haver pelo menos um padrão');
    
    // Verificar estrutura de um padrão
    const pattern = patterns[0];
    assertTrue(pattern.hasOwnProperty('ID'), 'Padrão deve ter ID');
    assertTrue(pattern.hasOwnProperty('Nome'), 'Padrão deve ter Nome');
    assertTrue(pattern.hasOwnProperty('Categoria'), 'Padrão deve ter Categoria');
});

// 2. Teste de API - Obtenção de trades
TEST_SUITE.addTest('API - Obtenção de trades', async function() {
    const trades = await API.getTrades();
    assertTrue(Array.isArray(trades), 'Trades devem ser um array');
    
    if (trades.length > 0) {
        const trade = trades[0];
        assertTrue(trade.hasOwnProperty('ID'), 'Trade deve ter ID');
        assertTrue(trade.hasOwnProperty('Data e Hora'), 'Trade deve ter Data e Hora');
        assertTrue(trade.hasOwnProperty('Padrão Brooks'), 'Trade deve ter Padrão Brooks');
    }
});

// 3. Teste de API - Filtragem de trades
TEST_SUITE.addTest('API - Filtragem de trades por padrão', async function() {
    // Obter todos os trades
    const allTrades = await API.getTrades();
    
    // Se não houver trades, pular o teste
    if (allTrades.length === 0) {
        console.log('Nenhum trade disponível para testar filtragem');
        return;
    }
    
    // Obter um padrão existente
    const patternName = allTrades[0]['Padrão Brooks'];
    
    // Filtrar por este padrão
    const filteredTrades = await API.getTrades({ pattern: patternName });
    
    assertTrue(Array.isArray(filteredTrades), 'Trades filtrados devem ser um array');
    
    // Verificar se todos os trades têm o padrão correto
    if (filteredTrades.length > 0) {
        const allHavePattern = filteredTrades.every(trade => trade['Padrão Brooks'] === patternName);
        assertTrue(allHavePattern, 'Todos os trades filtrados devem ter o padrão especificado');
    }
});

// 4. Teste de Utilitários - Formatação de data
TEST_SUITE.addTest('Utils - Formatação de data', function() {
    const date = new Date('2023-05-15T14:30:00');
    
    // Formato completo
    const fullFormat = Utils.formatDate(date, 'full');
    assertEqual(fullFormat, '15/05/2023 14:30', 'Formato completo incorreto');
    
    // Formato curto
    const shortFormat = Utils.formatDate(date, 'short');
    assertEqual(shortFormat, '15/05/2023', 'Formato curto incorreto');
    
    // Formato de hora
    const timeFormat = Utils.formatDate(date, 'time');
    assertEqual(timeFormat, '14:30', 'Formato de hora incorreto');
});

// 5. Teste de Utilitários - Formatação de valor R
TEST_SUITE.addTest('Utils - Formatação de valor R', function() {
    // Valor positivo
    const positiveR = Utils.formatR(2.5);
    assertEqual(positiveR, '+2.50R', 'Formatação de R positivo incorreta');
    
    // Valor negativo
    const negativeR = Utils.formatR(-1.75);
    assertEqual(negativeR, '-1.75R', 'Formatação de R negativo incorreta');
    
    // Zero
    const zeroR = Utils.formatR(0);
    assertEqual(zeroR, '0.00R', 'Formatação de R zero incorreta');
});

// 6. Teste de Utilitários - Formatação de porcentagem
TEST_SUITE.addTest('Utils - Formatação de porcentagem', function() {
    // Valor decimal
    const decimal = Utils.formatPercentage(0.75);
    assertEqual(decimal, '75.0%', 'Formatação de porcentagem incorreta');
    
    // Valor zero
    const zero = Utils.formatPercentage(0);
    assertEqual(zero, '0.0%', 'Formatação de porcentagem zero incorreta');
    
    // Valor 100%
    const hundred = Utils.formatPercentage(1);
    assertEqual(hundred, '100.0%', 'Formatação de 100% incorreta');
});

// 7. Teste de cálculos estatísticos
TEST_SUITE.addTest('Estatísticas - Cálculo de taxa de acerto', function() {
    // Criar conjunto de trades de teste
    const trades = [
        { 'Resultado (R)': '1.5' },   // Win
        { 'Resultado (R)': '-0.5' },  // Loss
        { 'Resultado (R)': '2.0' },   // Win
        { 'Resultado (R)': '0.75' }   // Win
    ];
    
    // Calcular manualmente a taxa de acerto esperada
    const expectedWinRate = 3 / 4; // 75%
    
    // Usar a função de cálculo de estatísticas
    const stats = calculateStatistics(trades);
    
    assertEqual(stats.winRate, expectedWinRate, 'Taxa de acerto calculada incorretamente');
});

// 8. Teste de cálculos estatísticos - Expectativa
TEST_SUITE.addTest('Estatísticas - Cálculo de expectativa', function() {
    // Criar conjunto de trades de teste
    const trades = [
        { 'Resultado (R)': '1.5' },
        { 'Resultado (R)': '-0.5' },
        { 'Resultado (R)': '2.0' },
        { 'Resultado (R)': '0.75' }
    ];
    
    // Calcular manualmente a expectativa esperada
    const expectedExpectancy = (1.5 - 0.5 + 2.0 + 0.75) / 4; // 0.9375R
    
    // Usar a função de cálculo de estatísticas
    const stats = calculateStatistics(trades);
    
    assertTrue(Math.abs(stats.expectancy - expectedExpectancy) < 0.0001, 'Expectativa calculada incorretamente');
});

// 9. Teste de Dashboard Config - Salvar e carregar
TEST_SUITE.addTest('Dashboard Config - Salvar e carregar configuração', function() {
    // Configuração de teste
    const testConfig = {
        statsCards: {
            winRate: true,
            expectancy: false,
            profitFactor: true,
            tradesCount: false
        },
        charts: {
            performance: true,
            patterns: false
        },
        layout: {
            defaultPeriod: 'month',
            colorTheme: 'green'
        }
    };
    
    // Salvar no localStorage
    localStorage.setItem('dashboardConfig', JSON.stringify(testConfig));
    
    // Carregar do localStorage
    const loadedConfig = JSON.parse(localStorage.getItem('dashboardConfig'));
    
    // Verificar se a configuração carregada é igual à salva
    assertEqual(loadedConfig, testConfig, 'Configuração carregada não corresponde à salva');
    
    // Limpar localStorage
    localStorage.removeItem('dashboardConfig');
});

// 10. Teste de mapeamento de padrão para detalhes
TEST_SUITE.addTest('Pattern Detail - Mapeamento de ID para detalhes', async function() {
    // Obter todos os padrões
    const patterns = await API.getPatterns();
    
    // Se não houver padrões, pular o teste
    if (patterns.length === 0) {
        console.log('Nenhum padrão disponível para testar mapeamento');
        return;
    }
    
    // Selecionar um padrão para teste
    const testPattern = patterns[0];
    const patternId = testPattern.ID;
    
    // Encontrar o padrão pelo ID
    const foundPattern = patterns.find(p => p.ID === patternId);
    
    // Verificar se o padrão foi encontrado e tem os mesmos dados
    assertTrue(foundPattern !== undefined, 'Padrão deve ser encontrado pelo ID');
    assertEqual(foundPattern.Nome, testPattern.Nome, 'Nome do padrão encontrado não corresponde');
    assertEqual(foundPattern.Categoria, testPattern.Categoria, 'Categoria do padrão encontrado não corresponde');
});

// Função para executar todos os testes
function runTests() {
    // Exibir indicador de carregamento
    const resultsContainer = document.getElementById('test-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="text-center p-8">
                <i class="fas fa-spinner fa-spin fa-2x text-blue-500"></i>
                <p class="mt-2">Executando testes...</p>
            </div>
        `;
    }
    
    // Executar testes após um pequeno delay para permitir que a UI atualize
    setTimeout(() => {
        TEST_SUITE.runAllTests();
    }, 100);
}

// Inicializar testes quando a página de testes for carregada
document.addEventListener('DOMContentLoaded', function() {
    const runTestsBtn = document.getElementById('run-tests-btn');
    if (runTestsBtn) {
        runTestsBtn.addEventListener('click', runTests);
        
        // Executar testes automaticamente na carga inicial
        runTests();
    }
});
