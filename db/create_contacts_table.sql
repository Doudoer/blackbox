-- SQL: create_contacts_table.sql
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.contacts (
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id    ON public.contacts (user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_id ON public.contacts (contact_id);
