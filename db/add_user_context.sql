-- ==============================================================================
-- SQL: add_user_context.sql
-- Añade soporte para almacenar contexto de usuario para importación a asistentes de IA.
-- Ejecuta este script en el SQL Editor de Supabase.
-- ==============================================================================

-- Añadir columna user_context (JSONB) a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_context jsonb DEFAULT '{
  "demographic": [],
  "interests": [],
  "relationships": [],
  "events": [],
  "instructions": []
}'::jsonb;

-- Comentario para documentar la estructura esperada del campo
COMMENT ON COLUMN public.profiles.user_context IS
  'Contexto del usuario para importar en asistentes de IA. Estructura JSON:
  {
    "demographic": [{ "statement": "...", "proof": "...", "date": "YYYY-MM-DD" }],
    "interests":   [...],
    "relationships": [...],
    "events":      [...],
    "instructions": [...]
  }';
