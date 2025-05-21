function initializeReportForm() {
    const addSectionButton = document.getElementById('addSection');
    const saveReportButton = document.getElementById('saveReport');
    const loadReportButton = document.getElementById('loadReportButton');
    const loadReportInput = document.getElementById('loadReportInput');
    const generatePdfButton = document.getElementById('generatePdf');
    const reportContainer = document.getElementById('reportContentContainer');

    addSectionButton.addEventListener('click', () => {
        const section = document.createElement('div');
        section.classList.add('content-group');
        section.innerHTML = `
            <input type="text" class="report-title" placeholder="Título da Seção" />
            <textarea class="report-content" placeholder="Conteúdo..."></textarea>
            <div class="images-in-section-container">
                <h3>Adicionar Imagens:</h3>
                <div class="image-upload-group">
                    <input type="file" accept="image/*" class="image-input" />
                    <div class="image-preview-and-caption">
                        <div class="image-preview-container">
                            <img class="image-preview" />
                        </div>
                        <div class="image-caption-group">
                            <input type="text" class="image-caption" placeholder="Legenda" />
                            <button type="button" class="remove-image-button">Remover</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        reportContainer.appendChild(section);

        section.querySelector('.image-input').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const preview = section.querySelector('.image-preview');
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        section.querySelector('.remove-image-button').addEventListener('click', () => {
            section.remove();
        });
    });

    saveReportButton.addEventListener('click', () => {
        const contentGroups = document.querySelectorAll('.content-group');
        const data = [];

        contentGroups.forEach(group => {
            const title = group.querySelector('.report-title').value;
            const content = group.querySelector('.report-content').value;
            const img = group.querySelector('.image-preview').src;
            const caption = group.querySelector('.image-caption').value;

            data.push({ title, content, img, caption });
        });

        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'relatorio.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    loadReportButton.addEventListener('click', () => loadReportInput.click());

    loadReportInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);
                loadReportDataIntoForm(loadedData);
            } catch (err) {
                alert('Erro ao carregar relatório');
            }
        };
        reader.readAsText(file);
    });

    generatePdfButton.addEventListener('click', generatePdf);
}

function loadReportDataIntoForm(data) {
    const reportContainer = document.getElementById('reportContentContainer');
    reportContainer.innerHTML = '';

    data.forEach(item => {
        const section = document.createElement('div');
        section.classList.add('content-group');
        section.innerHTML = `
            <input type="text" class="report-title" value="${item.title}" />
            <textarea class="report-content">${item.content}</textarea>
            <div class="images-in-section-container">
                <h3>Adicionar Imagens:</h3>
                <div class="image-upload-group">
                    <input type="file" accept="image/*" class="image-input" />
                    <div class="image-preview-and-caption">
                        <div class="image-preview-container">
                            <img class="image-preview" src="${item.img}" style="display:block;" />
                        </div>
                        <div class="image-caption-group">
                            <input type="text" class="image-caption" value="${item.caption}" />
                            <button type="button" class="remove-image-button">Remover</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        reportContainer.appendChild(section);

        section.querySelector('.remove-image-button').addEventListener('click', () => {
            section.remove();
        });
    });
}

async function generatePdf() {
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
        const img = group.querySelector('.image-preview').src;
        const caption = group.querySelector('.image-caption').value.trim();

        doc.setFontSize(14);
        doc.text(title, margin, yPosition);
        yPosition += 8;

        doc.setFontSize(11);
        const lines = doc.splitTextToSize(content, pageWidth - margin * 2);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * 6;

        if (img && img.startsWith('data:image')) {
            yPosition += 5;
            doc.setFontSize(12);
            doc.text("Imagem da Seção:", margin, yPosition);
            yPosition += 10;

            const imgWidth = pageWidth - margin * 2;
            const imgHeight = 90;
            doc.addImage(img, 'JPEG', margin, yPosition, imgWidth, imgHeight);

            if (caption) {
                doc.setFontSize(8);
                const captionTextLines = doc.splitTextToSize(caption, imgWidth);
                doc.text(captionTextLines, pageWidth / 2, yPosition + imgHeight + 5, { align: 'center' });
            }

            yPosition += imgHeight + 20;
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
}

// ⬇️ Expor para acesso global
window.initializeReportForm = initializeReportForm;
window.loadReportDataIntoForm = loadReportDataIntoForm;
