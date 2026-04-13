-- Oprava triggeru handle_new_user
-- Problém: trigger ukládal raw_user_meta_data->>'role' ('visitor'/'institution') do profiles.role,
-- ale tabulka povoluje pouze 'superadmin' nebo NULL → "Database error saving new user"
-- Řešení: trigger vkládá pouze id, role zůstává NULL (superadmin se přiřazuje ručně přes API)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
EXCEPTION WHEN others THEN
  -- Neblokuj registraci ani při neočekávané chybě v profiles
  RAISE WARNING 'handle_new_user: profiles insert failed for user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$;

-- Ujisti se, že trigger existuje (pokud ještě neexistuje)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;
