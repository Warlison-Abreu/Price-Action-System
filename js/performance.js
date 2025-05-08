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
                this.workers[name] = worker;
                return worker;
            } catch (error) {
                console.error(`Erro ao criar worker ${name}:`, error);
                return null;
            }
        }
    }
    
    /**
     * Executa uma tarefa em um worker
     * @param {string} name - Nome do worker
     * @param {string} scriptUrl - URL do script do worker
     * @param {Object} data - Dados a serem processados
     * @returns {Promise} - Promise com o resultado
     */
    executeTask(name, scriptUrl, data) {
        return new Promise((resolve, reject) => {
            const worker = this.getWorker(name, scriptUrl);
            
            // Se não houver worker, processar no thread principal
            if (!worker) {
                // Importar o script e executar a função diretamente
                import(scriptUrl.replace('workers/', 'workers/fallback/'))
                    .then(module => {
                        try {
                            const result = module.processData(data);
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    })
                    .catch(error => reject(error));
                return;
            }
            
            // Configurar manipuladores de eventos para o worker
            const messageHandler = function(event) {
                worker.removeEventListener('message', messageHandler);
                worker.removeEventListener('error', errorHandler);
                
                resolve(event.data);
            };
            
            const errorHandler = function(error) {
                worker.removeEventListener('message', messageHandler);
                worker.removeEventListener('error', errorHandler);
                
                reject(error);
            };
            
            worker.addEventListener('message', messageHandler);
            worker.addEventListener('error', errorHandler);
            
            // Enviar dados para o worker
            worker.postMessage(data);
        });
    }
    
    /**
     * Termina um worker
     * @param {string} name - Nome do worker
     */
    terminateWorker(name) {
        if (this.workers[name]) {
            this.workers[name].terminate();
            delete this.workers[name];
        }
    }
    
    /**
     * Termina todos os workers
     */
    terminateAll() {
        Object.keys(this.workers).forEach(name => {
            this.terminateWorker(name);
        });
    }
}

// Instância global do gerenciador de workers
const workerManager = new WorkerManager();

/**
 * Gerencia armazenamento com IndexedDB
 */
class IndexedDBStorage {
    constructor(dbName = 'tradingSystemDB', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
        
        // Inicializar banco de dados
        if (PERFORMANCE_CONFIG.useIndexedDB && 'indexedDB' in window) {
            this.initDB();
        }
    }
    
    /**
     * Inicializa o banco de dados
     * @returns {Promise} - Promise com a instância do banco
     */
    initDB() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                resolve(this.db);
                return;
            }
            
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Criar stores
                if (!db.objectStoreNames.contains('trades')) {
                    db.createObjectStore('trades', { keyPath: 'ID' });
                }
                
                if (!db.objectStoreNames.contains('patterns')) {
                    db.createObjectStore('patterns', { keyPath: 'ID' });
                }
                
                if (!db.objectStoreNames.contains('statistics')) {
                    db.createObjectStore('statistics', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('cache')) {
                    db.createObjectStore('cache', { keyPath: 'key' });
                }
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
            
            request.onerror = (event) => {
                console.error('Erro ao abrir IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    }
    
    /**
     * Salva dados no banco
     * @param {string} storeName - Nome do store
     * @param {Object|Array} data - Dados a serem salvos
     * @returns {Promise} - Promise com o resultado
     */
    async saveData(storeName, data) {
        try {
            const db = await this.initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                // Se for um array, salvar cada item
                if (Array.isArray(data)) {
                    // Usar transaction para garantir atomicidade
                    data.forEach(item => {
                        store.put(item);
                    });
                    
                    transaction.oncomplete = () => resolve(true);
                    transaction.onerror = (event) => reject(event.target.error);
                } else {
                    // Se for um único objeto
                    const request = store.put(data);
                    
                    request.onsuccess = () => resolve(true);
                    request.onerror = (event) => reject(event.target.error);
                }
            });
        } catch (error) {
            console.error(`Erro ao salvar dados em ${storeName}:`, error);
            return false;
        }
    }
    
    /**
     * Obtém dados do banco
     * @param {string} storeName - Nome do store
     * @param {string|number} key - Chave do item (opcional)
     * @returns {Promise} - Promise com os dados
     */
    async getData(storeName, key = null) {
        try {
            const db = await this.initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                
                if (key !== null) {
                    // Obter um único item pelo ID
                    const request = store.get(key);
                    
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = (event) => reject(event.target.error);
                } else {
                    // Obter todos os itens
                    const request = store.getAll();
                    
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = (event) => reject(event.target.error);
                }
            });
        } catch (error) {
            console.error(`Erro ao obter dados de ${storeName}:`, error);
            return null;
        }
    }
    
    /**
     * Remove dados do banco
     * @param {string} storeName - Nome do store
     * @param {string|number} key - Chave do item
     * @returns {Promise} - Promise com o resultado
     */
    async removeData(storeName, key) {
        try {
            const db = await this.initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const request = store.delete(key);
                
                request.onsuccess = () => resolve(true);
                request.onerror = (event) => reject(event.target.error);
            });
        } catch (error) {
            console.error(`Erro ao remover dados de ${storeName}:`, error);
            return false;
        }
    }
    
    /**
     * Limpa todos os dados de um store
     * @param {string} storeName - Nome do store
     * @returns {Promise} - Promise com o resultado
     */
    async clearStore(storeName) {
        try {
            const db = await this.initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const request = store.clear();
                
                request.onsuccess = () => resolve(true);
                request.onerror = (event) => reject(event.target.error);
            });
        } catch (error) {
            console.error(`Erro ao limpar store ${storeName}:`, error);
            return false;
        }
    }
}

// Instância global do gerenciador de armazenamento
const dbStorage = new IndexedDBStorage();

/**
 * Utilitário para compressão/descompressão de dados
 */
const CompressionUtil = {
    /**
     * Comprime dados em string
     * @param {Object} data - Dados a serem comprimidos
     * @returns {string} - String comprimida
     */
    compress: function(data) {
        // Se a compressão não estiver habilitada, retornar dados serializados
        if (!PERFORMANCE_CONFIG.compressData) {
            return JSON.stringify(data);
        }
        
        try {
            // Converter dados para string JSON
            const jsonString = JSON.stringify(data);
            
            // Usar LZString para compressão
            if (typeof LZString !== 'undefined') {
                return LZString.compressToUTF16(jsonString);
            }
            
            // Fallback se LZString não estiver disponível
            return jsonString;
        } catch (error) {
            console.error('Erro ao comprimir dados:', error);
            return JSON.stringify(data);
        }
    },
    
    /**
     * Descomprime string para objeto
     * @param {string} compressedString - String comprimida
     * @returns {Object} - Dados descomprimidos
     */
    decompress: function(compressedString) {
        // Se a compressão não estiver habilitada ou a string for nula/indefinida
        if (!PERFORMANCE_CONFIG.compressData || !compressedString) {
            try {
                return JSON.parse(compressedString || '{}');
            } catch (e) {
                return {};
            }
        }
        
        try {
            // Usar LZString para descompressão
            if (typeof LZString !== 'undefined') {
                const jsonString = LZString.decompressFromUTF16(compressedString);
                return JSON.parse(jsonString || '{}');
            }
            
            // Fallback se LZString não estiver disponível
            return JSON.parse(compressedString);
        } catch (error) {
            console.error('Erro ao descomprimir dados:', error);
            return {};
        }
    }
};

/**
 * Inicializa otimizações de desempenho
 */
function initPerformanceOptimizations() {
    console.log('Inicializando otimizações de desempenho...');
    
    // Configurar lazy loading
    setupLazyLoading();
    
    // Aplicar otimizações às funções da API
    if (typeof API !== 'undefined') {
        // Aplicar cache às funções da API
        API.getPatterns = withCache(API.getPatterns, 'patterns', { ignoreFilter: true });
        API.getTrades = withCache(API.getTrades, 'trades');
        API.getContexts = withCache(API.getContexts, 'contexts', { ignoreFilter: true });
        API.getTimeframes = withCache(API.getTimeframes, 'timeframes', { ignoreFilter: true });
        API.getStatistics = withCache(API.getStatistics, 'statistics');
    }
    
    // Funções memoizadas para cálculos frequentes
    window.calculateStatistics = memoize(window.calculateStatistics || function() {});
    window.calculatePerformanceMetrics = memoize(window.calculatePerformanceMetrics || function() {});
    
    // Debounce para eventos de pesquisa
    const searchInputs = document.querySelectorAll('input[type="search"], .search-input');
    searchInputs.forEach(input => {
        const originalHandler = input.oninput;
        if (originalHandler) {
            input.oninput = debounce(originalHandler);
        }
    });
    
    // Throttle para eventos de scroll
    const scrollHandler = throttle(function() {
        // Lógica de tratamento de scroll
    });
    window.addEventListener('scroll', scrollHandler);
    
    // Inicializar workers se necessário
    if (PERFORMANCE_CONFIG.useWorkers) {
        // Pré-carregar workers comuns
        workerManager.getWorker('statisticsWorker', 'js/workers/statistics-worker.js');
        workerManager.getWorker('chartsWorker', 'js/workers/charts-worker.js');
    }
    
    console.log('Otimizações de desempenho inicializadas.');
}

/**
 * Exporta funções e objetos para uso global
 */
window.PerformanceUtils = {
    debounce,
    throttle,
    memoize,
    domUpdater,
    workerManager,
    dbStorage,
    CompressionUtil,
    withCache
};

// Inicializar otimizações quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initPerformanceOptimizations);
