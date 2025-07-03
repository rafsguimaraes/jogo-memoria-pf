// FireMemory - script.js
// Exemplo de lógica para menu e integração futura com backend

document.addEventListener('DOMContentLoaded', function() {
  // Exemplo: mensagem de boas-vindas gamificada
  const intro = document.querySelector('.intro-text');
  if (intro) {
    intro.innerHTML += '<br><span style="color:#ff9800;font-weight:bold;">🔥 Dica: Complete todas as etapas para liberar conquistas especiais!</span>';
  }

  // Exemplo: clique nos botões de etapa
  document.querySelectorAll('.stage-button').forEach(btn => {
    btn.addEventListener('click', function() {
      // Futuro: enviar evento para backend, analytics, etc.
      // fetch('/api/etapa', { method: 'POST', body: JSON.stringify({ etapa: this.href }) });
    });
  });
});
