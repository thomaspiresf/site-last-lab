-- Last Lab · gerador de ideias com curadoria
-- Roda uma vez no SQL Editor do Supabase, depois do schema_ai_generator.sql.

alter table calendars add column ai_notes text;

create table post_ideas (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references calendars(id) on delete cascade,
  caption text not null default '',
  tag text not null default '',
  scheduled_date date,
  rationale text,
  created_at timestamptz not null default now()
);

create index post_ideas_calendar_id_idx on post_ideas(calendar_id);

alter table post_ideas enable row level security;

create policy "admin_all_post_ideas" on post_ideas for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
