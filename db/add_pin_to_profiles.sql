-- ==============================================================================
-- SQL: add_pin_to_profiles.sql
-- Ejecuta este script en el SQL Editor de Supabase
-- Agrega un PIN único de 6 caracteres alfanuméricos a cada usuario
-- ==============================================================================

-- 1. Añadir la columna 'pin' a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pin varchar(6) UNIQUE;

-- 2. Crear función para generar un PIN aleatorio de 6 caracteres (mayúsculas y números)
CREATE OR REPLACE FUNCTION public.generate_unique_pin()
RETURNS varchar(6)
LANGUAGE plpgsql
AS $$
DECLARE
  chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
  new_pin varchar(6);
  is_unique boolean := false;
BEGIN
  WHILE NOT is_unique LOOP
    new_pin := '';
    FOR i IN 1..6 LOOP
      new_pin := new_pin || chars[1 + random() * (array_length(chars, 1) - 1)];
    END LOOP;
    
    -- Check if it exists
    PERFORM 1 FROM public.profiles WHERE pin = new_pin;
    IF NOT FOUND THEN
      is_unique := true;
    END IF;
  END LOOP;
  
  RETURN new_pin;
END;
$$;

-- 3. Crear el Trigger para asignar un PIN automáticamente a los nuevos usuarios
CREATE OR REPLACE FUNCTION public.trigger_set_profile_pin()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pin IS NULL THEN
    NEW.pin := public.generate_unique_pin();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profile_pin_trigger ON public.profiles;
CREATE TRIGGER set_profile_pin_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_profile_pin();

-- 4. Actualizar todos los perfiles existentes que no tengan PIN
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM public.profiles WHERE pin IS NULL LOOP
    UPDATE public.profiles
    SET pin = public.generate_unique_pin()
    WHERE id = rec.id;
  END LOOP;
END;
$$;
