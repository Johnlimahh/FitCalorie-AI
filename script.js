let atletas = [];
let chart;
let k = 3; // Número de clusters

function calcularCalorias(peso, velocidade, distancia) {
    const MET = velocidade; 
    return MET * peso * 0.0175 * (distancia / velocidade) * 60;
}

function adicionarAtleta() {
    const peso = parseFloat(document.getElementById("peso").value);
    const velocidade = parseFloat(document.getElementById("velocidade").value);
    const distancia = parseFloat(document.getElementById("distancia").value);

    if (!isNaN(peso) && !isNaN(velocidade) && !isNaN(distancia)) {
        const calorias = calcularCalorias(peso, velocidade, distancia);
        atletas.push({ peso, velocidade, distancia, calorias, grupo: null });
        atualizarTabela();
        if (atletas.length >= k) agruparAtletas();
    } else {
        alert("Preencha todos os campos corretamente.");
    }
}

function atualizarTabela() {
    const tabela = document.getElementById("tabelaAtletas");
    tabela.innerHTML = "";

    atletas.forEach((atleta, index) => {
        const row = `<tr>
            <td>${atleta.peso} Kg</td>
            <td>${atleta.velocidade} Km/h</td>
            <td>${atleta.distancia.toFixed(2)} Km</td>
            <td>${atleta.calorias.toFixed(2)} Kcal</td>
            <td>${atleta.grupo !== null ? `Grupo ${atleta.grupo}` : "N/A"}</td>
        </tr>`;
        tabela.innerHTML += row;
    });
}

function agruparAtletas() {
    let centroids = atletas.slice(0, k).map(a => ({ distancia: a.distancia, calorias: a.calorias }));
    let mudou;

    do {
        mudou = false;

        atletas.forEach(atleta => {
            let grupoMaisProximo = 0;
            let menorDistancia = Infinity;

            centroids.forEach((centroide, i) => {
                const dist = Math.sqrt((centroide.distancia - atleta.distancia) ** 2 + (centroide.calorias - atleta.calorias) ** 2);
                if (dist < menorDistancia) {
                    menorDistancia = dist;
                    grupoMaisProximo = i;
                }
            });

            if (atleta.grupo !== grupoMaisProximo) {
                atleta.grupo = grupoMaisProximo;
                mudou = true;
            }
        });

        centroids = centroids.map((_, i) => {
            const grupo = atletas.filter(a => a.grupo === i);
            return {
                distancia: grupo.reduce((acc, a) => acc + a.distancia, 0) / grupo.length || 0,
                calorias: grupo.reduce((acc, a) => acc + a.calorias, 0) / grupo.length || 0
            };
        });

    } while (mudou);

    atualizarTabela();
    atualizarGrafico();
}

function atualizarGrafico() {
    const ctx = document.getElementById("graficoClusters").getContext("2d");

    if (chart) chart.destroy();

    const cores = ["red", "blue", "green", "purple", "orange"];
    let datasets = [];

    for (let i = 0; i < k; i++) {
        datasets.push({
            label: `Grupo ${i}`,
            data: atletas.filter(a => a.grupo === i).map(a => ({ 
                x: a.distancia, 
                y: a.calorias,
                atleta: `Atleta ${atletas.indexOf(a) + 1} (Grupo ${i})`
            })),
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
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.raw.atleta;
                        }
                    }
                }
            },
            scales: {
                x: { title: { display: true, text: "Distância (Km)" } },
                y: { title: { display: true, text: "Calorias (Kcal)" } }
            }
        }
    });
}
