-- Last Lab · histórico de contatos de cada lead do diagnóstico (26/10/2026)
-- Registros manuais (ligação, reunião, resposta do cliente, anotação) e automáticos (mudança de etapa).
-- Os demais eventos (diagnóstico feito, e-mails, mensagens enviadas pelo admin) a ficha monta a partir
-- das colunas que já existem em `diagnosticos`.

create table if not exists diagnostico_contatos (
  id uuid primary key default gen_random_uuid(),
  diagnostico_id uuid not null references diagnosticos(id) on delete cascade,
  criado_em timestamptz not null default now(),
  quando timestamptz not null default now(),   -- quando o contato aconteceu (pode ser antes do registro)
  tipo text not null,                          -- etapa | enviada | resposta | ligacao | reuniao | nota | acao
  canal text,                                  -- whatsapp | instagram | email | telefone | presencial
  texto text not null default '',
  automatico boolean not null default false
);

create index if not exists diagnostico_contatos_lead on diagnostico_contatos (diagnostico_id, quando desc);

alter table diagnostico_contatos enable row level security;
drop policy if exists "admin_all_diagnostico_contatos" on diagnostico_contatos;
create policy "admin_all_diagnostico_contatos" on diagnostico_contatos for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

-- toda mudança de etapa entra no histórico (vale para o admin, as funções de e-mail e o diagnóstico)
create or replace function public.diagnosticos_registra_etapa()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into diagnostico_contatos (diagnostico_id, tipo, texto, automatico)
    values (new.id, 'etapa', coalesce(old.status, '') || '>' || coalesce(new.status, ''), true);
  end if;
  return new;
end;
$$;

drop trigger if exists diagnosticos_registra_etapa on diagnosticos;
create trigger diagnosticos_registra_etapa after update on diagnosticos
  for each row execute function public.diagnosticos_registra_etapa();
