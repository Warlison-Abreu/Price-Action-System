/**
 * Sistema de Quantificação Price Action Brooks
 * Otimizações de Desempenho
 */

// Configurações de performance
const PERFORMANCE_CONFIG = {
    enableCaching: true,           // Habilitar cache de dados
    cacheDuration: 5 * 60 * 1000,  // Duração do cache em ms (5 minutos)
    lazyLoadImages: true,          // Carregar imagens sob demanda
    debounceDuration: 300,         // Duração do debounce em ms
    throttleDuration: 100,         // Duração do throttle em ms
    useMemoization: true,          // Usar memoização para cálculos repetitivos
    batchDOMUpdates: true,         // Agrupar atualizações do DOM
    useIndexedDB: true,            // Usar IndexedDB para armazenamento local maior
    compressData: true,            // Comprimir dados antes de armazenar
    useWorkers: true               // Usar Web Workers para processamento paralelo
};

// Cache de dados
const dataCache = {
    patterns: {
        data: null,
        timestamp: 0
    },
    trades: {
        data: null,
        timestamp: 0,
        filter: null
    },
    contexts: {
        data: null,
        timestamp: 0
    },
    timeframes: {
        data: null,
        timestamp: 0
    },
    statistics: {
        data: null,
        timestamp: 0,
        filter: null
    }
};

/**
 * Otimiza as chamadas de API com cache
 * @param {Function} originalFn - Função original da API
 * @param {string} cacheKey - Chave para armazenar no cache
 * @param {Object} options - Opções adicionais
 * @returns {Function} - Função otimizada com cache
 */
function withCache(originalFn, cacheKey, options = {}) {
    return async function(...args) {
        // Se o cache não estiver habilitado, chamar função original
        if (!PERFORMANCE_CONFIG.enableCaching) {
            return originalFn.apply(this, args);
        }
        
        const cache = dataCache[cacheKey];
        const now = Date.now();
        const filter = args[0] || null;
        
        // Verificar se os dados em cache são válidos
        const isValidCache = cache.data !== null && 
                            (now - cache.timestamp) < PERFORMANCE_CONFIG.cacheDuration &&
                            (options.ignoreFilter || JSON.stringify(cache.filter) === JSON.stringify(filter));
        
        if (isValidCache) {
            console.log(`Usando dados em cache para ${cacheKey}`);
            return JSON.parse(JSON.stringify(cache.data)); // Retornar cópia para evitar mutação
        }
        
        // Se não houver cache válido, chamar função original
        try {
            const data = await originalFn.apply(this, args);
            
            // Atualizar cache
            cache.data = data;
            cache.timestamp = now;
            cache.filter = filter;
            
            return data;
        } catch (error) {
            console.error(`Erro ao buscar dados para ${cacheKey}:`, error);
            throw error;
        }
    };
}

/**
 * Cria uma versão com debounce de uma função
 * @param {Function} fn - Função a ser debounced
 * @param {number} delay - Atraso em ms
 * @returns {Function} - Função com debounce
 */
function debounce(fn, delay = PERFORMANCE_CONFIG.debounceDuration) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
}

/**
 * Cria uma versão com throttle de uma função
 * @param {Function} fn - Função a ser throttled
 * @param {number} delay - Atraso em ms
 * @returns {Function} - Função com throttle
 */
function throttle(fn, delay = PERFORMANCE_CONFIG.throttleDuration) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn.apply(this, args);
        }
    };
}

/**
 * Cria uma versão memoizada de uma função
 * @param {Function} fn - Função a ser memoizada
 * @returns {Function} - Função com memoização
 */
function memoize(fn) {
    const cache = new Map();
    
    return function(...args) {
        // Se a memoização não estiver habilitada, chamar função original
        if (!PERFORMANCE_CONFIG.useMemoization) {
            return fn.apply(this, args);
        }
        
        const key = JSON.stringify(args);
        
        if (cache.has(key)) {
            return cache.get(key);
        }
        
        const result = fn.apply(this, args);
        cache.set(key, result);
        
        return result;
    };
}

/**
 * Implementa lazy loading para imagens
 */
function setupLazyLoading() {
    // Se o lazy loading não estiver habilitado, sair
    if (!PERFORMANCE_CONFIG.lazyLoadImages) {
        return;
    }
    
    // Verificar suporte a Intersection Observer
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.classList.remove('lazy-load');
                    imageObserver.unobserve(lazyImage);
                }
            });
        });
        
        // Observar todas as imagens com classe lazy-load
        document.querySelectorAll('img.lazy-load').forEach(function(img) {
            imageObserver.observe(img);
        });
    } else {
        // Fallback para navegadores sem suporte a Intersection Observer
        const lazyImages = [].slice.call(document.querySelectorAll("img.lazy-load"));
        
        let lazyLoadThrottled = throttle(function() {
            const scrollTop = window.pageYOffset;
            
            lazyImages.forEach(function(img) {
                if (img.offsetTop < (window.innerHeight + scrollTop + 500)) {
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-load');
                }
            });
            
            if (lazyImages.length === 0) {
                document.removeEventListener("scroll", lazyLoadThrottled);
                window.removeEventListener("resize", lazyLoadThrottled);
                window.removeEventListener("orientationChange", lazyLoadThrottled);
            }
        });
        
        document.addEventListener("scroll", lazyLoadThrottled);
        window.addEventListener("resize", lazyLoadThrottled);
        window.addEventListener("orientationChange", lazyLoadThrottled);
    }
}

/**
 * Gerencia atualizações em lote para o DOM
 */
class DOMBatchUpdater {
    constructor() {
        this.updates = [];
        this.isWaiting = false;
    }
    
    /**
     * Adiciona uma atualização ao lote
     * @param {Function} updateFn - Função de atualização
     */
    addUpdate(updateFn) {
        // Se o batch update não estiver habilitado, executar imediatamente
        if (!PERFORMANCE_CONFIG.batchDOMUpdates) {
            updateFn();
            return;
        }
        
        this.updates.push(updateFn);
        
        if (!this.isWaiting) {
            this.isWaiting = true;
            
            // Usar requestAnimationFrame para otimizar atualizações
            requestAnimationFrame(() => {
                this.processUpdates();
            });
        }
    }
    
    /**
     * Processa todas as atualizações no lote
     */
    processUpdates() {
        // Criar um fragmento de documento para operações em lote
        const fragment = document.createDocumentFragment();
        
        this.updates.forEach(updateFn => {
            updateFn(fragment);
        });
        
        this.updates = [];
        this.isWaiting = false;
    }
}

// Instância global do gerenciador de atualizações
const domUpdater = new DOMBatchUpdater();

/**
 * Gerencia Web Workers para processamento paralelo
 */
class WorkerManager {
    constructor() {
        this.workers = {};
    }
    
    /**
     * Cria ou obtém um worker existente
     * @param {string} name - Nome do worker
     * @param {string} scriptUrl - URL do script do worker
     * @returns {Worker} - Instância do worker
     */
    getWorker(name, scriptUrl) {
        // Se os workers não estiverem habilitados ou não forem suportados, retornar null
        if (!PERFORMANCE_CONFIG.useWorkers || !('Worker' in window)) {
            return null;
        }
        
        // Reutilizar worker existente
        if (this.workers[name]) {
            return this.workers[name];
        }
        
        // Criar novo worker
        try {
            const worker = new Worker(scriptUrl);
            this.workers[name] =
