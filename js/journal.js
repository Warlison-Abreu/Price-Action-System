/**
 * Sistema de Quantificação Price Action Brooks
 * Lógica para a página de Diário de Trading
 */

// Estado da página
const journalState = {
    entries: [],           // Todas as entradas do diário
    filteredEntries: [],   // Entradas após aplicação de filtros
    currentPage: 1,        // Página atual
    entriesPerPage: 5,     // Número de entradas por página
    currentCategory: 'all', // Categoria selecionada atualmente
    dateRange: {
        from: null,
        to: null
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar filtros de data
    initializeFilters();
    
    // Carregar entradas do diário
    loadJournalEntries();
    
    // Configurar eventos
    setupEventListeners();
});

/**
 * Inicializa os filtros com valores padrão
 */
function initializeFilters() {
    // Configurar datas inicial e final com data atual e 30 dias atrás
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Formatar datas para input date (YYYY-MM-DD)
    const todayStr = today.toISOString().split('T')[0];
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    document.getElementById('date-to').value = todayStr;
    document.getElementById('date-from').value = thirtyDaysAgoStr;
    
    // Atualizar estado
    journalState.dateRange.from = thirtyDaysAgoStr;
    journalState.dateRange.to = todayStr;
    
    // Configurar data atual para o formulário
    document.getElementById('entry-date').value = todayStr;
}

/**
 * Configura os event listeners da página
 */
function setupEventListeners() {
    // Botão de nova entrada
    const newEntryBtn = document.getElementById('new-entry-btn');
    if (newEntryBtn) {
        newEntryBtn.addEventListener('click', showEntryModal);
    }
    
    // Botão de começar diário
    const startJournalBtn = document.getElementById('start-journal-btn');
    if (startJournalBtn) {
        startJournalBtn.addEventListener('click', showEntryModal);
    }
    
    // Botão de exportar
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportJournalEntries);
    }
    
    // Filtros de categoria
    document.querySelectorAll('a[data-category]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover classe ativa de todos os links
            document.querySelectorAll('a[data-category]').forEach(a => {
                a.parentElement.classList.remove('bg-blue-600');
                a.parentElement.classList.add('hover:bg-gray-700');
            });
            
            // Adicionar classe ativa ao link clicado
            this.parentElement.classList.remove('hover:bg-gray-700');
            this.parentElement.classList.add('bg-blue-600');
            
            // Atualizar categoria atual
            journalState.currentCategory = this.getAttribute('data-category');
            
            // Filtrar entradas e voltar para a primeira página
            filterEntries();
            journalState.currentPage = 1;
            renderEntries();
        });
    });
    
    // Filtro de data
    const applyDateFilterBtn = document.getElementById('apply-date-filter');
    if (applyDateFilterBtn) {
        applyDateFilterBtn.addEventListener('click', function() {
            const fromDate = document.getElementById('date-from').value;
            const toDate = document.getElementById('date-to').value;
            
            // Atualizar estado
            journalState.dateRange.from = fromDate;
            journalState.dateRange.to = toDate;
            
            // Filtrar entradas e voltar para a primeira página
            filterEntries();
            journalState.currentPage = 1;
            renderEntries();
            
            // Mostrar mensagem de sucesso
            Utils.showToast('Filtro aplicado com sucesso.', 'success');
        });
    }
    
    // Paginação
    document.getElementById('prev-page').addEventListener('click', function() {
        if (journalState.currentPage > 1) {
            journalState.currentPage--;
            renderEntries();
        }
    });
    
    document.getElementById('next-page').addEventListener('click', function() {
        const totalPages = Math.ceil(journalState.filteredEntries.length / journalState.entriesPerPage);
        if (journalState.currentPage < totalPages) {
            journalState.currentPage++;
            renderEntries();
        }
    });
    
    // Modal de entrada
    document.getElementById('close-modal').addEventListener('click', hideEntryModal);
    document.getElementById('cancel-btn').addEventListener('click', hideEntryModal);
    
    // Formulário de entrada
    document.getElementById('journal-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveJournalEntry();
    });
    
    // Screenshot upload
    setupScreenshotUpload();
}

/**
 * Configura o upload de screenshots
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
 * Carrega entradas do diário do armazenamento local
 * (Substituir por API quando backend estiver implementado)
 */
async function loadJournalEntries() {
    try {
        // Mostrar indicador de carregamento
        document.getElementById('loading-indicator').classList.remove('hidden');
        document.getElementById('journal-entries').classList.add('hidden');
        document.getElementById('pagination').classList.add('hidden');
        document.getElementById('no-entries-message').classList.add('hidden');
        
        // Carregar entradas do localStorage (temporário até backend estar pronto)
        // Posteriormente, isso será substituído por uma chamada à API
        const storedEntries = localStorage.getItem('journalEntries');
        let entries = storedEntries ? JSON.parse(storedEntries) : [];
        
        // Se não houver entradas armazenadas, criar alguns exemplos
        if (!entries || entries.length === 0) {
            entries = generateSampleEntries();
            localStorage.setItem('journalEntries', JSON.stringify(entries));
        }
        
        // Ordenar por data (mais recente primeiro)
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Armazenar dados para uso futuro
        journalState.entries = entries;
        
        // Filtrar entradas
        filterEntries();
        
        // Renderizar entradas
        renderEntries();
        
    } catch (error) {
        console.error('Erro ao carregar entradas:', error);
        Utils.showToast('Erro ao carregar entradas. Tente novamente.', 'error');
        
        // Esconder indicador de carregamento
        document.getElementById('loading-indicator').classList.add('hidden');
        
        // Mostrar mensagem de nenhuma entrada
        document.getElementById('no-entries-message').classList.remove('hidden');
    }
}

/**
 * Filtra entradas do diário com base nos filtros
 */
function filterEntries() {
    // Obter filtros
    const category = journalState.currentCategory;
    const { from, to } = journalState.dateRange;
    
    // Filtrar entradas
    journalState.filteredEntries = journalState.entries.filter(entry => {
        // Filtrar por categoria
        if (category !== 'all' && entry.category !== category) {
            return false;
        }
        
        // Filtrar por data
        if (from && to) {
            const entryDate = new Date(entry.date);
            const fromDate = new Date(from);
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59); // Definir para o final do dia
            
            if (entryDate < fromDate || entryDate > toDate) {
                return false;
            }
        }
        
        return true;
    });
}

/**
 * Renderiza as entradas do diário
 */
function renderEntries() {
    const entriesContainer = document.getElementById('journal-entries');
    
    // Verificar se há entradas para mostrar
    if (journalState.filteredEntries.length === 0) {
        // Esconder indicador de carregamento e container de entradas
        document.getElementById('loading-indicator').classList.add('hidden');
        entriesContainer.classList.add('hidden');
        document.getElementById('pagination').classList.add('hidden');
        
        // Mostrar mensagem de nenhuma entrada
        document.getElementById('no-entries-message').classList.remove('hidden');
        return;
    }
    
    // Calcular índices para paginação
    const startIndex = (journalState.currentPage - 1) * journalState.entriesPerPage;
    const endIndex = Math.min(startIndex + journalState.entriesPerPage, journalState.filteredEntries.length);
    const currentEntries = journalState.filteredEntries.slice(startIndex, endIndex);
    
    // Limpar container
    entriesContainer.innerHTML = '';
    
    // Adicionar cada entrada ao container
    currentEntries.forEach(entry => {
        // Determinar ícone e cor da categoria
        let categoryIcon, categoryColor;
        
        switch (entry.category) {
            case 'patterns':
                categoryIcon = 'fa-chart-line';
                categoryColor = 'text-blue-600';
                break;
            case 'psychology':
                categoryIcon = 'fa-brain';
                categoryColor = 'text-purple-600';
                break;
            case 'mistakes':
                categoryIcon = 'fa-exclamation-triangle';
                categoryColor = 'text-red-600';
                break;
            case 'strategy':
                categoryIcon = 'fa-chess';
                categoryColor = 'text-green-600';
                break;
            case 'risk':
                categoryIcon = 'fa-shield-alt';
                categoryColor = 'text-yellow-600';
                break;
            default:
                categoryIcon = 'fa-sticky-note';
                categoryColor = 'text-gray-600';
        }
        
        // Determinar ícone e cor da emoção
        let emotionIcon, emotionColor;
        
        switch (entry.emotion) {
            case 'confident':
                emotionIcon = 'fa-thumbs-up';
                emotionColor = 'text-blue-600';
                break;
            case 'focused':
                emotionIcon = 'fa-bullseye';
                emotionColor = 'text-purple-600';
                break;
            case 'anxious':
                emotionIcon = 'fa-bolt';
                emotionColor = 'text-yellow-600';
                break;
            case 'frustrated':
                emotionIcon = 'fa-angry';
                emotionColor = 'text-red-600';
                break;
            case 'satisfied':
                emotionIcon = 'fa-smile';
                emotionColor = 'text-green-600';
                break;
            default:
                emotionIcon = 'fa-meh';
                emotionColor = 'text-gray-600';
        }
        
        // Criar div para a entrada
        const entryDiv = document.createElement('div');
        entryDiv.className = 'bg-white rounded-lg shadow-md p-4 mb-4';
        
        // Conteúdo da entrada
        entryDiv.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h3 class="text-lg font-bold">${entry.title}</h3>
                    <div class="flex items-center text-sm text-gray-500">
                        <span class="mr-3">${Utils.formatDate(entry.date, 'short')}</span>
                        <span class="flex items-center ${categoryColor} mr-3">
                            <i class="fas ${categoryIcon} mr-1"></i>
                            ${getCategoryName(entry.category)}
                        </span>
                        <span class="flex items-center ${emotionColor}">
                            <i class="fas ${emotionIcon} mr-1"></i>
                            ${getEmotionName(entry.emotion)}
                        </span>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button class="edit-entry-btn text-blue-600 hover:text-blue-800" data-id="${entry.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-entry-btn text-red-600 hover:text-red-800" data-id="${entry.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="prose max-w-none">
                <p>${entry.content.replace(/\n/g, '<br>')}</p>
            </div>
        `;
        
        // Adicionar screenshot se houver
        if (entry.screenshot) {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'mt-4';
            imageContainer.innerHTML = `
                <div class="border p-1 rounded-md bg-gray-50 text-center">
                    <img src="${entry.screenshot}" alt="Screenshot" class="max-h-64 mx-auto">
                </div>
            `;
            entryDiv.appendChild(imageContainer);
        }
        
        // Adicionar ao container
        entriesContainer.appendChild(entryDiv);
    });
    
    // Adicionar eventos aos botões de ação
    document.querySelectorAll('.edit-entry-btn').forEach(button => {
        button.addEventListener('click', function() {
            const entryId = parseInt(this.getAttribute('data-id'));
            editEntry(entryId);
        });
    });
    
    document.querySelectorAll('.delete-entry-btn').forEach(button => {
        button.addEventListener('click', function() {
            const entryId = parseInt(this.getAttribute('data-id'));
            deleteEntry(entryId);
        });
    });
    
    // Atualizar paginação
    updatePagination();
    
    // Esconder indicador de carregamento e mostrar container de entradas
    document.getElementById('loading-indicator').classList.add('hidden');
    entriesContainer.classList.remove('hidden');
    document.getElementById('pagination').classList.remove('hidden');
    document.getElementById('no-entries-message').classList.add('hidden');
}

/**
 * Atualiza os elementos de paginação
 */
function updatePagination() {
    const totalEntries = journalState.filteredEntries.length;
    const totalPages = Math.ceil(totalEntries / journalState.entriesPerPage);
    const currentPage = journalState.currentPage;
    
    // Habilitar/desabilitar botões de navegação
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
    
    // Renderizar números de página
    const pageNumbers = document.getElementById('page-numbers');
    pageNumbers.innerHTML = '';
    
    // Determinar intervalo de páginas a mostrar
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Ajustar se estamos perto do final
    if (endPage - startPage < 4 && totalPages > 5) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Adicionar página inicial se necessário
    if (startPage > 1) {
        const button = createPageButton(1, currentPage);
        pageNumbers.appendChild(button);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'px-2 py-1';
            pageNumbers.appendChild(ellipsis);
        }
    }
    
    // Adicionar páginas do intervalo
    for (let i = startPage; i <= endPage; i++) {
        const button = createPageButton(i, currentPage);
        pageNumbers.appendChild(button);
    }
    
    // Adicionar página final se necessário
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'px-2 py-1';
            pageNumbers.appendChild(ellipsis);
        }
        
        const button = createPageButton(totalPages, currentPage);
        pageNumbers.appendChild(button);
    }
}

/**
 * Cria botão de página para paginação
 * @param {number} pageNumber - Número da página
 * @param {number} currentPage - Página atual
 * @return {HTMLElement} - Botão de página
 */
function createPageButton(pageNumber, currentPage) {
    const button = document.createElement('button');
    button.textContent = pageNumber;
    button.className = 'px-3 py-1 rounded-md';
    
    if (pageNumber === currentPage) {
        button.classList.add('bg-blue-600', 'text-white');
    } else {
        button.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
        
        // Adicionar evento de clique
        button.addEventListener('click', function() {
            journalState.currentPage = pageNumber;
            renderEntries();
        });
    }
    
    return button;
}

/**
 * Exibe o modal para adicionar nova entrada
 */
function showEntryModal() {
    // Resetar formulário
    document.getElementById('journal-form').reset();
    document.getElementById('entry-id').value = '';
    
    // Definir título do modal
    document.getElementById('modal-title').textContent = 'Nova Entrada no Diário';
    
    // Definir data atual
    document.getElementById('entry-date').value = new Date().toISOString().split('T')[0];
    
    // Resetar upload de screenshot
    resetScreenshotUpload();
    
    // Mostrar modal
    document.getElementById('journal-entry-modal').classList.remove('hidden');
}

/**
 * Esconde o modal de entrada
 */
function hideEntryModal() {
    document.getElementById('journal-entry-modal').classList.add('hidden');
}

/**
 * Edita uma entrada existente
 * @param {number} entryId - ID da entrada a ser editada
 */
function editEntry(entryId) {
    // Encontrar entrada pelo ID
    const entry = journalState.entries.find(e => e.id === entryId);
    
    if (!entry) {
        Utils.showToast('Entrada não encontrada.', 'error');
        return;
    }
    
    // Preencher formulário com dados da entrada
    document.getElementById('entry-id').value = entry.id;
    document.getElementById('entry-title').value = entry.title;
    document.getElementById('entry-date').value = entry.date;
    document.getElementById('entry-category').value = entry.category;
    document.getElementById('entry-content').value = entry.content;
    
    // Selecionar emoção
    document.querySelector(`input[name="entry-emotion"][value="${entry.emotion}"]`).checked = true;
    
    // Mostrar screenshot se houver
    if (entry.screenshot) {
        const uploadArea = document.getElementById('screenshot-upload');
        uploadArea.innerHTML = '';
        
        const img = document.createElement('img');
        img.src = entry.screenshot;
        img.classList.add('max-h-32', 'mx-auto', 'mt-2');
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="fas fa-times-circle"></i>';
        removeBtn.classList.add('absolute', 'top-2', 'right-2', 'text-red-500', 'text-xl');
        removeBtn.onclick = function(e) {
            e.stopPropagation();
            resetScreenshotUpload();
        };
        
        uploadArea.classList.add('relative');
        uploadArea.appendChild(img);
        uploadArea.appendChild(removeBtn);
    }
    
    // Definir título do modal
    document.getElementById('modal-title').textContent = 'Editar Entrada do Diário';
    
    // Mostrar modal
    document.getElementById('journal-entry-modal').classList.remove('hidden');
}

/**
 * Salva uma entrada de diário
 */
function saveJournalEntry() {
    // Obter dados do formulário
    const entryId = document.getElementById('entry-id').value;
    const title = document.getElementById('entry-title').value;
    const date = document.getElementById('entry-date').value;
    const category = document.getElementById('entry-category').value;
    const content = document.getElementById('entry-content').value;
    const emotion = document.querySelector('input[name="entry-emotion"]:checked').value;
    
    // Obter screenshot (se houver)
    const uploadArea = document.getElementById('screenshot-upload');
    const img = uploadArea.querySelector('img');
    const screenshot = img ? img.src : null;
    
    // Validar dados essenciais
    if (!title || !date || !category || !content) {
        Utils.showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    // Criar entrada
    const entry = {
        id: entryId ? parseInt(entryId) : Date.now(), // Usar timestamp como ID temporário
        title,
        date,
        category,
        content,
        emotion,
        screenshot,
        createdAt: entryId ? getExistingEntry(entryId).createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Atualizar ou inserir entrada
    if (entryId) {
        // Atualizar entrada existente
        const index = journalState.entries.findIndex(e => e.id === parseInt(entryId));
        if (index !== -1) {
            journalState.entries[index] = entry;
        }
    } else {
        // Inserir nova entrada
        journalState.entries.push(entry);
    }
    
    // Ordenar entradas por data (mais recente primeiro)
    journalState.entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Salvar no localStorage (temporário até backend estar pronto)
    localStorage.setItem('journalEntries', JSON.stringify(journalState.entries));
    
    // Filtrar e renderizar entradas
    filterEntries();
    renderEntries();
    
    // Fechar modal
    hideEntryModal();
    
    // Mostrar mensagem de sucesso
    Utils.showToast(entryId ? 'Entrada atualizada com sucesso.' : 'Entrada adicionada com sucesso.', 'success');
}

/**
 * Deleta uma entrada do diário
 * @param {number} entryId - ID da entrada a ser deletada
 */
function deleteEntry(entryId) {
    // Confirmar exclusão
    if (!confirm('Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    // Encontrar índice da entrada
    const index = journalState.entries.findIndex(e => e.id === entryId);
    
    if (index === -1) {
        Utils.showToast('Entrada não encontrada.', 'error');
        return;
    }
    
    // Remover entrada
    journalState.entries.splice(index, 1);
    
    // Salvar no localStorage
    localStorage.setItem('journalEntries', JSON.stringify(journalState.entries));
    
    // Filtrar e renderizar entradas
    filterEntries();
    renderEntries();
    
    // Mostrar mensagem de sucesso
    Utils.showToast('Entrada excluída com sucesso.', 'success');
}

/**
 * Encontra uma entrada existente pelo ID
 * @param {number|string} entryId - ID da entrada
 * @returns {Object|null} - Entrada encontrada ou null
 */
function getExistingEntry(entryId) {
    const id = parseInt(entryId);
    return journalState.entries.find(e => e.id === id) || null;
}

/**
 * Exporta as entradas do diário em formato PDF ou CSV
 */
function exportJournalEntries() {
    // Verificar se há entradas para exportar
    if (journalState.filteredEntries.length === 0) {
        Utils.showToast('Não há entradas para exportar.', 'error');
        return;
    }
    
    try {
        // Por enquanto, exportar como CSV (mais simples)
        // Preparar título do arquivo com data atual
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `diario_trading_${dateStr}.csv`;
        
        // Criar cabeçalhos do CSV
        const headers = ['ID', 'Título', 'Data', 'Categoria', 'Conteúdo', 'Emoção', 'Data de Criação', 'Última Atualização'];
        
        // Iniciar conteúdo CSV com cabeçalhos
        let csv = headers.join(',') + '\n';
        
        // Adicionar cada entrada
        journalState.filteredEntries.forEach(entry => {
            const row = [
                entry.id,
                `"${entry.title.replace(/"/g, '""')}"`,
                entry.date,
                getCategoryName(entry.category),
                `"${entry.content.replace(/"/g, '""')}"`,
                getEmotionName(entry.emotion),
                entry.createdAt,
                entry.updatedAt
            ];
            
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
        
        Utils.showToast('Diário exportado com sucesso.', 'success');
    } catch (error) {
        console.error('Erro ao exportar diário:', error);
        Utils.showToast('Erro ao exportar diário. Tente novamente.', 'error');
    }
}

/**
 * Obtém o nome da categoria a partir do código
 * @param {string} categoryCode - Código da categoria
 * @returns {string} - Nome da categoria
 */
function getCategoryName(categoryCode) {
    switch (categoryCode) {
        case 'patterns':
            return 'Padrões Price Action';
        case 'psychology':
            return 'Psicologia de Trading';
        case 'mistakes':
            return 'Erros e Lições';
        case 'strategy':
            return 'Estratégia';
        case 'risk':
            return 'Gestão de Risco';
        default:
            return 'Outro';
    }
}

/**
 * Obtém o nome da emoção a partir do código
 * @param {string} emotionCode - Código da emoção
 * @returns {string} - Nome da emoção
 */
function getEmotionName(emotionCode) {
    switch (emotionCode) {
        case 'confident':
            return 'Confiante';
        case 'focused':
            return 'Focado';
        case 'anxious':
            return 'Ansioso';
        case 'frustrated':
            return 'Frustrado';
        case 'satisfied':
            return 'Satisfeito';
        default:
            return 'Neutro';
    }
}

/**
 * Gera entradas de exemplo para demonstração
 * @returns {Array} - Entradas de exemplo
 */
function generateSampleEntries() {
    const currentDate = new Date();
    
    // Array para armazenar entradas
    const entries = [];
    
    // Exemplo 1 - Padrões Price Action
    entries.push({
        id: 1,
        title: "Identificando e negociando Major Trend Reversals",
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1).toISOString().split('T')[0],
        category: "patterns",
        content: "Hoje estudei os Major Trend Reversals (MTR) de Al Brooks. Percebi que é crucial identificar primeiro uma tendência forte, seguida de um pullback que rompe o canal da tendência. O segundo pullback na direção oposta é o sinal para entrada.\n\nPontos importantes:\n- Procurar tendências com pelo menos 10 barras\n- O primeiro pullback deve quebrar a linha de tendência\n- Entrar na reversão somente após confirmar o segundo pullback\n- Stop deve ser acima/abaixo do ponto de início da reversão",
        emotion: "focused",
        screenshot: null,
        createdAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1).toISOString(),
        updatedAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1).toISOString()
    });
    
    // Exemplo 2 - Psicologia
    entries.push({
        id: 2,
        title: "Superando o medo de entrar em trades após perdas consecutivas",
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 3).toISOString().split('T')[0],
        category: "psychology",
        content: "Após três perdas seguidas ontem, percebi que estava hesitante em entrar em novos trades hoje, mesmo quando identificava setups válidos. Decidi implementar algumas estratégias para gerenciar este medo:\n\n1. Reduzir temporariamente o tamanho da posição para 50% do normal\n2. Focar apenas em setups A (alta qualidade)\n3. Revisar as perdas anteriores para confirmar se foram realmente setups válidos ou se eu estava forçando entradas\n\nResultado: Consegui entrar em dois trades hoje, ambos com lucro, o que ajudou a restaurar minha confiança. A chave foi reduzir o risco enquanto trabalhava no aspecto psicológico.",
        emotion: "anxious",
        screenshot: null,
        createdAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 3).toISOString(),
        updatedAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 3).toISOString()
    });
    
    // Exemplo 3 - Erros e Lições
    entries.push({
        id: 3,
        title: "Erro crítico: Entrar contra uma tendência forte",
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 5).toISOString().split('T')[0],
        category: "mistakes",
        content: "Hoje cometi um erro clássico que Brooks sempre alerta: entrei em um trade contra uma tendência forte baseado apenas em um pullback. O mercado estava em clara tendência de alta e identifiquei o que parecia ser um Wedge, mas ignorei o contexto maior.\n\nResgate rápido:\n- A tendência é seu amigo, não seu inimigo\n- Um padrão de reversão requer confirmação adicional quando vai contra a tendência predominante\n- Se for entrar contra a tendência, exija pelo menos 3 sinais de confirmação\n\nPerdi 1.5R neste trade, e o pior é que eu sabia que não deveria ter entrado. Disciplina é essencial.",
        emotion: "frustrated",
        screenshot: null,
        createdAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 5).toISOString(),
        updatedAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 5).toISOString()
    });
    
    // Exemplo 4 - Estratégia
    entries.push({
        id: 4,
        title: "Refinando estratégia para contextos de range",
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 8).toISOString().split('T')[0],
        category: "strategy",
        content: "Estou refinando minha estratégia para mercados em consolidação (ranges). Após analisar os últimos 20 trades em contextos de range, percebi que:\n\n1. Os breakouts falsos são muito comuns (70% dos casos)\n2. Reversões nas extremidades do range têm taxa de acerto maior (65% vs 40% no meio do range)\n3. Os melhores setups são reversões após falha no rompimento (Trading Range Reversals)\n\nNova abordagem:\n- Priorizar entradas contra o movimento após testes de extremidades\n- Exigir pelo menos 2 barras de rejeição/reversão antes de entrar\n- Usar alvos conservadores (70% da largura do range)\n- Evitar completamente trades no meio do range",
        emotion: "satisfied",
        screenshot: null,
        createdAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 8).toISOString(),
        updatedAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 8).toISOString()
    });
    
    // Exemplo 5 - Gestão de Risco
    entries.push({
        id: 5,
        title: "Implementando planejamento de risco semanal",
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 10).toISOString().split('T')[0],
        category: "risk",
        content: "Comecei a implementar um sistema de gestão de risco semanal para manter minha exposição sob controle. Regras:\n\n1. Nunca arriscar mais de 2% da conta por trade\n2. Limite de perda diário de 4% da conta\n3. Limite de perda semanal de 8% da conta\n4. Se atingir 80% do limite diário ou semanal, reduzir o risco por trade para 1% até o próximo período\n5. Se atingir 3 trades consecutivos com lucro, posso aumentar para 2.5% por trade no próximo\n\nEstou testando isto por 30 dias para ver se melhora minha curva de capital. Acredito que esta estrutura ajudará a proteger o capital durante períodos ruins e ainda permitir crescimento nos bons momentos.",
        emotion: "confident",
        screenshot: null,
        createdAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 10).toISOString(),
        updatedAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 10).toISOString()
    });
    
    // Exemplo 6 - Padrões Price Action (mais recente)
    entries.push({
        id: 6,
        title: "Estudo aprofundado: High 2 e Low 2 em diferentes contextos",
        date: currentDate.toISOString().split('T')[0],
        category: "patterns",
        content: "Dediquei o dia a estudar como os padrões High 2 e Low 2 de Brooks se comportam em diferentes contextos de mercado. Resultados interessantes:\n\n1. Em tendências fortes: taxa de acerto de ~70%, expectativa de +1.5R\n2. Em tendências moderadas: taxa de acerto de ~60%, expectativa de +0.8R\n3. Em tendências fracas: taxa de acerto de ~45%, expectativa de -0.2R\n4. Em ranges: taxa de acerto de ~35%, expectativa de -0.6R\n\nConclusão óbvia: estes setups devem ser negociados primariamente em contextos de tendência. Nos ranges, é melhor evitá-los ou inverter a lógica (negociar contra o padrão).\n\nDetalhes específicos para reconhecimento:\n- O pullback deve ter pelo menos 3 barras\n- O sinal mais forte é quando o segundo pullback é menor que o primeiro\n- Nunca entrar se o segundo pullback ultrapassar o início do primeiro",
        emotion: "focused",
        screenshot: null,
        createdAt: currentDate.toISOString(),
        updatedAt: currentDate.toISOString()
    });
    
    return entries;
}
