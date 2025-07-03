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
    if (timerEl === null && document.querySelector('.scoreboard')) { 
        const scoreboardDiv = document.querySelector('.scoreboard');
        // Verifica se já não existe um span com id timer para evitar duplicar
        if (scoreboardDiv && !scoreboardDiv.querySelector('#timer')) {
            const timerDivContainer = document.createElement('div'); // Cria um div para o timer
            timerDivContainer.innerHTML = 'Tempo: <span id="timer">0s</span>';
            scoreboardDiv.appendChild(timerDivContainer);
            timerEl = document.getElementById('timer');
        }
    } else if (timerEl === null) {
        // Fallback se a estrutura do scoreboard for inesperada ou não existir
        const gameContainer = document.querySelector('.game-container');
        if(gameContainer && !document.getElementById('timer')) {
            const timerDiv = document.createElement('div');
            timerDiv.id = "timerFallbackContainer";
            timerDiv.style.textAlign = 'center';
            timerDiv.style.marginBottom = '10px';
            timerDiv.innerHTML = 'Tempo: <span id="timer">0s</span>'; 
            gameContainer.insertBefore(timerDiv, memoryGridEl || gameContainer.firstChild); 
            timerEl = document.getElementById('timer');
        }
    }

    pararTimer(); // Limpa timer anterior antes de iniciar um novo
    iniciarTimer();
    
    if (!window.dadosDaEtapaAtual || window.dadosDaEtapaAtual.length === 0) {
      console.error("Dados da etapa não foram definidos ou estão vazios. Verifique a variável 'window.dadosDaEtapaAtual' no HTML da etapa.");
      if (memoryGridEl) memoryGridEl.innerHTML = "<p style='color:red; text-align:center;'>Erro: Dados da etapa não carregados. Verifique o console (F12).</p>";
      return;
    }
    
    const dadosEtapa = window.dadosDaEtapaAtual;
    totalPares = dadosEtapa.length;

    tentativas = 0;
    acertos = 0;

    if (tentativasEl) tentativasEl.textContent = tentativas;
    if (acertosEl) acertosEl.textContent = acertos;
    if (parabensMsgEl) {
        parabensMsgEl.style.display = 'none';
        parabensMsgEl.innerHTML = "Parabéns! Você concluiu a etapa!"; // Reset msg
    }
    
    primeiraCarta = null;
    segundaCarta = null;
    bloqueado = false;
    cartas = [];
    
    dadosEtapa.forEach((par, idx) => {
      cartas.push({ 
        id: idx + '-A', 
        tipo: 'frente', // Identificador do tipo de carta (pode ser usado para lógicas futuras)
        parId: idx, // ID do par ao qual esta carta pertence
        conteudoFrente: par.emoji, // O que aparece na frente da carta (emoji)
        conteudoVerso: par.frente, // O que aparece no verso (o conceito/pergunta)
        virada: false, 
        acertou: false 
      });
      cartas.push({ 
        id: idx + '-B', 
        tipo: 'verso', // Identificador do tipo de carta
        parId: idx, // ID do par ao qual esta carta pertence
        conteudoFrente: par.emoji, // Verso também mostra emoji na parte da frente visual
        conteudoVerso: par.verso, // O que aparece no verso (a definição/resposta)
        virada: false, 
        acertou: false 
      });
    });

    embaralhar(cartas);
    renderizarCartas();
    atualizarProgresso(); // Atualiza a barra de progresso e pares restantes no início

  } catch (error) {
    console.error("Erro ao iniciar o jogo:", error);
    if (memoryGridEl) memoryGridEl.innerHTML = "<p style='color:red; text-align:center;'>Ocorreu um erro ao iniciar o jogo. Tente recarregar.</p>";
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
      cardDiv.dataset.cardId = carta.id; 

      // Não adiciona 'flipped' ou 'matched' aqui, pois o estado inicial é sempre não virado
      // Essas classes serão adicionadas dinamicamente ao virar/acertar
      
      const cardFront = document.createElement('div');
      cardFront.className = 'card-content card-front';
      cardFront.textContent = carta.conteudoFrente; 
      
      const cardBack = document.createElement('div');
      cardBack.className = 'card-content card-back';
      cardBack.innerHTML = carta.conteudoVerso; // Usar innerHTML para permitir tags como <br> ou <strong> se necessário

      cardDiv.appendChild(cardFront);
      cardDiv.appendChild(cardBack);
      
      // Só adiciona o evento de clique se a carta ainda não foi acertada
      if (!carta.acertou) {
        cardDiv.onclick = () => virarCarta(carta);
      }
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
          // Clicou na mesma carta, desvira e reseta.
          if (cardElement) cardElement.classList.remove('flipped');
          cartaClicada.virada = false;
          // Não conta como tentativa, pois foi um clique inválido na mesma carta
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
        
        if(primeiraCartaEl) {
            primeiraCartaEl.classList.add('matched');
            primeiraCartaEl.onclick = null; // Remove evento de clique após acertar
        }
        if(segundaCartaEl) {
            segundaCartaEl.classList.add('matched');
            segundaCartaEl.onclick = null; // Remove evento de clique após acertar
        }

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
        const primeiraCartaEl = Array.from(memoryGridEl.children).find(el => el.dataset.cardId === primeiraCarta.id);
        const segundaCartaEl = Array.from(memoryGridEl.children).find(el => el.dataset.cardId === segundaCarta.id);

        if(primeiraCartaEl) primeiraCartaEl.classList.add('error');
        if(segundaCartaEl) segundaCartaEl.classList.add('error');

        setTimeout(() => {
          if (primeiraCarta && !primeiraCarta.acertou) {
            primeiraCarta.virada = false;
            if (primeiraCartaEl) {
              primeiraCartaEl.classList.remove('flipped');
              primeiraCartaEl.classList.remove('error');
            }
          }
          if (segundaCarta && !segundaCarta.acertou) {
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
  // pararTimer() é chamado antes em iniciarJogo()
  tempoDecorrido = 0;
  if(timerEl) timerEl.textContent = tempoDecorrido + 's';
  timerInterval = setInterval(() => {
    tempoDecorrido++;
    if (timerEl) timerEl.textContent = tempoDecorrido + 's';
  }, 1000);
}

function pararTimer() {
  clearInterval(timerInterval);
  timerInterval = null; // Garante que o ID do intervalo seja limpo
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

// Adiciona o listener para iniciar o jogo quando a página carregar e para o botão de reiniciar.
function configurarListeners() {
    // Garante que iniciarJogo seja chamado após o DOM estar completamente carregado
    if (document.readyState === 'loading') { // Ainda carregando
        document.addEventListener('DOMContentLoaded', iniciarJogo);
    } else { // `DOMContentLoaded` já disparou
        iniciarJogo();
    }

    const btnRestart = document.getElementById('btn-restart-game');
    if (btnRestart) {
        // Remove listener antigo para evitar múltiplos, se configurarListeners for chamado mais de uma vez
        btnRestart.removeEventListener('click', iniciarJogo);
        btnRestart.addEventListener('click', iniciarJogo);
    }
}

// Chama a configuração dos listeners assim que o script é lido.
// iniciarJogo() será chamado por 'DOMContentLoaded' ou imediatamente se já carregado.
configurarListeners();