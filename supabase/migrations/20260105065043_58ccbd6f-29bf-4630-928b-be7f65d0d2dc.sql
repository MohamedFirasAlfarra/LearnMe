-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'all', -- 'all', 'specific_users', 'course_enrollees'
  target_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification_recipients table for tracking who received/read notifications
CREATE TABLE public.notification_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(notification_id, user_id)
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;

-- Policies for notifications table
CREATE POLICY "Admins can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all notifications"
ON public.notifications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view notifications sent to them"
ON public.notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.notification_recipients
    WHERE notification_recipients.notification_id = notifications.id
    AND notification_recipients.user_id = auth.uid()
  )
);

-- Policies for notification_recipients table
CREATE POLICY "Admins can manage all recipients"
ON public.notification_recipients
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own notifications"
ON public.notification_recipients
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications as read"
ON public.notification_recipients
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_notification_recipients_user_id ON public.notification_recipients(user_id);
CREATE INDEX idx_notification_recipients_notification_id ON public.notification_recipients(notification_id);
CREATE INDEX idx_notification_recipients_is_read ON public.notification_recipients(is_read);