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
    memoryGridEl = document.getElementById('memoryGrid'); // Changed from grid to memoryGridEl
    timerEl = document.getElementById('timer');
    progressBarEl = document.getElementById('progressBar');
    paresRestantesEl = document.getElementById('paresRestantes');

    // Garante que o elemento do timer exista no scoreboard
    if (timerEl === null && document.querySelector('.scoreboard')) { // Check if scoreboard exists
        const scoreboardDiv = document.querySelector('.scoreboard div:last-child');
        if (scoreboardDiv && scoreboardDiv.parentElement) {
            const timerDiv = document.createElement('div');
            timerDiv.innerHTML = 'Tempo: <span id="timer">0s</span>';
            scoreboardDiv.parentElement.appendChild(timerDiv);
            timerEl = document.getElementById('timer');
        } else {
            const gameContainer = document.querySelector('.game-container');
            if(gameContainer && memoryGridEl) { // Ensure memoryGridEl is defined for insertion point
                const timerDiv = document.createElement('div');
                // timerDiv.id = "timerFallbackContainer"; // Avoid if not strictly necessary, keep it simple
                timerDiv.style.textAlign = 'center'; // Basic styling for fallback
                timerDiv.style.marginBottom = '10px';
                timerDiv.innerHTML = 'Tempo: <span id="timer">0s</span>';
                gameContainer.insertBefore(timerDiv, memoryGridEl);
                timerEl = document.getElementById('timer');
            }
        }
    }

    if (timerEl) { // Only start timer if element exists
        iniciarTimer();
    }
    atualizarProgresso();

    if (!window.dadosDaEtapaAtual || window.dadosDaEtapaAtual.length === 0) {
      console.error("Dados da etapa não foram definidos ou estão vazios. Verifique a variável 'window.dadosDaEtapaAtual' no HTML.");
      if (memoryGridEl) memoryGridEl.innerHTML = "<p style='color:red;'>Erro: Dados da etapa não carregados.</p>";
      return;
    }

    const dadosEtapa = window.dadosDaEtapaAtual;
    totalPares = dadosEtapa.length;

    // Reset game state variables
    tentativas = 0;
    acertos = 0;
    primeiraCarta = null;
    segundaCarta = null;
    bloqueado = false;
    cartas = [];


    if (tentativasEl) tentativasEl.textContent = tentativas;
    if (acertosEl) acertosEl.textContent = acertos;
    if (parabensMsgEl) parabensMsgEl.style.display = 'none';


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
        conteudoFrente: par.emoji,
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
      // console.error("Elemento 'memoryGrid' não encontrado durante a renderização."); // Already handled by early return in event listener
      return;
    }
    memoryGridEl.innerHTML = '';

    cartas.forEach((carta) => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card';
      cardDiv.dataset.cardId = carta.id;

      if (carta.virada) cardDiv.classList.add('flipped');
      if (carta.acertou) cardDiv.classList.add('matched');

      const cardFront = document.createElement('div');
      cardFront.className = 'card-content card-front';
      cardFront.textContent = carta.conteudoFrente;

      const cardBack = document.createElement('div');
      cardBack.className = 'card-content card-back';
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

    const cardElement = Array.from(memoryGridEl.children).find(el => el.dataset.cardId === cartaClicada.id);
    if (cardElement) {
        cardElement.classList.add('flipped');
    }
    cartaClicada.virada = true;

    if (!primeiraCarta) {
      primeiraCarta = cartaClicada;
    } else if (!segundaCarta) {
      if (cartaClicada.id === primeiraCarta.id) {
          if (cardElement) cardElement.classList.remove('flipped');
          cartaClicada.virada = false;
          return;
      }
      segundaCarta = cartaClicada;
      tentativas++;
      if (tentativasEl) tentativasEl.textContent = tentativas;

      if (primeiraCarta.parId === segundaCarta.parId) {
        primeiraCarta.acertou = true;
        segundaCarta.acertou = true;
        acertos++;
        if (acertosEl) acertosEl.textContent = acertos;
        atualizarProgresso();

        const primeiraCartaEl = Array.from(memoryGridEl.children).find(el => el.dataset.cardId === primeiraCarta.id);
        const segundaCartaEl = Array.from(memoryGridEl.children).find(el => el.dataset.cardId === segundaCarta.id);
        if(primeiraCartaEl) primeiraCartaEl.classList.add('matched');
        if(segundaCartaEl) segundaCartaEl.classList.add('matched');

        primeiraCarta = null;
        segundaCarta = null;
        // bloqueado should remain false here

        if (acertos === totalPares) {
          if (parabensMsgEl) {
            parabensMsgEl.innerHTML = `Parabéns! Você concluiu a etapa em ${tempoDecorrido}s com ${tentativas} tentativas! <br> ${calcularEstrelas()}`;
            parabensMsgEl.style.display = 'block';
          }
          pararTimer();
        }
      } else {
        bloqueado = true;
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
    if(memoryGridEl && memoryGridEl.children){ // Check if memoryGridEl and its children exist
        if (primeiraCarta) {
            const el1 = Array.from(memoryGridEl.children).find(el => el && el.dataset && el.dataset.cardId === primeiraCarta.id);
            if (el1) el1.classList.remove('flipped');
            primeiraCarta.virada = false;
        }
        if (segundaCarta) {
            const el2 = Array.from(memoryGridEl.children).find(el => el && el.dataset && el.dataset.cardId === segundaCarta.id);
            if (el2) el2.classList.remove('flipped');
            segundaCarta.virada = false;
        }
    }
    primeiraCarta = null;
    segundaCarta = null;
    bloqueado = false;
  }
}

function iniciarTimer() {
  pararTimer();
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
  const maxTentativasPara3Estrelas = totalPares + Math.floor(totalPares * 0.5);
  const maxTentativasPara2Estrelas = totalPares + totalPares;

  let estrelas = '⭐';

  if (tentativas <= maxTentativasPara3Estrelas) {
    estrelas = '⭐⭐⭐';
  } else if (tentativas <= maxTentativasPara2Estrelas) {
    estrelas = '⭐⭐';
  }
  return `<span class='estrelas'>${estrelas}</span>`;
}

function atualizarProgresso() {
  if (progressBarEl) {
    const progressoPercentual = totalPares > 0 ? (acertos / totalPares) * 100 : 0;
    progressBarEl.style.width = progressoPercentual + '%';
  }
  if (paresRestantesEl) {
    const restantes = totalPares - acertos;
    paresRestantesEl.textContent = `Pares restantes: ${restantes}`;
  }
}

// Event listener setup
document.addEventListener('DOMContentLoaded', function() {
  // This part is for index.html enhancements, keep it.
  const intro = document.querySelector('.intro-text');
  if (intro) {
    intro.innerHTML += '<br><span style="color:#ff9800;font-weight:bold;">🔥 Dica: Complete todas as etapas para liberar conquistas especiais!</span>';
  }

  document.querySelectorAll('.stage-button').forEach(btn => {
    btn.addEventListener('click', function() {
      // Future analytics or logging
    });
  });

  // Game specific initialization, only if on a game page
  memoryGridEl = document.getElementById('memoryGrid'); // Assign here, as it's used by iniciarJogo
  if (memoryGridEl) { // Check if we are on a page with a memory grid
    if (window.dadosDaEtapaAtual && window.dadosDaEtapaAtual.length > 0) {
      iniciarJogo(); // Initialize the game if data is present
    } else {
      console.warn("`window.dadosDaEtapaAtual` não definido ou vazio para esta página. O jogo não será iniciado automaticamente pelo script global.");
      // memoryGridEl.innerHTML = "<p style='color:orange;'>Conteúdo da etapa não carregado via script global.</p>";
    }

    const btnRestartPage = document.getElementById('btn-restart-game'); // For buttons specific to stage pages
    if (btnRestartPage) {
        btnRestartPage.addEventListener('click', iniciarJogo);
    }
  }
});

// Expose iniciarJogo globally if other scripts or inline HTML needs to call it.
// This is what the original 'feature' branch had with configurarListeners.
// The DOMContentLoaded ensures elements are ready before this is globally available and potentially called.
window.iniciarJogoGlobal = iniciarJogo;
