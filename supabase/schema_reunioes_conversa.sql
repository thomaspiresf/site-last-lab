-- Last Lab · registro da conversa da reunião (28/10/2026)
-- A transcrição (do tl;dv ou outra ferramenta) colada no admin e o que a IA tirou dela: dores,
-- objeções, interesse, próximos passos. Vai também como contato na ficha do lead.
alter table reunioes add column if not exists transcricao text not null default '';
alter table reunioes add column if not exists insights jsonb;
alter table reunioes add column if not exists insights_em timestamptz;
