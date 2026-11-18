// Página "Adicione seu Projeto" — só o administrador pode cadastrar
const formProjeto = document.getElementById('formCadastro');
const caixaCadastro = document.querySelector('.cadastro');

// Esconde o formulário até confirmar quem está logado
formProjeto.style.display = 'none';

function criarBotaoSair() {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.textContent = 'Sair da conta';
  botao.className = 'botaoSecundario';
  botao.onclick = sair;
  return botao;
}

async function verificarAcesso() {
  const usuario = await usuarioAtual();

  // Ninguém logado -> vai para a tela de login
  if (!usuario) {
    window.location.href = 'login.html';
    return;
  }

  if (await ehAdmin()) {
    formProjeto.style.display = '';
    // "Sair da conta" fica ao lado do botão Cadastrar
    const acoes = formProjeto.querySelector('.acoesForm');
    acoes.insertBefore(criarBotaoSair(), acoes.firstChild);
  } else {
    const aviso = document.createElement('div');
    aviso.className = 'aviso';
    aviso.innerHTML = '<p>Apenas o administrador pode adicionar projetos. Fale com ele para publicar o seu!</p>';
    aviso.appendChild(criarBotaoSair());
    caixaCadastro.appendChild(aviso);
  }
}

formProjeto.addEventListener('submit', async (e) => {
  e.preventDefault();

  const novoProjeto = {
    autores: document.getElementById('projCriadores').value.trim(),
    nome_projeto: document.getElementById('projNome').value.trim(),
    ano_finalizacao: document.getElementById('projAno').value.trim(),
    link_artigo: document.getElementById('projLink').value.trim() || null,
    palavras_chaves: document.getElementById('projPalavras').value.trim() || null,
    orientador: document.getElementById('projOrientador').value.trim(),
    email_orientador: document.getElementById('projEmailOrientador').value.trim(),
    area: document.getElementById('projArea').value.trim()
  };

  const botaoEnviar = formProjeto.querySelector('button[type="submit"]');
  botaoEnviar.disabled = true;

  const { error } = await db.from('projetos').insert(novoProjeto);

  botaoEnviar.disabled = false;

  if (error) {
    alert('Erro ao salvar o projeto: ' + error.message);
    return;
  }

  alert('Projeto "' + novoProjeto.nome_projeto + '" adicionado com sucesso!');
  formProjeto.reset();
});

verificarAcesso();
