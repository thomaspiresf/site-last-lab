-- Last Lab · convite da reunião por e-mail da Last Lab (28/10/2026)
-- O Google não manda mais o convite dele: a função google-agenda manda um e-mail da Last Lab (Resend)
-- com o Meet e o .ics. Aqui fica o que o cliente já recebeu, para saber se o próximo e-mail é de
-- confirmação, de remarcação ou de cancelamento.

alter table reunioes add column if not exists convite_inicio timestamptz;   -- horário que o cliente conhece
alter table reunioes add column if not exists convite_link text;            -- link que o cliente recebeu
alter table reunioes add column if not exists convite_seq integer not null default 0; -- versão do .ics
