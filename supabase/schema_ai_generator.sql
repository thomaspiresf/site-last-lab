-- Last Lab · gerador de calendário com IA
-- Roda uma vez no SQL Editor do Supabase, depois do schema.sql inicial.

alter table clients add column brand_brief text;

create table competitors (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  handle text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table client_dates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  month_day text not null, -- "MM-DD"
  label text not null,
  created_at timestamptz not null default now()
);

create table refs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  kind text not null, -- 'own' | 'competitor'
  competitor_id uuid references competitors(id) on delete set null,
  source text not null default 'manual', -- 'manual' | 'apify'
  image_url text,
  caption text,
  notes text,
  tag text, -- pilar opcional
  post_url text,
  likes int,
  comments int,
  posted_at date,
  created_at timestamptz not null default now()
);

create index competitors_client_id_idx on competitors(client_id);
create index client_dates_client_id_idx on client_dates(client_id);
create index refs_client_id_idx on refs(client_id);

alter table competitors enable row level security;
alter table client_dates enable row level security;
alter table refs enable row level security;

-- Só o admin logado usa essas tabelas (nada aqui é exposto ao cliente final).
create policy "admin_all_competitors" on competitors for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "admin_all_client_dates" on client_dates for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "admin_all_refs" on refs for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
