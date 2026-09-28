-- Last Lab · briefings de identidade visual (formulário público /briefing)
-- Roda uma vez no SQL Editor do Supabase.

create table brand_briefs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  business_stage text not null, -- tem_empresa | comecando | nao_sei
  brand_name text,
  activity text not null,
  target_audience text not null,
  differentiators text not null,
  desired_feelings text not null,
  style_adjectives text[] not null default '{}',
  visual_styles text[] not null default '{}',
  color_preferences text,
  admired_brands text,
  desired_elements text,
  avoid_elements text,
  extra_info text,
  created_at timestamptz not null default now()
);

alter table brand_briefs enable row level security;

-- Admin (logado via Supabase Auth) tem acesso total.
create policy "admin_all_brand_briefs" on brand_briefs for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

-- Qualquer visitante pode enviar um briefing (é um formulário público de lead),
-- mas ninguém de fora consegue ler as respostas de volta.
create policy "public_insert_brand_briefs" on brand_briefs for insert
  with check (true);
