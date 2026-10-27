-- Last Lab · agenda interna de reuniões (27/10/2026)
-- Reuniões de venda, devolutiva, projeto ou internas. Quando ligada a um lead do diagnóstico, a agenda
-- abre a ficha, a apresentação e o roteiro dele.

create table if not exists reunioes (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  inicio timestamptz not null,
  duracao_min integer not null default 30,
  titulo text not null,
  tipo text not null default 'venda',          -- venda | devolutiva | projeto | interna
  diagnostico_id uuid references diagnosticos(id) on delete set null,
  local text not null default '',              -- link da chamada ou endereço
  notas text not null default '',
  status text not null default 'marcada'       -- marcada | feita | cancelada
);

create index if not exists reunioes_inicio on reunioes (inicio);

alter table reunioes enable row level security;
drop policy if exists "admin_all_reunioes" on reunioes;
create policy "admin_all_reunioes" on reunioes for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
