-- Add missing columns to messages table if they don't exist
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false;

-- reply_to_id should already be there but let's be sure
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_id bigint REFERENCES public.messages(id) ON DELETE SET NULL;
