/**
 * majesticOnline.js — сервис отображения онлайна Majestic RP в Discord.
 *
 * Получает данные через majesticParser, формирует Embed-сообщение
 * и редактирует его (или создаёт новое, если не существует).
 * Сравнивает текущий онлайн с предыдущим и показывает динамику.
 */

const { EmbedBuilder } = require('discord.js');
const parser  = require('./majesticParser');
const storage = require('../utils/storage');
const logger  = require('../utils/logger');
const config  = require('../config/config.json');

// Ключи для хранилища
const STORAGE_KEY_CHANNEL_ID = 'majesticChannelId';
const STORAGE_KEY_MESSAGE_ID = 'majesticMessageId';
const STORAGE_KEY_PREV_DATA  = 'majesticPrevData';

// Интервал обновления (по умолчанию 60 секунд)
const UPDATE_INTERVAL = config.majesticOnline.updateIntervalMs || 60_000;

// Иконки городов из конфига
const SERVER_ICONS = config.serverIcons || {};

// Ссылка на клиент Discord (устанавливается при запуске)
let discordClient = null;

// Таймер обновления
let updateTimer = null;

/**
 * Возвращает иконку для сервера по его имени.
 * Ищет частичное совпадение имени города.
 * @param {string} serverName
 * @returns {string}
 */
function getServerIcon(serverName) {
  for (const [city, icon] of Object.entries(SERVER_ICONS)) {
    if (serverName.toLowerCase().includes(city.toLowerCase())) {
      return icon;
    }
  }
  return '🎮'; // иконка по умолчанию
}

/**
 * Формирует строку изменения онлайна с стрелкой.
 * @param {number} current — текущее значение
 * @param {number|null} previous — предыдущее значение
 * @returns {string} например: "(+3) ▲" или "(-2) ▼" или "(±0)"
 */
function formatDiff(current, previous) {
  if (previous === null || previous === undefined) return '';

  const diff = current - previous;

  if (diff > 0) return ` **(+${diff}) ▲**`;
  if (diff < 0) return ` **(${diff}) ▼**`;
  return ' **(±0)**';
}

/**
 * Строит Discord Embed с онлайном серверов.
 * @param {Array<{name: string, players: number}>} servers
 * @param {object} prevData — предыдущие данные { [name]: players }
 * @returns {EmbedBuilder}
 */
function buildEmbed(servers, prevData = {}) {
  const embed = new EmbedBuilder()
    .setTitle('🚀 Онлайн на Majestic RP')
    .setColor(0x2b2d31)
    .setTimestamp()
    .setFooter({ text: 'Обновляется каждые 60 секунд' });

  if (servers.length === 0) {
    embed.setDescription('❌ Не удалось получить данные. Повтор через минуту...');
    embed.setColor(0xff4444);
    return embed;
  }

  // Формируем строку для каждого сервера
    const lines = servers.map((server, index) => {
        const icon = getServerIcon(server.name);
        const prevCount = prevData[server.name] ?? null;
        const diff = formatDiff(server.players, prevCount);
        const queue = server.queue > 0 ? ` | 🕐 Очередь: **${server.queue}**` : '';

        return `**${index + 1}.** ${icon} **${server.name}**\n• Игроков: **${server.players.toLocaleString('ru-RU')}**${diff}${queue}`;
    });

  // Разбиваем на поля по 5 серверов (ограничение Embed)
  const SERVERS_PER_FIELD = 5;
  for (let i = 0; i < lines.length; i += SERVERS_PER_FIELD) {
    const chunk = lines.slice(i, i + SERVERS_PER_FIELD);
    embed.addFields({
      name:   i === 0 ? 'Серверы' : '\u200B',
      value:  chunk.join('\n\n'),
      inline: false,
    });
  }

  // Итоговый онлайн
  const totalPlayers = servers.reduce((sum, s) => sum + s.players, 0);
  embed.addFields({
    name:   '📈 Всего онлайн',
    value:  `**${totalPlayers.toLocaleString('ru-RU')}** игроков`,
    inline: false,
  });

  return embed;
}

/**
 * Находит или создаёт сообщение для онлайна.
 * Редактирует существующее или публикует новое.
 * @param {TextChannel} channel
 * @param {EmbedBuilder} embed
 */
async function updateOrCreateMessage(channel, embed) {
  const savedMessageId = storage.get(STORAGE_KEY_MESSAGE_ID);

  // Пытаемся отредактировать существующее сообщение
  if (savedMessageId) {
    try {
      const message = await channel.messages.fetch(savedMessageId);
      await message.edit({ embeds: [embed] });
      logger.debug('[MajesticOnline] Сообщение обновлено (edit)');
      return;
    } catch (err) {
      // Сообщение удалено или недоступно — создаём новое
      logger.warn(`[MajesticOnline] Сохранённое сообщение недоступно: ${err.message}`);
      storage.del(STORAGE_KEY_MESSAGE_ID);
    }
  }

  // Публикуем новое сообщение
  const message = await channel.send({ embeds: [embed] });
  storage.set(STORAGE_KEY_MESSAGE_ID, message.id);
  logger.success(`[MajesticOnline] Новое сообщение создано (ID: ${message.id})`);
}

/**
 * Основной цикл обновления данных.
 */
async function updateOnline() {
  const channelId = storage.get(STORAGE_KEY_CHANNEL_ID)
    || process.env.MAJESTIC_CHANNEL_ID;

  if (!channelId) {
    logger.warn('[MajesticOnline] Канал не настроен. Используйте /setup-online');
    return;
  }

  try {
    // Получаем канал Discord
    const channel = await discordClient.channels.fetch(channelId).catch(() => null);

    if (!channel) {
      logger.error(`[MajesticOnline] Канал ${channelId} не найден`);
      return;
    }

    // Получаем предыдущие данные из хранилища
    const prevData = storage.get(STORAGE_KEY_PREV_DATA, {});

    // Парсим актуальный онлайн
    let servers = [];
    let hasError = false;

    try {
      servers = await parser.getServersOnline();
    } catch (parseErr) {
      logger.error('[MajesticOnline] Ошибка парсинга:', parseErr.message);
      hasError = true;
    }

    // Строим Embed
    const embed = hasError
      ? new EmbedBuilder()
        .setTitle('🚀 Онлайн на Majestic RP')
        .setColor(0xff4444)
        .setDescription('❌ Ошибка получения данных. Повтор через минуту...')
        .setTimestamp()
      : buildEmbed(servers, prevData);

    // Обновляем или создаём сообщение
    await updateOrCreateMessage(channel, embed);

    // Сохраняем текущие данные как предыдущие
    if (!hasError && servers.length > 0) {
      const currentData = {};
      servers.forEach(s => { currentData[s.name] = s.players; });
      storage.set(STORAGE_KEY_PREV_DATA, currentData);
    }

  } catch (err) {
    logger.error('[MajesticOnline] Необработанная ошибка:', err.message);
  }
}

/**
 * Запускает сервис мониторинга онлайна.
 * @param {Client} client — Discord клиент
 */
async function start(client) {
  discordClient = client;
  logger.info(`[MajesticOnline] Запуск сервиса (интервал: ${UPDATE_INTERVAL / 1000}с)`);

  // Первое обновление сразу
  await updateOnline();

  // Очищаем старый таймер
  if (updateTimer) clearInterval(updateTimer);

  // Периодическое обновление
  updateTimer = setInterval(updateOnline, UPDATE_INTERVAL);
}

/**
 * Останавливает сервис.
 */
function stop() {
  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
    logger.info('[MajesticOnline] Сервис остановлен');
  }
}

/**
 * Принудительное обновление.
 */
async function forceUpdate() {
  logger.info('[MajesticOnline] Принудительное обновление...');
  await updateOnline();
}

/**
 * Устанавливает канал для публикации онлайна.
 * @param {string} channelId
 */
function setChannelId(channelId) {
  storage.set(STORAGE_KEY_CHANNEL_ID, channelId);
  // Сбрасываем ID сообщения, чтобы создать новое в новом канале
  storage.del(STORAGE_KEY_MESSAGE_ID);
}

module.exports = { start, stop, forceUpdate, setChannelId };
