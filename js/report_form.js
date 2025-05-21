// Arquivo atualizado com imagens proporcionais no PDF e legendas organizadas



// Substituição da parte do generatePdf responsável pelas imagens



// Dentro da função generatePdf, substitua toda esta parte:

// const imgWidth = ...

// ...

// for (let i = 0; i < sectionImages.length; i++) {

//    ...

// }



// POR ESTE BLOCO ABAIXO:



const imgWidth = (pageWidth - (margin * 2) - 10) / 2; // Duas imagens por linha com 10px de gap

const imgHeight = 70;

const paddingBetweenImageAndCaption = 5;

const captionLineHeight = 5;

const maxCaptionLines = 3;

const estimatedCaptionHeight = captionLineHeight * maxCaptionLines;

const totalImageBlockHeight = imgHeight + estimatedCaptionHeight + paddingBetweenImageAndCaption + 4;



let currentX = margin;

let currentRowY = yPosition;



for (let i = 0; i < sectionImages.length; i++) {

    const img = sectionImages[i];



    if (currentX + imgWidth > pageWidth - margin && i % 2 === 0) {

        currentX = margin;

        currentRowY += totalImageBlockHeight;

    } else if (i % 2 !== 0) {

        currentX += imgWidth + 10;

    }



    if (currentRowY + totalImageBlockHeight > pageHeight - (margin + 20)) {

        doc.addPage();

        currentPageNumber++;

        addContentPageHeaderAndFooter(doc, currentPageNumber);

        currentRowY = margin + 20;

        currentX = margin;

    }



    try {

        const imgProps = await new Promise((resolve, reject) => {

            const tempImg = new Image();

            tempImg.onload = () => resolve({ width: tempImg.width, height: tempImg.height });

            tempImg.onerror = reject;

            tempImg.src = img.url;

        });



        const aspectRatio = imgProps.width / imgProps.height;

        let displayWidth = imgWidth;

        let displayHeight = imgHeight;



        if (aspectRatio > 1) {

            displayHeight = imgWidth / aspectRatio;

        } else {

            displayWidth = imgHeight * aspectRatio;

        }



        const offsetX = currentX + (imgWidth - displayWidth) / 2;



        doc.addImage(img.url, 'JPEG', offsetX, currentRowY, displayWidth, displayHeight);



        if (img.caption) {

            doc.setFontSize(8);

            const captionTextLines = doc.splitTextToSize(img.caption, imgWidth);

            doc.text(captionTextLines, currentX + imgWidth / 2, currentRowY + displayHeight + 5, { align: 'center' });

        }



    } catch (error) {

        console.error("Erro ao carregar imagem:", error);

        doc.text(`Erro ao carregar imagem`, currentX, currentRowY + 10);

    }



    if (i % 2 === 0) {

        currentX += imgWidth + 10;

    } else {

        currentX = margin;

        currentRowY += totalImageBlockHeight;

    }

}



yPosition = currentRowY;
