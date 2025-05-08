/**
 * Sistema de Quantificação Price Action Brooks
 * Funções utilitárias
 */

const Utils = (function() {
    /**
     * Formata uma data para exibição
     * @param {Date|string} date - Data para formatar
     * @param {string} format - Formato desejado ('short' ou 'long')
     * @returns {string} - Data formatada
     */
    function formatDate(date, format = 'short') {
        if (!date) return '';
        
        const d = new Date(date);
        
        if (isNaN(d.getTime())) {
            return '';
        }
        
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        if (format === 'short') {
            return `${day}/${month}/${year}`;
        } else if (format === 'long') {
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        } else if (format === 'timestamp') {
            const seconds = String(d.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
        
        // Formato padrão
        return `${day}/${month}/${year}`;
    }
    
    /**
     * Retorna a data atual formatada
     * @param {string} format - Formato desejado
     * @returns {string} - Data atual formatada
     */
    function getCurrentDate(format = 'short') {
        return formatDate(new Date(), format);
    }
    
    /**
     * Calcula a cor com base na taxa de acerto
     * @param {number} winRate - Taxa de acerto (0 a 1)
     * @returns {string} - Código de cor hexadecimal
     */
    function getWinRateColor(winRate) {
        for (const threshold of CONFIG.WIN_RATE_COLORS) {
            if (winRate >= threshold.threshold) {
                return threshold.color;
            }
        }
        return CONFIG.WIN_RATE_COLORS[CONFIG.WIN_RATE_COLORS.length - 1].color;
    }
    
    /**
     * Calcula a cor com base na expectativa
     * @param {number} expectancy - Expectativa em R
     * @returns {string} - Código de cor hexadecimal
     */
    function getExpectancyColor(expectancy) {
        for (const threshold of CONFIG.EXPECTANCY_COLORS) {
            if (expectancy >= threshold.threshold) {
                return threshold.color;
            }
        }
        return CONFIG.EXPECTANCY_COLORS[CONFIG.EXPECTANCY_COLORS.length - 1].color;
    }
    
    /**
     * Exibe uma notificação em forma de toast
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo de notificação ('success', 'error' ou 'warning')
     * @param {number} duration - Duração em ms (padrão: 3000ms)
     */
    function showToast(message, type = 'success', duration = 3000) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        // Configurar tipo de toast
        toast.className = 'fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg transform transition-transform duration-300';
        
        if (type === 'success') {
            toast.classList.add('bg-green-500', 'text-white');
        } else if (type === 'error') {
            toast.classList.add('bg-red-500', 'text-white');
        } else if (type === 'warning') {
            toast.classList.add('bg-yellow-500', 'text-white');
        }
        
        // Definir mensagem
        toastMessage.textContent = message;
        
        // Mostrar toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Esconder toast após duração especificada
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
    
    /**
     * Trunca um texto para o tamanho máximo especificado
     * @param {string} text - Texto para truncar
     * @param {number} maxLength - Tamanho máximo desejado
     * @returns {string} - Texto truncado
     */
    function truncateText(text, maxLength = 30) {
        if (!text) return '';
        
        if (text.length <= maxLength) {
            return text;
        }
        
        return text.substring(0, maxLength - 3) + '...';
    }
    
    /**
     * Converte uma imagem de arquivo para base64
     * @param {File} file - Arquivo de imagem
     * @returns {Promise} - Promise com a string base64
     */
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = () => {
                resolve(reader.result);
            };
            
            reader.onerror = (error) => {
                reject(error);
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * Verifica se um objeto é vazio
     * @param {Object} obj - Objeto para verificar
     * @returns {boolean} - true se o objeto estiver vazio
     */
    function isEmptyObject(obj) {
        return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
    }
    
    /**
     * Obtém o início da semana atual
     * @returns {Date} - Data do início da semana
     */
    function getStartOfWeek() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = domingo, 1 = segunda, etc.
        const startOfWeek = new Date(now);
        
        // Ajustar para domingo
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        
        return startOfWeek;
    }
    
    /**
     * Obtém o início do mês atual
     * @returns {Date} - Data do início do mês
     */
    function getStartOfMonth() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    /**
     * Calcula a variação percentual entre dois valores
     * @param {number} current - Valor atual
     * @param {number} previous - Valor anterior
     * @returns {number} - Variação percentual
     */
    function calculatePercentageChange(current, previous) {
        if (previous === 0) {
            return current > 0 ? 100 : 0;
        }
        
        return ((current - previous) / Math.abs(previous)) * 100;
    }
    
    /**
     * Gera cores únicas para vários elementos
     * @param {number} count - Quantidade de cores necessárias
     * @returns {Array} - Array de cores
     */
    function generateColors(count) {
        const colors = [
            CONFIG.CHART_COLORS.blue,
            CONFIG.CHART_COLORS.green,
            CONFIG.CHART_COLORS.red,
            CONFIG.CHART_COLORS.yellow,
            CONFIG.CHART_COLORS.purple,
            CONFIG.CHART_COLORS.indigo,
            CONFIG.CHART_COLORS.pink,
            CONFIG.CHART_COLORS.orange
        ];
        
        // Se precisar de mais cores do que as predefinidas, gerar cores aleatórias
        if (count > colors.length) {
            for (let i = colors.length; i < count; i++) {
                const r = Math.floor(Math.random() * 200);
                const g = Math.floor(Math.random() * 200);
                const b = Math.floor(Math.random() * 200);
                colors.push(`rgb(${r}, ${g}, ${b})`);
            }
        }
        
        return colors.slice(0, count);
    }
    
    /**
     * Gera cores transparentes baseadas nas cores originais
     * @param {Array} colors - Array de cores originais
     * @param {number} opacity - Opacidade (0 a 1)
     * @returns {Array} - Array de cores transparentes
     */
    function generateTransparentColors(colors, opacity = 0.2) {
        return colors.map(color => {
            // Se a cor for hexadecimal
            if (color.startsWith('#')) {
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${opacity})`;
            }
            
            // Se a cor já for rgba
            if (color.startsWith('rgba')) {
                return color.replace(/[\d\.]+\)$/, `${opacity})`);
            }
            
            // Se a cor for rgb
            if (color.startsWith('rgb')) {
                return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
            }
            
            return color;
        });
    }
    
    /**
     * Cria um elemento de spinner de carregamento
     * @returns {HTMLElement} - Elemento de spinner
     */
    function createSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'spinner mx-auto';
        return spinner;
    }
    
    /**
     * Formata um número como percentual
     * @param {number} value - Valor a ser formatado (0 a 1)
     * @param {number} decimals - Quantidade de casas decimais
     * @returns {string} - Valor formatado como percentual
     */
    function formatPercentage(value, decimals = 1) {
        if (value === null || value === undefined || isNaN(value)) {
            return '--';
        }
        
        return (value * 100).toFixed(decimals) + '%';
    }
    
    /**
     * Formata um número como valor R
     * @param {number} value - Valor a ser formatado
     * @param {number} decimals - Quantidade de casas decimais
     * @returns {string} - Valor formatado como R
     */
    function formatR(value, decimals = 2) {
        if (value === null || value === undefined || isNaN(value)) {
            return '--';
        }
        
        const formattedValue = value.toFixed(decimals);
        
        if (value > 0) {
            return '+' + formattedValue + 'R';
        } else {
            return formattedValue + 'R';
        }
    }
    
    /**
     * Preenche um select com opções
     * @param {string} selectId - ID do elemento select
     * @param {Array} options - Array de opções
     * @param {string} valueField - Nome do campo a ser usado como value
     * @param {string} textField - Nome do campo a ser exibido
     */
    function populateSelect(selectId, options, valueField, textField) {
        const selectElement = document.getElementById(selectId);
        
        if (!selectElement) {
            console.error(`Elemento select com ID ${selectId} não encontrado`);
            return;
        }
        
        // Preservar a primeira opção (geralmente "Selecione...")
        const firstOption = selectElement.options[0];
        
        // Limpar opções existentes
        selectElement.innerHTML = '';
        
        // Restaurar primeira opção
        if (firstOption) {
            selectElement.add(firstOption);
        }
        
        // Adicionar novas opções
        options.forEach(option => {
            const optElement = document.createElement('option');
            optElement.value = option[valueField];
            optElement.textContent = option[textField];
            selectElement.add(optElement);
        });
    }
    
    // Funções públicas
    return {
        formatDate,
        getCurrentDate,
        getWinRateColor,
        getExpectancyColor,
        showToast,
        truncateText,
        fileToBase64,
        isEmptyObject,
        getStartOfWeek,
        getStartOfMonth,
        calculatePercentageChange,
        generateColors,
        generateTransparentColors,
        createSpinner,
        formatPercentage,
        formatR,
        populateSelect
    };
})();
