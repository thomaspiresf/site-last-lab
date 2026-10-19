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
    'whatsapp',           -- clicou no WhatsApp do site
    'brief_iniciou',      -- começou o briefing (/briefing)
    'brief_pergunta',     -- avançou uma pergunta do briefing (detalhe = campo)
    'brief_revisao',      -- chegou na revisão
    'brief_enviado'       -- enviou o briefing
  )),
  pagina text check (length(pagina) <= 200),
  detalhe text check (length(detalhe) <= 120),
  origem text check (length(origem) <= 80),      -- utm_source
  midia text check (length(midia) <= 80),        -- utm_medium
  campanha text check (length(campanha) <= 120), -- utm_campaign
  anuncio text check (length(anuncio) <= 160),   -- utm_content (nome do anúncio, na Meta: {{ad.name}})
  referencia text check (length(referencia) <= 120), -- domínio de onde veio (google.com, instagram.com...)
  dispositivo text check (dispositivo in ('celular', 'tablet', 'computador'))
);

alter table eventos add column if not exists anuncio text check (length(anuncio) <= 160);
alter table eventos drop constraint if exists eventos_tipo_check;
alter table eventos add constraint eventos_tipo_check check (tipo in (
  'pagina', 'diag_iniciou', 'diag_pergunta', 'diag_resultado', 'diag_links', 'diag_lead', 'diag_ajuda', 'diag_portfolio',
  'whatsapp', 'brief_iniciou', 'brief_pergunta', 'brief_revisao', 'brief_enviado'
));

-- o briefing guarda o visitante anônimo, para saber de onde veio
alter table brand_briefs add column if not exists visitante text check (length(visitante) <= 64);

create index if not exists eventos_criado_em on eventos (criado_em);
create index if not exists eventos_visitante on eventos (visitante, criado_em);

alter table eventos enable row level security;
drop policy if exists eventos_insert_publico on eventos;
create policy eventos_insert_publico on eventos for insert to anon, authenticated with check (true);
drop policy if exists eventos_admin_le on eventos;
create policy eventos_admin_le on eventos for select using (auth.uid() is not null);
drop policy if exists eventos_admin_apaga on eventos;
create policy eventos_admin_apaga on eventos for delete using (auth.uid() is not null);

-- Gastos da Meta Ads por dia e anúncio, trazidos pela função sync-meta-ads (botão no admin).
create table if not exists meta_gastos (
  dia date not null,
  anuncio_id text not null,
  anuncio text,
  conjunto_id text,
  conjunto text,
  campanha_id text,
  campanha text,
  gasto numeric not null default 0,
  impressoes integer not null default 0,
  alcance integer not null default 0,
  cliques integer not null default 0,   -- cliques no link
  atualizado_em timestamptz not null default now(),
  primary key (dia, anuncio_id)
);
create index if not exists meta_gastos_campanha on meta_gastos (lower(campanha));
alter table meta_gastos enable row level security;
drop policy if exists meta_gastos_admin on meta_gastos;
create policy meta_gastos_admin on meta_gastos for all using (auth.uid() is not null) with check (auth.uid() is not null);

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
  ),
  -- série diária para as linhas de tendência dos cartões
  serie as (
    select to_char(dia, 'YYYY-MM-DD') as dia,
      (select count(distinct visitante) from ev where (criado_em at time zone 'America/Sao_Paulo')::date = dia) as visitantes,
      (select count(distinct visitante) from ev where tipo = 'diag_iniciou' and (criado_em at time zone 'America/Sao_Paulo')::date = dia) as iniciou,
      (select count(*) from leads where (created_at at time zone 'America/Sao_Paulo')::date = dia) as leads,
      (select coalesce(sum(gasto), 0) from meta_gastos g where g.dia = d.dia) as gasto,
      (select count(*) from leads where (created_at at time zone 'America/Sao_Paulo')::date = dia
        and (lower(coalesce(dados->'utms'->>'utm_source', '')) in ('meta', 'facebook', 'instagram', 'fb', 'ig') or lower(coalesce(dados->'utms'->>'utm_medium', '')) in ('pago', 'paid', 'cpc', 'ads'))) as leads_meta,
      (select count(*) from brand_briefs b where (b.created_at at time zone 'America/Sao_Paulo')::date = dia) as briefings
    from generate_series((desde at time zone 'America/Sao_Paulo')::date, ((ate at time zone 'America/Sao_Paulo') - interval '1 second')::date, interval '1 day') as d(dia)
  ),
  -- Campanhas pagas: gasto da Meta + visitas e diagnósticos (eventos) + leads e vendas (diagnósticos),
  -- ligados pelo nome da campanha e do anúncio (utm_campaign={{campaign.name}}, utm_content={{ad.name}})
  pago_g as (
    select lower(campanha) as c, lower(coalesce(anuncio, '')) as a, max(campanha) as campanha, max(anuncio) as anuncio,
      sum(gasto) as gasto, sum(impressoes) as impressoes, sum(cliques) as cliques, sum(alcance) as alcance
    from meta_gastos
    where dia >= (desde at time zone 'America/Sao_Paulo')::date and dia < (ate at time zone 'America/Sao_Paulo')::date + 1
      and anuncio_id <> '_sincronizado'  -- marcador de "sincronizou sem anúncio rodando"
    group by 1, 2
  ),
  pago_e as (
    select lower(campanha) as c, lower(coalesce(anuncio, '')) as a, max(campanha) as campanha, max(anuncio) as anuncio,
      count(distinct sessao) as visitas,
      count(distinct visitante) filter (where tipo = 'diag_iniciou') as iniciou
    from ev
    where campanha is not null
      and (lower(coalesce(origem, '')) in ('meta', 'facebook', 'instagram', 'fb', 'ig') or lower(coalesce(midia, '')) in ('pago', 'paid', 'cpc', 'ads'))
    group by 1, 2
  ),
  pago_l as (
    select lower(dados->'utms'->>'utm_campaign') as c, lower(coalesce(dados->'utms'->>'utm_content', '')) as a,
      max(dados->'utms'->>'utm_campaign') as campanha, max(dados->'utms'->>'utm_content') as anuncio,
      count(*) as leads,
      count(*) filter (where qualificado) as qualificados,
      count(*) filter (where status = 'fechado') as fechados,
      coalesce(sum(case when status = 'fechado' then coalesce(valor_fechado,
        nullif(regexp_replace(split_part(coalesce(apresentacao->>'investimento', ''), ',', 1), '[^0-9]', '', 'g'), '')::numeric) end), 0) as vendido
    from leads
    where coalesce(dados->'utms'->>'utm_campaign', '') <> ''
      and (lower(coalesce(dados->'utms'->>'utm_source', '')) in ('meta', 'facebook', 'instagram', 'fb', 'ig') or lower(coalesce(dados->'utms'->>'utm_medium', '')) in ('pago', 'paid', 'cpc', 'ads'))
    group by 1, 2
  ),
  pago as (
    select coalesce(g.campanha, e.campanha, l.campanha) as campanha,
      nullif(coalesce(g.anuncio, e.anuncio, l.anuncio), '') as anuncio,
      coalesce(g.gasto, 0) as gasto, coalesce(g.impressoes, 0) as impressoes, coalesce(g.cliques, 0) as cliques, coalesce(g.alcance, 0) as alcance,
      coalesce(e.visitas, 0) as visitas, coalesce(e.iniciou, 0) as iniciou,
      coalesce(l.leads, 0) as leads, coalesce(l.qualificados, 0) as qualificados,
      coalesce(l.fechados, 0) as fechados, coalesce(l.vendido, 0) as vendido
    from pago_g g
    full join pago_e e on e.c = g.c and e.a = g.a
    full join pago_l l on l.c = coalesce(g.c, e.c) and l.a = coalesce(g.a, e.a)
  ),
  briefs as (
    select b.*, coalesce(pt.canal, 'direto') as canal
    from brand_briefs b
    left join primeiro_toque pt on pt.visitante = b.visitante
    where b.created_at >= desde and b.created_at < ate
  ),
  brief_parou as (
    select distinct on (e.visitante) e.visitante, e.detalhe
    from ev e
    where e.tipo = 'brief_pergunta'
      and not exists (select 1 from ev l where l.visitante = e.visitante and l.tipo = 'brief_enviado')
    order by e.visitante, e.criado_em desc
  )
  select jsonb_build_object(
    'briefing', jsonb_build_object(
      'abriu', (select count(distinct visitante) from ev where tipo = 'pagina' and pagina like '/briefing%'),
      'iniciou', (select count(distinct visitante) from ev where tipo = 'brief_iniciou'),
      'revisao', (select count(distinct visitante) from ev where tipo = 'brief_revisao'),
      'enviado', (select count(distinct visitante) from ev where tipo = 'brief_enviado'),
      'parou_em', coalesce((select jsonb_agg(x) from (
          select jsonb_build_object('pergunta', detalhe, 'pessoas', count(*)) as x
          from brief_parou group by detalhe order by count(*) desc limit 12
        ) t), '[]'::jsonb),
      'recebidos', (select count(*) from briefs),
      'por_situacao', coalesce((select jsonb_agg(x) from (
          select jsonb_build_object('situacao', business_stage, 'n', count(*)) as x from briefs group by business_stage order by count(*) desc
        ) t), '[]'::jsonb),
      'por_canal', coalesce((select jsonb_agg(x) from (
          select jsonb_build_object('canal', canal, 'n', count(*)) as x from briefs group by canal order by count(*) desc
        ) t), '[]'::jsonb),
      'estilos', coalesce((select jsonb_agg(x) from (
          select jsonb_build_object('nome', v, 'n', count(*)) as x from briefs, unnest(visual_styles) v group by v order by count(*) desc limit 8
        ) t), '[]'::jsonb),
      'adjetivos', coalesce((select jsonb_agg(x) from (
          select jsonb_build_object('nome', v, 'n', count(*)) as x from briefs, unnest(style_adjectives) v group by v order by count(*) desc limit 8
        ) t), '[]'::jsonb)
    ),
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
    ),
    'serie', coalesce((select jsonb_agg(to_jsonb(serie) order by dia) from serie), '[]'::jsonb),
    'meta', jsonb_build_object(
      'conectada', exists (select 1 from meta_gastos),
      'atualizado_em', (select max(atualizado_em) from meta_gastos),
      'gasto', (select coalesce(sum(gasto), 0) from pago),
      'impressoes', (select coalesce(sum(impressoes), 0) from pago),
      'alcance', (select coalesce(sum(alcance), 0) from pago),
      'cliques', (select coalesce(sum(cliques), 0) from pago),
      'visitas', (select coalesce(sum(visitas), 0) from pago),
      'iniciou', (select coalesce(sum(iniciou), 0) from pago),
      'leads', (select coalesce(sum(leads), 0) from pago),
      'qualificados', (select coalesce(sum(qualificados), 0) from pago),
      'fechados', (select coalesce(sum(fechados), 0) from pago),
      'vendido', (select coalesce(sum(vendido), 0) from pago),
      'anuncios', coalesce((select jsonb_agg(to_jsonb(pago) order by leads desc, gasto desc) from pago), '[]'::jsonb),
      'campanhas', coalesce((select jsonb_agg(x order by (x->>'leads')::int desc, (x->>'gasto')::numeric desc) from (
          select jsonb_build_object('campanha', campanha, 'anuncios', count(*),
            'gasto', sum(gasto), 'impressoes', sum(impressoes), 'cliques', sum(cliques), 'visitas', sum(visitas),
            'iniciou', sum(iniciou), 'leads', sum(leads), 'qualificados', sum(qualificados),
            'fechados', sum(fechados), 'vendido', sum(vendido)) as x
          from pago group by campanha
        ) t), '[]'::jsonb)
    )
  ) into r;
  return r;
end $$;

revoke all on function analytics_resumo(timestamptz, timestamptz) from public, anon;
grant execute on function analytics_resumo(timestamptz, timestamptz) to authenticated;
