-- ============================================
-- JOSE APP - Setup Completo de Profiles e Avatares
-- Execute este SQL completo no Supabase SQL Editor
-- ============================================

-- 1. Criar tabela profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  full_name TEXT,
  phone TEXT,
  preferences JSONB DEFAULT '{
    "weekly_summary": true,
    "new_wisdom": true,
    "hide_balance": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- 3. Ativar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 5. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profiles_updated_at();

-- 7. Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger para novos usuários
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- 9. BACKFILL - Criar perfis para usuários existentes
INSERT INTO public.profiles (id, full_name)
SELECT 
  id,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 10. Criar bucket de avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 11. Políticas de Storage
CREATE POLICY "Public Access to Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 12. Comentários
COMMENT ON TABLE public.profiles IS 'User profiles with avatar, contact info, and preferences';
COMMENT ON COLUMN public.profiles.preferences IS 'User preferences stored as JSONB: weekly_summary, new_wisdom, hide_balance';

-- 13. Verificação final
SELECT 'Setup completo! Perfis criados:' as status, count(*) as total FROM public.profiles;
SELECT 'Bucket criado:' as status, id, name, public FROM storage.buckets WHERE id = 'avatars';
