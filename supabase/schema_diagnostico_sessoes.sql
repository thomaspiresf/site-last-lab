-- Last Lab · todo mundo que começa o diagnóstico (22/10/2026)
-- Uma linha por diagnóstico iniciado (a partir do nome), atualizada a cada resposta. Mostra no admin
-- quem concluiu, quem pediu análise e quem abandonou, e em que pergunta.
-- O id é o mesmo do lead em `diagnosticos` quando a pessoa deixa o contato.
-- Separada de `diagnosticos` de propósito: as outras telas do admin continuam vendo só leads completos.

create table if not exists diagnostico_sessoes (
  id uuid primary key,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  visitante text,
  nome text not null default '',
  empresa text not null default '',
  utms jsonb not null default '{}',
  perfil jsonb not null default '{}',
  respondidas int not null default 0,      -- etapas concluídas (perfil + perguntas + contato + links)
  total int not null default 0,
  parou_id text,                           -- etapa pendente na última atualização (ex.: B2, contato, convite)
  parou_em text,                           -- a mesma etapa, legível (ex.: "Clareza · pergunta 2")
  parou_ordem int,                         -- posição da etapa no fluxo, para ordenar o funil
  concluido boolean not null default false, -- deixou o contato (o resultado foi liberado)
  convite text,                            -- depois do resultado: sim (análise) | whats | nao
  pediu_analise boolean not null default false
);

create index if not exists diagnostico_sessoes_criado on diagnostico_sessoes (criado_em desc);

alter table diagnostico_sessoes enable row level security;

-- Só o admin (logado) lê e apaga. O visitante grava pela função abaixo, nunca direto na tabela.
drop policy if exists "admin_all_diagnostico_sessoes" on diagnostico_sessoes;
create policy "admin_all_diagnostico_sessoes" on diagnostico_sessoes for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

create or replace function public.registrar_sessao_diagnostico(p jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into diagnostico_sessoes (id, visitante, nome, empresa, utms, perfil, respondidas, total,
    parou_id, parou_em, parou_ordem, concluido, convite, pediu_analise)
  values (
    (p->>'id')::uuid, p->>'visitante', left(coalesce(p->>'nome', ''), 120), left(coalesce(p->>'empresa', ''), 160),
    coalesce(p->'utms', '{}'), coalesce(p->'perfil', '{}'),
    coalesce((p->>'respondidas')::int, 0), coalesce((p->>'total')::int, 0),
    left(p->>'parou_id', 40), left(p->>'parou_em', 160), (p->>'parou_ordem')::int,
    coalesce((p->>'concluido')::boolean, false), left(p->>'convite', 10), coalesce((p->>'pediu_analise')::boolean, false)
  )
  on conflict (id) do update set
    atualizado_em = now(),
    visitante = excluded.visitante,
    nome = excluded.nome,
    empresa = excluded.empresa,
    utms = excluded.utms,
    perfil = excluded.perfil,
    respondidas = excluded.respondidas,
    total = excluded.total,
    parou_id = excluded.parou_id,
    parou_em = excluded.parou_em,
    parou_ordem = excluded.parou_ordem,
    -- uma vez concluído/pedido, não volta atrás
    concluido = diagnostico_sessoes.concluido or excluded.concluido,
    convite = coalesce(excluded.convite, diagnostico_sessoes.convite),
    pediu_analise = diagnostico_sessoes.pediu_analise or excluded.pediu_analise
  where diagnostico_sessoes.criado_em > now() - interval '2 days';
end;
$$;

revoke all on function public.registrar_sessao_diagnostico(jsonb) from public;
grant execute on function public.registrar_sessao_diagnostico(jsonb) to anon, authenticated;
