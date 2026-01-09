-- Create admin user
-- This script creates a user in the auth.users table and sets their role to admin.
-- Note: You should run this in your Supabase SQL Editor.

-- 1. Create the user in auth.users
INSERT INTO auth.users (
    instance_id, 
    id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
)
SELECT 
    '00000000-0000-0000-0000-000000000000', 
    gen_random_uuid(), 
    'authenticated', 
    'authenticated', 
    'fralfarra11@gmail.com', 
    crypt('Feras@@@123', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"full_name":"Feras Alfarra"}', 
    now(), 
    now(),
    '',
    '',
    '',
    ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'fralfarra11@gmail.com');

-- 2. Ensure user_roles entry exists and is set to admin
-- The trigger on_auth_user_created might have already created a 'student' role.
-- We update it to 'admin'.
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'fralfarra11@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Check if role already exists
        IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id) THEN
            UPDATE public.user_roles SET role = 'admin' WHERE user_id = target_user_id;
        ELSE
            INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'admin');
        END IF;
    END IF;
END $$;
