-- Add avatar_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for avatars if it doesn't exist
-- Note: This needs to be run in Supabase Dashboard or via Supabase CLI
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for avatars bucket
-- Note: These policies should be created in Supabase Dashboard under Storage > Policies
-- Policy 1: Anyone can view avatars (SELECT)
-- Policy 2: Authenticated users can upload their own avatars (INSERT)
-- Policy 3: Users can update their own avatars (UPDATE)
-- Policy 4: Users can delete their own avatars (DELETE)
