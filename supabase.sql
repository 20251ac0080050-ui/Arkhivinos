-- =====================================================
-- Ajustes no SEU banco (tabelas "projetos" e "usuarios")
-- Rode tudo no Supabase: SQL Editor > New query > Run
-- Pode rodar mais de uma vez sem problema.
-- =====================================================

-- 0) LIMPEZA do script anterior (caso você tenha rodado a primeira versão)
drop trigger if exists ao_criar_usuario on auth.users;
drop function if exists public.criar_perfil();
drop policy if exists "todos veem projetos" on public.projetos;
drop policy if exists "so admin adiciona"   on public.projetos;
drop policy if exists "so admin edita"      on public.projetos;
drop policy if exists "so admin apaga"      on public.projetos;
drop function if exists public.eh_admin();
drop table if exists public.perfis;   -- tabela criada só pelo script anterior

-- 1) PROJETOS: colunas que o formulário do site já tem
alter table public.projetos add column if not exists orientador       text;
alter table public.projetos add column if not exists email_orientador text;
alter table public.projetos add column if not exists area             text;

-- Garante que o id é gerado sozinho (1, 2, 3...) ao adicionar um projeto
do $$
declare
  tem_padrao text;
  eh_identity text;
begin
  select column_default, is_identity into tem_padrao, eh_identity
  from information_schema.columns
  where table_schema = 'public' and table_name = 'projetos' and column_name = 'id';

  if tem_padrao is null and eh_identity = 'NO' then
    create sequence if not exists public.projetos_id_seq owned by public.projetos.id;
    perform setval('public.projetos_id_seq', coalesce((select max(id) from public.projetos), 0) + 1, false);
    alter table public.projetos alter column id set default nextval('public.projetos_id_seq');
    grant usage, select on sequence public.projetos_id_seq to authenticated;
  end if;
end $$;

-- 2) USUARIOS: todo mundo começa como 'aluno'
alter table public.usuarios alter column tipo_conta set default 'aluno';

-- Cria a linha em "usuarios" automaticamente quando alguém se cadastra no site
create or replace function public.criar_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.usuarios (id_usuario, nome_usuario, tipo_conta)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    'aluno'
  )
  on conflict (id_usuario) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_usuario();

-- Cria a linha para quem já tinha conta antes deste script
insert into public.usuarios (id_usuario, nome_usuario, tipo_conta)
select id, coalesce(raw_user_meta_data ->> 'nome', split_part(email, '@', 1)), 'aluno'
from auth.users
on conflict (id_usuario) do nothing;

-- 3) SEGURANÇA (RLS)
-- O usuário logado é administrador? (aceita 'admin' ou 'adm')
create or replace function public.eh_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.usuarios
    where id_usuario = auth.uid()
      and lower(trim(tipo_conta)) in ('admin', 'adm')
  );
$$;

alter table public.usuarios enable row level security;
drop policy if exists "usuario ve a propria conta" on public.usuarios;
create policy "usuario ve a propria conta" on public.usuarios
  for select using (auth.uid() = id_usuario);

alter table public.projetos enable row level security;
drop policy if exists "todos veem projetos" on public.projetos;
create policy "todos veem projetos" on public.projetos
  for select using (true);
drop policy if exists "so admin adiciona" on public.projetos;
create policy "so admin adiciona" on public.projetos
  for insert with check (public.eh_admin());
drop policy if exists "so admin edita" on public.projetos;
create policy "so admin edita" on public.projetos
  for update using (public.eh_admin());
drop policy if exists "so admin apaga" on public.projetos;
create policy "so admin apaga" on public.projetos
  for delete using (public.eh_admin());

-- 4) TORNAR SUA CONTA ADMIN
-- Cadastre-se pelo site primeiro. Depois troque o e-mail e rode só este bloco:
-- update public.usuarios set tipo_conta = 'admin'
-- where id_usuario = (select id from auth.users where email = 'SEU_EMAIL_AQUI');
