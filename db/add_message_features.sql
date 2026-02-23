-- ==============================================================================
-- SQL: add_message_features.sql
-- Añade características de "visto" y corrige la tabla si fuese necesario
-- ==============================================================================

-- 1. Añadir la columna de confirmación de lectura a mensajes
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- (Opcional) Limpiar si es necesario para asegurar tipos:
-- UPDATE public.messages SET is_read = false WHERE is_read IS NULL;

-- 2. Nota para Storage en Supabase (Hacer desde la UI):
-- * Crear un nuevo "Bucket" llamado 'chat_media' y marcarlo como "Public".
-- * En Security -> Policies, crear una política:
--   "Permitir INSERT a autenticados" => auth.role() = 'authenticated'
-- * Para leer => Es público o también auth.role() = 'authenticated'
