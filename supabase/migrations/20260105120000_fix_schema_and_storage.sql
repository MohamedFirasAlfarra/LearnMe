-- 1. Add avatar_url column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create the storage bucket for avatars
-- We use a DO block to check existence because INSERT ON CONFLICT doesn't work for virtual tables/views sometimes depending on setup,
-- but standard insert with ON CONFLICT DO NOTHING is safest for storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable RLS on the bucket (optional, usually enabled by default for new buckets but good to ensure)
-- UPDATE storage.buckets SET pkg_config = jsonb_set(pkg_config, '{features, security, rls}', 'true') WHERE id = 'avatars';

-- 4. Create RLS policies for the avatars bucket
-- Note: We drop existing policies first to ensure we don't have duplicates or conflicts
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects; -- Old insecure policy if any
DROP POLICY IF EXISTS "Authenticated users can upload availability" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Policy: Public Read Access
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Policy: Authenticated Upload (Insert)
-- Restrict to the user's own folder (user_id/filename) or just allow any upload by auth user into the bucket
-- For simplicity and complying with the code `fileName = \`\${user?.id}-\${Math.random()}.\${fileExt}\``:
-- The code uploads directly to the root of the bucket with the user ID as prefix.
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' AND (storage.foldername(name))[1] <> 'private' );

-- Policy: Authenticated Update
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND owner = auth.uid() );

-- Policy: Authenticated Delete
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' AND owner = auth.uid() );
