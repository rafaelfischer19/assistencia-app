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
    "5.6.1 – Filtro",
    "5.6.2 – Pré ar",
    "5.6.3 – Dutos/Dampers/Exaustor e chaminé",
    "5.7- Sistema de descarga de fundo",
    "5.8- Sistema de alimentação de água",
    "5.9- Tanque de Condensado",
    "5.10- Plataformas de acesso",
    "5.11- Sistema de alimentação de combustível",
    "5.12- Painel Elétrico",
    "5.13-Instrumentação",
    "5.14- Pintura",
    "5.15 - Tratamento de água da caldeira",
    "5.16- Inspeção com boroscópio",
    "6. RECOMENDAÇÕES GERAIS AO CLIENTE",
    "7. SUGESTÃO DE MANUTENÇÕES A SER ORÇADO PELA H BREMER",
    "8. CONCLUSÕES"
];

// Verifica a compatibilidade da API Web Speech
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
// As grammars não são estritamente necessárias para um reconhecimento genérico
// const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
// const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

if (!SpeechRecognition) {
    console.warn('A API Web Speech (reconhecimento de voz) não é suportada por este navegador. Por favor, use um navegador baseado no Chromium (Chrome, Edge, etc.) para esta funcionalidade.');
}

// Função para iniciar a transcrição para um textarea específico
const startTranscription = (textArea, statusSpan) => {
    if (!SpeechRecognition) return;

    // Se já houver uma transcrição ativa, pare-a
    if (recognition) {
        recognition.stop();
    }

    currentTextArea = textArea;
    recognitionStatusSpan = statusSpan;

    recognition = new SpeechRecognition();
    recognition.continuous = true; // Continua a capturar fala até ser parado
    recognition.interimResults = true; // Mostra resultados intermediários
    recognition.lang = 'pt-BR'; // Define o idioma para português do Brasil

    let finalTranscript = ''; // Armazena o resultado final

    recognition.onstart = () => {
        if (recognitionStatusSpan) {
            recognitionStatusSpan.textContent = 'Gravando...';
            recognitionStatusSpan.style.color = 'red';
        }
        if (textArea) textArea.focus(); // Coloca o foco no textarea
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
        // Adiciona o texto final e o intermediário no textarea
        if (currentTextArea) {
            currentTextArea.value = finalTranscript + interimTranscript;
        }
    };

    recognition.onerror = (event) => {
        console.error('Erro de reconhecimento de fala:', event.error);
        if (recognitionStatusSpan) {
            recognitionStatusSpan.textContent = `Erro: ${event.error}`;
            recognitionStatusSpan.style.color = 'darkred';
        }
        if (recognition) recognition.stop(); // Tenta parar o reconhecimento em caso de erro
    };

    recognition.onend = () => {
        if (recognitionStatusSpan) {
            recognitionStatusSpan.textContent = 'Inativo';
            recognitionStatusSpan.style.color = '#555';
        }
        recognition = null; // Reseta a instância
    };

    recognition.start();
};

// Função para parar a transcrição
const stopTranscription = () => {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    if (recognitionStatusSpan) {
        recognitionStatusSpan.textContent = 'Inativo';
        recognitionStatusSpan.style.color = '#555';
    }
};

// Função para adicionar um novo grupo de imagem com legenda dentro de uma seção
const addImageToSection = (sectionDiv, sectionImageCounter, imageUrl = null, caption = '') => {
    const imagesContainer = sectionDiv.querySelector('.images-in-section-container');
    if (!imagesContainer) {
        console.error('Container de imagens não encontrado na seção:', sectionDiv);
        return;
    }
    const newImageUploadGroup = document.createElement('div');
    newImageUploadGroup.classList.add('image-upload-group');
    newImageUploadGroup.innerHTML = `
        <input type="file" class="image-upload" accept="image/*" data-section-id="${sectionDiv.dataset.sectionId}" data-image-id="${sectionImageCounter}">
        <div class="image-preview-and-caption">
            <div class="image-preview-container">
                <img class="image-preview" src="${imageUrl || '#'}" alt="Prévia da Imagem" style="${imageUrl ? 'display: block;' : 'display: none;'}">
            </div>
            <div class="form-group image-caption-group">
                <label for="image-caption-s${sectionDiv.dataset.sectionId}-img${sectionImageCounter}">Legenda da Imagem:</label>
                <input type="text" class="image-caption" id="image-caption-s${sectionDiv.dataset.sectionId}-img${sectionImageCounter}" placeholder="Digite a legenda da imagem..." value="${caption}">
            </div>
        </div>
    `;
    imagesContainer.appendChild(newImageUploadGroup);
};

// Função para adicionar uma nova seção completa
const addNewSection = (title = null, content = '', images = []) => {
    currentSectionCounter++; // Incrementa o contador de seções local
    const container = document.getElementById('reportContentContainer');
    if (!container) {
        console.error('reportContentContainer não encontrado ao adicionar nova seção.');
        return;
    }
    const newContentGroup = document.createElement('div');
    newContentGroup.classList.add('content-group');
    newContentGroup.dataset.sectionId = currentSectionCounter; // Atribui um ID único à seção

    const sectionTitleHtml = title !== null ? `<input type="text" id="campoTitulo-${currentSectionCounter}" class="report-title" value="${title}" readonly>` :
                                           `<input type="text" id="campoTitulo-${currentSectionCounter}" class="report-title" placeholder="Digite o título da seção...">`;

    newContentGroup.innerHTML = `
        <div class="form-group">
            <label for="campoTitulo-${currentSectionCounter}">Título da Seção:</label>
            ${sectionTitleHtml}
        </div>
        <div class="form-group">
            <label for="campoConteudo-${currentSectionCounter}">Conteúdo da Seção:</label>
            <textarea id="campoConteudo-${currentSectionCounter}" class="report-content" rows="8" placeholder="Digite o conteúdo da seção aqui...">${content}</textarea>
            <div class="transcription-controls">
                <button class="start-transcription-btn" data-target-textarea="campoConteudo-${currentSectionCounter}">Iniciar Transcrição</button>
                <button class="stop-transcription-btn">Parar Transcrição</button>
                <span class="transcription-status">Inativo</span>
            </div>
        </div>
        <div class="images-in-section-container">
            <h3>Imagens da Seção ${title || `Seção ${currentSectionCounter}`}</h3>
            </div>
        <button class="add-image-to-section" data-section-id="${currentSectionCounter}">Adicionar Imagem à Seção</button>
        <hr>
    `;
    container.appendChild(newContentGroup);

    // Adiciona as imagens passadas como parâmetro ou uma imagem vazia
    if (images.length > 0) {
        images.forEach((imgData, index) => addImageToSection(newContentGroup, index + 1, imgData.url, imgData.caption));
    } else {
        // Adiciona a primeira imagem a essa nova seção automaticamente se nenhuma imagem for passada
        addImageToSection(newContentGroup, 1);
    }

    // Rolagem suave para a nova seção (útil ao adicionar manualmente, não tanto ao carregar)
    // newContentGroup.scrollIntoView({ behavior: 'smooth', block: 'end' });
};

// Função para limpar todas as seções existentes
const clearAllSections = () => {
    const container = document.getElementById('reportContentContainer');
    if (container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }
    currentSectionCounter = 0; // Reseta o contador de seções
};

// Função para inicializar o formulário (chamada pelo main.js)
const initializeReportForm = () => {
    console.log('initializeReportForm chamado.');
    clearAllSections(); // Garante que o formulário esteja limpo
    mandatoryTopics.forEach(topic => addNewSection(topic)); // Adiciona as seções obrigatórias

    // Define a data atual no campo de data, se não houver um valor
    const dataInput = document.getElementById('data');
    if (dataInput && !dataInput.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months start at 0!
        const dd = String(today.getDate()).padStart(2, '0');
        dataInput.value = `${yyyy}-${mm}-${dd}`;
    }

    // Adiciona os event listeners específicos do formulário
    const addSectionButton = document.getElementById('addSection');
    if (addSectionButton) {
        // Usa removeEventListener para evitar duplicidade em recarregamentos dinâmicos
        addSectionButton.removeEventListener('click', () => addNewSection());
        addSectionButton.addEventListener('click', () => addNewSection());
    }

    const reportContentContainer = document.getElementById('reportContentContainer');
    if (reportContentContainer) {
        // Remove listeners para evitar duplicação em recarregamentos
        reportContentContainer.removeEventListener('change', handleImageUploadChange);
        reportContentContainer.removeEventListener('click', handleSectionButtonClick);

        // Adiciona novamente os listeners (usa capturing phase para botões dinâmicos)
        reportContentContainer.addEventListener('change', handleImageUploadChange, true); // true para capturing
        reportContentContainer.addEventListener('click', handleSectionButtonClick, true); // true para capturing
    }

    // Listeners para Salvar/Carregar/Gerar PDF
    const saveReportButton = document.getElementById('saveReport');
    if (saveReportButton) {
        saveReportButton.removeEventListener('click', saveReport);
        saveReportButton.addEventListener('click', saveReport);
    }

    const loadReportButton = document.getElementById('loadReportButton');
    const loadReportInput = document.getElementById('loadReportInput');
    if (loadReportButton && loadReportInput) {
        loadReportButton.removeEventListener('click', () => loadReportInput.click());
        loadReportButton.addEventListener('click', () => loadReportInput.click());
        loadReportInput.removeEventListener('change', loadReportFromFile);
        loadReportInput.addEventListener('change', loadReportFromFile);
    }

    const generatePdfButton = document.getElementById('generatePdf');
    if (generatePdfButton) {
        generatePdfButton.removeEventListener('click', generatePdf);
        generatePdfButton.addEventListener('click', generatePdf);
    }
};

// Funções de Event Handler para evitar duplicação de listeners e usar event delegation
const handleImageUploadChange = (event) => {
    if (event.target.classList.contains('image-upload')) {
        const fileInput = event.target;
        const group = fileInput.closest('.image-upload-group');
        const preview = group ? group.querySelector('.image-preview') : null;

        if (fileInput.files && fileInput.files[0] && preview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else if (preview) {
            preview.src = '#';
            preview.style.display = 'none';
        }
    }
};

const handleSectionButtonClick = (event) => {
    if (event.target.classList.contains('add-image-to-section')) {
        const sectionId = event.target.dataset.sectionId;
        const sectionDiv = document.querySelector(`.content-group[data-section-id="${sectionId}"]`);
        if (sectionDiv) {
            const existingImages = sectionDiv.querySelectorAll('.image-upload-group').length;
            addImageToSection(sectionDiv, existingImages + 1);
        }
    } else if (event.target.classList.contains('start-transcription-btn')) {
        const targetTextareaId = event.target.dataset.targetTextarea;
        const textArea = document.getElementById(targetTextareaId);
        // O span de status é o terceiro elemento irmão do botão (button -> button -> span)
        const statusSpan = event.target.nextElementSibling?.nextElementSibling;
        if(textArea && statusSpan) startTranscription(textArea, statusSpan);
    } else if (event.target.classList.contains('stop-transcription-btn')) {
        stopTranscription();
    }
};


// --- Funções de Salvar/Carregar/Gerar PDF ---

const saveReport = () => {
    stopTranscription(); // Para qualquer transcrição ativa

    const reportData = {
        cliente: document.getElementById('cliente')?.value || '',
        tecnico: document.getElementById('tecnico')?.value || '',
        data: document.getElementById('data')?.value || '',
        local: document.getElementById('local')?.value || '',
        sections: []
    };

    const contentGroups = document.querySelectorAll('.content-group');
    contentGroups.forEach(group => {
        const titleInput = group.querySelector('.report-title');
        const contentTextarea = group.querySelector('.report-content');
        const images = [];

        group.querySelectorAll('.image-upload-group').forEach(imgGroup => {
            const imgElement = imgGroup.querySelector('.image-preview');
            const captionInput = imgGroup.querySelector('.image-caption');
            if (imgElement && imgElement.src && imgElement.style.display !== 'none' && !imgElement.src.startsWith('data:,')) { // Evita imagens vazias ou src inválido
                images.push({
                    url: imgElement.src, // Base64 da imagem
                    caption: captionInput ? captionInput.value.trim() : ''
                });
            }
        });

        reportData.sections.push({
            title: titleInput ? titleInput.value.trim() : '',
            content: contentTextarea ? contentTextarea.value.trim() : '',
            images: images
        });
    });

    const jsonString = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const fileNameDate = reportData.data || new Date().toISOString().slice(0, 10);
    const clientNameForFilename = reportData.cliente.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) || 'relatorio'; // Limpa nome do cliente
    a.download = `relatorio_${clientNameForFilename}_${fileNameDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Relatório salvo com sucesso!');
};

const loadReportFromFile = (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const loadedData = JSON.parse(e.target.result);
            window.loadReportDataIntoForm(loadedData); // Usa a função global para carregar
            // Reseta o input file para que o mesmo arquivo possa ser carregado novamente se necessário
            event.target.value = null;
            alert('Relatório carregado com sucesso!');

        } catch (error) {
            console.error("Erro ao carregar ou parsear o arquivo JSON:", error);
            alert('Erro ao carregar o relatório. Verifique se o arquivo JSON é válido.');
        }
    };
    reader.readAsText(file);
};

// Função exposta globalmente para ser chamada pelo main.js e para carregar relatórios salvos.
window.loadReportDataIntoForm = (loadedData) => {
    console.log('loadReportDataIntoForm chamado com dados:', loadedData);

    // Limpa o formulário atual e seções para reconstruí-lo
    const clienteSelect = document.getElementById('cliente');
    const tecnicoSelect = document.getElementById('tecnico');
    const dataInput = document.getElementById('data');
    const localInput = document.getElementById('local');

    if (clienteSelect) clienteSelect.value = loadedData.cliente || '';
    if (tecnicoSelect) tecnicoSelect.value = loadedData.tecnico || '';
    if (dataInput) dataInput.value = loadedData.data || '';
    if (localInput) localInput.value = loadedData.local || '';

    clearAllSections(); // Limpa todas as seções para reconstrução

    // Adiciona as seções do relatório salvo
    if (loadedData.sections && Array.isArray(loadedData.sections)) {
        loadedData.sections.forEach(section => {
            addNewSection(section.title, section.content, section.images);
        });
    }
};

const generatePdf = async () => {
    stopTranscription(); // Para qualquer transcrição ativa

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    const cliente = document.getElementById('cliente')?.value || '';
    const tecnico = document.getElementById('tecnico')?.value || '';
    const data = document.getElementById('data')?.value || '';
    const local = document.getElementById('local')?.value || '';
    const companyAddress = "Rua Lilly Bremer, 322 Bairro Navegantes- Fone 47-3531-9000 Fax 47- 3525-1975 e-mail: assistencia@bremer.com.br CEP 89160-000- Rio do Sul-SC";

    // --- Página de Rosto ---
    doc.setFontSize(24);
    doc.text("RELATÓRIO DE INSPEÇÃO", pageWidth / 2, pageHeight * 0.25, { align: 'center' });

    doc.setFontSize(14);
    doc.text(`CLIENTE: ${cliente}`, pageWidth / 2, pageHeight * 0.45, { align: 'center' });
    doc.text(`TÉCNICO: ${tecnico}`, pageWidth / 2, pageHeight * 0.50, { align: 'center' });
    doc.text(`DATA: ${data}`, pageWidth / 2, pageHeight * 0.55, { align: 'center' });
    doc.text(`LOCAL: ${local}`, pageWidth / 2, pageHeight * 0.60, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(50);
    const companyAddressLines = doc.splitTextToSize(companyAddress, pageWidth - (margin * 4));
    doc.text(companyAddressLines, pageWidth / 2, pageHeight - 30, { align: 'center' });
    doc.setTextColor(0);

    // --- Funções Auxiliares para Páginas de Conteúdo ---
    let currentPageNumber = 1; // Começa a contagem de páginas de conteúdo após a página de rosto
    const addContentPageHeaderAndFooter = (doc, pageNumber) => {
        doc.setFontSize(16);
        doc.text("RELATÓRIO DE INSPEÇÃO", pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`${pageNumber}`, pageWidth - margin, 20, { align: 'right' }); // Número da página no canto superior direito

        doc.setFontSize(8);
        doc.setTextColor(100);
        const footerTextLines = doc.splitTextToSize(companyAddress, pageWidth - (margin * 2));
        const footerY = doc.internal.pageSize.getHeight() - 15;
        doc.text(footerTextLines, pageWidth / 2, footerY, { align: 'center' });
        doc.setTextColor(0);
    };

    const checkNewPage = (doc, currentY, minSpaceRequired) => {
        // Adiciona uma margem de segurança para o rodapé
        if (currentY + minSpaceRequired > pageHeight - (margin + 20)) { // 20 para o rodapé
            doc.addPage();
            currentPageNumber++;
            addContentPageHeaderAndFooter(doc, currentPageNumber);
            return margin + 20; // Retorna a posição Y para o início da nova página (abaixo do cabeçalho)
        }
        return currentY;
    };

    // --- Conteúdo do Relatório ---
    doc.addPage(); // Adiciona a primeira página de conteúdo
    currentPageNumber++;
    addContentPageHeaderAndFooter(doc, currentPageNumber);
    yPosition = margin + 20; // Início do conteúdo na nova página

    const contentGroups = document.querySelectorAll('.content-group');

    for (const group of contentGroups) {
        const titleInput = group.querySelector('.report-title');
        const contentTextarea = group.querySelector('.report-content');
        const sectionImages = [];

        const sectionTitleText = titleInput ? titleInput.value.trim() : '';

        const imageUploadsInSection = group.querySelectorAll('.image-upload-group');
        for (const imgGroup of imageUploadsInSection) {
            const imgElement = imgGroup.querySelector('.image-preview');
            const captionInput = imgGroup.querySelector('.image-caption');
            if (imgElement && imgElement.style.display !== 'none' && imgElement.src && !imgElement.src.startsWith('data:,')) {
                sectionImages.push({
                    url: imgElement.src,
                    caption: captionInput ? captionInput.value.trim() : ''
                });
            }
        }

        // Adiciona Título da Seção
        if (sectionTitleText) {
            yPosition = checkNewPage(doc, yPosition, 15); // Espaço para o título
            doc.setFontSize(14);
            // Verifica se é um tópico principal para negrito
            const isMainTopic = /^\d+(\.\d+)?(\s|$)/.test(sectionTitleText);
            doc.setFont(undefined, isMainTopic ? 'bold' : 'normal');
            doc.text(sectionTitleText, margin, yPosition);
            doc.setFont(undefined, 'normal'); // Reseta para normal
            yPosition += 8;
        }

        // Adiciona Conteúdo da Seção
        if (contentTextarea && contentTextarea.value.trim()) {
            doc.setFontSize(10);
            const textLines = doc.splitTextToSize(contentTextarea.value.trim(), pageWidth - (margin * 2));

            textLines.forEach(line => {
                yPosition = checkNewPage(doc, yPosition, 5); // Espaço para cada linha de texto
                doc.text(line, margin, yPosition);
                yPosition += 5; // Aumenta a posição Y para a próxima linha
            });
            yPosition += 5; // Espaço após o bloco de texto
        }

        // Adiciona Imagens da Seção
        if (sectionImages.length > 0) {
            yPosition = checkNewPage(doc, yPosition, 20); // Espaço para o título "Imagens da Seção"
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Imagens da Seção:", margin, yPosition);
            doc.setFont("helvetica", "normal"); // Resetar a fonte após o título da seção
            yPosition += 10; // Espaço após o título "Imagens da Seção"

            let currentX = margin;
            let currentRowY = yPosition; // Inicia a linha de imagens no yPosition atual
            const imgAvailableWidth = pageWidth - (margin * 2);
            const imgWidth = (imgAvailableWidth - 15) / 2; // Duas imagens por linha com 15px de espaçamento entre elas
            const imgMaxHeight = 60; // Altura máxima reduzida para garantir espaço para a legenda e evitar sobreposição

            for (let i = 0; i < sectionImages.length; i++) {
                const img = sectionImages[i];

                // Calcular altura da legenda
                doc.setFontSize(9); // Definir tamanho da fonte para a legenda antes de calcular splitTextToSize
                const captionTextLines = doc.splitTextToSize(img.caption || '', imgWidth);
                const captionLineHeight = doc.getLineHeight() / doc.internal.scaleFactor;
                const captionHeight = captionTextLines.length * captionLineHeight + (captionTextLines.length > 0 ? 4 : 0); // +4 para padding extra se houver legenda

                let actualImgHeight = imgMaxHeight; // Altura padrão

                try {
                    const imgData = img.url;
                    const imgProps = doc.getImageProperties(imgData);
                    if (imgProps) {
                        actualImgHeight = (imgWidth * imgProps.height) / imgProps.width;
                        if (actualImgHeight > imgMaxHeight) {
                            actualImgHeight = imgMaxHeight; // Limita a altura máxima
                        }
                    } else {
                        console.warn("Não foi possível obter as propriedades da imagem. A imagem pode estar corrompida ou o Data URL inválido. Usando altura padrão.", imgData.substring(0, 50) + "...");
                    }
                } catch (e) {
                    console.error("Erro ao processar imagem para obter propriedades:", e);
                }

                // Altura total que um bloco de imagem + legenda ocupará
                const totalImageBlockHeight = actualImgHeight + captionHeight + 8; // Altura da imagem + legenda + padding extra abaixo do bloco

                // Verificar quebra de página ANTES de desenhar a imagem
                // Se for a primeira imagem da linha E houver uma segunda imagem para ir na mesma linha,
                // precisamos verificar se ambas caberão. Caso contrário, verifica apenas a imagem atual.
                let spaceNeededForCurrentBlock = totalImageBlockHeight;
                if (i % 2 === 0 && i < sectionImages.length - 1) { // Se for a primeira imagem da linha e não a última imagem total
                    // Calcula a altura da próxima imagem e legenda para verificar se cabem na mesma linha
                    const nextImg = sectionImages[i + 1];
                    const nextCaptionTextLines = doc.splitTextToSize(nextImg.caption || '', imgWidth);
                    const nextCaptionHeight = nextCaptionTextLines.length * captionLineHeight + (nextCaptionTextLines.length > 0 ? 4 : 0);

                    let nextActualImgHeight = imgMaxHeight;
                    try {
                        const nextImgProps = doc.getImageProperties(nextImg.url);
                        if (nextImgProps) {
                            nextActualImgHeight = (imgWidth * nextImgProps.height) / nextImgProps.width;
                            if (nextActualImgHeight > imgMaxHeight) {
                                nextActualImgHeight = imgMaxHeight;
                            }
                        }
                    } catch (e) {
                        console.warn("Erro ao obter propriedades da próxima imagem.", e);
                    }
                    const nextTotalImageBlockHeight = nextActualImgHeight + nextCaptionHeight + 8;
                    spaceNeededForCurrentBlock = Math.max(totalImageBlockHeight, nextTotalImageBlockHeight);
                }


                currentRowY = checkNewPage(doc, currentRowY, spaceNeededForCurrentBlock + 10); // +10 para espaçamento antes da primeira imagem da linha na nova página

                try {
                    doc.addImage(img.url, 'JPEG', currentX, currentRowY, imgWidth, actualImgHeight, undefined, 'FAST'); // Adiciona a imagem
                    if (img.caption) {
                        // Adiciona a legenda centralizada sob a imagem
                        doc.setFontSize(9);
                        doc.setFont("helvetica", "normal");
                        // O Y da legenda é a base da imagem + sua altura real + um pequeno offset
                        doc.text(captionTextLines, currentX + imgWidth / 2, currentRowY + actualImgHeight + 4, { align: 'center' });
                    }
                } catch (error) {
                    console.error("Erro ao adicionar imagem ou legenda ao PDF:", error);
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "normal");
                    doc.text(`Erro ao carregar imagem ${i + 1}`, currentX, currentRowY + actualImgHeight / 2);
                }

                if (i % 2 === 0 && i < sectionImages.length - 1) { // Se for a primeira imagem na linha E houver uma próxima
                    currentX += imgWidth + 15; // Prepara o X para a próxima imagem na mesma linha (com espaçamento)
                    // Não atualiza currentRowY ainda, pois a próxima imagem está na mesma linha
                } else { // Se for a segunda imagem na linha OU a última imagem da seção
                    currentX = margin; // Reseta X para a próxima linha ou para a próxima seção
                    currentRowY += totalImageBlockHeight + 10; // Pula para a próxima linha de imagens com espaçamento extra
                }
            }
            yPosition = currentRowY; // Atualiza a posição Y geral após todas as imagens desta seção
        }

        yPosition += 15; // Espaço entre as seções
        yPosition = checkNewPage(doc, yPosition, 10); // Garante espaço para a próxima seção
    }

    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
};


// Exporta a função de inicialização para o main.js e para carregar relatórios salvos.
window.loadReportDataIntoForm = loadReportDataIntoForm; // Certifique-se que esta linha esteja aqui
window.initializeReportForm = initializeReportForm; // ESTA LINHA É A CRÍTICA!
