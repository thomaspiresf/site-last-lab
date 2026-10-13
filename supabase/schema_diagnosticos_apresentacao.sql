-- Last Lab · apresentação da reunião, montada dentro do admin (/admin/diagnosticos/:id/apresentar)
-- Guarda o que é escrito por lead: empresa, resumo, observações "de fora" (com prints), custo e casos.

alter table diagnosticos
  add column apresentacao jsonb not null default '{}'::jsonb;

-- O visitante não pode preencher esse campo.
drop policy "public_insert_diagnosticos" on diagnosticos;
create policy "public_insert_diagnosticos" on diagnosticos for insert
  with check (status = 'novo' and anotacoes = '' and analise = '' and token is null
              and publicado_em is null and oferta_escolhida is null
              and persona_avaliacao is null and persona_sugerida is null
              and apresentacao = '{}'::jsonb);
