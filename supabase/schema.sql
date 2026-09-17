-- Last Lab · schema inicial (clientes, calendários, posts)
-- Roda uma vez no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  handle text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table calendars (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  month text not null, -- "YYYY-MM"
  status text not null default 'draft', -- draft | pending | approved | changes_requested
  token text not null unique,
  feedback text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references calendars(id) on delete cascade,
  order_index int not null default 0,
  media jsonb not null default '[]', -- [{ type: 'image'|'video', url }]
  caption text not null default '',
  scheduled_date date,
  tag text not null default '',
  created_at timestamptz not null default now(),
  scheduled boolean not null default false,
  scheduled_at timestamptz
);

create index posts_calendar_id_idx on posts(calendar_id);
create index calendars_client_id_idx on calendars(client_id);
create index calendars_token_idx on calendars(token);

alter table clients enable row level security;
alter table calendars enable row level security;
alter table posts enable row level security;

-- Admin (logado via Supabase Auth) tem acesso total.
create policy "admin_all_clients" on clients for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "admin_all_calendars" on calendars for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "admin_all_posts" on posts for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

-- Leitura pública (o link/token já é o controle de acesso, mesmo modelo da V1 local).
create policy "public_read_clients" on clients for select using (true);
create policy "public_read_calendars" on calendars for select using (true);
create policy "public_read_posts" on posts for select using (true);

-- Única escrita pública permitida: decisão de aprovação, via função abaixo
-- (o cliente nunca ganha UPDATE direto na tabela).
create or replace function submit_approval_decision(p_token text, p_status text, p_feedback text)
returns calendars
language plpgsql
security definer
set search_path = public
as $$
declare
  updated calendars;
begin
  if p_status not in ('approved', 'changes_requested', 'pending') then
    raise exception 'status inválido';
  end if;

  update calendars
  set status = p_status,
      feedback = p_feedback,
      decided_at = now()
  where token = p_token
  returning * into updated;

  if updated.id is null then
    raise exception 'calendário não encontrado';
  end if;

  return updated;
end;
$$;

grant execute on function submit_approval_decision(text, text, text) to anon;
