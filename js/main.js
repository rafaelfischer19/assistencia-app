// js/main.js

// Variável global para rastrear se o script do formulário de relatório foi carregado
let reportFormScriptLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('app-content');
    const navButtons = document.querySelectorAll('.nav-button');

    // Funções auxiliares para localStorage
    const getClients = () => JSON.parse(localStorage.getItem('clients')) || [];
    const saveClients = (clients) => localStorage.setItem('clients', JSON.stringify(clients));
    const getTechnicians = () => JSON.parse(localStorage.getItem('technicians')) || [];
    const saveTechnicians = (technicians) => localStorage.setItem('technicians', JSON.stringify(technicians));
    const getLoadedReports = () => JSON.parse(localStorage.getItem('loadedReports')) || [];
    const saveLoadedReports = (reports) => localStorage.setItem('loadedReports', JSON.stringify(reports));

    // --- Funções de Renderização e População de Dados ---

    const renderClients = () => {
        const clientList = document.getElementById('clientList');
        if (!clientList) return;

        const clients = getClients();
        clientList.innerHTML = '';
        if (clients.length === 0) {
            clientList.innerHTML = '<p>Nenhum cliente cadastrado.</p>';
            return;
        }
        clients.forEach((client, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${client.name} - ${client.contact} - ${client.address}</span>
                <button data-index="${index}">Remover</button>
            `;
            clientList.appendChild(li);
        });

        clientList.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                const indexToRemove = parseInt(e.target.dataset.index);
                const clients = getClients();
                clients.splice(indexToRemove, 1);
                saveClients(clients);
                renderClients();
                // Popula selects no formulário de relatório, se estiver ativo
                populateReportFormSelects();
            });
        });
    };

    const renderTechnicians = () => {
        const technicianList = document.getElementById('technicianList');
        if (!technicianList) return;

        const technicians = getTechnicians();
        technicianList.innerHTML = '';
        if (technicians.length === 0) {
            technicianList.innerHTML = '<p>Nenhum técnico cadastrado.</p>';
            return;
        }
        technicians.forEach((technician, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${technician.name} (${technician.crea})</span>
                <button data-index="${index}">Remover</button>
            `;
            technicianList.appendChild(li);
        });

        technicianList.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                const indexToRemove = parseInt(e.target.dataset.index);
                const technicians = getTechnicians();
                technicians.splice(indexToRemove, 1);
                saveTechnicians(technicians);
                renderTechnicians();
                // Popula selects no formulário de relatório, se estiver ativo
                populateReportFormSelects();
            });
        });
    };

    // Função para popular os selects de cliente e técnico no formulário de relatório
    const populateReportFormSelects = () => {
        const clienteSelect = document.getElementById('cliente');
        const tecnicoSelect = document.getElementById('tecnico');

        if (clienteSelect) {
            const clients = getClients();
            const selectedClient = clienteSelect.value; // Mantém o valor selecionado
            clienteSelect.innerHTML = '<option value="">Selecione um cliente</option>';
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.name;
                option.textContent = client.name;
                clienteSelect.appendChild(option);
            });
            clienteSelect.value = selectedClient; // Restaura o valor selecionado
        }

        if (tecnicoSelect) {
            const technicians = getTechnicians();
            const selectedTechnician = tecnicoSelect.value; // Mantém o valor selecionado
            tecnicoSelect.innerHTML = '<option value="">Selecione um técnico</option>';
            technicians.forEach(technician => {
                const option = document.createElement('option');
                option.value = technician.name;
                option.textContent = technician.name;
                tecnicoSelect.appendChild(option);
            });
            tecnicoSelect.value = selectedTechnician; // Restaura o valor selecionado
        }
    };

    // Função para renderizar a lista de relatórios carregados na página de consulta
    const renderLoadedReports = () => {
        const loadedReportsList = document.getElementById('loadedReportsList');
        const clearLoadedReportsButton = document.getElementById('clearLoadedReports');
        if (!loadedReportsList) return;

        const reports = getLoadedReports();
        loadedReportsList.innerHTML = ''; // Limpa a lista existente

        if (reports.length === 0) {
            loadedReportsList.innerHTML = '<p>Nenhum relatório carregado ainda.</p>';
            if (clearLoadedReportsButton) clearLoadedReportsButton.style.display = 'none';
            return;
        }

        reports.forEach((report, index) => {
            const reportItem = document.createElement('div');
            reportItem.classList.add('report-item');
            reportItem.innerHTML = `
                <p><strong>Cliente:</strong> ${report.cliente || 'N/A'}</p>
                <p><strong>Data:</strong> ${report.data || 'N/A'}</p>
                <p><strong>Técnico:</strong> ${report.tecnico || 'N/A'}</p>
                <div class="report-actions">
                    <button class="view-report" data-index="${index}">Visualizar</button>
                    <button class="delete-report" data-index="${index}">Excluir</button>
                </div>
            `;
            loadedReportsList.appendChild(reportItem);
        });

        // Adiciona event listeners para os botões de visualizar e excluir
        loadedReportsList.querySelectorAll('.view-report').forEach(button => {
            button.addEventListener('click', (e) => {
                const indexToView = parseInt(e.target.dataset.index);
                const reports = getLoadedReports();
                const reportToView = reports[indexToView];
                if (reportToView && window.loadReportDataIntoForm) {
                    loadPage('new_report').then(() => {
                        // Espera o formulário carregar e a função initializeReportForm ser chamada
                        // Antes de carregar os dados
                        // Um pequeno atraso pode ser necessário se a inicialização for assíncrona
                        setTimeout(() => {
                            window.loadReportDataIntoForm(reportToView);
                            // Rola para o topo do formulário após carregar
                            const formElement = document.getElementById('formClienteTecnico');
                            if (formElement) formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100); // Pequeno atraso para garantir que o DOM esteja pronto
                    });
                } else {
                    console.error("Função loadReportDataIntoForm não está disponível ou relatório não encontrado.");
                    alert("Erro: Não foi possível carregar o relatório para visualização.");
                }
            });
        });

        loadedReportsList.querySelectorAll('.delete-report').forEach(button => {
            button.addEventListener('click', (e) => {
                if (confirm('Tem certeza que deseja excluir este relatório?')) {
                    const indexToDelete = parseInt(e.target.dataset.index);
                    const reports = getLoadedReports();
                    reports.splice(indexToDelete, 1);
                    saveLoadedReports(reports);
                    renderLoadedReports();
                }
            });
        });

        if (clearLoadedReportsButton) clearLoadedReportsButton.style.display = 'block';
    };


    // --- Lógica de Navegação de Páginas ---
    const showPage = (pageId) => {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const activePage = document.getElementById(pageId);
        if (activePage) {
            activePage.classList.add('active');
        }
    };

    const loadPage = async (pageName) => {
        console.log(`Carregando página: ${pageName}`);
        showPage(`${pageName}-page`);

        // Descarregar CSS/JS específico da página anterior se houver
        const oldCssLink = document.getElementById('page-specific-css');
        if (oldCssLink) oldCssLink.remove();
        const oldJsScript = document.getElementById('page-specific-js');
        if (oldJsScript) oldJsScript.remove();

        // Lógica de carregamento de conteúdo e inicialização por página
        switch (pageName) {
            case 'home':
                // Nada extra a carregar para a home
                break;
            case 'new_report':
                try {
                    const response = await fetch('report_form.html');
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const html = await response.text();
                    document.getElementById('new_report-page').innerHTML = html;

                    // Carregar o CSS específico do formulário
                    let cssLink = document.createElement('link');
                    cssLink.id = 'page-specific-css';
                    cssLink.rel = 'stylesheet';
                    cssLink.href = 'styles/report_form.css';
                    document.head.appendChild(cssLink);

                    // Carregar o script específico do formulário
                    const loadScriptPromise = new Promise((resolve, reject) => {
                        // Verifica se o script já está no DOM e se foi carregado
                        // Evita múltiplos carregamentos e garante a ordem
                        if (reportFormScriptLoaded && typeof window.initializeReportForm === 'function') {
                            console.log('js/report_form.js já carregado e função disponível.');
                            resolve();
                            return;
                        }

                        let script = document.getElementById('page-specific-js');
                        if (script) { // Remove o script existente se já estiver lá para recarregar ou limpar
                            script.remove();
                        }

                        script = document.createElement('script');
                        script.id = 'page-specific-js';
                        script.src = 'js/report_form.js';
                        script.onload = () => {
                            reportFormScriptLoaded = true;
                            console.log('js/report_form.js carregado com sucesso.');
                            resolve();
                        };
                        script.onerror = (e) => {
                            console.error('Erro ao carregar js/report_form.js', e);
                            reportFormScriptLoaded = false;
                            reject(new Error('Falha ao carregar report_form.js'));
                        };
                        document.body.appendChild(script);
                    });

                    await loadScriptPromise; // Espera o script carregar completamente

                    // Agora que o script está carregado e garantimos que está pronto
                    if (typeof window.initializeReportForm === 'function') {
                        window.initializeReportForm(); // Chama a função de inicialização do formulário
                        populateReportFormSelects(); // Popula os selects do formulário com clientes/técnicos
                        console.log('Formulário de relatório inicializado e selects populados.');
                    } else {
                        console.error('Função initializeReportForm não encontrada no global (window).');
                        document.getElementById('new_report-page').innerHTML = '<p>Erro ao carregar o formulário de relatório: Função de inicialização do script não disponível.</p>';
                    }

                } catch (error) {
                    console.error('Erro ao carregar o formulário de relatório:', error);
                    document.getElementById('new_report-page').innerHTML = `<p>Erro ao carregar o formulário de relatório: ${error.message}. Verifique o console para mais detalhes.</p>`;
                }
                break;
            case 'consult_reports':
                renderLoadedReports();
                // Event listener para carregar múltiplos relatórios
                const loadMultipleReportsButton = document.getElementById('loadMultipleReportsButton');
                const loadReportInputList = document.getElementById('loadReportInputList');
                const clearLoadedReportsButton = document.getElementById('clearLoadedReports');

                if (loadMultipleReportsButton) {
                    loadMultipleReportsButton.onclick = () => {
                        if (loadReportInputList) loadReportInputList.click();
                    };
                }
                if (loadReportInputList) {
                    loadReportInputList.onchange = (event) => {
                        const files = event.target.files;
                        if (!files.length) return;

                        const loadedReports = getLoadedReports();
                        let filesProcessed = 0;

                        Array.from(files).forEach(file => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                try {
                                    const reportData = JSON.parse(e.target.result);
                                    loadedReports.push(reportData);
                                    filesProcessed++;
                                    if (filesProcessed === files.length) {
                                        saveLoadedReports(loadedReports);
                                        renderLoadedReports();
                                        alert('Relatórios carregados com sucesso!');
                                        event.target.value = null; // Reseta o input file
                                    }
                                } catch (error) {
                                    console.error(`Erro ao carregar ou parsear o arquivo ${file.name}:`, error);
                                    alert(`Erro ao carregar o relatório ${file.name}. Verifique se o arquivo JSON é válido.`);
                                    filesProcessed++;
                                    if (filesProcessed === files.length) {
                                        saveLoadedReports(loadedReports); // Salva o que deu certo
                                        renderLoadedReports();
                                    }
                                }
                            };
                            reader.readAsText(file);
                        });
                    };
                }

                if (clearLoadedReportsButton) {
                    clearLoadedReportsButton.onclick = () => {
                        if (confirm('Tem certeza que deseja limpar todos os relatórios carregados?')) {
                            localStorage.removeItem('loadedReports');
                            renderLoadedReports();
                            alert('Todos os relatórios carregados foram removidos.');
                        }
                    };
                }
                break;
            case 'register_client':
                renderClients();
                const clientForm = document.getElementById('clientForm');
                if (clientForm) {
                    clientForm.onsubmit = (e) => {
                        e.preventDefault();
                        const name = document.getElementById('clientName').value.trim();
                        const contact = document.getElementById('clientContact').value.trim();
                        const address = document.getElementById('clientAddress').value.trim();
                        if (name) {
                            const clients = getClients();
                            clients.push({ name, contact, address });
                            saveClients(clients);
                            renderClients();
                            clientForm.reset();
                            alert('Cliente cadastrado com sucesso!');
                            // Popula selects no formulário de relatório, se estiver ativo
                            populateReportFormSelects();
                        } else {
                            alert('Nome do cliente é obrigatório!');
                        }
                    };
                }
                break;
            case 'register_technician':
                renderTechnicians();
                const technicianForm = document.getElementById('technicianForm');
                if (technicianForm) {
                    technicianForm.onsubmit = (e) => {
                        e.preventDefault();
                        const name = document.getElementById('technicianName').value.trim();
                        const crea = document.getElementById('technicianCrea').value.trim();
                        if (name) {
                            const technicians = getTechnicians();
                            technicians.push({ name, crea });
                            saveTechnicians(technicians);
                            renderTechnicians();
                            technicianForm.reset();
                            alert('Técnico cadastrado com sucesso!');
                            // Popula selects no formulário de relatório, se estiver ativo
                            populateReportFormSelects();
                        } else {
                            alert('Nome do técnico é obrigatório!');
                        }
                    };
                }
                break;
            case 'support':
                // Nada extra a carregar para o suporte
                break;
            default:
                console.warn(`Página desconhecida: ${pageName}`);
                showPage('home-page');
        }
    };

    // --- Event Listeners Globais ---

    // Event Listeners para a navegação
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const page = button.dataset.page;
            console.log(`Botão de navegação clicado: ${page}`); // Log para depuração
            loadPage(page);
        });
    });

    // Carrega a página inicial por padrão ao carregar a aplicação
    loadPage('home');
    console.log('main.js DOMContentLoaded executado. Botões de navegação devem estar funcionais.');
});
