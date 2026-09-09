-- Remove the em dash from the government ID policy.
--
-- 00009_content_fixes.sql already tried to do this, under the comment
-- "Fix government ID rule (em dash removal)", but it targeted
-- `WHERE key = 'government_id'`. The row's key is actually `id_requirement`, so
-- the UPDATE matched zero rows and silently succeeded. The em dash has been live
-- on every environment ever since.
--
-- It was invisible locally because `supabase db reset` re-seeds from seed.sql,
-- which carries the corrected text — so the local database looked right while
-- the migration that was supposed to fix it did nothing. Only comparing local
-- against staging surfaced it.
--
-- Keyed on the body text as well as the key, so it stays a no-op anywhere the
-- text is already correct.

UPDATE property_policies
SET body = 'All adult guests must present valid government-issued photo ID at check-in: Aadhaar card, passport, or driving licence. This is a legal requirement under Karnataka state regulations. Soft copies must be shared via WhatsApp before arrival.'
WHERE key = 'id_requirement'
  AND body LIKE '%check-in —%'
  AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
