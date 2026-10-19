-- Analytics próprio do site e do diagnóstico (aba Analytics do admin).
-- Eventos anônimos: um id de visitante (localStorage) e um de sessão (sessionStorage), sem nome,
-- e-mail ou IP. O site e o diagnóstico só inserem; só o admin logado lê, pela função analytics_resumo.

create table if not exists eventos (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  app text not null check (app in ('site', 'diagnostico')),
  visitante text not null check (length(visitante) between 8 and 64),
  sessao text not null check (length(sessao) between 8 and 64),
  tipo text not null check (tipo in (
    'pagina',             -- página vista (site ou diagnóstico)
    'diag_iniciou',       -- respondeu a primeira pergunta
    'diag_pergunta',      -- respondeu uma pergunta (detalhe = id da pergunta)
    'diag_resultado',     -- viu o resultado
    'diag_links',         -- mandou os links (parte 2)
    'diag_lead',          -- deixou o contato (virou lead)
    'diag_ajuda',         -- clicou em "Veja como podemos te ajudar"
    'diag_portfolio',     -- clicou em "Ver portfólio"
    'whatsapp'            -- clicou no WhatsApp do site
  )),
  pagina text check (length(pagina) <= 200),
  detalhe text check (length(detalhe) <= 120),
  origem text check (length(origem) <= 80),      -- utm_source
  midia text check (length(midia) <= 80),        -- utm_medium
  campanha text check (length(campanha) <= 120), -- utm_campaign
  referencia text check (length(referencia) <= 120), -- domínio de onde veio (google.com, instagram.com...)
  dispositivo text check (dispositivo in ('celular', 'tablet', 'computador'))
);

create index if not exists eventos_criado_em on eventos (criado_em);
create index if not exists eventos_visitante on eventos (visitante, criado_em);

alter table eventos enable row level security;
drop policy if exists eventos_insert_publico on eventos;
create policy eventos_insert_publico on eventos for insert to anon, authenticated with check (true);
drop policy if exists eventos_admin_le on eventos;
create policy eventos_admin_le on eventos for select using (auth.uid() is not null);
drop policy if exists eventos_admin_apaga on eventos;
create policy eventos_admin_apaga on eventos for delete using (auth.uid() is not null);

-- Venda: valor fechado e quando (a data entra sozinha quando o status vira "fechado").
alter table diagnosticos add column if not exists valor_fechado numeric;
alter table diagnosticos add column if not exists fechado_em timestamptz;

create or replace function diagnosticos_marca_fechado() returns trigger language plpgsql as $$
begin
  if new.status = 'fechado' and (old.status is distinct from 'fechado') then
    new.fechado_em := coalesce(new.fechado_em, now());
  elsif new.status <> 'fechado' then
    new.fechado_em := null;
  end if;
  return new;
end $$;

drop trigger if exists diagnosticos_fechado on diagnosticos;
create trigger diagnosticos_fechado before update of status on diagnosticos
  for each row execute function diagnosticos_marca_fechado();

-- Canal de uma visita: utm_source; senão o site de onde veio; senão "direto".
create or replace function analytics_canal(origem text, referencia text) returns text language sql immutable as $$
  select case
    when coalesce(origem, '') <> '' then lower(origem)
    when referencia ilike '%instagram%' then 'instagram'
    when referencia ilike '%facebook%' or referencia ilike 'fb.%' or referencia ilike 'l.facebook%' then 'facebook'
    when referencia ilike '%google%' then 'google'
    when referencia ilike '%linkedin%' or referencia ilike 'lnkd.in' then 'linkedin'
    when referencia ilike '%whatsapp%' or referencia ilike 'wa.me' then 'whatsapp'
    when referencia ilike '%bing%' or referencia ilike '%duckduckgo%' or referencia ilike '%yahoo%' then 'outras buscas'
    when referencia ilike '%chatgpt%' or referencia ilike '%openai%' or referencia ilike '%perplexity%' or referencia ilike '%claude.ai%' or referencia ilike '%gemini%' then 'IA (ChatGPT etc.)'
    when coalesce(referencia, '') <> '' then lower(referencia)
    else 'direto'
  end
$$;

-- Tudo o que a aba Analytics mostra, para um período. Só para admin logado.
create or replace function analytics_resumo(desde timestamptz, ate timestamptz default now())
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r jsonb;
begin
  if auth.uid() is null then
    raise exception 'não autorizado';
  end if;

  with ev as (
    select * from eventos where criado_em >= desde and criado_em < ate
  ),
  -- primeira visita de cada sessão: de onde veio e em que aparelho
  sessoes as (
    select distinct on (sessao) sessao, visitante, app, criado_em, pagina,
      analytics_canal(origem, referencia) as canal, campanha, dispositivo
    from ev order by sessao, criado_em
  ),
  -- primeira visita de cada visitante (all time): a origem do lead
  primeiro_toque as (
    select distinct on (visitante) visitante, analytics_canal(origem, referencia) as canal
    from eventos order by visitante, criado_em
  ),
  diag as (
    select tipo, count(distinct visitante) as pessoas from ev where app = 'diagnostico' group by tipo
  ),
  -- quem começou e não virou lead: em que pergunta parou
  parou as (
    select distinct on (e.visitante) e.visitante, e.detalhe
    from ev e
    where e.tipo = 'diag_pergunta'
      and not exists (select 1 from ev l where l.visitante = e.visitante and l.tipo = 'diag_lead')
    order by e.visitante, e.criado_em desc
  ),
  leads as (
    select d.*,
      coalesce(nullif(lower(d.dados->'utms'->>'utm_source'), ''), pt.canal, 'direto') as canal
    from diagnosticos d
    left join primeiro_toque pt on pt.visitante = d.dados->>'visitante'
    where d.created_at >= desde and d.created_at < ate
  ),
  valores as (
    select id, status, valor_fechado, fechado_em,
      nullif(regexp_replace(split_part(coalesce(apresentacao->>'investimento', ''), ',', 1), '[^0-9]', '', 'g'), '')::numeric as proposto
    from diagnosticos
  )
  select jsonb_build_object(
    'visitas', jsonb_build_object(
      'sessoes', (select count(*) from sessoes),
      'visitantes', (select count(distinct visitante) from sessoes),
      'paginas_vistas', (select count(*) from ev where tipo = 'pagina'),
      'por_dia', coalesce((select jsonb_agg(x order by x->>'dia') from (
          select jsonb_build_object('dia', to_char(criado_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'),
            'sessoes', count(*), 'visitantes', count(distinct visitante)) as x
          from sessoes group by to_char(criado_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD')
        ) t), '[]'::jsonb),
      'paginas', coalesce((select jsonb_agg(x) from (
          select jsonb_build_object('pagina', pagina, 'vistas', count(*), 'pessoas', count(distinct visitante)) as x
          from ev where tipo = 'pagina' group by pagina order by count(*) desc limit 15
        ) t), '[]'::jsonb),
      'canais', coalesce((select jsonb_agg(x) from (
          select jsonb_build_object('canal', canal, 'sessoes', count(*)) as x
          from sessoes group by canal order by count(*) desc limit 12
        ) t), '[]'::jsonb),
      'campanhas', coalesce((select jsonb_agg(x) from (
          select jsonb_build_object('campanha', campanha, 'canal', canal, 'sessoes', count(*)) as x
          from sessoes where campanha is not null group by campanha, canal order by count(*) desc limit 10
        ) t), '[]'::jsonb),
      'dispositivos', coalesce((select jsonb_object_agg(coalesce(dispositivo, 'outro'), n) from (
          select dispositivo, count(*) as n from sessoes group by dispositivo
        ) t), '{}'::jsonb),
      'cliques_whatsapp', (select count(*) from ev where tipo = 'whatsapp')
    ),
    'funil', jsonb_build_object(
      'abriu', (select count(distinct visitante) from ev where app = 'diagnostico' and tipo = 'pagina'),
      'iniciou', coalesce((select pessoas from diag where tipo = 'diag_iniciou'), 0),
      'resultado', coalesce((select pessoas from diag where tipo = 'diag_resultado'), 0),
      'links', coalesce((select pessoas from diag where tipo = 'diag_links'), 0),
      'lead', coalesce((select pessoas from diag where tipo = 'diag_lead'), 0),
      'ajuda', coalesce((select pessoas from diag where tipo = 'diag_ajuda'), 0),
      'parou_em', coalesce((select jsonb_agg(x) from (
          select jsonb_build_object('pergunta', detalhe, 'pessoas', count(*)) as x
          from parou group by detalhe order by count(*) desc limit 12
        ) t), '[]'::jsonb)
    ),
    'leads', jsonb_build_object(
      'total', (select count(*) from leads),
      'qualificados', (select count(*) from leads where qualificado),
      'por_canal', coalesce((select jsonb_agg(x) from (
          select jsonb_build_object('canal', canal, 'leads', count(*),
            'qualificados', count(*) filter (where qualificado),
            'fechados', count(*) filter (where status = 'fechado'),
            'nota_media', round(avg(nota_geral))) as x
          from leads group by canal order by count(*) desc
        ) t), '[]'::jsonb),
      'por_segmento', coalesce((select jsonb_agg(x) from (
          select jsonb_build_object('segmento', coalesce(dados->'devolutiva'->'perfil_textos'->>'segmento', 'Sem segmento'), 'leads', count(*)) as x
          from leads group by coalesce(dados->'devolutiva'->'perfil_textos'->>'segmento', 'Sem segmento') order by count(*) desc
        ) t), '[]'::jsonb),
      'por_pilar', coalesce((select jsonb_agg(x) from (
          select jsonb_build_object('pilar', dados->>'pilar_mais_fraco', 'leads', count(*)) as x
          from leads where dados->>'pilar_mais_fraco' is not null group by dados->>'pilar_mais_fraco' order by count(*) desc
        ) t), '[]'::jsonb)
    ),
    -- pipeline: a situação de hoje (todos os leads), e as vendas fechadas no período
    'pipeline', jsonb_build_object(
      'por_status', coalesce((select jsonb_object_agg(status, n) from (
          select status, count(*) as n from diagnosticos group by status
        ) t), '{}'::jsonb),
      'em_proposta', (select coalesce(sum(proposto), 0) from valores where status = 'proposta'),
      'fechados', (select count(*) from valores where status = 'fechado' and fechado_em >= desde and fechado_em < ate),
      'vendido', (select coalesce(sum(coalesce(valor_fechado, proposto)), 0) from valores where status = 'fechado' and fechado_em >= desde and fechado_em < ate),
      'sem_valor', (select count(*) from valores where status = 'fechado' and valor_fechado is null),
      'ganhos_total', (select count(*) from diagnosticos where status = 'fechado'),
      'perdidos_total', (select count(*) from diagnosticos where status = 'perdido'),
      'por_mes', coalesce((select jsonb_agg(x order by x->>'mes') from (
          select jsonb_build_object('mes', to_char(fechado_em at time zone 'America/Sao_Paulo', 'YYYY-MM'),
            'fechados', count(*), 'vendido', coalesce(sum(coalesce(valor_fechado, proposto)), 0)) as x
          from valores where status = 'fechado' and fechado_em is not null
          group by to_char(fechado_em at time zone 'America/Sao_Paulo', 'YYYY-MM')
        ) t), '[]'::jsonb)
    )
  ) into r;
  return r;
end $$;

revoke all on function analytics_resumo(timestamptz, timestamptz) from public, anon;
grant execute on function analytics_resumo(timestamptz, timestamptz) to authenticated;
