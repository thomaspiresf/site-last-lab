-- Last Lab · catálogo de produtos e serviços (página /admin/servicos)
-- Textos base das apresentações: fichas dos serviços, sugestões de "O que eu vi de fora", casos,
-- "custo de ficar como está" e o mapa das ofertas do diagnóstico. Cada "Salvar" grava uma versão
-- nova; o admin usa sempre a mais recente, por cima do padrão que está no código.

create table catalogo_servicos (
  id bigint generated always as identity primary key,
  dados jsonb not null default '{}',
  criado_em timestamptz not null default now(),
  criado_por uuid default auth.uid()
);

alter table catalogo_servicos enable row level security;

-- Uso interno: só o admin logado lê e grava.
create policy "admin_read_catalogo_servicos" on catalogo_servicos for select
  using (auth.uid() is not null);
create policy "admin_insert_catalogo_servicos" on catalogo_servicos for insert
  with check (auth.uid() is not null);
