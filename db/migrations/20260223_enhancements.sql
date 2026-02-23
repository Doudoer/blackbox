-- Migration: Blackbox Platform Enhancements
-- Date: 2026-02-23
-- Description: Adds fields for read receipts, ephemeral messaging, and profile status.

-- 1. Extend Messages table for read receipts and expiration
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Extend Profiles table for online status and privacy
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS status_message TEXT DEFAULT '';

-- 3. Create or replace the public view to include new non-sensitive fields
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id, 
  username, 
  bio, 
  avatar_url, 
  is_admin, 
  last_seen_at, 
  status_message
FROM public.profiles;

-- 4. Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_sender_id UUID, p_receiver_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.messages
  SET is_read = TRUE
  WHERE sender_id = p_sender_id 
    AND receiver_id = p_receiver_id 
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Enable Row Level Security (RLS) check for the new fields if needed
-- (Existing policies already cover select/insert/update based on profile id)

-- 6. Cron-like cleanup for expired messages (if pg_cron is available, otherwise manual check)
-- Note: This is a placeholder for logic that would be handled by a Supabase Edge Function or similar.
DELETE FROM public.messages WHERE expires_at IS NOT NULL AND expires_at < NOW();
