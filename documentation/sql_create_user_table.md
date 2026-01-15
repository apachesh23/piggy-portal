-- ============================================
-- Удаляем старую таблицу и пересоздаем
-- ============================================

DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- Таблица пользователей (users) - ФИНАЛЬНАЯ ВЕРСИЯ
-- ============================================

CREATE TABLE users (
  -- Первичный ключ
  id SERIAL PRIMARY KEY,
  
  -- Идентификаторы (обязательные)
  discord_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  
  -- Профиль Discord (заполняются при первом логине)
  discord_username TEXT,
  discord_avatar TEXT,
  email TEXT,
  
  -- Роли (обязательные)
  role TEXT NOT NULL CHECK (role IN ('junior', 'moderator', 'supervisor', 'teamleader', 'admin')),
  
  -- Уровень доступа (обязательный, по умолчанию guest)
  permission_level TEXT NOT NULL DEFAULT 'guest' CHECK (permission_level IN ('guest', 'moderator', 'teamleader', 'admin', 'dev')),
  
  -- Иерархия (опциональная)
  teamleader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Системные поля
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Гибкое поле для дополнительных данных
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- Индексы для быстрого поиска
-- ============================================

CREATE INDEX idx_users_discord_id ON users(discord_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_permission_level ON users(permission_level);
CREATE INDEX idx_users_teamleader_id ON users(teamleader_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================
-- Функция для автообновления updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Триггер для updated_at
-- ============================================

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Триггер: защита от изменения dev через админку
-- ============================================

CREATE OR REPLACE FUNCTION protect_dev_permission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.permission_level = 'dev' AND auth.uid() IS NOT NULL THEN
    IF OLD.permission_level = 'dev' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Cannot set permission_level to dev through application';
  END IF;
  
  IF OLD.permission_level = 'dev' AND NEW.permission_level != 'dev' AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot modify dev permission_level through application';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_dev_permission_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION protect_dev_permission();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = discord_id)
  WITH CHECK (auth.uid()::text = discord_id);

CREATE POLICY "Only admins can insert users"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE discord_id = auth.uid()::text 
      AND permission_level IN ('admin', 'dev')
    )
  );

CREATE POLICY "Only admins can delete users"
  ON users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE discord_id = auth.uid()::text 
      AND permission_level IN ('admin', 'dev')
    )
    AND permission_level != 'dev'
  );

CREATE POLICY "Admins can update all users except dev"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE discord_id = auth.uid()::text 
      AND permission_level IN ('admin', 'dev')
    )
    AND (permission_level != 'dev' OR auth.uid()::text = discord_id)
  );

CREATE POLICY "Dev can update everyone"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE discord_id = auth.uid()::text 
      AND permission_level = 'dev'
    )
  );

-- ============================================
-- Комментарии для документации
-- ============================================

COMMENT ON TABLE users IS 'Таблица пользователей Piggy Portal';
COMMENT ON COLUMN users.id IS 'Уникальный идентификатор пользователя';
COMMENT ON COLUMN users.discord_id IS 'ID пользователя из Discord (для авторизации)';
COMMENT ON COLUMN users.username IS 'Внутреннее имя пользователя (для whitelist и статистики)';
COMMENT ON COLUMN users.discord_username IS 'Имя пользователя из Discord (заполняется при первом логине)';
COMMENT ON COLUMN users.discord_avatar IS 'URL аватарки из Discord (заполняется при первом логине)';
COMMENT ON COLUMN users.role IS 'Визуальная роль: junior, moderator, supervisor, teamleader, admin';
COMMENT ON COLUMN users.permission_level IS 'Уровень доступа: guest, moderator, teamleader, admin, dev (только через БД!)';
COMMENT ON COLUMN users.teamleader_id IS 'ID куратора (teamleader) этого пользователя';
COMMENT ON COLUMN users.metadata IS 'Дополнительные данные в формате JSON';