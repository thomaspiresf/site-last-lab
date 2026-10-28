-- Last Lab · lembrete 1h antes das reuniões (28/10/2026)
-- A cada 5 minutos o pg_cron chama a função lembrete-reunioes, que manda um e-mail para o Thomás
-- com o botão do WhatsApp do cliente (uma vez por reunião, marcado em lembrete_enviado_em).

alter table reunioes add column if not exists lembrete_enviado_em timestamptz;

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('lembrete-reunioes') where exists (select 1 from cron.job where jobname = 'lembrete-reunioes');
select cron.schedule('lembrete-reunioes', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://btmcefbijvwtvvpvueia.supabase.co/functions/v1/lembrete-reunioes',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
$$);
