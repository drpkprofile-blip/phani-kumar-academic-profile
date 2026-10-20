begin;

alter table public.profile_settings
  add column hero_message_mode text not null default 'quote'
    check (hero_message_mode in ('quote', 'greeting')),
  add column hero_quote text not null default 'Curiosity inspires discovery; knowledge creates lasting impact.'
    check (length(btrim(hero_quote)) between 1 and 280),
  add column hero_quote_attribution text not null default ''
    check (length(hero_quote_attribution) <= 120),
  add column hero_greeting text not null default 'Warm wishes to you and your family on this special occasion.'
    check (length(btrim(hero_greeting)) between 1 and 280),
  add column hero_greeting_attribution text not null default ''
    check (length(hero_greeting_attribution) <= 120);

comment on column public.profile_settings.hero_message_mode is
  'Controls whether the public home hero shows the general quote or festival greeting.';

commit;
