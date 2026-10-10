-- Last Lab · leads do diagnóstico de marca (lastlab.com.br/diagnostico)
-- Roda uma vez no SQL Editor do Supabase.

create table diagnosticos (
  id uuid primary key,                       -- gerado pela página do diagnóstico
  created_at timestamptz not null default now(),
  status text not null default 'novo',        -- novo | analisando | devolutiva | proposta | fechado | perdido
  anotacoes text not null default '',
  nome text not null,
  email text not null,
  whatsapp text not null,
  qualificado boolean not null default false,
  persona text not null,
  nota_geral int not null,
  oferta_entrada text,
  dados jsonb not null                        -- lead completo: respostas, notas, selos, links, UTMs e a devolutiva sugerida
);

alter table diagnosticos enable row level security;

-- Admin (logado via Supabase Auth) tem acesso total.
create policy "admin_all_diagnosticos" on diagnosticos for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

-- Qualquer visitante pode enviar o diagnóstico, mas não consegue ler nada de volta
-- nem escolher status/anotações.
create policy "public_insert_diagnosticos" on diagnosticos for insert
  with check (status = 'novo' and anotacoes = '');

-- Apresentações enviadas no diagnóstico (bucket privado, até 15 MB).
insert into storage.buckets (id, name, public, file_size_limit)
values ('diagnostico-arquivos', 'diagnostico-arquivos', false, 15728640);

create policy "public_upload_diagnostico_arquivos" on storage.objects for insert
  with check (bucket_id = 'diagnostico-arquivos');

create policy "admin_read_diagnostico_arquivos" on storage.objects for select
  using (bucket_id = 'diagnostico-arquivos' and auth.uid() is not null);
