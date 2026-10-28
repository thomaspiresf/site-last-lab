-- Link do Figma de onde o post foi puxado (seção ou prancheta), para atualizar depois de editar no Figma.
alter table posts add column if not exists figma_url text;
