-- Blog da Last Lab: conteúdo útil (Raio-X expandido, guias, pontos de vista), publicado em /blog/:slug.
create table if not exists artigos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  resumo text,
  capa_url text,
  corpo text not null default '',          -- markdown
  serie text,                               -- Raio-X, Ponto de vista, Guia...
  instagram_url text,                       -- post do Instagram relacionado (o "ver o post completo")
  cta text not null default 'instagram' check (cta in ('instagram', 'diagnostico', 'nenhum')),
  publicado boolean not null default false,
  publicado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists artigos_publicado_em on artigos (publicado_em desc);
alter table artigos enable row level security;
drop policy if exists "admin_all_artigos" on artigos;
create policy "admin_all_artigos" on artigos for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "public_read_artigos" on artigos;
create policy "public_read_artigos" on artigos for select using (publicado);

-- cliques do blog para o Instagram entram no Analytics
alter table eventos drop constraint if exists eventos_tipo_check;
alter table eventos add constraint eventos_tipo_check check (tipo in (
  'pagina', 'diag_iniciou', 'diag_pergunta', 'diag_resultado', 'diag_links', 'diag_lead', 'diag_ajuda', 'diag_portfolio',
  'whatsapp', 'brief_iniciou', 'brief_pergunta', 'brief_revisao', 'brief_enviado', 'clique_instagram'
));
