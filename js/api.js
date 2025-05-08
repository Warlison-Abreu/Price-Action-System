/**
 * Sistema de Quantificação Price Action Brooks
 * Serviço de API para comunicação com o backend
 */

const API = (function() {
    /**
     * Realiza uma requisição à API
     * @param {string} action - Ação a ser executada pela API
     * @param {Object} params - Parâmetros adicionais para a requisição
     * @param {string} method - Método HTTP (GET ou POST)
     * @param {Object} data - Dados para enviar no corpo da requisição (para POST)
     * @returns {Promise} - Promise com o resultado da requisição
     */
    async function request(action, params = {}, method = 'GET', data = null) {
        // Construir URL da requisição
        let url = new URL(CONFIG.API_BASE_URL);
        
        // Adicionar a ação como parâmetro
        url.searchParams.append('action', action);
        
        // Adicionar parâmetros adicionais
        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                url.searchParams.append(key, params[key]);
            }
        }
        
        // Configurar opções da requisição
        const options = {
            method: method,
            redirect: 'follow',
            headers: {
                'Accept': 'application/json'
            }
        };
        
        // Adicionar corpo da requisição para métodos POST
        if (method === 'POST' && data) {
            options.body = JSON.stringify(data);
            options.headers['Content-Type'] = 'application/json';
        }
        
        try {
            // Fazer a requisição
            const response = await fetch(url, options);
            
            // Verificar se a resposta foi bem-sucedida
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Interpretar o resultado como JSON
            const result = await response.json();
            
            // Verificar se a API retornou um erro
            if (result.status === 'error') {
                throw new Error(result.message || CONFIG.ERROR_MESSAGES.API_ERROR);
            }
            
            // Retornar apenas os dados da resposta
            return result.data;
        } catch (error) {
            console.error(`Erro na requisição para ${action}:`, error);
            
            // Relançar o erro para tratamento no chamador
            throw error;
        }
    }
    
    // Interface pública do serviço de API
    return {
        /**
         * Carrega lista de trades com filtros opcionais
         * @param {Object} filters - Filtros a serem aplicados
         * @returns {Promise} - Promise com a lista de trades
         */
        getTrades: function(filters = {}) {
            return request('getTrades', filters);
        },
        
        /**
         * Obtém lista de padrões Brooks
         * @returns {Promise} - Promise com a lista de padrões
         */
        getPatterns: function() {
            return request('getPatterns');
        },
        
        /**
         * Obtém lista de contextos de mercado
         * @returns {Promise} - Promise com a lista de contextos
         */
        getContexts: function() {
            return request('getContexts');
        },
        
        /**
         * Obtém lista de ciclos de mercado
         * @returns {Promise} - Promise com a lista de ciclos
         */
        getCycles: function() {
            return request('getCycles');
        },
        
        /**
         * Obtém lista de pares de moedas
         * @returns {Promise} - Promise com a lista de pares
         */
        getPairs: function() {
            return request('getPairs');
        },
        
        /**
         * Obtém lista de timeframes
         * @returns {Promise} - Promise com a lista de timeframes
         */
        getTimeframes: function() {
            return request('getTimeframes');
        },
        
        /**
         * Salva um novo trade
         * @param {Object} tradeData - Dados do trade a ser salvo
         * @returns {Promise} - Promise com o resultado da operação
         */
        saveTrade: function(tradeData) {
            return request('saveTrade', {}, 'POST', tradeData);
        },
        
        /**
         * Obtém estatísticas gerais do sistema
         * @returns {Promise} - Promise com as estatísticas
         */
        getStatistics: function() {
            return request('getStatistics');
        },
        
        /**
         * Obtém estatísticas por padrão
         * @returns {Promise} - Promise com as estatísticas por padrão
         */
        getPatternStatistics: function() {
            return request('getPatternStatistics');
        },
        
        /**
         * Obtém estatísticas por contexto
         * @returns {Promise} - Promise com as estatísticas por contexto
         */
        getContextStatistics: function() {
            return request('getContextStatistics');
        },
        
        /**
         * Obtém matriz cruzada de probabilidades
         * @returns {Promise} - Promise com a matriz cruzada
         */
        getCrossMatrix: function() {
            return request('getCrossMatrix');
        },
        
        /**
         * Faz upload de uma captura de tela e vincula a um trade
         * @param {string} base64Data - Dados da imagem em formato base64
         * @param {string} tradeId - ID do trade para vincular
         * @returns {Promise} - Promise com a URL da imagem salva
         */
        uploadScreenshot: function(base64Data, tradeId) {
            return request('uploadScreenshot', {}, 'POST', {
                base64Data: base64Data,
                tradeId: tradeId
            });
        }
    };
})();
