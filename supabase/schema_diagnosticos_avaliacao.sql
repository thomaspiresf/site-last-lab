-- Last Lab · "A persona fez sentido?" na ficha do lead (para calibrar os pesos por tipo de negócio)
-- Roda uma vez no SQL Editor do Supabase.

alter table diagnosticos
  add column persona_avaliacao text check (persona_avaliacao in ('sim', 'nao')),
  add column persona_sugerida text;   -- se não fez sentido: qual persona você daria

-- O visitante não pode preencher esses campos.
drop policy "public_insert_diagnosticos" on diagnosticos;
create policy "public_insert_diagnosticos" on diagnosticos for insert
  with check (status = 'novo' and anotacoes = '' and analise = '' and token is null
              and publicado_em is null and oferta_escolhida is null
              and persona_avaliacao is null and persona_sugerida is null);
