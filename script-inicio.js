// Página Início — mostra um projeto do banco como exemplo (sorteado a cada visita)
document.addEventListener('DOMContentLoaded', async () => {
  const area = document.getElementById('exemploProjeto');

  function linkSeguro(url) {
    return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
  }

  function capaDoArtigo(url) {
    if (!linkSeguro(url)) return null;
    const achou = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || url.match(/[?&]id=([\w-]+)/);
    return achou ? 'https://drive.google.com/thumbnail?id=' + achou[1] + '&sz=w600' : null;
  }

  const ICONE_DOC = `<svg class="icone-doc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>`;
  window.ICONE_DOC_HTML = ICONE_DOC;

  const { data, error } = await db.from('projetos').select('*');

  if (error || !data || data.length === 0) {
    area.innerHTML = '<p class="vazio">Nenhum projeto cadastrado ainda.</p>';
    return;
  }

  const p = data[Math.floor(Math.random() * data.length)];
  const capa = capaDoArtigo(p.link_artigo);
  const imagem = capa
    ? `<img src="${escaparHTML(capa)}" alt="Capa do artigo" onerror="this.onerror=null;this.outerHTML=ICONE_DOC_HTML">`
    : ICONE_DOC;

  const etiquetas = (p.palavras_chaves || '')
    .split(/[,.;]/).map(t => t.trim()).filter(Boolean)
    .map(t => `<span class="etiqueta">${escaparHTML(t)}</span>`).join('');

  area.innerHTML = `
    <article class="linha-projeto">
      <div class="linha-capa">${imagem}</div>
      <div class="linha-info">
        <h3 class="linha-titulo">${escaparHTML(p.nome_projeto)}</h3>
        <p class="linha-detalhe"><strong>Autores:</strong> ${escaparHTML(p.autores)}</p>
        <div class="etiquetas">
          ${p.ano_finalizacao ? `<span class="etiqueta ano">${escaparHTML(p.ano_finalizacao)}</span>` : ''}
          ${etiquetas}
        </div>
      </div>
      ${linkSeguro(p.link_artigo) ? `<a class="botaoArtigo" href="${escaparHTML(p.link_artigo)}" target="_blank" rel="noopener">Ver artigo &rarr;</a>` : ''}
    </article>`;
});
