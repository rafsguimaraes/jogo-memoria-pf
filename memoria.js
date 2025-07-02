// memoria.js - Lógica universal para todas as etapas do Jogo da Memória
// Este script busca o array 'pares' definido em cada etapa e monta o grid de cartas automaticamente

window.addEventListener('DOMContentLoaded', function () {
  if (typeof pares === 'undefined' || !Array.isArray(pares) || pares.length === 0) return;
  const grid = document.getElementById('memoryGrid');
  if (!grid) return;

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
    if (document.getElementById('tentativas')) document.getElementById('tentativas').textContent = tentativas;
    if (document.getElementById('acertos')) document.getElementById('acertos').textContent = acertos;
    if (document.getElementById('parabensMsg')) document.getElementById('parabensMsg').style.display = 'none';
    primeiraCarta = null;
    segundaCarta = null;
    bloqueado = false;
    cartas = [];
    pares.forEach((par, idx) => {
      // Se "frente" já contém emoji, não duplica
      let frenteHtml = par.frente;
      if (!frenteHtml.includes(par.emoji)) {
        frenteHtml = '<span style="font-size:2em;">' + par.emoji + '</span><br>' + par.frente;
      }
      cartas.push({ id: idx + '-a', conteudo: frenteHtml, tipo: 'frente', par: idx });
      cartas.push({ id: idx + '-b', conteudo: par.verso, tipo: 'verso', par: idx });
    });
    embaralhar(cartas);
    renderizarCartas();
  }

  function renderizarCartas() {
    grid.innerHTML = '';
    cartas.forEach((carta, i) => {
      const div = document.createElement('div');
      div.className = 'card';
      div.setAttribute('data-id', carta.id);
      div.setAttribute('tabindex', 0);
      div.setAttribute('role', 'button');
      div.setAttribute('aria-label', 'Carta do jogo da memória');
      // Mostra o emoji do par antes de virar
      if (!div.classList.contains('flipped') && !div.classList.contains('matched')) {
        // Descobre o emoji do par
        let emoji = '';
        if (carta.tipo === 'frente' && typeof pares[carta.par] !== 'undefined') {
          emoji = pares[carta.par].emoji;
        } else if (typeof pares[carta.par] !== 'undefined') {
          emoji = pares[carta.par].emoji;
        }
        div.innerHTML = '<span style="font-size:2em;">' + emoji + '</span>';
      }
      div.onclick = () => virarCarta(div, carta, i);
      div.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') virarCarta(div, carta, i); };
      grid.appendChild(div);
    });
  }

  function virarCarta(div, carta, idx) {
    if (bloqueado || div.classList.contains('flipped') || div.classList.contains('matched')) return;
    div.classList.add('flipped');
    div.innerHTML = carta.conteudo;
    if (!primeiraCarta) {
      primeiraCarta = { div, carta, idx };
    } else if (!segundaCarta) {
      segundaCarta = { div, carta, idx };
      bloqueado = true;
      tentativas++;
      if (document.getElementById('tentativas')) document.getElementById('tentativas').textContent = tentativas;
      if (primeiraCarta.carta.par === segundaCarta.carta.par && primeiraCarta.idx !== segundaCarta.idx) {
        setTimeout(() => {
          primeiraCarta.div.classList.add('matched');
          segundaCarta.div.classList.add('matched');
          acertos++;
          if (document.getElementById('acertos')) document.getElementById('acertos').textContent = acertos;
          if (acertos === pares.length) {
            if (document.getElementById('parabensMsg')) document.getElementById('parabensMsg').style.display = 'block';
          }
          primeiraCarta = null;
          segundaCarta = null;
          bloqueado = false;
        }, 500);
      } else {
        setTimeout(() => {
          primeiraCarta.div.classList.remove('flipped');
          segundaCarta.div.classList.remove('flipped');
          primeiraCarta.div.innerHTML = '?';
          segundaCarta.div.innerHTML = '?';
          primeiraCarta = null;
          segundaCarta = null;
          bloqueado = false;
        }, 900);
      }
    }
  }

  window.iniciarJogo = iniciarJogo;
  iniciarJogo();
});
