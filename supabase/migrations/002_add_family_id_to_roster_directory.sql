begin;

create or replace view public.roster_directory as
select
  p.id as player_id,
  fp.family_id,
  p.status,
  p.first_name,
  p.last_name,
  concat_ws(' ', p.first_name, p.last_name) as player_name,
  p.jersey_number,
  p.bats,
  p.throws,
  p.catches,
  f.dad_name,
  f.mom_name,
  coalesce(f.contact_email, f.email) as parent_email,
  p.sort_order
from public.players p
left join public.family_players fp on fp.player_id = p.id
left join public.families f on f.id = fp.family_id;

grant select on public.roster_directory to authenticated;

commit;
