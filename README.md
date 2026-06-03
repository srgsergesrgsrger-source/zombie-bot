# 🤖 Majestic RP Discord Bot

Discord бот для отображения статистики сервера и онлайна Majestic RP.

---

## 📋 Возможности

| Функция | Описание |
|---------|----------|
| 📊 Статистика участников | Голосовой канал с живым счётчиком участников |
| 🚀 Онлайн Majestic RP | Embed с онлайном всех серверов (обновляется каждую минуту) |
| 🔄 Динамика онлайна | Показывает рост ▲ и снижение ▼ относительно предыдущего обновления |
| ⚡ Слэш-команды | `/setup-stats`, `/setup-online`, `/force-update` |

---

## ⚙️ Требования

- **Node.js** 18.0.0 или выше
- **npm** 8+
- Аккаунт Discord Developer

---

## 🚀 Установка

### 1. Клонируйте репозиторий

```bash
git clone <url-репозитория>
cd majestic-rp-discord-bot
```

### 2. Установите зависимости

```bash
npm install
```

### 3. Настройте переменные окружения

```bash
cp .env.example .env
```

Откройте `.env` и заполните значения (см. раздел ниже).

---

## 🔑 Настройка Discord Bot Token

### Шаг 1: Создание приложения

1. Откройте [Discord Developer Portal](https://discord.com/developers/applications)
2. Нажмите **New Application**
3. Введите имя бота и нажмите **Create**

### Шаг 2: Создание бота

1. В левом меню выберите **Bot**
2. Нажмите **Add Bot** → **Yes, do it!**
3. В разделе **Token** нажмите **Reset Token**, затем **Copy**
4. Вставьте токен в `.env` как `DISCORD_TOKEN`

### Шаг 3: Получение CLIENT_ID и GUILD_ID

**CLIENT_ID** (Application ID):
- В левом меню: **General Information**
- Скопируйте **Application ID**
- Вставьте в `.env` как `CLIENT_ID`

**GUILD_ID** (ID сервера):
- В Discord: правая кнопка на вашем сервере → **Копировать ID**
  *(если не видите пункт — включите режим разработчика: Настройки → Расширенные → Режим разработчика)*
- Вставьте в `.env` как `GUILD_ID`

### Шаг 4: Настройка Intents

В **Discord Developer Portal → Bot** включите следующие **Privileged Gateway Intents**:
- ✅ **Server Members Intent** — для подсчёта участников
- ✅ **Message Content Intent** — для чтения сообщений

---

## 🛡️ Выдача прав боту

### Приглашение на сервер

1. В Developer Portal → **OAuth2** → **URL Generator**
2. В **SCOPES** выберите:
   - ✅ `bot`
   - ✅ `applications.commands`
3. В **BOT PERMISSIONS** выберите:
   - ✅ View Channels
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Manage Channels *(для создания канала статистики)*
   - ✅ Read Message History
4. Скопируйте сгенерированную ссылку и откройте её
5. Выберите ваш сервер и нажмите **Авторизовать**

### Права бота на сервере (рекомендуется)

Создайте роль **Bot** на сервере и выдайте ей:
- **Просмотр каналов** — обязательно
- **Отправка сообщений** — обязательно
- **Встроить ссылки** — для Embed
- **Управление каналами** — для создания/переименования канала статистики
- **Читать историю сообщений** — для редактирования Embed

---

## 📝 Файл `.env`

```env
# Токен бота (Discord Developer Portal → Bot → Token)
DISCORD_TOKEN=MTIz...

# Application ID (Discord Developer Portal → General Information)
CLIENT_ID=123456789012345678

# ID вашего Discord сервера
GUILD_ID=987654321098765432

# ID канала для онлайна Majestic RP (или настройте через /setup-online)
MAJESTIC_CHANNEL_ID=

# ID категории для канала статистики (необязательно)
STATS_CATEGORY_ID=
```

---

## ▶️ Запуск

### Регистрация команд (один раз)

```bash
node src/deploy-commands.js
```

> Выполните это после первого запуска и при изменении команд.

### Запуск бота

```bash
# Продакшн
npm start

# Разработка (автоперезапуск)
npm run dev
```

---

## 📁 Структура проекта

```
majestic-rp-discord-bot/
├── src/
│   ├── commands/
│   │   ├── setup-stats.js      # /setup-stats — настройка канала статистики
│   │   ├── setup-online.js     # /setup-online — настройка канала онлайна
│   │   └── force-update.js     # /force-update — принудительное обновление
│   ├── events/
│   │   ├── ready.js            # Запуск сервисов при старте
│   │   ├── interactionCreate.js # Обработка слэш-команд
│   │   └── guildMemberUpdate.js # Реакция на вход/выход участников
│   ├── services/
│   │   ├── majesticParser.js   # Парсинг сайта Majestic RP
│   │   ├── majesticOnline.js   # Сервис онлайна (Embed + обновление)
│   │   └── memberCounter.js    # Сервис статистики участников
│   ├── utils/
│   │   ├── storage.js          # JSON-хранилище настроек
│   │   └── logger.js           # Логгер с цветным выводом
│   ├── config/
│   │   └── config.json         # Настройки: интервалы, иконки, шаблоны
│   ├── deploy-commands.js      # Регистрация команд в Discord
│   └── index.js                # Точка входа
├── data/
│   └── settings.json           # Авто-генерируется: ID каналов, предыдущие данные
├── .env                        # Секреты (не коммитить!)
├── .env.example                # Шаблон .env
├── .gitignore
├── .eslintrc.json
└── package.json
```

---

## 🎮 Команды

| Команда | Описание | Права |
|---------|----------|-------|
| `/setup-stats` | Создать/настроить канал статистики участников | Администратор |
| `/setup-online` | Выбрать канал для публикации онлайна Majestic RP | Администратор |
| `/force-update` | Принудительно обновить всё | Администратор |

---

## ⚙️ Конфигурация (`src/config/config.json`)

```json
{
  "statsChannel": {
    "name": "📊 All Members: {count}",   // Шаблон названия канала
    "updateIntervalMs": 300000,           // Интервал обновления (5 мин)
    "categoryName": "📊 SERVER STATS 📊" // Название категории
  },
  "majesticOnline": {
    "updateIntervalMs": 60000,            // Интервал обновления (60 сек)
    "maxRetries": 3,                      // Попыток при ошибке парсинга
    "retryDelayMs": 5000                  // Задержка между попытками
  }
}
```

---

## 🔧 Устранение проблем

**Бот не отвечает на команды**
→ Убедитесь, что выполнили `node src/deploy-commands.js` и перезапустили бота.

**Ошибка "Missing Permissions"**
→ Проверьте, что боту выданы права **Manage Channels** и **Send Messages**.

**Канал статистики не обновляется**
→ Discord ограничивает переименование каналов: не чаще 2 раз в 10 минут. Это нормально.

**Парсер не получает данные Majestic RP**
→ Сайт может быть недоступен. Бот повторит попытку через 60 секунд автоматически.

**"DISCORD_TOKEN не указан"**
→ Проверьте наличие файла `.env` (не `.env.example`) с заполненным токеном.

---

## 📜 Зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `discord.js` | ^14.14 | Discord API |
| `axios` | ^1.6 | HTTP-запросы к сайту Majestic RP |
| `cheerio` | ^1.0 | Парсинг HTML |
| `dotenv` | ^16.4 | Переменные окружения |
| `eslint` | ^8.56 | Линтинг кода |
