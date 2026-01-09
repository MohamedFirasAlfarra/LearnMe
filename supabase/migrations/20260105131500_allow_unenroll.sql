-- Enable delete policy for enrollments
-- Allow users to delete their own enrollments
DROP POLICY IF EXISTS "Users can unenroll themselves" ON public.enrollments;
CREATE POLICY "Users can unenroll themselves"
ON public.enrollments FOR DELETE
USING ( auth.uid() = user_id );
