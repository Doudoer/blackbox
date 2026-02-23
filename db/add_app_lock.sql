-- ==============================================================================
-- SQL: add_app_lock.sql
-- Añade soporte para el bloqueo de aplicación en el cliente con PIN hasheado
-- ==============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS lock_key_hash text NULL;
