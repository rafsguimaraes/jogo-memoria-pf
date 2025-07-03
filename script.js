// FireMemory - script.js
// Lógica universal para todas as etapas e menu

document.addEventListener('DOMContentLoaded', function() {
  // Mensagem gamificada no menu principal
  const intro = document.querySelector('.intro-text');
  if (intro) {
    intro.innerHTML += '<br><span style="color:#ff9800;font-weight:bold;">🔥 Dica: Complete todas as etapas para liberar conquistas especiais!</span>';
  }

  // Menu: clique nos botões de etapa
  document.querySelectorAll('.stage-button').forEach(btn => {
    btn.addEventListener('click', function() {
      // Futuro: enviar evento para backend, analytics, etc.
    });
  });

  // Jogo da Memória: só executa se houver .memory-grid na página
  const grid = document.querySelector('.memory-grid');
  if (!grid) return;

  // Busca os pares definidos na etapa (window.paresEtapa)
  const pares = window.paresEtapa || [];
  if (!pares.length) {
    grid.innerHTML = '<p style="color:#c00;font-weight:bold;">Nenhum conteúdo disponível para esta etapa.</p>';
    return;
  }

  let cartas = [];
  let primeiraCarta = null;
  let segundaCarta = null;
  let bloqueado = false;
  let tentativas = 0;
  let acertos = 0;

  function embaralhar(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function iniciarJogo() {
    tentativas = 0;
    acertos = 0;
    // Ensure these elements exist before trying to set their textContent
    const tentativasEl = document.getElementById('tentativas');
    const acertosEl = document.getElementById('acertos');
    if (tentativasEl) tentativasEl.textContent = tentativas;
    if (acertosEl) acertosEl.textContent = acertos;

    const parabens = document.getElementById('parabensMsg');
    if (parabens) parabens.style.display = 'none';

    primeiraCarta = null;
    segundaCarta = null;
    bloqueado = false;
    cartas = [];
    pares.forEach((par, idx) => {
      cartas.push({ id: idx + '-A', texto: par.frente, par: idx, virada: false, acertou: false, emoji: par.emoji });
      cartas.push({ id: idx + '-B', texto: par.verso, par: idx, virada: false, acertou: false, emoji: par.emoji });
    });
    embaralhar(cartas);
    renderizarCartas();
  }

  function renderizarCartas() {
    grid.innerHTML = '';
    cartas.forEach((carta, i) => {
      const card = document.createElement('div');
      card.className = 'card' + (carta.virada || carta.acertou ? ' flipped' : '');
      if (carta.acertou) card.classList.add('matched');

      const front = document.createElement('div');
      front.className = 'card-content card-front';
      front.textContent = carta.emoji;

      const back = document.createElement('div');
      back.className = 'card-content card-back';
      back.textContent = carta.texto;

      card.appendChild(front);
      card.appendChild(back);

      card.onclick = () => virarCarta(i);
      grid.appendChild(card);
    });
  }

  function virarCarta(idx) {
    if (bloqueado) return;
    const carta = cartas[idx];
    if (carta.virada || carta.acertou) return;
    carta.virada = true;
    renderizarCartas(); // Re-render to show the flip

    if (!primeiraCarta) {
      primeiraCarta = carta;
    } else if (!segundaCarta) {
      segundaCarta = carta;
      tentativas++;
      const tentativasEl = document.getElementById('tentativas');
      if (tentativasEl) tentativasEl.textContent = tentativas;

      if (primeiraCarta.par === segundaCarta.par && primeiraCarta.id !== segundaCarta.id) {
        primeiraCarta.acertou = true;
        segundaCarta.acertou = true;
        acertos++;
        const acertosEl = document.getElementById('acertos');
        if (acertosEl) acertosEl.textContent = acertos;

        primeiraCarta = null;
        segundaCarta = null;
        renderizarCartas(); // Re-render to show matched state

        if (acertos === pares.length) {
          const parabens = document.getElementById('parabensMsg');
          if (parabens) parabens.style.display = 'block';
        }
      } else {
        bloqueado = true;
        setTimeout(() => {
          primeiraCarta.virada = false;
          segundaCarta.virada = false;
          primeiraCarta = null;
          segundaCarta = null;
          bloqueado = false;
          renderizarCartas(); // Re-render to flip back
        }, 1100);
      }
    }
  }

  // Make iniciarJogo globally accessible for restart buttons on individual stage pages
  window.reiniciarJogoGlobal = iniciarJogo;

  // Check if there's a local restart button on the page (e.g. etapa2.html's own button)
  const localRestartButton = document.getElementById('reiniciar'); // as in etapa2.html from main
  if (localRestartButton) {
    localRestartButton.onclick = iniciarJogo;
  }

  iniciarJogo(); // Initialize the game on load
});
