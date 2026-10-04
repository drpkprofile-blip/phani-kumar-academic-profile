import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { root } from "./publication-seed.mjs";

// Operator-only: prepare SQL for the CLI's authenticated database connection.
// Never accept passwords, tokens, emails or editable metadata as authorization.
const uuid = process.argv[2];
assert.match(uuid ?? "", /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "A verified Auth user UUID is required");
const sql = `begin;
lock table private.publications_admins in exclusive mode;
do $$
begin
  if not exists (select 1 from auth.users where id = '${uuid}'::uuid and email_confirmed_at is not null) then
    raise exception 'Selected Auth user must exist and have a confirmed email';
  end if;
  if exists (select 1 from private.publications_admins where user_id <> '${uuid}'::uuid) then
    raise exception 'First-admin bootstrap refused: another admin already exists';
  end if;
end;
$$;
insert into private.publications_admins(user_id) values ('${uuid}'::uuid)
on conflict(user_id) do nothing;
select count(*) = 1 as only_selected_admin_allowlisted
from private.publications_admins where user_id = '${uuid}'::uuid;
commit;
`;
mkdirSync(`${root}/supabase/.temp`, { recursive: true });
writeFileSync(`${root}/supabase/.temp/first-admin-bootstrap.sql`, sql);
console.log("Prepared ignored first-admin SQL; no credentials included.");
