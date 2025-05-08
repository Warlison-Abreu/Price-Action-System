/**
 * Sistema de Quantificação Price Action Brooks
 * Lógica para a página de Registro de Trades
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar formulário
    initializeForm();
    
    // Configurar eventos
    setupEventListeners();
});

/**
 * Inicializa o formulário carregando dados de referência
 */
async function initializeForm() {
    try {
        // Mostrar indicador de carregamento
        document.getElementById('loading-indicator').classList.remove('hidden');
        document.getElementById('trade-form').classList.add('hidden');
        
        // Carregar dados para os selects em paralelo
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
        
        // Preencher também as listas na sidebar
        populateSidebar(patterns, pairs);
        
        // Configurar data e hora atual
        setCurrentDateTime();
        
        // Esconder indicador de carregamento e mostrar formulário
        document.getElementById('loading-indicator').classList.add('hidden');
        document.getElementById('trade-form').classList.remove('hidden');
    } catch (error) {
        console.error('Erro ao inicializar formulário:', error);
        Utils.showToast('Erro ao carregar dados para o formulário.', 'error');
        
        // Esconder indicador de carregamento mesmo em caso de erro
        document.getElementById('loading-indicator').classList.add('hidden');
    }
}

/**
 * Preenche as listas da sidebar
 * @param {Array} patterns - Lista de padrões
 * @param {Array} pairs - Lista de pares de moedas
 */
function populateSidebar(patterns, pairs) {
    // Preencher lista de padrões
    const patternsList = document.querySelector('.patterns-list');
    if (patternsList) {
        patternsList.innerHTML = '';
        
        // Agrupar padrões por categoria
        const categorizedPatterns = {};
        
        patterns.forEach(pattern => {
            const category = pattern.Categoria || 'Outros';
            
            if (!categorizedPatterns[category]) {
                categorizedPatterns[category] = [];
            }
            
            categorizedPatterns[category].push(pattern);
        });
        
        // Adicionar padrões agrupados
        for (const category in categorizedPatterns) {
            // Adicionar cabeçalho da categoria
            const categoryHeader = document.createElement('li');
            categoryHeader.className = 'text-xs text-gray-400 mt-2 mb-1 pl-2';
            categoryHeader.textContent = category.toUpperCase();
            patternsList.appendChild(categoryHeader);
            
            // Adicionar padrões desta categoria
            categorizedPatterns[category].forEach(pattern => {
                const item = document.createElement('li');
                item.className = 'hover:bg-gray-700 p-2 rounded';
                item.innerHTML = `<a href="#" class="block" data-pattern="${pattern.Nome}">${pattern.Nome}</a>`;
                patternsList.appendChild(item);
                
                // Adicionar evento para pré-selecionar o padrão no formulário
                item.querySelector('a').addEventListener('click', function(e) {
                    e.preventDefault();
                    document.getElementById('pattern').value = this.getAttribute('data-pattern');
                });
            });
        }
    }
    
    // Preencher lista de pares
    const pairsList = document.querySelector('.pairs-list');
    if (pairsList) {
        pairsList.innerHTML = '';
        
        pairs.forEach(pair => {
            const item = document.createElement('li');
            item.className = 'flex justify-between items-center hover:bg-gray-700 p-2 rounded';
            
            // Gerar um valor de variação aleatório para demonstração
            const changeValue = (Math.random() * 0.5 - 0.25).toFixed(2);
            const changeClass = changeValue >= 0 ? 'text-green-400' : 'text-red-400';
            const changeSign = changeValue >= 0 ? '+' : '';
            
            item.innerHTML = `
                <a href="#" class="block" data-pair="${pair.Par}">${pair.Par}</a>
                <span class="${changeClass}">${changeSign}${changeValue}%</span>
            `;
            pairsList.appendChild(item);
            
            // Adicionar evento para pré-selecionar o par no formulário
            item.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                document.getElementById('pair').value = this.getAttribute('data-pair');
            });
        });
        
        // Adicionar opção "Ver Todos"
        const viewAllItem = document.createElement('li');
        viewAllItem.className = 'hover:bg-gray-700 p-2 rounded';
        viewAllItem.innerHTML = '<a href="#" class="block">Ver Todos...</a>';
        pairsList.appendChild(viewAllItem);
    }
}

/**
 * Define a data e hora atual no campo datetime
 */
function setCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    const datetimeInput = document.getElementById('datetime');
    
    if (datetimeInput) {
        datetimeInput.value = currentDateTime;
    }
}

/**
 * Configura os event listeners para o formulário
 */
function setupEventListeners() {
    // Botões principais
    const saveBtn = document.getElementById('save-trade-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveTrade);
    }
    
    const clearBtn = document.getElementById('clear-form-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearForm);
    }
    
    // Evento para calcular risk-reward
    const entryInput = document.getElementById('entry-price');
    const stopInput = document.getElementById('stop-loss');
    const targetInput = document.getElementById('take-profit');
    
    if (entryInput && stopInput && targetInput) {
        entryInput.addEventListener('input', updateRiskReward);
        stopInput.addEventListener('input', updateRiskReward);
        targetInput.addEventListener('input', updateRiskReward);
        
        // Adicionar evento para calcular automaticamente o resultado quando a operação for encerrada
        targetInput.addEventListener('change', suggestResult);
    }
    
    // Evento para selecionar seção do formulário ao clicar nos títulos
    document.querySelectorAll('h3.text-lg.font-bold').forEach(header => {
        header.addEventListener('click', function() {
            // Encontrar o próximo div depois do título
            let section = this.nextElementSibling;
            
            // Se o próximo elemento não for um div, procurar o próximo
            if (section.tagName !== 'DIV') {
                section = section.nextElementSibling;
            }
            
            // Alternar classe de visibilidade (implementação específica)
            // section.classList.toggle('hidden');
        });
    });
    
    // Configurar upload de screenshot
    setupScreenshotUpload();
    
    // Configurar alteração da cor do resultado com base no sinal
    const resultInput = document.getElementById('result');
    if (resultInput) {
        resultInput.addEventListener('input', function() {
            const value = parseFloat(this.value) || 0;
            
            if (value > 0) {
                this.classList.remove('text-red-600');
                this.classList.add('text-green-600');
            } else if (value < 0) {
                this.classList.remove('text-green-600');
                this.classList.add('text-red-600');
            } else {
                this.classList.remove('text-green-600', 'text-red-600');
            }
        });
    }
}

/**
 * Atualiza o cálculo de risk-reward baseado nos valores de entrada, stop e alvo
 */
function updateRiskReward() {
    const entryInput = document.getElementById('entry-price');
    const stopInput = document.getElementById('stop-loss');
    const targetInput = document.getElementById('take-profit');
    const rrText = document.getElementById('risk-reward');
    const rrBar = document.getElementById('risk-reward-bar');
    
    if (!entryInput.value || !stopInput.value || !targetInput.value) {
        return;
    }
    
    const entry = parseFloat(entryInput.value);
    const stop = parseFloat(stopInput.value);
    const target = parseFloat(targetInput.value);
    
    if (isNaN(entry) || isNaN(stop) || isNaN(target)) {
        return;
    }
    
    // Calcular risk e reward
    let risk, reward;
    
    // Para posição long
    if (document.getElementById('long').checked) {
        risk = Math.abs(entry - stop);
        reward = Math.abs(target - entry);
    } 
    // Para posição short
    else if (document.getElementById('short').checked) {
        risk = Math.abs(entry - stop);
        reward = Math.abs(entry - target);
    } 
    // Se nenhuma direção estiver selecionada
    else {
        return;
    }
    
    // Evitar divisão por zero
    if (risk === 0) {
        rrText.textContent = '∞';
        rrBar.style.width = '100%';
        return;
    }
    
    // Calcular ratio
    const ratio = reward / risk;
    
    // Atualizar texto e barra
    rrText.textContent = `1:${ratio.toFixed(1)}`;
    
    // Calcular largura da barra (máximo 100%)
    const barWidth = Math.min(ratio * 50, 100);
    rrBar.style.width = `${barWidth}%`;
    
    // Mudar cor conforme ratio
    if (ratio >= 2) {
        rrBar.classList.remove('bg-red-600', 'bg-yellow-500');
        rrBar.classList.add('bg-green-600');
    } else if (ratio >= 1) {
        rrBar.classList.remove('bg-red-600', 'bg-green-600');
        rrBar.classList.add('bg-yellow-500');
    } else {
        rrBar.classList.remove('bg-green-600', 'bg-yellow-500');
        rrBar.classList.add('bg-red-600');
    }
}

/**
 * Sugere um resultado automático para o trade com base nos valores de entrada, stop e target
 */
function suggestResult() {
    const entryInput = document.getElementById('entry-price');
    const stopInput = document.getElementById('stop-loss');
    const targetInput = document.getElementById('take-profit');
    const resultInput = document.getElementById('result');
    
    // Se o resultado já estiver definido, não substituir
    if (resultInput.value) {
        return;
    }
    
    if (!entryInput.value || !stopInput.value || !targetInput.value) {
        return;
    }
    
    const entry = parseFloat(entryInput.value);
    const stop = parseFloat(stopInput.value);
    const target = parseFloat(targetInput.value);
    
    if (isNaN(entry) || isNaN(stop) || isNaN(target)) {
        return;
    }
    
    // Calcular risk e reward
    let risk, reward;
    
    // Para posição long
    if (document.getElementById('long').checked) {
        risk = Math.abs(entry - stop);
        
        // Sugerir valor de +1R para target atingido
        resultInput.value = "+1.0"; 
        
        // Aplicar classe para colorir o valor
        resultInput.classList.remove('text-red-600');
        resultInput.classList.add('text-green-600');
    } 
    // Para posição short
    else if (document.getElementById('short').checked) {
        risk = Math.abs(entry - stop);
        
        // Sugerir valor de +1R para target atingido
        resultInput.value = "+1.0";
        
        // Aplicar classe para colorir o valor
        resultInput.classList.remove('text-red-600');
        resultInput.classList.add('text-green-600');
    }
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
 * Limpa o formulário
 */
function clearForm() {
    const form = document.getElementById('trade-form');
    
    if (confirm('Tem certeza que deseja limpar todos os campos do formulário?')) {
        form.reset();
        resetScreenshotUpload();
        setCurrentDateTime();
        
        // Resetar a barra de risk-reward
        const rrText = document.getElementById('risk-reward');
        const rrBar = document.getElementById('risk-reward-bar');
        
        if (rrText) rrText.textContent = '1:1.0';
        if (rrBar) {
            rrBar.style.width = '50%';
            rrBar.className = 'bg-blue-600 h-2.5 rounded-full';
        }
        
        Utils.showToast('Formulário limpo com sucesso.', 'success');
    }
}

/**
 * Salva o trade com base nos dados do formulário
 */
async function saveTrade() {
    try {
        // Validar formulário
        const form = document.getElementById('trade-form');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Mostrar indicador de carregamento no botão de salvar
        const saveBtn = document.getElementById('save-trade-btn');
        const originalBtnText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
        saveBtn.disabled = true;
        
        // Coletar dados do formulário
        const formData = {
            'Data e Hora': document.getElementById('datetime').value,
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
            'Notas e Lições': document.getElementById('lessons').value || ''
        };
        
        // Validar dados essenciais
        if (!formData['Par de Moedas'] || !formData['Padrão Brooks'] || !formData['Direção']) {
            Utils.showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            
            // Restaurar botão
            saveBtn.innerHTML = originalBtnText;
            saveBtn.disabled = false;
            
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
        
        // Restaurar botão
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
        
        // Exibir mensagem de sucesso
        Utils.showToast('Trade registrado com sucesso!', 'success');
        
        // Limpar formulário após salvar
        clearForm();
    } catch (error) {
        console.error('Erro ao salvar trade:', error);
        Utils.showToast('Erro ao salvar o trade. Tente novamente.', 'error');
        
        // Restaurar botão
        const saveBtn = document.getElementById('save-trade-btn');
        saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Salvar';
        saveBtn.disabled = false;
    }
}
