-- Last Lab · devolutiva do diagnóstico (página de resultado do cliente + imagem para stories)
-- Roda uma vez no SQL Editor do Supabase, depois de schema_diagnosticos.sql.

alter table diagnosticos
  add column token text unique,              -- link do cliente: /diagnostico/resultado/?t=<token>
  add column analise text not null default '',-- "O que eu vi de fora": vai para o cliente (anotacoes continua interno)
  add column publicado_em timestamptz,       -- só com isso preenchido a página do cliente abre
  add column email_enviado_em timestamptz;

-- O visitante continua só podendo inserir, e sem conseguir se "auto-publicar".
drop policy "public_insert_diagnosticos" on diagnosticos;
create policy "public_insert_diagnosticos" on diagnosticos for insert
  with check (status = 'novo' and anotacoes = '' and analise = '' and token is null and publicado_em is null);

-- Leitura pública só pelo token e só depois de publicado. Devolve o resultado sem dados de contato.
create or replace function diagnostico_publico(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'dados', d.dados - 'email' - 'whatsapp' - 'utms' - 'consentimento' - 'bruto',
    'analise', d.analise,
    'publicado_em', d.publicado_em
  )
  from diagnosticos d
  where d.token = p_token and d.publicado_em is not null
$$;

revoke all on function diagnostico_publico(text) from public;
grant execute on function diagnostico_publico(text) to anon, authenticated;

-- Imagem para stories, gerada no fim do diagnóstico (bucket público: o link vai no e-mail).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('diagnostico-stories', 'diagnostico-stories', true, 2097152, array['image/png']);

create policy "public_upload_diagnostico_stories" on storage.objects for insert
  with check (bucket_id = 'diagnostico-stories');
