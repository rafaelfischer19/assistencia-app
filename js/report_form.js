// js/report_form.js

// Garante que o jsPDF esteja disponível globalmente (ele será carregado no index.html principal)
const { jsPDF } = window.jspdf;

// Variáveis globais para o SpeechRecognition (uma instância por transcrição ativa)
let recognition = null;
let currentTextArea = null;
let recognitionStatusSpan = null;
let currentSectionCounter = 0; // Usar um contador local para as seções do formulário

// Tópicos obrigatórios do relatório
const mandatoryTopics = [
    "1. Objetivo",
    "2. Periodo da Inspeção",
    "3. Características do equipamento",
    "4. Acompanharam a Inspeção",
    "5. Inspeção e Analise das Condições Físicas",
    "5.1 Gerador de Vapor",
    "5.1.1 – Lado da água",
    "5.1.2 – Lado dos gases",
    "5.1.3 – Acessórios",
    "5.2- Fornalha",
    "5.3- Grelha Rotativa",
    "5.3.1 – Medição de espessura, tapete grelha rotativa",
    "5.4 – Refratários",
    "5.5- Sistema de ar de combustão",
    "5.5.1 - Ar Primário",
    "5.5.2 - Ar Secundário",
    "5.6- Sistema de tiragem de gases",
    "5.6.1 Filtro",
    "5.6.2- Pré ar",
    "5.6.3 - Dutos/Dampers/Exaustor e chaminé",
    "5.7- Sistema de descarga de fundo",
    "5.8- Sistema de alimentação de água",
    "6. Aspectos de segurança",
    "7. Recomendações",
    "8. Sugestão de Manutenção",
    "9. Conclusão"
];

// Função para iniciar a transcrição
const startTranscription = (textAreaId, statusSpanId) => {
    currentTextArea = document.getElementById(textAreaId);
    recognitionStatusSpan = document.getElementById(statusSpanId);

    if (!('webkitSpeechRecognition' in window)) {
        alert('Seu navegador não suporta a API de Reconhecimento de Fala. Use o Google Chrome.');
        return;
    }

    if (recognition) {
        recognition.stop();
    }

    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    let finalTranscript = '';

    recognition.onstart = () => {
        recognitionStatusSpan.textContent = 'Gravando...';
        recognitionStatusSpan.style.color = 'green';
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        currentTextArea.value = finalTranscript + interimTranscript;
    };

    recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de fala:', event.error);
        recognitionStatusSpan.textContent = `Erro: ${event.error}`;
        recognitionStatusSpan.style.color = 'red';
        if (event.error === 'no-speech') {
            alert('Nenhuma fala detectada. Tente novamente.');
        } else if (event.error === 'not-allowed') {
            alert('Permissão de microfone negada. Por favor, permita o acesso ao microfone.');
        }
    };

    recognition.onend = () => {
        recognitionStatusSpan.textContent = 'Parado';
        recognitionStatusSpan.style.color = '';
        console.log('Reconhecimento de fala finalizado.');
    };

    recognition.start();
};

// Função para parar a transcrição
const stopTranscription = () => {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
};

// Adiciona uma nova seção de conteúdo ao formulário
const addNewSection = (topic = null) => {
    currentSectionCounter++;
    const reportContentContainer = document.getElementById('reportContentContainer');

    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('content-group');
    sectionDiv.dataset.sectionId = currentSectionCounter; // Adiciona um ID para facilitar a manipulação

    const sectionTitleInputId = `sectionTitle-${currentSectionCounter}`;
    const sectionContentTextAreaId = `sectionContent-${currentSectionCounter}`;
    const recognitionStatusId = `recognitionStatus-${currentSectionCounter}`;
    const imageUploadId = `imageUpload-${currentSectionCounter}`;
    const imagePreviewContainerId = `imagePreviewContainer-${currentSectionCounter}`;


    let titleOptionsHtml = mandatoryTopics.map(topic => `<option value="${topic}">${topic}</option>`).join('');
    if (topic) {
        titleOptionsHtml = `<option value="${topic}" selected>${topic}</option>` + titleOptionsHtml;
    } else {
        titleOptionsHtml = `<option value="" selected disabled>Selecione um tópico ou digite</option>` + titleOptionsHtml;
    }


    sectionDiv.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label for="${sectionTitleInputId}">Título da Seção ${currentSectionCounter}:</label>
                <input type="text" id="${sectionTitleInputId}" class="report-title" list="mandatoryTopicsList" placeholder="Ex: 1. Objetivo" value="${topic || ''}">
                <datalist id="mandatoryTopicsList">
                    ${mandatoryTopics.map(t => `<option value="${t}"></option>`).join('')}
                </datalist>
            </div>
            <div class="form-group" style="flex: 0 0 auto;">
                <button type="button" class="remove-section-btn" data-section-id="${currentSectionCounter}">Remover Seção</button>
            </div>
        </div>
        <div class="form-group">
            <label for="${sectionContentTextAreaId}">Conteúdo:</label>
            <textarea id="${sectionContentTextAreaId}" class="report-content" rows="6"></textarea>
            <div class="speech-controls">
                <button type="button" class="start-speech" data-textarea="${sectionContentTextAreaId}" data-status="${recognitionStatusId}">Gravar Áudio</button>
                <button type="button" class="stop-speech">Parar Gravação</button>
                <span id="${recognitionStatusId}" class="recognition-status"></span>
            </div>
        </div>
        <div class="image-upload-group">
            <label for="${imageUploadId}">Adicionar Imagens:</label>
            <input type="file" id="${imageUploadId}" class="image-upload-input" accept="image/*" multiple>
            <div id="${imagePreviewContainerId}" class="image-preview-container">
                </div>
        </div>
        <hr>
    `;

    reportContentContainer.appendChild(sectionDiv);

    // Adiciona event listeners para os botões de transcrição na nova seção
    const startSpeechBtn = sectionDiv.querySelector(`.start-speech[data-textarea="${sectionContentTextAreaId}"]`);
    const stopSpeechBtn = sectionDiv.querySelector('.stop-speech');
    const removeSectionBtn = sectionDiv.querySelector(`.remove-section-btn[data-section-id="${currentSectionCounter}"]`);
    const imageUploadInput = sectionDiv.querySelector(`.image-upload-input`);

    if (startSpeechBtn) {
        startSpeechBtn.addEventListener('click', () => startTranscription(sectionContentTextAreaId, recognitionStatusId));
    }
    if (stopSpeechBtn) {
        stopSpeechBtn.addEventListener('click', stopTranscription);
    }
    if (removeSectionBtn) {
        removeSectionBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja remover esta seção?')) {
                sectionDiv.remove();
            }
        });
    }
    if (imageUploadInput) {
        imageUploadInput.addEventListener('change', (event) => handleImageUploadChange(event, imagePreviewContainerId));
    }
};

// Limpa todas as seções de conteúdo dinâmicas
const clearAllSections = () => {
    const reportContentContainer = document.getElementById('reportContentContainer');
    reportContentContainer.innerHTML = '';
    currentSectionCounter = 0; // Reseta o contador
    // Adiciona os tópicos obrigatórios novamente, se desejar
    mandatoryTopics.forEach(topic => addNewSection(topic));
};

// Lida com o upload de imagens e exibe prévias
const handleImageUploadChange = (event, previewContainerId) => {
    const previewContainer = document.getElementById(previewContainerId);
    const files = event.target.files;

    if (!previewContainer) {
        console.error("Contêiner de pré-visualização não encontrado:", previewContainerId);
        return;
    }

    // Limpa prévias existentes para evitar duplicação se o input não for 'multiple' ou for para substituir
    // Se você quer adicionar mais imagens, remova esta linha:
    // previewContainer.innerHTML = '';

    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgGroup = document.createElement('div');
                imgGroup.classList.add('image-preview-group');
                imgGroup.innerHTML = `
                    <img src="${e.target.result}" class="image-preview" alt="Pré-visualização da imagem">
                    <input type="text" class="image-caption" placeholder="Legenda da imagem">
                    <button type="button" class="remove-image-btn">Remover</button>
                `;
                previewContainer.appendChild(imgGroup);

                imgGroup.querySelector('.remove-image-btn').addEventListener('click', () => {
                    imgGroup.remove();
                });
            };
            reader.readAsDataURL(file);
        } else {
            alert('Por favor, selecione apenas arquivos de imagem.');
        }
    });
};

// Salva o relatório atual no localStorage
const saveReport = () => {
    const cliente = document.getElementById('cliente').value;
    const tecnico = document.getElementById('tecnico').value;
    const data = document.getElementById('data').value;
    const local = document.getElementById('local').value;

    if (!cliente || !tecnico || !data || !local) {
        alert('Preencha os dados do cabeçalho (Cliente, Técnico, Data, Local) antes de salvar.');
        return;
    }

    const sectionsData = [];
    document.querySelectorAll('.content-group').forEach(sectionDiv => {
        const sectionId = sectionDiv.dataset.sectionId;
        const title = sectionDiv.querySelector('.report-title').value;
        const content = sectionDiv.querySelector('.report-content').value;
        const images = [];

        sectionDiv.querySelectorAll('.image-preview-group').forEach(imgGroup => {
            const imgSrc = imgGroup.querySelector('.image-preview').src;
            const imgCaption = imgGroup.querySelector('.image-caption').value;
            images.push({ url: imgSrc, caption: imgCaption });
        });

        sectionsData.push({ id: sectionId, title, content, images });
    });

    const reportData = {
        cliente,
        tecnico,
        data,
        local,
        sections: sectionsData
    };

    // Gera um nome de arquivo único para o relatório
    const reportName = `relatorio_${cliente.replace(/\s/g, '_')}_${data}.json`;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = reportName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Relatório salvo como ' + reportName);

    // Opcional: Adicionar ao localStorage para a página de consulta
    const loadedReports = JSON.parse(localStorage.getItem('loadedReports')) || [];
    loadedReports.push(reportData); // Você pode precisar adicionar um identificador único se for carregar múltiplos
    localStorage.setItem('loadedReports', JSON.stringify(loadedReports));
    console.log("Relatório salvo no localStorage:", reportData);
};

// Carrega um relatório de um arquivo JSON
const loadReport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const reportData = JSON.parse(e.target.result);
            loadReportDataIntoForm(reportData);
            alert('Relatório carregado com sucesso!');
        } catch (error) {
            console.error("Erro ao carregar relatório:", error);
            alert('Erro ao carregar o arquivo. Verifique se é um arquivo JSON válido.');
        }
    };
    reader.readAsText(file);
};

// Popula o formulário com dados de um relatório carregado
const loadReportDataIntoForm = (data) => {
    document.getElementById('cliente').value = data.cliente;
    document.getElementById('tecnico').value = data.tecnico;
    document.getElementById('data').value = data.data;
    document.getElementById('local').value = data.local;

    clearAllSections(); // Limpa seções existentes antes de carregar novas
    currentSectionCounter = 0; // Reinicia o contador para que os IDs fiquem corretos

    data.sections.forEach(section => {
        currentSectionCounter++; // Incrementa para cada seção carregada
        const reportContentContainer = document.getElementById('reportContentContainer');

        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('content-group');
        sectionDiv.dataset.sectionId = currentSectionCounter;

        const sectionTitleInputId = `sectionTitle-${currentSectionCounter}`;
        const sectionContentTextAreaId = `sectionContent-${currentSectionCounter}`;
        const recognitionStatusId = `recognitionStatus-${currentSectionCounter}`;
        const imageUploadId = `imageUpload-${currentSectionCounter}`;
        const imagePreviewContainerId = `imagePreviewContainer-${currentSectionCounter}`;

        sectionDiv.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="${sectionTitleInputId}">Título da Seção ${currentSectionCounter}:</label>
                    <input type="text" id="${sectionTitleInputId}" class="report-title" list="mandatoryTopicsList" value="${section.title || ''}">
                    <datalist id="mandatoryTopicsList">
                        ${mandatoryTopics.map(t => `<option value="${t}"></option>`).join('')}
                    </datalist>
                </div>
                <div class="form-group" style="flex: 0 0 auto;">
                    <button type="button" class="remove-section-btn" data-section-id="${currentSectionCounter}">Remover Seção</button>
                </div>
            </div>
            <div class="form-group">
                <label for="${sectionContentTextAreaId}">Conteúdo:</label>
                <textarea id="${sectionContentTextAreaId}" class="report-content" rows="6">${section.content || ''}</textarea>
                <div class="speech-controls">
                    <button type="button" class="start-speech" data-textarea="${sectionContentTextAreaId}" data-status="${recognitionStatusId}">Gravar Áudio</button>
                    <button type="button" class="stop-speech">Parar Gravação</button>
                    <span id="${recognitionStatusId}" class="recognition-status"></span>
                </div>
            </div>
            <div class="image-upload-group">
                <label for="${imageUploadId}">Adicionar Imagens:</label>
                <input type="file" id="${imageUploadId}" class="image-upload-input" accept="image/*" multiple>
                <div id="${imagePreviewContainerId}" class="image-preview-container">
                    </div>
            </div>
            <hr>
        `;
        reportContentContainer.appendChild(sectionDiv);

        // Preencher imagens
        const previewContainer = sectionDiv.querySelector(`#${imagePreviewContainerId}`);
        section.images.forEach(imgData => {
            const imgGroup = document.createElement('div');
            imgGroup.classList.add('image-preview-group');
            imgGroup.innerHTML = `
                <img src="${imgData.url}" class="image-preview" alt="Pré-visualização da imagem">
                <input type="text" class="image-caption" placeholder="Legenda da imagem" value="${imgData.caption || ''}">
                <button type="button" class="remove-image-btn">Remover</button>
            `;
            previewContainer.appendChild(imgGroup);
            imgGroup.querySelector('.remove-image-btn').addEventListener('click', () => {
                imgGroup.remove();
            });
        });

        // Re-adicionar event listeners
        const startSpeechBtn = sectionDiv.querySelector(`.start-speech[data-textarea="${sectionContentTextAreaId}"]`);
        const stopSpeechBtn = sectionDiv.querySelector('.stop-speech');
        const removeSectionBtn = sectionDiv.querySelector(`.remove-section-btn[data-section-id="${currentSectionCounter}"]`);
        const imageUploadInput = sectionDiv.querySelector(`.image-upload-input`);

        if (startSpeechBtn) {
            startSpeechBtn.addEventListener('click', () => startTranscription(sectionContentTextAreaId, recognitionStatusId));
        }
        if (stopSpeechBtn) {
            stopSpeechBtn.addEventListener('click', stopTranscription);
        }
        if (removeSectionBtn) {
            removeSectionBtn.addEventListener('click', () => {
                if (confirm('Tem certeza que deseja remover esta seção?')) {
                    sectionDiv.remove();
                }
            });
        }
        if (imageUploadInput) {
            imageUploadInput.addEventListener('change', (event) => handleImageUploadChange(event, imagePreviewContainerId));
        }
    });

    populateReportFormSelects(); // Garante que os selects de cliente/técnico estejam atualizados
};


// Função para inicializar o formulário de relatório
const initializeReportForm = () => {
    console.log("initializeReportForm: Iniciando inicialização do formulário de relatório.");

    const addSectionBtn = document.getElementById('addSection');
    const clearAllSectionsBtn = document.getElementById('clearAllSections'); // Certifique-se de ter este botão no HTML
    const saveReportBtn = document.getElementById('saveReport');
    const loadReportInput = document.getElementById('loadReportInput');
    const loadReportBtn = document.getElementById('loadReportBtn');
    const generatePdfButton = document.getElementById('generatePdf'); // Botão de gerar PDF

    // Remove listeners para evitar duplicação se a página for recarregada
    if (addSectionBtn) {
        addSectionBtn.removeEventListener('click', addNewSection);
        addSectionBtn.addEventListener('click', () => addNewSection(null)); // Adiciona nova seção sem tópico predefinido
    }
    if (clearAllSectionsBtn) {
        clearAllSectionsBtn.removeEventListener('click', clearAllSections);
        clearAllSectionsBtn.addEventListener('click', clearAllSections);
    }
    if (saveReportBtn) {
        saveReportBtn.removeEventListener('click', saveReport);
        saveReportBtn.addEventListener('click', saveReport);
    }
    if (loadReportBtn) {
        loadReportBtn.removeEventListener('click', () => loadReportInput.click());
        loadReportBtn.addEventListener('click', () => loadReportInput.click());
    }
    if (loadReportInput) {
        loadReportInput.removeEventListener('change', loadReport);
        loadReportInput.addEventListener('change', loadReport);
    }
    if (generatePdfButton) {
        generatePdfButton.removeEventListener('click', generatePdf);
        generatePdfButton.addEventListener('click', generatePdf);
    }

    // Adiciona os tópicos obrigatórios ao inicializar, se não houver seções carregadas
    const reportContentContainer = document.getElementById('reportContentContainer');
    if (reportContentContainer && reportContentContainer.children.length === 0) {
        currentSectionCounter = 0; // Garante que o contador esteja resetado
        mandatoryTopics.forEach(topic => addNewSection(topic));
    }

    populateReportFormSelects(); // Popula os selects de cliente e técnico
    console.log("initializeReportForm: Formulário de relatório inicializado.");
};


// Função para popular os selects de cliente e técnico (chamada também do main.js)
// Precisa estar no window para ser acessível do main.js
window.populateReportFormSelects = () => {
    const clienteSelect = document.getElementById('cliente');
    const tecnicoSelect = document.getElementById('tecnico');

    if (!clienteSelect || !tecnicoSelect) {
        console.warn("Elementos select de cliente ou técnico não encontrados no DOM.");
        return;
    }

    // Limpa opções antigas
    clienteSelect.innerHTML = '<option value="">Selecione um cliente</option>';
    tecnicoSelect.innerHTML = '<option value="">Selecione um técnico</option>';

    const clients = JSON.parse(localStorage.getItem('clients')) || [];
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.name;
        option.textContent = client.name;
        clienteSelect.appendChild(option);
    });

    const technicians = JSON.parse(localStorage.getItem('technicians')) || [];
    technicians.forEach(technician => {
        const option = document.createElement('option');
        option.value = technician.name;
        option.textContent = technician.name;
        tecnicoSelect.appendChild(option);
    });
};

// Função para gerar o PDF (Esta é a função que foi modificada)
const generatePdf = async () => {
    try {
        console.log("Iniciando geração do PDF...");

        // Coletar dados do formulário
        const clienteNome = document.getElementById('cliente').value;
        const tecnicoNome = document.getElementById('tecnico').value;
        const dataRelatorio = document.getElementById('data').value;
        const localRelatorio = document.getElementById('local').value;

        // Validar dados essenciais
        if (!clienteNome || !tecnicoNome || !dataRelatorio || !localRelatorio) {
            alert('Por favor, preencha todos os campos de cabeçalho (Cliente, Técnico, Data, Local) antes de gerar o PDF.');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        let currentPageNumber = 1;

        // Helper para adicionar cabeçalho e rodapé em novas páginas de CONTEÚDO
        const addContentPageHeaderAndFooter = (doc, pageNum) => {
            doc.setFontSize(10);
            doc.setTextColor(100);
            // Cabeçalho: Apenas "RELATÓRIO DE INSPEÇÃO" e número da página
            doc.text("RELATÓRIO DE INSPEÇÃO", margin, margin / 2 + 5);
            doc.text(`${pageNum}`, pageWidth - margin - 5, pageHeight - 5); // Número da página no rodapé
            // Rodapé: Informações de contato
            doc.text("Rua Lilly Bremer, 322 Bairro Navegantes- Fone 47-3531-9000 Fax 47-3525-1975 e-mail: assistencia@bremer.com.br CEP 89160-000- Rio do Sul-SC", margin, pageHeight - 5);
            doc.setTextColor(0); // Reseta a cor do texto para preto
            doc.setFontSize(10); // Reseta o tamanho da fonte
        };

        // Função auxiliar para verificar e adicionar nova página
        const checkNewPage = (doc, currentY, contentHeight) => {
            const footerHeight = 20; // Espaço para o rodapé
            const headerHeight = 20; // Espaço para o cabeçalho (apenas título)
            if (currentY + contentHeight > pageHeight - (margin + footerHeight)) {
                doc.addPage();
                currentPageNumber++;
                addContentPageHeaderAndFooter(doc, currentPageNumber);
                return margin + headerHeight; // Retorna o Y inicial para a nova página, deixando espaço para o cabeçalho
            }
            return currentY;
        };

        // --- Página de Rosto (Primeira Página) ---
        let yPosition = margin; // Inicia na margem superior

        // Título principal
        doc.setFontSize(16);
        doc.text("RELATÓRIO DE INSPEÇÃO", pageWidth / 2, yPosition + 30, { align: 'center' });
        
        // Informações do relatório
        doc.setFontSize(12);
        doc.text(`CLIENTE: ${clienteNome}`, margin, yPosition + 50);
        doc.text(`TÉCNICO: ${tecnicoNome}`, margin, yPosition + 60);
        doc.text(`DATA: ${dataRelatorio}`, margin, yPosition + 70);
        doc.text(`LOCAL: ${localRelatorio}`, margin, yPosition + 80);

        // Adiciona a imagem de logo da H. Bremer (ajuste o caminho ou use base64)
        // Exemplo: se você tiver a imagem como base64, você pode usar:
        // const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."; // Substitua pela sua string base64
        // doc.addImage(logoBase64, 'PNG', pageWidth - margin - 50, margin + 5, 40, 40); // Ajuste X, Y, largura, altura

        // Rodapé da primeira página (diferente das páginas de conteúdo)
        doc.setFontSize(8);
        doc.text("Rua Lilly Bremer, 322 Bairro Navegantes- Fone 47-3531-9000 Fax 47-3525-1975 e-mail: assistencia@bremer.com.br CEP 89160-000- Rio do Sul-SC", margin, pageHeight - 5);
        doc.text("1", pageWidth - margin - 5, pageHeight - 5); // Número da página 1

        // --- Início do Conteúdo do Relatório (A partir da Segunda Página) ---
        doc.addPage(); // Adiciona a segunda página para o conteúdo do relatório
        currentPageNumber++;
        addContentPageHeaderAndFooter(doc, currentPageNumber); // Adiciona cabeçalho/rodapé da nova página
        yPosition = margin + 20; // Reinicia yPosition para o conteúdo (abaixo do cabeçalho de conteúdo)

        // Iterar sobre as seções do relatório
        const reportContentContainer = document.getElementById('reportContentContainer');
        const contentSections = reportContentContainer.querySelectorAll('.content-group');

        for (const sectionDiv of contentSections) {
            const sectionTitle = sectionDiv.querySelector('.report-title').value;
            const sectionContent = sectionDiv.querySelector('.report-content').value;
            const sectionImages = [];
            sectionDiv.querySelectorAll('.image-preview-group').forEach(imgGroup => {
                const imgPreview = imgGroup.querySelector('.image-preview');
                const imgCaption = imgGroup.querySelector('.image-caption').value;
                if (imgPreview && imgPreview.src && imgPreview.src !== '#' && imgPreview.style.display !== 'none') {
                    sectionImages.push({ url: imgPreview.src, caption: imgCaption });
                }
            });

            // Adicionar título da seção
            yPosition = checkNewPage(doc, yPosition, 10); // Espaço para o título
            doc.setFontSize(12);
            doc.text(sectionTitle, margin, yPosition);
            yPosition += 8; // Espaço após o título

            // Adicionar conteúdo da seção
            doc.setFontSize(10);
            const splitContent = doc.splitTextToSize(sectionContent, pageWidth - (margin * 2));
            yPosition = checkNewPage(doc, yPosition, splitContent.length * 7); // Altura estimada do texto
            doc.text(splitContent, margin, yPosition);
            yPosition += (splitContent.length * 7) + 5; // Avança Y após o texto + padding

            // Seção de Imagens
            if (sectionImages.length > 0) {
                const imgColumnWidth = (pageWidth - (margin * 2) - 10) / 2; // Duas colunas com 10px de gap entre elas
                const fixedImgHeight = 70; // Altura máxima/base para a imagem antes da proporcionalidade
                const paddingBetweenImageAndCaption = 5;
                const captionLineHeight = 4; // Altura de uma linha de texto da legenda
                const maxCaptionLines = 3; // Número máximo de linhas para a legenda antes de truncar/quebrar

                let currentX = margin; // Posição X inicial para a primeira coluna
                let currentImagesBlockY = yPosition; // Inicia o Y para o bloco de imagens da seção

                // Adiciona um subtítulo para as imagens da seção
                currentImagesBlockY = checkNewPage(doc, currentImagesBlockY, 20);
                doc.setFontSize(12);
                doc.text("Imagens da Seção:", margin, currentImagesBlockY);
                currentImagesBlockY += 10; // Espaço após o subtítulo

                for (let i = 0; i < sectionImages.length; i++) {
                    const img = sectionImages[i];

                    // Calcula a altura da legenda para esta imagem
                    let captionTextLines = [];
                    if (img.caption) {
                        doc.setFontSize(8); // Define o tamanho da fonte para a legenda
                        captionTextLines = doc.splitTextToSize(img.caption, imgColumnWidth);
                        if (captionTextLines.length > maxCaptionLines) {
                            captionTextLines = captionTextLines.slice(0, maxCaptionLines);
                            captionTextLines[maxCaptionLines - 1] += '...';
                        }
                    }
                    const actualCaptionHeight = captionTextLines.length * captionLineHeight;
                    const estimatedBlockHeight = fixedImgHeight + paddingBetweenImageAndCaption + actualCaptionHeight + 5; // +5 para espaçamento extra

                    // Determina a posição X da imagem (coluna esquerda ou direita)
                    if (i % 2 === 0) { // Primeira imagem na linha (coluna esquerda)
                        currentX = margin;
                        // Verifica se precisamos de uma nova página antes de desenhar a imagem atual (primeira de um par)
                        // Se for a primeira imagem de uma nova linha, o Y base é atualizado aqui.
                        currentImagesBlockY = checkNewPage(doc, currentImagesBlockY, estimatedBlockHeight + 10);
                    } else { // Segunda imagem na linha (coluna direita)
                        currentX = margin + imgColumnWidth + 10; // 10px de gap
                    }

                    try {
                        const imgProps = await new Promise((resolve, reject) => {
                            const tempImg = new Image();
                            tempImg.onload = () => resolve({ width: tempImg.width, height: tempImg.height });
                            tempImg.onerror = (e) => {
                                console.error("Erro ao carregar imagem temporária:", e);
                                reject(e);
                            };
                            tempImg.src = img.url;
                        });

                        const aspectRatio = imgProps.width / imgProps.height;
                        let displayWidth = imgColumnWidth;
                        let displayHeight = fixedImgHeight;

                        if (aspectRatio > (imgColumnWidth / fixedImgHeight)) {
                            displayHeight = imgColumnWidth / aspectRatio;
                        } else {
                            displayWidth = fixedImgHeight * aspectRatio;
                        }

                        // Centraliza a imagem na coluna
                        const offsetX = currentX + (imgColumnWidth - displayWidth) / 2;
                        const offsetY = currentImagesBlockY + (fixedImgHeight - displayHeight) / 2; // Centraliza verticalmente na altura fixa

                        doc.addImage(img.url, 'JPEG', offsetX, offsetY, displayWidth, displayHeight);

                        // Adiciona a legenda logo abaixo da imagem, centralizada na coluna
                        if (img.caption) {
                            doc.setFontSize(8);
                            doc.text(captionTextLines, currentX + imgColumnWidth / 2, currentImagesBlockY + fixedImgHeight + paddingBetweenImageAndCaption, { align: 'center' });
                        }

                    } catch (error) {
                        console.error("Erro ao adicionar imagem ou legenda ao PDF:", error);
                        doc.text(`Erro ao carregar imagem.`, currentX, currentImagesBlockY + fixedImgHeight / 2);
                    }

                    // Após cada par de imagens ou se for a última imagem, avança o Y para a próxima linha de imagens
                    if (i % 2 !== 0 || i === sectionImages.length - 1) {
                        currentImagesBlockY += estimatedBlockHeight; // Avança o Y pela altura total do bloco
                        if (i < sectionImages.length - 1) { // Adiciona espaçamento extra entre as linhas de imagens, exceto na última
                            currentImagesBlockY += 10;
                        }
                    }
                }
                yPosition = currentImagesBlockY; // Atualiza a posição Y geral do documento após todas as imagens da seção
            }

            yPosition += 15; // Espaço entre as seções
            yPosition = checkNewPage(doc, yPosition, 10); // Garante espaço para a próxima seção
        }

        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');

    } catch (error) {
        console.error("Um erro inesperado ocorreu durante a geração do PDF:", error);
        alert("Ocorreu um erro ao gerar o PDF. Por favor, verifique o console para mais detalhes.");
    }
};


// Exporta a função de inicialização para o main.js e para carregar relatórios salvos.
window.initializeReportForm = initializeReportForm;
window.loadReportDataIntoForm = loadReportDataIntoForm; // Certifique-se que esta linha esteja aqui
// window.populateReportFormSelects já está definida globalmente no início do arquivo
