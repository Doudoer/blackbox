-- SQL: create_contacts_table.sql
--
-- Creates a simple one-way contacts table for the Blackbox chat app.
-- Run this in Supabase SQL editor or with psql against your database.

CREATE TABLE IF NOT EXISTS public.contacts (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_contact_id ON public.contacts (contact_id);

-- Notes:
-- - This is a one-way contact mapping: user_id added contact_id to their list.
-- - If you want mutual friendships, insert rows in both directions when creating a contact.
-- - Run in Supabase SQL editor: paste and Execute.
