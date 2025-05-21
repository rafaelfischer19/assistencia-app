window.initializeReportForm = initializeReportForm;
window.loadReportDataIntoForm = loadReportDataIntoForm;

const generatePdf = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin + 20;
    let currentPageNumber = 1;

    const contentGroups = document.querySelectorAll('.content-group');

    const addContentPageHeaderAndFooter = (doc, pageNum) => {
        doc.setFontSize(10);
        doc.text(`Página ${pageNum}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    };

    addContentPageHeaderAndFooter(doc, currentPageNumber);

    for (const group of contentGroups) {
        const title = group.querySelector('.report-title').value.trim();
        const content = group.querySelector('.report-content').value.trim();
        const imageWrappers = group.querySelectorAll('.image-preview-and-caption');

        const sectionImages = [];

        imageWrappers.forEach(wrapper => {
            const img = wrapper.querySelector('img');
            const caption = wrapper.querySelector('.image-caption');
            if (img && img.src && caption) {
                sectionImages.push({
                    url: img.src,
                    caption: caption.value.trim()
                });
            }
        });

        doc.setFontSize(14);
        doc.text(title, margin, yPosition);
        yPosition += 8;

        doc.setFontSize(11);
        const lines = doc.splitTextToSize(content, pageWidth - margin * 2);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * 6;

        if (sectionImages.length > 0) {
            yPosition += 5;
            doc.setFontSize(12);
            doc.text("Imagens da Seção:", margin, yPosition);
            yPosition += 10;

            const imgWidth = (pageWidth - (margin * 2) - 10) / 2;
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
        }

        yPosition += 15;
        if (yPosition > pageHeight - margin - 20) {
            doc.addPage();
            currentPageNumber++;
            addContentPageHeaderAndFooter(doc, currentPageNumber);
            yPosition = margin + 20;
        }
    }

    window.open(doc.output('bloburl'), '_blank');
};
