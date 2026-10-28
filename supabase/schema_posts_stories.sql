-- Canal do post: feed (grade) ou stories (sequência 9:16, não entra na grade).
alter table posts add column if not exists canal text not null default 'feed' check (canal in ('feed', 'stories'));
