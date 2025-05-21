// js/report_form.js

// Garante que o jsPDF esteja disponível globalmente (ele será carregado no index.html principal)
const { jsPDF } = window.jspdf;

// ... (todo o seu código existente antes da função generatePdf permanece o mesmo) ...

// Função para gerar o PDF
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
        let yPosition = margin;

        // Helper para adicionar cabeçalho e rodapé em novas páginas
        const addContentPageHeaderAndFooter = (doc, pageNum) => {
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("RELATÓRIO DE INSPEÇÃO", margin, margin / 2 + 5);
            doc.text(`${pageNum}`, pageWidth - margin - 5, pageHeight - 5); // Número da página no rodapé
            doc.text("Rua Lilly Bremer, 322 Bairro Navegantes- Fone 47-3531-9000 Fax 47-3525-1975 e-mail: assistencia@bremer.com.br CEP 89160-000- Rio do Sul-SC", margin, pageHeight - 5);
            doc.setTextColor(0); // Reseta a cor do texto para preto
            doc.setFontSize(10); // Reseta o tamanho da fonte
        };

        // Função auxiliar para verificar e adicionar nova página
        const checkNewPage = (doc, currentY, contentHeight) => {
            if (currentY + contentHeight > pageHeight - (margin + 20)) { // 20 é um espaço para o rodapé
                doc.addPage();
                currentPageNumber++;
                addContentPageHeaderAndFooter(doc, currentPageNumber);
                return margin + 20; // Retorna o Y inicial para a nova página, deixando espaço para o cabeçalho
            }
            return currentY;
        };

        // Adicionar a primeira página de rosto/informações iniciais (mantida do seu código original)
        doc.setFontSize(16);
        doc.text("RELATÓRIO DE INSPEÇÃO", pageWidth / 2, yPosition + 30, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`CLIENTE: ${clienteNome}`, margin, yPosition + 50);
        doc.text(`TÉCNICO: ${tecnicoNome}`, margin, yPosition + 60);
        doc.text(`DATA: ${dataRelatorio}`, margin, yPosition + 70);
        doc.text(`LOCAL: ${localRelatorio}`, margin, yPosition + 80);

        // Adiciona a imagem de logo da H. Bremer (ajuste o caminho se necessário)
        // Você precisaria de uma imagem base64 ou URL acessível para isso
        // const logoImg = 'caminho/para/sua/logo.png';
        // if (logoImg) {
        //     doc.addImage(logoImg, 'PNG', pageWidth - margin - 50, margin, 40, 40);
        // }

        // Adiciona o rodapé da primeira página
        doc.setFontSize(8);
        doc.text("Rua Lilly Bremer, 322 Bairro Navegantes- Fone 47-3531-9000 Fax 47-3525-1975 e-mail: assistencia@bremer.com.br CEP 89160-000- Rio do Sul-SC", margin, pageHeight - 5);
        doc.text("1", pageWidth - margin - 5, pageHeight - 5); // Número da página 1

        doc.addPage(); // Adiciona a segunda página para o conteúdo do relatório
        currentPageNumber++;
        addContentPageHeaderAndFooter(doc, currentPageNumber);
        yPosition = margin + 20; // Reinicia yPosition para o conteúdo

        // Iterar sobre as seções do relatório
        const reportContentContainer = document.getElementById('reportContentContainer');
        const contentSections = reportContentContainer.querySelectorAll('.content-group');

        for (const sectionDiv of contentSections) {
            const sectionTitle = sectionDiv.querySelector('.report-title').value;
            const sectionContent = sectionDiv.querySelector('.report-content').value;
            const sectionImages = [];
            sectionDiv.querySelectorAll('.image-upload-group').forEach(imgGroup => {
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

                let currentX = margin;
                let currentImagesBlockY = yPosition; // Usaremos esta variável para controlar o Y dentro do bloco de imagens da seção

                // Adiciona um título para a seção de imagens se houver imagens
                currentImagesBlockY = checkNewPage(doc, currentImagesBlockY, 20); // Espaço para o título "Imagens da Seção"
                doc.setFontSize(12);
                doc.text("Imagens da Seção:", margin, currentImagesBlockY);
                currentImagesBlockY += 10; // Espaço após o título

                for (let i = 0; i < sectionImages.length; i++) {
                    const img = sectionImages[i];

                    // Calcula a altura da legenda para esta imagem
                    let captionTextLines = [];
                    if (img.caption) {
                        doc.setFontSize(8); // Define o tamanho da fonte para a legenda
                        captionTextLines = doc.splitTextToSize(img.caption, imgColumnWidth);
                        // Limita as linhas da legenda para evitar que ocupem espaço demais, se necessário.
                        if (captionTextLines.length > maxCaptionLines) {
                            captionTextLines = captionTextLines.slice(0, maxCaptionLines);
                            captionTextLines[maxCaptionLines - 1] += '...'; // Adiciona reticências se truncado
                        }
                    }
                    const actualCaptionHeight = captionTextLines.length * captionLineHeight;
                    // Altura estimada do bloco completo da imagem (imagem + padding + legenda)
                    const estimatedBlockHeight = fixedImgHeight + paddingBetweenImageAndCaption + actualCaptionHeight + 5; // +5 para espaçamento extra

                    // Determina a posição X da imagem (coluna esquerda ou direita)
                    if (i % 2 === 0) { // Primeira imagem na linha (coluna esquerda)
                        currentX = margin;
                    } else { // Segunda imagem na linha (coluna direita)
                        currentX = margin + imgColumnWidth + 10; // 10px de gap
                    }

                    // Verifica se precisamos de uma nova página antes de desenhar a imagem atual
                    // Considera a altura estimada do bloco completo da imagem
                    currentImagesBlockY = checkNewPage(doc, currentImagesBlockY, estimatedBlockHeight + 10); // +10 para margem de segurança

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

                        // Ajusta a largura ou altura para manter a proporção e caber na coluna
                        if (aspectRatio > (imgColumnWidth / fixedImgHeight)) {
                            displayHeight = imgColumnWidth / aspectRatio;
                        } else {
                            displayWidth = fixedImgHeight * aspectRatio;
                        }

                        // Centraliza a imagem na coluna
                        const offsetX = currentX + (imgColumnWidth - displayWidth) / 2;
                        // Centraliza verticalmente a imagem dentro da altura fixa, se necessário (menos comum, mas boa prática)
                        const offsetY = currentImagesBlockY + (fixedImgHeight - displayHeight) / 2;

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
                        // Adiciona um pequeno espaçamento extra entre as linhas de imagens
                        if (i < sectionImages.length - 1) { // Só se não for a última imagem
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

// ... (todo o seu código existente após a função generatePdf permanece o mesmo) ...
