const formLogin = document.getElementById('formLogin');
const formCadastro = document.getElementById('formCadastro');
const btnLogin = document.getElementById('btnLogin');
const btnCadastro = document.getElementById('btnCadastro');

function mostrarLogin() {
  formLogin.classList.remove('escondido');
  formCadastro.classList.add('escondido');
  btnLogin.classList.add('ativo');
  btnCadastro.classList.remove('ativo');
}

function mostrarCadastro() {
  formCadastro.classList.remove('escondido');
  formLogin.classList.add('escondido');
  btnCadastro.classList.add('ativo');
  btnLogin.classList.remove('ativo');
}

// ---------- ENTRAR ----------
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;

  const { error } = await db.auth.signInWithPassword({ email: email, password: senha });

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      alert('Confirme seu e-mail antes de entrar (veja sua caixa de entrada).');
    } else {
      alert('E-mail ou senha incorretos.');
    }
    return;
  }

  // Administrador vai direto para a página de adicionar projetos
  if (await ehAdmin()) {
    window.location.href = 'adicione.html';
  } else {
    window.location.href = 'index.html';
  }
});

// ---------- CADASTRAR ----------
formCadastro.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('cadastroNome').value.trim();
  const email = document.getElementById('cadastroEmail').value.trim();
  const senha = document.getElementById('cadastroSenha').value;

  if (senha.length < 6) {
    alert('A senha precisa ter pelo menos 6 caracteres.');
    return;
  }

  const { data, error } = await db.auth.signUp({
    email: email,
    password: senha,
    options: { data: { nome: nome } } // vai para usuarios.nome_usuario
  });

  if (error) {
    alert('Não foi possível cadastrar: ' + error.message);
    return;
  }

  if (data.session) {
    alert('Conta criada com sucesso!');
    window.location.href = 'index.html';
  } else {
    alert('Conta criada! Enviamos um e-mail de confirmação. Confirme e depois entre.');
    formCadastro.reset();
    mostrarLogin();
  }
});
