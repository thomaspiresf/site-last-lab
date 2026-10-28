-- Last Lab · conexão com o Google Agenda (28/10/2026)
-- A reunião criada no admin vira evento no Google, com Meet e convite para o cliente.
-- integracoes guarda o acesso à conta Google (refresh token): sem policies, só as funções
-- (service role) leem e escrevem.

alter table reunioes add column if not exists google_event_id text;
alter table reunioes add column if not exists convidado_email text not null default '';

create table if not exists integracoes (
  id text primary key,                      -- 'google' (conta conectada), 'google_state' (login em andamento)
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table integracoes enable row level security;
