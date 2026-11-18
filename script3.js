document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');
  const menuAnos = document.getElementById('menuAnos');
  const btnFiltrar = document.getElementById('btnFiltrar');
  const msgErro = document.getElementById('mensagemErro');
  const lista = document.getElementById('listaProjetos');
  const btnVerMais = document.getElementById('btnVerMais');
  const contador = document.getElementById('contador');
  const listaGanhadores = document.getElementById('listaGanhadores');

  let itens = []; // projetos vindos do banco
  let anoSelecionado = ''; // '' = todos os anos

  const POR_PAGINA = 3;     // quantos projetos aparecem por vez
  let projetosDaLista = []; // resultado atual (com busca/filtro aplicados)
  let quantosMostrar = POR_PAGINA;

  // Só aceita links http/https (evita links maliciosos)
  function linkSeguro(url) {
    return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
  }

  // Se o artigo estiver no Google Drive, usa a 1ª página do PDF como imagem
  function capaDoArtigo(url) {
    if (!linkSeguro(url)) return null;
    const achou = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || url.match(/[?&]id=([\w-]+)/);
    return achou ? 'https://drive.google.com/thumbnail?id=' + achou[1] + '&sz=w600' : null;
  }

  function exibirErro(texto) {
    if (msgErro) {
      msgErro.textContent = texto;
      msgErro.style.display = 'block';
    } else {
      alert(texto);
    }
  }

  function limparErro() {
    if (msgErro) {
      msgErro.textContent = '';
      msgErro.style.display = 'none';
    }
  }

  function linkArtigo(p) {
    return linkSeguro(p.link_artigo)
      ? `<a class="botaoArtigo" href="${escaparHTML(p.link_artigo)}" target="_blank" rel="noopener">Ver artigo &rarr;</a>`
      : '';
  }

  // Ícone de documento usado nas linhas quando não há capa
  const ICONE_DOC = `<svg class="icone-doc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>`;

  // Imagem do projeto: capa do PDF no Drive ou, se não houver,
  // o logo do IFPR (cartões grandes) / ícone de documento (linhas)
  function imagemCapa(p, pequena = false) {
    const capa = capaDoArtigo(p.link_artigo);
    const reserva = pequena
      ? "this.onerror=null;this.outerHTML=ICONE_DOC_HTML"
      : "this.onerror=null;this.src='img/IFPR.png';this.className='sem-capa'";
    if (capa) {
      return `<img src="${escaparHTML(capa)}" alt="Capa do artigo" loading="lazy" onerror="${reserva}">`;
    }
    return pequena ? ICONE_DOC : `<img src="img/IFPR.png" alt="" class="sem-capa">`;
  }
  window.ICONE_DOC_HTML = ICONE_DOC;

  // ---------- PROJETOS GANHADORES (3 cartões do topo) ----------
  function mostrarGanhadores(projetos) {
    if (!listaGanhadores || projetos.length === 0) return;

    listaGanhadores.innerHTML = projetos.slice(0, 3).map(p => `
      <article class="cartao">
        <div class="cartao-capa">${imagemCapa(p)}</div>
        <div class="cartao-corpo">
          ${p.ano_finalizacao ? `<span class="selo">${escaparHTML(p.ano_finalizacao)}</span>` : ''}
          <h3 class="cartao-titulo" title="${escaparHTML(p.nome_projeto)}">${escaparHTML(p.nome_projeto)}</h3>
          <p class="cartao-autores">${escaparHTML(p.autores)}</p>
          ${linkArtigo(p)}
        </div>
      </article>`).join('');
  }

  // ---------- TODOS OS PROJETOS ----------
  // Recebe uma nova lista (busca/filtro) e volta a mostrar só os 3 primeiros
  function mostrarProjetos(projetos) {
    projetosDaLista = projetos;
    quantosMostrar = POR_PAGINA;
    desenharLista();
  }

  // Transforma "IA, Automação. Robótica" em etiquetas separadas
  function etiquetas(texto) {
    return (texto || '')
      .split(/[,.;]/)
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => `<span class="etiqueta">${escaparHTML(t)}</span>`)
      .join('');
  }

  function desenharLista() {
    if (projetosDaLista.length === 0) {
      lista.innerHTML = '<p class="vazio">Nenhum projeto encontrado.</p>';
      btnVerMais.hidden = true;
      contador.textContent = '';
      return;
    }

    const visiveis = projetosDaLista.slice(0, quantosMostrar);

    lista.innerHTML = visiveis.map(p => `
      <article class="linha-projeto">
        <div class="linha-capa">${imagemCapa(p, true)}</div>
        <div class="linha-info">
          <h3 class="linha-titulo">${escaparHTML(p.nome_projeto)}</h3>
          <p class="linha-detalhe"><strong>Autores:</strong> ${escaparHTML(p.autores)}</p>
          ${p.orientador ? `<p class="linha-detalhe"><strong>Orientador:</strong> ${escaparHTML(p.orientador)}${p.email_orientador ? ' (' + escaparHTML(p.email_orientador) + ')' : ''}</p>` : ''}
          ${p.area ? `<p class="linha-detalhe"><strong>Área:</strong> ${escaparHTML(p.area)}</p>` : ''}
          <div class="etiquetas">
            ${p.ano_finalizacao ? `<span class="etiqueta ano">${escaparHTML(p.ano_finalizacao)}</span>` : ''}
            ${etiquetas(p.palavras_chaves)}
          </div>
        </div>
        ${linkArtigo(p)}
      </article>
    `).join('');

    contador.textContent = `Mostrando ${visiveis.length} de ${projetosDaLista.length} projeto${projetosDaLista.length > 1 ? 's' : ''}`;

    // Esconde o botão quando já está mostrando todos
    btnVerMais.hidden = quantosMostrar >= projetosDaLista.length;
  }

  // ---------- MENU SANDUÍCHE DE ANOS ----------
  function abrirMenu(abrir) {
    menuAnos.hidden = !abrir;
    btnFiltrar.setAttribute('aria-expanded', abrir ? 'true' : 'false');
  }

  // Monta o menu com os anos que existem no banco (mais recente primeiro)
  function preencherAnos() {
    const anos = [...new Set(itens.map(p => (p.ano_finalizacao || '').trim()).filter(Boolean))]
      .sort((a, b) => b.localeCompare(a, 'pt-BR', { numeric: true }));

    menuAnos.innerHTML = ['', ...anos].map(ano => `
      <button type="button" role="menuitem" data-ano="${escaparHTML(ano)}"
        class="${ano === anoSelecionado ? 'selecionado' : ''}">
        ${ano ? escaparHTML(ano) : 'Todos os anos'}
      </button>`).join('');
  }

  function escolherAno(ano) {
    anoSelecionado = ano;
    btnFiltrar.innerHTML = '&#9776; ' + (ano ? 'Ano: ' + escaparHTML(ano) : 'Filtrar');
    menuAnos.querySelectorAll('button').forEach(b =>
      b.classList.toggle('selecionado', b.dataset.ano === ano));
    abrirMenu(false);
    aplicarFiltros();
  }

  async function carregarProjetos() {
    const { data, error } = await db
      .from('projetos')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      exibirErro('Não foi possível carregar os projetos: ' + error.message);
      return;
    }

    itens = data;
    preencherAnos();
    mostrarProjetos(itens);

    // Ganhadores: os marcados com destaque = true no banco.
    // Se nenhum estiver marcado, mostra os 3 primeiros cadastrados.
    const destaques = itens.filter(p => p.destaque === true);
    const primeiros = [...itens].sort((a, b) => a.id - b.id);
    mostrarGanhadores(destaques.length > 0 ? destaques : primeiros);
  }

  // Aplica a busca por texto E o filtro de ano ao mesmo tempo
  function aplicarFiltros(rolar = true) {
    limparErro();
    const termo = input.value.trim().toLowerCase();
    const ano = anoSelecionado;

    const resultado = itens.filter(p => {
      const bateAno = !ano || (p.ano_finalizacao || '').trim() === ano;
      const bateTermo = !termo ||
        [p.nome_projeto, p.autores, p.orientador, p.area, p.palavras_chaves, p.ano_finalizacao]
          .some(campo => (campo || '').toLowerCase().includes(termo));
      return bateAno && bateTermo;
    });

    if (resultado.length === 0) {
      const partes = [];
      if (termo) partes.push(`"${input.value.trim()}"`);
      if (ano) partes.push(`no ano ${ano}`);
      exibirErro('Nenhum resultado encontrado ' + partes.join(' ') + '.');
    }
    mostrarProjetos(resultado);
    if (rolar) lista.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  btnVerMais.addEventListener('click', () => {
    quantosMostrar += POR_PAGINA;
    desenharLista();
  });

  btnFiltrar.addEventListener('click', (e) => {
    e.stopPropagation();
    abrirMenu(menuAnos.hidden);
  });

  menuAnos.addEventListener('click', (e) => {
    const opcao = e.target.closest('button');
    if (opcao) escolherAno(opcao.dataset.ano);
  });

  // Fecha o menu ao clicar fora dele ou apertar Esc
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.filtro')) abrirMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') abrirMenu(false);
  });

  // Pesquisa automática: filtra enquanto a pessoa digita
  // (espera 300 ms depois da última tecla para não pesquisar a cada letra)
  let espera;
  input.addEventListener('input', () => {
    clearTimeout(espera);
    espera = setTimeout(() => aplicarFiltros(false), 300);
  });

  // Enter ainda funciona e leva até os resultados
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(espera);
      aplicarFiltros();
    }
  });

  limparErro();
  carregarProjetos();
});
