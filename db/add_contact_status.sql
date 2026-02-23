-- ==============================================================================
-- SQL: add_contact_status.sql
-- Añade un sistema de estados ('pending', 'accepted') a la tabla contacts
-- ==============================================================================

-- 1. Añadir la columna status con valor por defecto 'pending'
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'pending';

-- 2. Retrocompatibilidad: marcar los contactos existentes como 'accepted'
UPDATE public.contacts
SET status = 'accepted'
WHERE status = 'pending' OR status IS NULL;

-- 3. Crear una restricción CHECK opcional para asegurar valores válidos
-- (Sólo se permite 'pending' o 'accepted')
ALTER TABLE public.contacts 
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE public.contacts 
ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted'));
