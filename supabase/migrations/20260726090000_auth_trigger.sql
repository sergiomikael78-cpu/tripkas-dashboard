-- =============================================================================
-- Stage Final: Auto-create User Profile & Workspace on Sign Up
-- =============================================================================

-- Fungsi ini akan dipanggil oleh trigger Supabase Auth setiap kali ada user baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    new_workspace_id uuid;
    extracted_name text;
BEGIN
    -- 1. Tentukan nama dari metadata (jika ada), atau dari bagian depan email
    extracted_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    -- 2. Buat profil user di tabel public.users
    INSERT INTO public.users (id, full_name, email)
    VALUES (NEW.id, extracted_name, NEW.email);

    -- 3. Buat workspace baru dengan nama "Bisnis [Nama User]"
    INSERT INTO public.workspaces (name, owner_id)
    VALUES ('Bisnis ' || extracted_name, NEW.id)
    RETURNING id INTO new_workspace_id;

    -- 4. Update tabel public.users untuk menautkan ke workspace yang baru dibuat
    UPDATE public.users 
    SET workspace_id = new_workspace_id 
    WHERE id = NEW.id;

    -- 5. Tambahkan user ini sebagai 'owner' di workspace_members
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (new_workspace_id, NEW.id, 'owner'::user_role);

    RETURN NEW;
END;
$$;

-- Buat trigger di tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
