// Arquivo atualizado com imagens proporcionais no PDF e legendas organizadas

// Dentro da função generatePdf, substitua toda a parte que lida com as imagens (geralmente dentro do loop de seções)
// Começa onde você define `imgWidth`, `imgHeight` etc., e termina onde você atualiza `yPosition = currentRowY;`

// POR ESTE BLOCO ABAIXO:

            const imgColumnWidth = (pageWidth - (margin * 2) - 10) / 2; // Duas colunas com 10px de gap entre elas
            const fixedImgHeight = 70; // Altura máxima/base para a imagem antes da proporcionalidade
            const paddingBetweenImageAndCaption = 5;
            const captionLineHeight = 4; // Altura de uma linha de texto da legenda
            const maxCaptionLines = 3; // Número máximo de linhas para a legenda antes de truncar/quebrar

            let currentX = margin;
            let currentImagesBlockY = yPosition; // Usaremos esta variável para controlar o Y dentro do bloco de imagens da seção

            // Adiciona um título para a seção de imagens se houver imagens
            if (sectionImages.length > 0) {
                currentImagesBlockY = checkNewPage(doc, currentImagesBlockY, 20); // Espaço para o título "Imagens da Seção"
                doc.setFontSize(12);
                doc.text("Imagens da Seção:", margin, currentImagesBlockY);
                currentImagesBlockY += 10; // Espaço após o título
            }

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
