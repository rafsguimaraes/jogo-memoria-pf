// Variáveis globais do jogo
let cartas = [];
let primeiraCarta = null;
let segundaCarta = null;
let bloqueado = false;
let tentativas = 0;
let acertos = 0;
let totalPares = 0;

// Elementos DOM (serão buscados em iniciarJogo)
let tentativasEl, acertosEl, parabensMsgEl, memoryGridEl, timerEl, progressBarEl, paresRestantesEl;
let tempoDecorrido = 0;
let timerInterval = null;

/**
 * Embaralha um array utilizando o algoritmo Fisher-Yates.
 * @param {Array} array O array a ser embaralhado.
 */
function embaralhar(array) {
  try {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  } catch (error) {
    console.error("Erro ao embaralhar as cartas:", error);
  }
}

/**
 * Inicia ou reinicia o jogo.
 * Pega os dados da etapa da variável global `window.dadosDaEtapaAtual`.
 */
function iniciarJogo() {
  try {
    // Busca os elementos DOM aqui para garantir que existam quando o jogo iniciar
    tentativasEl = document.getElementById('tentativas');
    acertosEl = document.getElementById('acertos');
    parabensMsgEl = document.getElementById('parabensMsg');
    memoryGridEl = document.getElementById('memoryGrid');
    timerEl = document.getElementById('timer');
    progressBarEl = document.getElementById('progressBar');
    paresRestantesEl = document.getElementById('paresRestantes');

    // Garante que o elemento do timer exista no scoreboard
    if (timerEl === null) {
        const scoreboardDiv = document.querySelector('.scoreboard div:last-child'); // Tenta adicionar ao lado do último item
        if (scoreboardDiv && scoreboardDiv.parentElement) {
            const timerDiv = document.createElement('div');
            timerDiv.innerHTML = 'Tempo: <span id="timer">0s</span>';
            // Insere o timer como o último elemento no scoreboard
            scoreboardDiv.parentElement.appendChild(timerDiv);
            timerEl = document.getElementById('timer');
        } else {
            // Fallback se a estrutura do scoreboard for inesperada
            const gameContainer = document.querySelector('.game-container');
            if(gameContainer) {
                const timerDiv = document.createElement('div');
                timerDiv.id = "timerFallbackContainer" // Para evitar duplicidade de ID 'timer'
                timerDiv.innerHTML = 'Tempo: <span id="timer">0s</span>';
                gameContainer.insertBefore(timerDiv, memoryGridEl); // Adiciona antes da grade
                timerEl = document.getElementById('timer');
            }
        }
    }
    iniciarTimer();
    atualizarProgresso(); // Atualiza a barra de progresso e pares restantes no início


    if (!window.dadosDaEtapaAtual || window.dadosDaEtapaAtual.length === 0) {
      console.error("Dados da etapa não foram definidos ou estão vazios. Verifique a variável 'window.dadosDaEtapaAtual' no HTML.");
      if (memoryGridEl) memoryGridEl.innerHTML = "<p style='color:red;'>Erro: Dados da etapa não carregados.</p>";
      return;
    }

    const dadosEtapa = window.dadosDaEtapaAtual;
    totalPares = dadosEtapa.length;

    tentativas = 0;
    acertos = 0;

    if (tentativasEl) tentativasEl.textContent = tentativas;
    if (acertosEl) acertosEl.textContent = acertos;
    if (parabensMsgEl) parabensMsgEl.style.display = 'none';

    primeiraCarta = null;
    segundaCarta = null;
    bloqueado = false;
    cartas = [];

    dadosEtapa.forEach((par, idx) => {
      cartas.push({
        id: idx + '-A',
        tipo: 'frente',
        parId: idx,
        conteudoFrente: par.emoji,
        conteudoVerso: par.frente,
        virada: false,
        acertou: false
      });
      cartas.push({
        id: idx + '-B',
        tipo: 'verso',
        parId: idx,
        conteudoFrente: par.emoji, // Usar o mesmo emoji para a "frente" visual da carta de texto
        conteudoVerso: par.verso,
        virada: false,
        acertou: false
      });
    });

    embaralhar(cartas);
    renderizarCartas();
  } catch (error) {
    console.error("Erro ao iniciar o jogo:", error);
    if (memoryGridEl) memoryGridEl.innerHTML = "<p style='color:red;'>Ocorreu um erro ao iniciar o jogo. Tente recarregar.</p>";
  }
}

/**
 * Renderiza as cartas na grade do jogo.
 */
function renderizarCartas() {
  try {
    if (!memoryGridEl) {
      console.error("Elemento 'memoryGrid' não encontrado durante a renderização.");
      return;
    }
    memoryGridEl.innerHTML = ''; // Limpa a grade antes de renderizar

    cartas.forEach((carta) => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card';
      // Adiciona um data attribute para facilitar encontrar o objeto da carta depois, se necessário
      cardDiv.dataset.cardId = carta.id;

      if (carta.virada) cardDiv.classList.add('flipped');
      if (carta.acertou) cardDiv.classList.add('matched');

      const cardFront = document.createElement('div');
      cardFront.className = 'card-content card-front';
      // Se for uma carta de 'verso' (texto), a frente visual ainda mostra o emoji.
      // Se for uma carta de 'frente' (conceito), a frente visual também é o emoji.
      cardFront.textContent = carta.conteudoFrente;

      const cardBack = document.createElement('div');
      cardBack.className = 'card-content card-back';
      // O verso real da carta, seja o conceito (para carta emoji) ou a explicação (para carta conceito)
      cardBack.textContent = carta.conteudoVerso;

      cardDiv.appendChild(cardFront);
      cardDiv.appendChild(cardBack);

      cardDiv.onclick = () => virarCarta(carta);
      memoryGridEl.appendChild(cardDiv);
    });
  } catch (error) {
    console.error("Erro ao renderizar as cartas:", error);
  }
}

/**
 * Lida com o clique em uma carta.
 * @param {Object} cartaClicada O objeto da carta que foi clicada.
 */
function virarCarta(cartaClicada) {
  try {
    if (bloqueado || cartaClicada.virada || cartaClicada.acertou) return;

    // Encontra o elemento DOM correspondente à carta clicada e adiciona/remove 'flipped'
    // Isso é mais eficiente do que re-renderizar tudo.
    const cardElement = Array.from(memoryGridEl.children).find(el => el.dataset.cardId === cartaClicada.id);
    if (cardElement) {
        cardElement.classList.add('flipped');
    }
    cartaClicada.virada = true;

    if (!primeiraCarta) {
      primeiraCarta = cartaClicada;
    } else if (!segundaCarta) {
      // Garante que não está clicando na mesma carta duas vezes (embora a lógica de parId resolva isso)
      if (cartaClicada.id === primeiraCarta.id) {
          // Clicou na mesma carta, desvira a primeira e reseta.
          // Isso pode acontecer se o usuário for muito rápido.
          if (cardElement) cardElement.classList.remove('flipped');
          cartaClicada.virada = false;
          return;
      }
      segundaCarta = cartaClicada;
      tentativas++;
      if (tentativasEl) tentativasEl.textContent = tentativas;

      if (primeiraCarta.parId === segundaCarta.parId) { // Verifica se são um par pelo parId
        primeiraCarta.acertou = true;
        segundaCarta.acertou = true;
        acertos++;
        if (acertosEl) acertosEl.textContent = acertos;
        atualizarProgresso(); // Atualiza a barra de progresso e pares restantes

        // Adiciona a classe 'matched' aos elementos DOM correspondentes
        const primeiraCartaEl = Array.from(memoryGridEl.children).find(el => el.dataset.cardId === primeiraCarta.id);
        const segundaCartaEl = Array.from(memoryGridEl.children).find(el => el.dataset.cardId === segundaCarta.id);
        if(primeiraCartaEl) primeiraCartaEl.classList.add('matched');
        if(segundaCartaEl) segundaCartaEl.classList.add('matched');

        primeiraCarta = null;
        segundaCarta = null;
        bloqueado = false;

        if (acertos === totalPares) {
          if (parabensMsgEl) {
            parabensMsgEl.innerHTML = `Parabéns! Você concluiu a etapa em ${tempoDecorrido}s com ${tentativas} tentativas! <br> ${calcularEstrelas()}`;
            parabensMsgEl.style.display = 'block';
          }
          pararTimer();
        }
      } else {
        bloqueado = true;
        // Feedback de erro visual
        const primeiraCartaEl = Array.from(memoryGridEl.children).find(el => el.dataset.cardId === primeiraCarta.id);
        const segundaCartaEl = Array.from(memoryGridEl.children).find(el => el.dataset.cardId === segundaCarta.id);

        if(primeiraCartaEl) primeiraCartaEl.classList.add('error');
        if(segundaCartaEl) segundaCartaEl.classList.add('error');

        setTimeout(() => {
          if (primeiraCarta) {
            primeiraCarta.virada = false;
            if (primeiraCartaEl) {
              primeiraCartaEl.classList.remove('flipped');
              primeiraCartaEl.classList.remove('error');
            }
          }
          if (segundaCarta) {
            segundaCarta.virada = false;
            if (segundaCartaEl) {
              segundaCartaEl.classList.remove('flipped');
              segundaCartaEl.classList.remove('error');
            }
          }
          primeiraCarta = null;
          segundaCarta = null;
          bloqueado = false;
        }, 1200);
      }
    }
  } catch (error) {
    console.error("Erro ao virar a carta:", error);
    // Tenta resetar o estado para evitar bloqueios
    if (primeiraCarta) {
        const el1 = Array.from(memoryGridEl.children).find(el => el.dataset.cardId === primeiraCarta.id);
        if (el1) el1.classList.remove('flipped');
        primeiraCarta.virada = false;
    }
    if (segundaCarta) {
        const el2 = Array.from(memoryGridEl.children).find(el => el.dataset.cardId === segundaCarta.id);
        if (el2) el2.classList.remove('flipped');
        segundaCarta.virada = false;
    }
    primeiraCarta = null;
    segundaCarta = null;
    bloqueado = false;
  }
}

function iniciarTimer() {
  pararTimer(); // Garante que qualquer timer anterior seja limpo
  tempoDecorrido = 0;
  if(timerEl) timerEl.textContent = tempoDecorrido + 's';
  timerInterval = setInterval(() => {
    tempoDecorrido++;
    if (timerEl) timerEl.textContent = tempoDecorrido + 's';
  }, 1000);
}

function pararTimer() {
  clearInterval(timerInterval);
}

function calcularEstrelas() {
  // Critérios para estrelas (ajustar conforme necessário)
  // totalPares é o número de pares únicos na etapa
  const maxTentativasPara3Estrelas = totalPares + Math.floor(totalPares * 0.5); // Ex: 8 pares -> 12 tentativas
  const maxTentativasPara2Estrelas = totalPares + totalPares; // Ex: 8 pares -> 16 tentativas
  // Tempo também pode ser um fator, mas vamos focar nas tentativas por enquanto
  // const tempoMaxPara3Estrelas = totalPares * 5; // Ex: 8 pares -> 40 segundos

  let estrelas = '⭐'; // Pelo menos 1 estrela por completar

  if (tentativas <= maxTentativasPara3Estrelas) {
    estrelas = '⭐⭐⭐';
  } else if (tentativas <= maxTentativasPara2Estrelas) {
    estrelas = '⭐⭐';
  }

  // Exemplo com tempo (descomentar e ajustar se quiser usar)
  /*
  if (tentativas <= maxTentativasPara3Estrelas && tempoDecorrido <= tempoMaxPara3Estrelas) {
    estrelas = '⭐⭐⭐';
  } else if (tentativas <= maxTentativasPara2Estrelas && tempoDecorrido <= totalPares * 7) {
    estrelas = '⭐⭐';
  }
  */
  return `<span class='estrelas'>${estrelas}</span>`;
}

function atualizarProgresso() {
  if (progressBarEl) {
    const progressoPercentual = totalPares > 0 ? (acertos / totalPares) * 100 : 0;
    progressBarEl.style.width = progressoPercentual + '%';
    // progressBarEl.textContent = Math.round(progressoPercentual) + '%'; // Opcional: mostrar porcentagem na barra
  }
  if (paresRestantesEl) {
    const restantes = totalPares - acertos;
    paresRestantesEl.textContent = `Pares restantes: ${restantes}`;
  }
}

// Adiciona o listener para iniciar o jogo quando a página carregar.
// A função iniciarJogo agora depende de `window.dadosDaEtapaAtual` que deve ser definido no HTML.
function configurarListeners() {
    if (window.addEventListener) {
        window.addEventListener('load', iniciarJogo, false);
    } else if (window.attachEvent) {
        window.attachEvent('onload', iniciarJogo);
    } else {
        document.addEventListener('DOMContentLoaded', iniciarJogo, false);
    }

    // Adiciona listener para o botão de reiniciar, se existir
    const btnRestart = document.getElementById('btn-restart-game');
    if (btnRestart) {
        btnRestart.addEventListener('click', iniciarJogo);
    }
}

configurarListeners();
