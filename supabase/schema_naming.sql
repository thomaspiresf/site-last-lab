-- Last Lab · estudos de naming (gerador de argumentos + export pptx)
-- Roda uma vez no SQL Editor do Supabase.

create table naming_studies (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  keywords text,
  dimensions jsonb not null default '[]', -- [{ left, right, value }] (value 0-100, 50 = meio)
  brainstorm_names text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table naming_options (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references naming_studies(id) on delete cascade,
  order_index int not null default 0,
  name text not null,
  prefix text, -- ex: "Instituto", usado no slide de divisor e no feedback final
  meaning_concepts jsonb not null default '[]', -- [{ title, text }]
  sound_points jsonb not null default '[]', -- [{ title, text }]
  connection_text text,
  tagline text,
  created_at timestamptz not null default now()
);

create index naming_options_study_id_idx on naming_options(study_id);

alter table naming_studies enable row level security;
alter table naming_options enable row level security;

create policy "admin_all_naming_studies" on naming_studies for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "admin_all_naming_options" on naming_options for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
