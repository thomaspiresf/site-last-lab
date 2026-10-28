-- Last Lab · WhatsApp do convidado na reunião (28/10/2026)
-- Preenchido com o WhatsApp do lead, ou digitado quando a reunião não vem de um lead. Usado no botão
-- "Avisar no WhatsApp", no aviso do PC e no e-mail de lembrete de 1h antes.
alter table reunioes add column if not exists convidado_whatsapp text not null default '';
