-- Migration: 00005_fix_trigger_search_path.sql
-- Fix: SECURITY DEFINER functions need explicit search_path on Postgres 15+
-- Without it, unqualified table names like "profiles" fail to resolve at runtime.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
