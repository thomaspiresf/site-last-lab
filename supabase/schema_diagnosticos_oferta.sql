-- Last Lab · oferta escolhida por você na devolutiva (substitui a sugestão automática)
-- Roda uma vez no SQL Editor do Supabase, depois de schema_diagnosticos_devolutiva.sql.

alter table diagnosticos
  add column oferta_escolhida jsonb;   -- { principal: {nome, descricao}, complemento: {nome, descricao} | null }

-- O visitante não pode preencher esse campo.
drop policy "public_insert_diagnosticos" on diagnosticos;
create policy "public_insert_diagnosticos" on diagnosticos for insert
  with check (status = 'novo' and anotacoes = '' and analise = '' and token is null
              and publicado_em is null and oferta_escolhida is null);

-- A página do cliente passa a receber também a oferta escolhida.
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
    'oferta_escolhida', d.oferta_escolhida,
    'publicado_em', d.publicado_em
  )
  from diagnosticos d
  where d.token = p_token and d.publicado_em is not null
$$;
