let atletas = [];
let chart;

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
        atualizarGrafico();
    } else {
        alert("Preencha todos os campos corretamente.");
    }
}

function atualizarTabela() {
    const tabela = document.getElementById("tabelaAtletas");
    tabela.innerHTML = "";

    atletas.forEach(atleta => {
        const row = `<tr>
            <td>${atleta.peso} Kg</td>
            <td>${atleta.velocidade} Km/h</td>
            <td>${atleta.distancia.toFixed(2)} Km</td>
            <td>${atleta.calorias.toFixed(2)} Kcal</td>
            <td>${atleta.grupo !== null ? atleta.grupo : "N/A"}</td>
        </tr>`;
        tabela.innerHTML += row;
    });
}

function atualizarGrafico() {
    const ctx = document.getElementById("graficoAtletas").getContext("2d");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: atletas.map((atleta, index) => ({
                label: `Atleta ${index + 1} - Grupo ${atleta.grupo !== null ? atleta.grupo : "N/A"}`,
                data: [{ x: atleta.distancia, y: atleta.calorias }],
                backgroundColor: atleta.grupo !== null ? getCorGrupo(atleta.grupo) : "gray",
                pointRadius: 5
            }))
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: "Distância (Km)" } },
                y: { title: { display: true, text: "Calorias (Kcal)" } }
            }
        }
    });
}

function getCorGrupo(grupo) {
    const cores = ["red", "blue", "green", "orange", "purple"];
    return cores[grupo % cores.length];
}

function agruparAtletas(k = 3) {
    if (atletas.length < k) {
        alert("Número de atletas insuficiente para agrupar.");
        return;
    }

    let centroids = atletas.slice(0, k).map(a => [a.peso, a.velocidade, a.distancia]);
    let grupos = new Array(atletas.length);
    let mudou = true;

    while (mudou) {
        mudou = false;

        atletas.forEach((atleta, index) => {
            let melhorGrupo = 0;
            let menorDistancia = Infinity;

            centroids.forEach((centroide, g) => {
                const distancia = Math.sqrt(
                    (atleta.peso - centroide[0]) ** 2 +
                    (atleta.velocidade - centroide[1]) ** 2 +
                    (atleta.distancia - centroide[2]) ** 2
                );

                if (distancia < menorDistancia) {
                    melhorGrupo = g;
                    menorDistancia = distancia;
                }
            });

            if (grupos[index] !== melhorGrupo) {
                grupos[index] = melhorGrupo;
                mudou = true;
            }
        });

        for (let g = 0; g < k; g++) {
            let filtrados = atletas.filter((_, i) => grupos[i] === g);

            if (filtrados.length > 0) {
                centroids[g] = [
                    filtrados.reduce((sum, a) => sum + a.peso, 0) / filtrados.length,
                    filtrados.reduce((sum, a) => sum + a.velocidade, 0) / filtrados.length,
                    filtrados.reduce((sum, a) => sum + a.distancia, 0) / filtrados.length
                ];
            }
        }
    }

    atletas.forEach((atleta, i) => {
        atleta.grupo = grupos[i];
    });

    atualizarTabela();
    atualizarGrafico();
}
