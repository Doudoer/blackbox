-- ==============================================================================
-- SQL: advanced_features_tier2.sql
-- Añade soporte para mensajes efímeros, edición y borrado suave (soft-delete)
-- ==============================================================================

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone NULL,
ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS audio_url text;
