-- =============================================================================
-- Migration: Implement Invite System and Auto-create Workspace
-- =============================================================================

-- 1. Create Invitations Table
CREATE TABLE invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email text NOT NULL,
    role user_role NOT NULL,
    token uuid NOT NULL DEFAULT gen_random_uuid(),
    expires_at timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Only owner/admin can view and insert invitations
CREATE POLICY "Owner/Admin can manage invitations" ON invitations
FOR ALL USING (
  workspace_id = get_user_workspace() AND get_user_role(workspace_id) IN ('owner', 'admin')
);

-- Note: we need a way for anyone (even unauthenticated) to query an invitation by token during sign up
-- But we can't easily do that with RLS. Instead, we'll create an RPC that operates SECURITY DEFINER.

CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite record;
    v_workspace record;
BEGIN
    SELECT * INTO v_invite FROM invitations WHERE token = p_token AND status = 'pending' AND expires_at > now();
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT * INTO v_workspace FROM workspaces WHERE id = v_invite.workspace_id;

    RETURN json_build_object(
        'email', v_invite.email,
        'role', v_invite.role,
        'workspace_name', v_workspace.name,
        'workspace_id', v_workspace.id
    );
END;
$$;


-- 2. Trigger on auth.users creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite_token uuid;
    v_invite record;
    v_workspace_id uuid;
    v_full_name text;
BEGIN
    -- Extract metadata
    v_invite_token := (NEW.raw_user_meta_data->>'invite_token')::uuid;
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

    IF v_invite_token IS NOT NULL THEN
        -- Handle Invitation Flow
        SELECT * INTO v_invite FROM invitations WHERE token = v_invite_token AND status = 'pending' AND expires_at > now();
        
        IF NOT FOUND THEN
            -- Invalid token, fallback to normal creation or throw error?
            -- We'll throw error to prevent orphan accounts
            RAISE EXCEPTION 'Invalid or expired invitation token';
        END IF;

        -- Create user profile
        INSERT INTO public.users (id, full_name, email, workspace_id)
        VALUES (NEW.id, v_full_name, NEW.email, v_invite.workspace_id);

        -- Add as workspace member
        INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
        VALUES (v_invite.workspace_id, NEW.id, v_invite.role, v_invite.created_by);

        -- Mark invitation as accepted
        UPDATE invitations SET status = 'accepted' WHERE id = v_invite.id;

    ELSE
        -- Handle Normal Flow (Owner)
        -- Create a new workspace
        INSERT INTO public.workspaces (name, owner_id)
        VALUES ('Bisnis ' || v_full_name, NEW.id)
        RETURNING id INTO v_workspace_id;

        -- Create user profile
        INSERT INTO public.users (id, full_name, email, workspace_id)
        VALUES (NEW.id, v_full_name, NEW.email, v_workspace_id);

        -- Add as workspace owner
        INSERT INTO public.workspace_members (workspace_id, user_id, role)
        VALUES (v_workspace_id, NEW.id, 'owner');
    END IF;

    RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- 3. RPC to create invitation
CREATE OR REPLACE FUNCTION create_invitation(p_email text, p_role user_role)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_workspace_id uuid;
    v_my_role text;
    v_token uuid;
BEGIN
    v_workspace_id := get_user_workspace();
    v_my_role := get_user_role(v_workspace_id);
    
    IF v_my_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Only owner or admin can invite users';
    END IF;

    -- Check if email already invited
    IF EXISTS (SELECT 1 FROM invitations WHERE workspace_id = v_workspace_id AND email = p_email AND status = 'pending') THEN
        RAISE EXCEPTION 'This email has already been invited';
    END IF;

    -- Check if email already a member
    IF EXISTS (
        SELECT 1 FROM workspace_members wm 
        JOIN users u ON u.id = wm.user_id 
        WHERE wm.workspace_id = v_workspace_id AND u.email = p_email
    ) THEN
        RAISE EXCEPTION 'This user is already a member';
    END IF;

    INSERT INTO invitations (workspace_id, email, role, expires_at, created_by)
    VALUES (v_workspace_id, p_email, p_role, now() + interval '7 days', auth.uid())
    RETURNING token INTO v_token;

    RETURN v_token::text;
END;
$$;
