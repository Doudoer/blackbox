-- ==============================================================================
-- SQL: add_reply_feature.sql
-- Añade soporte para responder a mensajes específicos
-- ==============================================================================

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS reply_to_id bigint REFERENCES public.messages(id) ON DELETE SET NULL;
