-- Last Lab · gravação do lead do diagnóstico em duas etapas (22/10/2026)
-- 1. Contato (e-mail ou WhatsApp) libera o resultado: o diagnóstico grava o lead (pediu_analise = false).
-- 2. Se a pessoa aceitar o convite "Quero minha marca analisada por um profissional · grátis" e mandar
--    os links/materiais, a MESMA linha é atualizada (dados.pediu_analise = true).
-- Visitante não tem update na tabela; esta função só sobrescreve uma linha recente (1 dia) e nunca
-- mexe em status, anotações, publicação ou e-mail enviado. Se o lead tinha ido para "devolutiva"
-- (envio automático) e agora pediu a análise, volta para "novo" para ser trabalhado.

create or replace function public.salvar_diagnostico(p jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into diagnosticos (id, nome, email, whatsapp, qualificado, persona, nota_geral, oferta_entrada, dados)
  values (
    (p->>'id')::uuid,
    coalesce(p->>'nome', ''),
    coalesce(p->>'email', ''),
    coalesce(p->>'whatsapp', ''),
    coalesce((p->>'qualificado')::boolean, false),
    coalesce(p->>'persona', ''),
    coalesce((p->>'nota_geral')::int, 0),
    p->>'oferta_entrada',
    p->'dados'
  )
  on conflict (id) do update set
    nome = excluded.nome,
    email = excluded.email,
    whatsapp = excluded.whatsapp,
    qualificado = excluded.qualificado,
    persona = excluded.persona,
    nota_geral = excluded.nota_geral,
    oferta_entrada = excluded.oferta_entrada,
    dados = excluded.dados,
    status = case
      when excluded.dados->>'pediu_analise' = 'true' and diagnosticos.status = 'devolutiva' then 'novo'
      else diagnosticos.status
    end
  where diagnosticos.created_at > now() - interval '1 day';
end;
$$;

revoke all on function public.salvar_diagnostico(jsonb) from public;
grant execute on function public.salvar_diagnostico(jsonb) to anon, authenticated;
