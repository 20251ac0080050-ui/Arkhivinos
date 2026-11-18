// Botão "voltar ao topo": aparece depois de rolar um pouco a página
(function () {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'voltarTopo';
  botao.setAttribute('aria-label', 'Voltar ao topo da página');
  botao.title = 'Voltar ao topo';
  botao.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 15 12 9 18 15"/></svg>';
  document.body.appendChild(botao);

  function atualizar() {
    botao.classList.toggle('visivel', window.scrollY > 300);
  }

  botao.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', atualizar, { passive: true });
  atualizar();
})();
