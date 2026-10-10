-- Last Lab · ajustes de texto do diagnóstico (página /admin/diagnosticos/ajustes)
-- Cada "Salvar" grava uma versão nova; o diagnóstico usa sempre a mais recente.
-- Roda uma vez no SQL Editor do Supabase.

create table diagnostico_ajustes (
  id bigint generated always as identity primary key,
  ajustes jsonb not null default '{}',   -- { "caminho.no.json": "texto" }, só o que mudou em relação ao código
  criado_em timestamptz not null default now(),
  criado_por uuid default auth.uid()
);

alter table diagnostico_ajustes enable row level security;

-- Os textos são públicos (aparecem no diagnóstico): qualquer um lê.
create policy "public_read_diagnostico_ajustes" on diagnostico_ajustes for select
  using (true);

-- Só o admin logado grava.
create policy "admin_insert_diagnostico_ajustes" on diagnostico_ajustes for insert
  with check (auth.uid() is not null);
