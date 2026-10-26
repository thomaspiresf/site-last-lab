-- Last Lab · CRM dos leads do diagnóstico (26/10/2026)
-- Próxima ação (o que fazer e quando) e desde quando o lead está na etapa atual, para o quadro do
-- funil e a tela "Hoje" do admin. Etapas novas no status: conversa (aquecimento) e reuniao.
-- Funil: novo → conversa → analisando/devolutiva → reuniao → proposta → fechado | perdido

alter table diagnosticos add column if not exists proxima_acao text;
alter table diagnosticos add column if not exists proxima_acao_em date;
alter table diagnosticos add column if not exists etapa_desde timestamptz;
update diagnosticos set etapa_desde = created_at where etapa_desde is null;
alter table diagnosticos alter column etapa_desde set default now();

-- toda mudança de etapa marca a data (vale para o admin e para as funções de e-mail)
create or replace function public.diagnosticos_marca_etapa()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then new.etapa_desde = now(); end if;
  return new;
end;
$$;

drop trigger if exists diagnosticos_marca_etapa on diagnosticos;
create trigger diagnosticos_marca_etapa before update on diagnosticos
  for each row execute function public.diagnosticos_marca_etapa();
