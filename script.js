let atletas = [];
let chart;

// Função para calcular calorias queimadas
function calcularCalorias(peso, velocidade, distancia) {
    const MET = velocidade;
    return MET * peso * 0.0175 * (distancia / velocidade) * 60;
}

// Adicionar atleta à tabela e ao gráfico
function adicionarAtleta() {
    const peso = parseFloat(document.getElementById("peso").value);
    const velocidade = parseFloat(document.getElementById("velocidade").value);
    const distancia = parseFloat(document.getElementById("distancia").value);

    if (!isNaN(peso) && !isNaN(velocidade) && !isNaN(distancia)) {
        const calorias = calcularCalorias(peso, velocidade, distancia);
        atletas.push({ peso, velocidade, distancia, calorias, grupo: null });

        atualizarTabela();
    } else {
        alert("Preencha todos os campos corretamente.");
    }
}

// Atualizar tabela com atletas e grupos
function atualizarTabela() {
    const tabela = document.getElementById("tabelaAtletas");
    tabela.innerHTML = "";

    atletas.forEach(atleta => {
        const row = `<tr>
            <td>${atleta.peso} Kg</td>
            <td>${atleta.velocidade} Km/h</td>
            <td>${atleta.distancia.toFixed(2)} Km</td>
            <td>${atleta.calorias.toFixed(2)} Kcal</td>
            <td>${atleta.grupo !== null ? `Grupo ${atleta.grupo}` : "Não Classificado"}</td>
        </tr>`;
        tabela.innerHTML += row;
    });
}

// Algoritmo K-Means para agrupamento não supervisionado
function kMeans(k) {
    if (atletas.length < k) {
        alert("Adicione mais atletas para o agrupamento.");
        return;
    }

    let centroides = [];
    for (let i = 0; i < k; i++) {
        centroides.push(atletas[Math.floor(Math.random() * atletas.length)].calorias);
    }

    let mudou;
    do {
        mudou = false;
        
        atletas.forEach(atleta => {
            let menorDistancia = Infinity;
            let grupoMaisProximo = 0;

            for (let i = 0; i < k; i++) {
                let distancia = Math.abs(atleta.calorias - centroides[i]);
                if (distancia < menorDistancia) {
                    menorDistancia = distancia;
                    grupoMaisProximo = i;
                }
            }

            if (atleta.grupo !== grupoMaisProximo) {
                atleta.grupo = grupoMaisProximo;
                mudou = true;
            }
        });

        let somaGrupos = Array(k).fill(0);
        let contagemGrupos = Array(k).fill(0);

        atletas.forEach(atleta => {
            somaGrupos[atleta.grupo] += atleta.calorias;
            contagemGrupos[atleta.grupo]++;
        });

        for (let i = 0; i < k; i++) {
            if (contagemGrupos[i] > 0) {
                centroides[i] = somaGrupos[i] / contagemGrupos[i];
            }
        }

    } while (mudou);

    atualizarTabela();
    atualizarGrafico(k);
}

// Atualizar gráfico com grupos formados
function atualizarGrafico(k) {
    const ctx = document.getElementById("graficoClusters").getContext("2d");

    if (chart) chart.destroy();

    const cores = ["red", "blue", "green", "purple", "orange"];
    let datasets = [];

    for (let i = 0; i < k; i++) {
        datasets.push({
            label: `Grupo ${i}`,
            data: atletas.filter(a => a.grupo === i).map(a => ({ x: a.distancia, y: a.calorias })),
            backgroundColor: cores[i],
            borderColor: cores[i],
            pointRadius: 6
        });
    }

    chart = new Chart(ctx, {
        type: "scatter",
        data: { datasets },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: "Distância (Km)" } },
                y: { title: { display: true, text: "Calorias (Kcal)" } }
            }
        }
    });
}

// Iniciar o agrupamento
function realizarAgrupamento() {
    const k = 3; // Definimos 3 grupos para melhor visualização
    kMeans(k);
}
