# Never reset the database

Never ever reset the db unless it is corrupted, and even then only after obtaining the user's explicit approval.

This covers `supabase db reset`, `npm run supabase:reset`, dropping and recreating the database, and anything equivalent. If tests fail because of leftover local data, clean up the specific rows (and ask first) instead of resetting.
