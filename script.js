let atletas = [];
let chart;
let k = 3; // Default number of clusters

// Calculate calories based on athlete parameters
function calcularCalorias(peso, velocidade, distancia) {
    const MET = velocidade; 
    return MET * peso * 0.0175 * (distancia / velocidade) * 60;
}

// Add a new athlete to the dataset
function adicionarAtleta() {
    const nome = document.getElementById("nomeAtleta").value.trim();
    const peso = parseFloat(document.getElementById("peso").value);
    const velocidade = parseFloat(document.getElementById("velocidade").value);
    const distancia = parseFloat(document.getElementById("distancia").value);
    
    if (nome === "") {
        alert("Por favor, insira o nome do atleta.");
        return;
    }
    
    if (!isNaN(peso) && !isNaN(velocidade) && !isNaN(distancia)) {
        const calorias = calcularCalorias(peso, velocidade, distancia);
        atletas.push({ 
            nome,
            peso, 
            velocidade, 
            distancia, 
            calorias, 
            grupo: null,
            perfil: "Não classificado"
        });
        
        atualizarTabela();
        atualizarGrafico();
        
        // Clear fields after adding
        document.getElementById("nomeAtleta").value = "";
        document.getElementById("peso").value = "";
        document.getElementById("velocidade").value = "";
        document.getElementById("distancia").value = "";
    } else {
        alert("Preencha todos os campos numéricos corretamente.");
    }
}

// Update the table with athlete data
function atualizarTabela() {
    const tabela = document.getElementById("tabelaClusters");
    tabela.innerHTML = "";
    
    atletas.forEach((atleta) => {
        const row = `<tr class="${atleta.grupo !== null ? 'grupo-' + atleta.grupo : ''}">
            <td>${atleta.nome || "Anônimo"}</td>
            <td>${atleta.peso} Kg</td>
            <td>${atleta.velocidade} Km/h</td>
            <td>${atleta.distancia.toFixed(2)} Km</td>
            <td>${atleta.calorias.toFixed(2)} Kcal</td>
            <td>${atleta.grupo !== null ? `Grupo ${atleta.grupo + 1}` : "N/A"}</td>
            <td>${atleta.perfil}</td>
        </tr>`;
        tabela.innerHTML += row;
    });
}

// Perform k-means clustering
function realizarAgrupamento() {
    if (atletas.length === 0) {
        alert("Adicione pelo menos um atleta antes de realizar o agrupamento.");
        return;
    }
    
    // Update number of clusters based on user selection
    k = parseInt(document.getElementById("numeroGrupos").value);
    
    if (atletas.length < k) {
        alert(`Adicione pelo menos ${k} atletas antes de identificar ${k} grupos.`);
        return;
    }
    
    // Normalize data for better clustering
    const distancias = atletas.map(a => a.distancia);
    const calorias = atletas.map(a => a.calorias);
    
    const minDist = Math.min(...distancias);
    const maxDist = Math.max(...distancias);
    const minCal = Math.min(...calorias);
    const maxCal = Math.max(...calorias);
    
    const atletasNormalizados = atletas.map(a => ({
        ...a,
        distNorm: (a.distancia - minDist) / (maxDist - minDist || 1),
        calNorm: (a.calorias - minCal) / (maxCal - minCal || 1)
    }));
    
    // Initialize centroids (choosing k random athletes)
    const indices = Array.from({length: atletasNormalizados.length}, (_, i) => i);
    const indicesCentroides = indices
        .sort(() => Math.random() - 0.5)
        .slice(0, k);
    
    let centroides = indicesCentroides.map(i => ({
        distNorm: atletasNormalizados[i].distNorm,
        calNorm: atletasNormalizados[i].calNorm
    }));
    
    // k-means algorithm
    let mudou;
    let iteracoes = 0;
    const MAX_ITERACOES = 100;
    
    do {
        mudou = false;
        iteracoes++;
        
        // Assign each athlete to the closest group
        atletasNormalizados.forEach(atleta => {
            let grupoMaisProximo = 0;
            let menorDistancia = Infinity;
            
            centroides.forEach((centroide, i) => {
                const dist = Math.sqrt(
                    Math.pow(centroide.distNorm - atleta.distNorm, 2) + 
                    Math.pow(centroide.calNorm - atleta.calNorm, 2)
                );if (dist < menorDistancia) {
                    menorDistancia = dist;
                    grupoMaisProximo = i;
                }
            });
            
            if (atleta.grupo !== grupoMaisProximo) {
                atleta.grupo = grupoMaisProximo;
                mudou = true;
            }
        });
        
        // Recalculate centroids
        centroides = Array(k).fill().map((_, i) => {
            const grupo = atletasNormalizados.filter(a => a.grupo === i);
            if (grupo.length === 0) return centroides[i]; // If no athletes in the group, keep the centroid
            
            return {
                distNorm: grupo.reduce((acc, a) => acc + a.distNorm, 0) / grupo.length,
                calNorm: grupo.reduce((acc, a) => acc + a.calNorm, 0) / grupo.length
            };
        });
        
    } while (mudou && iteracoes < MAX_ITERACOES);
    
    // Transfer groups to original athletes
    atletas.forEach((atleta, i) => {
        atleta.grupo = atletasNormalizados[i].grupo;
        atleta.perfil = definirPerfilGrupo(atleta);
    });
    
    atualizarTabela();
    atualizarGrafico();
    analisarGrupos();
}

// Define profile based on athlete characteristics
function definirPerfilGrupo(atleta) {
    // Define profile based on athlete characteristics
    if (atleta.calorias > 800) {
        if (atleta.velocidade > 12) return "Corredor de Elite";
        if (atleta.distancia > 15) return "Ultramaratonista";
        return "Atleta de Alta Performance";
    } else if (atleta.calorias > 500) {
        if (atleta.velocidade > 10) return "Corredor Intermediário";
        if (atleta.distancia > 10) return "Corredor de Resistência";
        return "Atleta Regular";
    } else if (atleta.calorias > 300) {
        if (atleta.velocidade > 8) return "Corredor Casual";
        return "Atleta Iniciante";
    } else {
        if (atleta.velocidade < 6) return "Praticante de Caminhada";
        return "Corredor Recreativo";
    }
}

// Update the scatter plot chart
function atualizarGrafico() {
    const ctx = document.getElementById("graficoClusters").getContext("2d");
    if (chart) chart.destroy();
    
    // Define group colors
    const cores = ["#FF5733", "#33A1FF", "#36CF4C", "#FF33E9", "#FFD433"];
    
    // Prepare data for the chart
    let datasets = [];
    
    // Add points for each group
    for (let i = 0; i < k; i++) {
        const atletasDoGrupo = atletas.filter(a => a.grupo === i);
        
        if (atletasDoGrupo.length > 0) {
            datasets.push({
                label: `Grupo ${i + 1}`,
                data: atletasDoGrupo.map(a => ({ 
                    x: a.distancia, 
                    y: a.calorias,
                    nome: a.nome,
                    perfil: a.perfil,
                    peso: a.peso,
                    velocidade: a.velocidade
                })),
                backgroundColor: cores[i % cores.length],
                borderColor: cores[i % cores.length],
                pointRadius: 8,
                pointHoverRadius: 12
            });
        }
    }
    
    // Add data for unclassified athletes
    const atletasNaoClassificados = atletas.filter(a => a.grupo === null);
    if (atletasNaoClassificados.length > 0) {
        datasets.push({
            label: "Não Classificados",
            data: atletasNaoClassificados.map(a => ({ 
                x: a.distancia, 
                y: a.calorias,
                nome: a.nome,
                perfil: a.perfil,
                peso: a.peso,
                velocidade: a.velocidade
            })),
            backgroundColor: "#CCCCCC",
            borderColor: "#CCCCCC",
            pointRadius: 8,
            pointHoverRadius: 12
        });
    }
    
    // Create the chart
    chart = new Chart(ctx, {
        type: "scatter",
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            return [
                                `Nome: ${point.nome}`,
                                `Perfil: ${point.perfil}`,
                                `Distância: ${point.x.toFixed(2)} Km`,
                                `Calorias: ${point.y.toFixed(2)} Kcal`,
                                `Peso: ${point.peso} Kg`,
                                `Velocidade: ${point.velocidade} Km/h`
                            ];
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: { 
                    title: { display: true, text: "Distância (Km)" },
                    ticks: { callback: function(value) { return value + " Km"; } }
                },
                y: { 
                    title: { display: true, text: "Calorias (Kcal)" },
                    ticks: { callback: function(value) { return value + " Kcal"; } }
                }
            }
        }
    });
    
    // Update custom legend
    atualizarLegenda(cores);
}

// Update custom legend
function atualizarLegenda(cores) {
    const legenda = document.getElementById("legendaGrupos");
    legenda.innerHTML = "";
    
    for (let i = 0; i < k; i++) {
        const atletasDoGrupo = atletas.filter(a => a.grupo === i);
        if (atletasDoGrupo.length > 0) {
            const item = document.createElement("div");
            item.className = "legenda-item";
            item.innerHTML = `
                <span class="cor-grupo" style="background-color: ${cores[i % cores.length]}"></span>
                <span class="nome-grupo">Grupo ${i + 1}</span>
                <span class="count-grupo">(${atletasDoGrupo.length} atletas)</span>
            `;
            legenda.appendChild(item);
        }
    }
    
    // Add legend item for unclassified athletes if any
    const atletasNaoClassificados = atletas.filter(a => a.grupo === null);
    if (atletasNaoClassificados.length > 0) {
        const item = document.createElement("div");
        item.className = "legenda-item";
        item.innerHTML = `
            <span class="cor-grupo" style="background-color: #CCCCCC"></span>
            <span class="nome-grupo">Não Classificados</span>
            <span class="count-grupo">(${atletasNaoClassificados.length} atletas)</span>
        `;
        legenda.appendChild(item);
    }
}

// Analyze group characteristics
function analisarGrupos() {
    const analiseContainer = document.getElementById("analiseGrupos");
    analiseContainer.innerHTML = "";
    
    for (let i = 0; i < k; i++) {
        const atletasDoGrupo = atletas.filter(a => a.grupo === i);
        
        if (atletasDoGrupo.length === 0) continue;
        
        // Calculate group averages
        const mediaPeso = atletasDoGrupo.reduce((acc, a) => acc + a.peso, 0) / atletasDoGrupo.length;
        const mediaVelocidade = atletasDoGrupo.reduce((acc, a) => acc + a.velocidade, 0) / atletasDoGrupo.length;
        const mediaDistancia = atletasDoGrupo.reduce((acc, a) => acc + a.distancia, 0) / atletasDoGrupo.length;
        const mediaCalorias = atletasDoGrupo.reduce((acc, a) => acc + a.calorias, 0) / atletasDoGrupo.length;
        
        // Determine main characteristics of the group
        const caracteristicas = determinarCaracteristicasGrupo(mediaPeso, mediaVelocidade, mediaDistancia, mediaCalorias);
        
        // Create analysis card for the group
        const grupoAnalise = document.createElement("div");
        grupoAnalise.className = `grupo-analise grupo-${i}`;
        grupoAnalise.innerHTML = `
            <h3>Grupo ${i + 1} - ${caracteristicas.perfil}</h3>
            <div class="grupo-estatisticas">
                <div class="estatistica">
                    <span class="valor">${mediaPeso.toFixed(1)} Kg</span>
                    <span class="label">Peso Médio</span>
                </div>
                <div class="estatistica">
                    <span class="valor">${mediaVelocidade.toFixed(1)} Km/h</span>
                    <span class="label">Velocidade Média</span>
                </div>
                <div class="estatistica">
                    <span class="valor">${mediaDistancia.toFixed(1)} Km</span>
                    <span class="label">Distância Média</span>
                </div>
                <div class="estatistica">
                    <span class="valor">${mediaCalorias.toFixed(0)} Kcal</span>
                    <span class="label">Calorias Médias</span>
                </div>
            </div>
            <div class="grupo-caracteristicas">
                <h4>Características:</h4>
                <p>${caracteristicas.descricao}</p>
            </div>
            <div class="grupo-atletas-titulo">
                <h4>Atletas neste grupo:</h4>
                <div class="grupo-atletas-lista">
                    ${atletasDoGrupo.map(a => `<span class="atleta-chip">${a.nome}</span>`).join('')}
                </div>
            </div>
        `;
        
        analiseContainer.appendChild(grupoAnalise);
    }
}

// Determine group characteristics based on averages
function determinarCaracteristicasGrupo(peso, velocidade, distancia, calorias) {
    let perfil = "";
    let descricao = "";
    
    // Determine profile based on averages
    if (calorias > 800) {
        if (velocidade > 12) {
            perfil = "Corredores de Alta Performance";
            descricao = "Atletas com alto gasto calórico e velocidade elevada. Este grupo demonstra excelente condicionamento físico e eficiência energética.";
        } else if (distancia > 15) {
            perfil = "Ultramaratonistas";
            descricao = "Atletas especializados em longas distâncias com grande resistência e gasto calórico elevado. Focados em endurance e eficiência energética.";
        } else {
            perfil = "Atletas de Alto Rendimento";
            descricao = "Grupo com alto gasto energético, combinando boa velocidade e distância moderada a alta. Atletas bem condicionados com bom equilíbrio de capacidades.";
        }
    } else if (calorias > 500) {
        if (velocidade > 10) {
            perfil = "Corredores Intermediários";
            descricao = "Atletas com boa velocidade e gasto calórico moderado. Este grupo está em fase de desenvolvimento, com bom potencial para evolução.";
        } else if (distancia > 10) {
            perfil = "Corredores de Resistência";
            descricao = "Grupo focado em distâncias mais longas, com velocidade moderada e bom gasto calórico. Apresentam boa capacidade aeróbica.";
        } else {
            perfil = "Atletas Regulares";
            descricao = "Atletas com desempenho consistente e equilibrado. Treinam com regularidade e apresentam resultados moderados em todos os aspectos.";
        }
    } else if (calorias > 300) {
        if (velocidade > 8) {
            perfil = "Corredores Casuais";
            descricao = "Grupo com foco em distâncias curtas a médias com velocidade moderada. Praticam corrida como forma de manutenção da saúde.";
        } else {
            perfil = "Atletas Iniciantes";
            descricao = "Grupo em fase inicial de desenvolvimento, com velocidade e distância moderadas. Estão construindo base para evolução futura.";
        }
    } else {
        if (velocidade < 6) {
            perfil = "Praticantes de Caminhada";
            descricao = "Grupo focado em caminhadas, com baixa velocidade e gasto calórico moderado. Ótima atividade para iniciantes ou para recuperação.";
        } else {
            perfil = "Corredores Recreativos";
            descricao = "Atletas que praticam corrida ocasionalmente, com baixo gasto calórico. Buscam principalmente bem-estar e saúde básica.";
        }
    }
    
    return { perfil, descricao };
}

// Função melhorada para importar dados da atividade supervisionada
function importarDadosSalvos() {
    try {
        const atletasSalvos = localStorage.getItem('atletasSupervisionados');
        
        if (!atletasSalvos) {
            alert("Não foram encontrados dados de atletas salvos da atividade supervisionada.");
            return;
        }
        
        const atletasImportados = JSON.parse(atletasSalvos);
        
        if (atletasImportados.length === 0) {
            alert("A lista de atletas importados está vazia.");
            return;
        }
        
        // Contadores para feedback ao usuário
        let novoAtletas = 0;
        let atletasExistentes = 0;
        
        // Add imported athletes to the current list
        atletasImportados.forEach(atletaImportado => {
            // Check if athlete already exists in current list (by name)
            const atletaExistente = atletas.find(a => 
                a.nome === atletaImportado.nome
            );
            
            if (!atletaExistente) {
                // Mapear os campos da atividade supervisionada para a não supervisionada
                atletas.push({
                    nome: atletaImportado.nome,
                    peso: atletaImportado.peso,
                    velocidade: atletaImportado.velocidade, 
                    distancia: atletaImportado.distancia,
                    calorias: atletaImportado.calorias,
                    grupo: null,
                    perfil: "Não classificado"
                });
                novoAtletas++;
            } else {
                atletasExistentes++;
            }
        });
        
        atualizarTabela();
        atualizarGrafico();
        
        if (novoAtletas > 0) {
            alert(`Importação concluída com sucesso!\n- ${novoAtletas} novos atletas adicionados\n- ${atletasExistentes} atletas já existentes foram ignorados`);
        } else if (atletasExistentes > 0) {
            alert(`Nenhum novo atleta adicionado. Todos os ${atletasExistentes} atletas já existiam na lista atual.`);
        } else {
            alert("Nenhum atleta foi importado. Verifique os dados na atividade supervisionada.");
        }
    } catch (error) {
        console.error("Erro ao importar dados:", error);
        alert("Ocorreu um erro ao importar os dados. Verifique o console para mais detalhes.");
    }
}

// Função para limpar todos os dados
function limparDados() {
    if (confirm("Tem certeza que deseja remover todos os atletas? Esta ação não pode ser desfeita.")) {
        atletas = [];
        atualizarTabela();
        atualizarGrafico();
        
        // Limpar a análise de grupos
        const analiseContainer = document.getElementById("analiseGrupos");
        if (analiseContainer) analiseContainer.innerHTML = "";
        
        alert("Todos os dados foram removidos com sucesso.");
    }
}

// Função para comparar os dados importados com os grupos formados
function compararDadosSupervisionados() {
    // Verificar se há dados suficientes e se o agrupamento foi feito
    if (atletas.length === 0) {
        alert("Não há atletas para comparar.");
        return;
    }
    
    const atletasClassificados = atletas.filter(a => a.grupo !== null);
    if (atletasClassificados.length === 0) {
        alert("Execute o agrupamento primeiro para poder comparar os resultados.");
        return;
    }
    
    // Buscar as categorias supervisionadas (se existirem)
    try {
        const atletasSalvos = localStorage.getItem('atletasSupervisionados');
        if (!atletasSalvos) {
            alert("Não foram encontrados dados supervisionados para comparação.");
            return;
        }
        
        const atletasSupervisionados = JSON.parse(atletasSalvos);
        
        // Criar mapeamento entre nomes e categorias supervisionadas
        const categoriasSupervisionadas = {};
        atletasSupervisionados.forEach(a => {
            if (a.nome && a.categoria) {
                categoriasSupervisionadas[a.nome] = a.categoria;
            }
        });
        
        // Contar quantos atletas de cada categoria supervisionada estão em cada grupo
        const comparacao = [];
        for (let i = 0; i < k; i++) {
            const atletasDoGrupo = atletas.filter(a => a.grupo === i);
            const distribuicaoCategoria = {
                grupo: i + 1,
                total: atletasDoGrupo.length,
                Elite: 0,
                Amador: 0,
                Iniciante: 0,
                NaoClassificado: 0
            };
            
            atletasDoGrupo.forEach(atleta => {
                const categoriaSupervisionada = categoriasSupervisionadas[atleta.nome];
                if (categoriaSupervisionada) {
                    distribuicaoCategoria[categoriaSupervisionada]++;
                } else {
                    distribuicaoCategoria.NaoClassificado++;
                }
            });
            
            comparacao.push(distribuicaoCategoria);
        }
        
        // Exibir os resultados da comparação
        let resultadoHtml = `
            <div class="comparacao-resultado">
                <h3>Comparação com Classificação Supervisionada</h3>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Grupo</th>
                            <th>Total de Atletas</th>
                            <th>Elite</th>
                            <th>Amador</th>
                            <th>Iniciante</th>
                            <th>Não Classificado</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        comparacao.forEach(grupo => {
            resultadoHtml += `
                <tr>
                    <td>Grupo ${grupo.grupo}</td>
                    <td>${grupo.total}</td>
                    <td>${grupo.Elite} (${Math.round(grupo.Elite / grupo.total * 100)}%)</td>
                    <td>${grupo.Amador} (${Math.round(grupo.Amador / grupo.total * 100)}%)</td>
                    <td>${grupo.Iniciante} (${Math.round(grupo.Iniciante / grupo.total * 100)}%)</td>
                    <td>${grupo.NaoClassificado} (${Math.round(grupo.NaoClassificado / grupo.total * 100)}%)</td>
                </tr>
            `;
        });
        
        resultadoHtml += `
                    </tbody>
                </table>
                <div class="analise-comparacao">
                    <h4>Análise da Comparação:</h4>
                    <p>A tabela acima mostra como os atletas classificados na atividade supervisionada (Elite, Amador, Iniciante) 
                    estão distribuídos nos grupos formados pelo algoritmo de agrupamento não supervisionado (k-means).</p>
                    <p>Esta comparação permite avaliar se o algoritmo não supervisionado conseguiu identificar 
                    padrões semelhantes aos da classificação supervisionada.</p>
                </div>
            </div>
        `;
        
        // Adicionar o resultado à página
        const comparacaoContainer = document.getElementById("comparacaoSupervisionada");
        if (comparacaoContainer) {
            comparacaoContainer.innerHTML = resultadoHtml;
        } else {
            // Se o elemento não existir, criar um novo
            const analiseContainer = document.getElementById("analiseGrupos");
            if (analiseContainer) {
                const novoContainer = document.createElement("div");
                novoContainer.id = "comparacaoSupervisionada";
                novoContainer.innerHTML = resultadoHtml;
                analiseContainer.parentNode.insertBefore(novoContainer, analiseContainer.nextSibling);
            }
        }
        
    } catch (error) {
        console.error("Erro ao comparar dados:", error);
        alert("Ocorreu um erro ao comparar os dados. Verifique o console para mais detalhes.");
    }
}

// Verificar ao carregar a página se existem dados salvos
window.addEventListener('DOMContentLoaded', function() {
    // Verificar se há dados salvos da atividade supervisionada
    try {
        const atletasSalvos = localStorage.getItem('atletasSupervisionados');
        if (atletasSalvos) {
            const atletasSupervisionados = JSON.parse(atletasSalvos);
            if (atletasSupervisionados.length > 0) {
                // Adicionar botão de importação automática ou notificação
                const notificacao = document.createElement("div");
                notificacao.className = "alert alert-info mt-3";
                notificacao.innerHTML = `
                    <strong>Dados disponíveis!</strong> Foram encontrados ${atletasSupervisionados.length} atletas da atividade supervisionada.
                    <button onclick="importarDadosSalvos()" class="btn btn-primary btn-sm ms-2">Importar Dados</button>
                `;
                
                // Adicionar a notificação no início da página
                const container = document.querySelector(".container") || document.body;
                container.insertBefore(notificacao, container.firstChild);
            }
        }
    } catch (error) {
        console.error("Erro ao verificar dados salvos:", error);
    }
    
    // Configurar o seletor de número de grupos
    const selectGrupos = document.getElementById('numeroGrupos');
    if (selectGrupos) {
        selectGrupos.addEventListener('change', function() {
            k = parseInt(this.value);
        });
    }
    
    // Adicionar botões adicionais à interface se necessário
    const botoesContainer = document.querySelector('.botoes-container') || document.querySelector('.form-buttons');
    if (botoesContainer) {
        // Adicionar botão para comparar resultados
        const btnComparar = document.createElement('button');
        btnComparar.className = 'btn btn-info ms-2';
        btnComparar.textContent = 'Comparar com Supervisionado';
        btnComparar.onclick = compararDadosSupervisionados;
        botoesContainer.appendChild(btnComparar);
        
        // Adicionar botão para limpar dados
        const btnLimpar = document.createElement('button');
        btnLimpar.className = 'btn btn-danger ms-2';
        btnLimpar.textContent = 'Limpar Dados';
        btnLimpar.onclick = limparDados;
        botoesContainer.appendChild(btnLimpar);
    }
});

// Exportar os resultados do agrupamento
function exportarResultados() {
    if (atletas.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }
    
    try {
        // Formatar dados para exportação
        const atletasClassificados = atletas.filter(a => a.grupo !== null);
        const dadosExportar = {
            totalAtletas: atletas.length,
            atletasClassificados: atletasClassificados.length,
            numeroGrupos: k,
            grupos: []
        };
        
        // Coletar informações de cada grupo
        for (let i = 0; i < k; i++) {
            const atletasDoGrupo = atletas.filter(a => a.grupo === i);
            if (atletasDoGrupo.length > 0) {
                // Calcular médias do grupo
                const mediaPeso = atletasDoGrupo.reduce((acc, a) => acc + a.peso, 0) / atletasDoGrupo.length;
                const mediaVelocidade = atletasDoGrupo.reduce((acc, a) => acc + a.velocidade, 0) / atletasDoGrupo.length;
                const mediaDistancia = atletasDoGrupo.reduce((acc, a) => acc + a.distancia, 0) / atletasDoGrupo.length;
                const mediaCalorias = atletasDoGrupo.reduce((acc, a) => acc + a.calorias, 0) / atletasDoGrupo.length;
                
                dadosExportar.grupos.push({
                    grupo: i + 1,
                    totalAtletas: atletasDoGrupo.length,
                    mediaPeso: mediaPeso.toFixed(1),
                    mediaVelocidade: mediaVelocidade.toFixed(1),
                    mediaDistancia: mediaDistancia.toFixed(1),
                    mediaCalorias: mediaCalorias.toFixed(0),
                    atletas: atletasDoGrupo.map(a => a.nome)
                });
            }
        }
        
        // Converter para JSON e fazer download
        const jsonString = JSON.stringify(dadosExportar, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resultados_agrupamento.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert("Resultados exportados com sucesso!");
    } catch (error) {
        console.error("Erro ao exportar resultados:", error);
        alert("Ocorreu um erro ao exportar os resultados. Verifique o console para mais detalhes.");
    }
}
