-- Nome do cliente no link de aprovação: lastlab.com.br/aprovacao/<slug>[/<AAAA-MM>]
alter table clients add column if not exists slug text unique;
update clients set slug = 'angelini-seguros' where handle = 'angeliniseguros' and slug is null;
update clients set slug = 'last-lab' where handle = 'lastlab.studio' and slug is null;
select name, slug from clients;
