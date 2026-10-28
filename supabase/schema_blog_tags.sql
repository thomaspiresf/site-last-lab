alter table artigos add column if not exists tags text[] not null default '{}';
