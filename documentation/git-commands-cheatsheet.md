# 📋 Git команды - Шпаргалка

## 🔍 Проверить статус
```bash
git status
# Показывает какие файлы изменены, добавлены, удалены
```

## ➕ Добавить файлы в stage (подготовка к коммиту)
```bash
# Добавить конкретный файл
git add src/app/api/auth/[...nextauth]/route.ts

# Добавить все измененные файлы
git add .

# Добавить несколько файлов
git add file1.ts file2.ts file3.ts
```

## 💾 Создать коммит
```bash
# Коммит с сообщением
git commit -m "Fix: Replace guest role with tangiblee_partner"

# Коммит с подробным описанием
git commit -m "Fix: Replace guest role with tangiblee_partner" -m "- Updated role types and constraints
- Added tangiblee_partner to UserManagement dropdown
- Fixed username overwrite bug on Discord login"
```

## 🚀 Запушить изменения
```bash
# Запушить в текущую ветку
git push

# Запушить в конкретную ветку
git push origin main
git push origin master

# Первый пуш новой ветки
git push -u origin your-branch-name
```

## 🌿 Работа с ветками
```bash
# Посмотреть текущую ветку
git branch

# Создать новую ветку
git branch feature/add-tangiblee-role

# Переключиться на другую ветку
git checkout main
git checkout feature/add-tangiblee-role

# Создать и сразу переключиться
git checkout -b feature/add-tangiblee-role
```

## 📥 Получить изменения
```bash
# Скачать изменения с сервера
git pull

# Скачать изменения из конкретной ветки
git pull origin main
```

## 🔄 Типичный рабочий процесс
```bash
# 1. Проверить что изменилось
git status

# 2. Добавить все файлы
git add .

# 3. Создать коммит
git commit -m "Your commit message"

# 4. Запушить
git push
```

## 📝 Примеры хороших commit сообщений
```bash
git commit -m "Fix: Username overwrite bug on Discord login"
git commit -m "Feature: Add tangiblee_partner role"
git commit -m "Update: Replace guest with tangiblee_partner"
git commit -m "Refactor: Improve auth flow"
git commit -m "Docs: Update README with new roles"
```

## ⚠️ Отменить изменения
```bash
# Отменить изменения в файле (до git add)
git checkout -- filename.ts

# Убрать файл из stage (после git add, но до commit)
git reset HEAD filename.ts

# Отменить последний коммит (сохранить изменения)
git reset --soft HEAD~1

# Отменить последний коммит (удалить изменения)
git reset --hard HEAD~1
```

## 🔍 Просмотр истории
```bash
# Посмотреть историю коммитов
git log

# Краткая история
git log --oneline

# Последние 5 коммитов
git log -5
```

## 🎯 Для твоего случая (обновление ролей):
```bash
# Шаг 1: Проверить что изменилось
git status

# Шаг 2: Добавить все измененные файлы
git add .

# Шаг 3: Создать коммит с описанием
git commit -m "Fix: Replace guest role with tangiblee_partner" -m "- Fixed username overwrite bug on Discord login
- Updated role constraints in database
- Added tangiblee_partner to all role selections
- Disabled teamleader selection for tangiblee_partner role"

# Шаг 4: Запушить в main (или master)
git push origin main
```

## 💡 Полезные советы:
- `git status` - твой лучший друг, используй перед каждым действием
- Коммить часто, маленькими порциями
- Писать понятные commit сообщения на английском (для open source) или русском (для внутренних проектов)
- Делать `git pull` перед началом работы, чтобы получить последние изменения
