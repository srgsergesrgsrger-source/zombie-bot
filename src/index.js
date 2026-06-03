/**
 * index.js — точка входа Discord бота.
 *
 * Инициализирует клиент Discord, загружает команды и события,
 * настраивает обработку ошибок и подключается к Discord.
 */

// Загружаем переменные окружения из .env файла
require('dotenv').config();

const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
} = require('discord.js');

const fs      = require('fs');
const path    = require('path');
const storage = require('./utils/storage');
const logger  = require('./utils/logger');

// ============================================================
// Инициализация хранилища
// ============================================================
storage.init();

// ============================================================
// Создание Discord клиента с необходимыми Intents
// ============================================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,          // доступ к серверам
    GatewayIntentBits.GuildMembers,    // доступ к участникам (для подсчёта)
    GatewayIntentBits.GuildMessages,   // сообщения (для Embed)
  ],
  partials: [
    Partials.GuildMember,
  ],
  // Настройки переподключения: Discord.js управляет reconnect автоматически
  // Дополнительная настройка через sharding при масштабировании
});

// Коллекция слэш-команд
client.commands = new Collection();

// ============================================================
// Загрузка слэш-команд из папки commands/
// ============================================================
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    logger.info(`[Commands] Загружена команда: /${command.data.name}`);
  } else {
    logger.warn(`[Commands] Файл ${file} не экспортирует data или execute`);
  }
}

// ============================================================
// Загрузка обработчиков событий из папки events/
// ============================================================
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const eventModule = require(path.join(eventsPath, file));

  // Поддержка как единственного обработчика, так и массива (guildMemberUpdate.js)
  const handlers = Array.isArray(eventModule) ? eventModule : [eventModule];

  for (const handler of handlers) {
    if (handler.once) {
      client.once(handler.name, (...args) => handler.execute(...args));
    } else {
      client.on(handler.name, (...args) => handler.execute(...args));
    }
    logger.info(`[Events] Загружено событие: ${handler.name}`);
  }
}

// ============================================================
// Глобальная обработка необработанных ошибок
// ============================================================

// Ошибки промисов без catch
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Process] Необработанный rejection:', reason);
});

// Синхронные ошибки без try/catch
process.on('uncaughtException', (err) => {
  logger.error('[Process] Необработанное исключение:', err.message);
  logger.error(err.stack);
  // Не завершаем процесс — бот продолжает работу
});

// Обработка ошибок самого Discord клиента
client.on('error', (err) => {
  logger.error('[Discord] Ошибка клиента:', err.message);
});

// Логирование предупреждений Discord
client.on('warn', (msg) => {
  logger.warn('[Discord] Предупреждение:', msg);
});

// Логирование переподключений (Discord.js делает это автоматически)
client.on('shardReconnecting', () => {
  logger.info('[Discord] Переподключение к Discord...');
});

client.on('shardResume', () => {
  logger.success('[Discord] Соединение восстановлено');
});

// ============================================================
// Подключение к Discord
// ============================================================
const token = process.env.DISCORD_TOKEN;

if (!token) {
  logger.error('❌ DISCORD_TOKEN не указан в файле .env');
  logger.error('   Скопируйте .env.example в .env и заполните токен');
  process.exit(1);
}

logger.info('🔌 Подключение к Discord...');

client.login(token).catch(err => {
  logger.error('❌ Ошибка авторизации:', err.message);
  logger.error('   Проверьте DISCORD_TOKEN в файле .env');
  process.exit(1);
});
