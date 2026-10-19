-- 00095: close the public write path into enquiries, whose form no longer exists.
--
-- 00007 created the enquiries table for the contact form and gave it both
-- halves of a public write:
--
--   CREATE POLICY "public_insert_enquiries" ON enquiries FOR INSERT WITH CHECK (true);
--   GRANT INSERT ON enquiries TO anon, authenticated;
--
-- The operator retired the contact form on 2026-10-13 (see the note at the top
-- of src/app/(site)/contact/page.tsx). The table kept its open write path, and
-- nothing in src/ reads or writes it any more - the only mention left is its
-- generated row type in database.types.ts.
--
-- What that leaves is an unauthenticated, unvalidated, unbounded INSERT
-- endpoint on the Data API: POST /rest/v1/enquiries with any JSON body, as
-- many times as you like. It does not pass through Next.js at all, so the
-- per-IP limiter added for /api/bookings/create-order and /api/discount/validate
-- does not see it, and neither does any of the input validation in those
-- routes. The one thing making it hard to reach today is that this app ships no
-- browser Supabase client, so the anon key is never published - but anon keys
-- are designed to be public, and the protection disappears the moment anyone
-- adds a client-side query or the key is shared.
--
-- Both halves are removed, because either one alone would stop the insert and
-- leaving the other implies an access level that is no longer intended.
--
-- Deliberately NOT dropping the table. The live database has been taking
-- enquiries since before the form was retired, and those are real messages from
-- real people. service_role keeps SELECT (granted in 00011) so staff tooling
-- can still read the history. If the contact form ever returns, it should come
-- back through a server route that validates and rate-limits, like every other
-- write in this app - not by restoring a blanket grant to anon.

-- The RLS half.
DROP POLICY IF EXISTS "public_insert_enquiries" ON enquiries;

-- The privilege half. anon loses its only INSERT grant anywhere in the schema;
-- authenticated's SELECT goes too, since RLS has no SELECT policy to permit it
-- and the grant only suggests an access level that does not exist.
REVOKE INSERT ON enquiries FROM anon, authenticated;
REVOKE SELECT ON enquiries FROM authenticated;

COMMENT ON TABLE enquiries IS
  'Historical contact-form and WhatsApp enquiries. The form was retired '
  '2026-10-13 and the public INSERT path was closed in 00095. Read by '
  'service_role only. A future enquiry form must write through a validated, '
  'rate-limited server route, not a direct anon grant.';
