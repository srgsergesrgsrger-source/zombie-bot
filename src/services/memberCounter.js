/**
 * memberCounter.js — сервис подсчёта участников Discord-сервера.
 *
 * Автоматически создаёт голосовой канал со статистикой
 * и обновляет его название каждые N минут.
 */

const { ChannelType, PermissionFlagsBits } = require('discord.js');
const storage = require('../utils/storage');
const logger  = require('../utils/logger');
const config  = require('../config/config.json');

// Ключи для хранилища
const STORAGE_KEY_CHANNEL_ID  = 'statsChannelId';
const STORAGE_KEY_CATEGORY_ID = 'statsCategoryId';

// Интервал обновления (по умолчанию 5 минут)
const UPDATE_INTERVAL = config.statsChannel.updateIntervalMs || 300_000;

// Таймер обновления (хранится для возможности сброса)
let updateTimer = null;

/**
 * Находит или создаёт категорию для канала статистики.
 * @param {Guild} guild
 * @returns {Promise<CategoryChannel|null>}
 */
async function getOrCreateCategory(guild) {
  const categoryName = config.statsChannel.categoryName || '📊 SERVER STATS 📊';

  // Ищем существующую категорию по имени
  const existing = guild.channels.cache.find(
    ch => ch.type === ChannelType.GuildCategory && ch.name === categoryName
  );

  if (existing) return existing;

  // Создаём новую категорию
  try {
    const category = await guild.channels.create({
      name: categoryName,
      type: ChannelType.GuildCategory,
    });
    logger.info(`[MemberCounter] Создана категория: ${categoryName}`);
    return category;
  } catch (err) {
    logger.warn(`[MemberCounter] Не удалось создать категорию: ${err.message}`);
    return null;
  }
}

/**
 * Форматирует название канала, подставляя количество участников.
 * @param {number} count
 * @returns {string}
 */
function formatChannelName(count) {
  const template = config.statsChannel.name || '📊 All Members: {count}';
  return template.replace('{count}', count.toLocaleString('ru-RU'));
}

/**
 * Получает актуальное количество участников сервера.
 * @param {Guild} guild
 * @returns {Promise<number>}
 */
async function getMemberCount(guild) {
  // Запрашиваем свежие данные с Discord API
  await guild.members.fetch();
  return guild.memberCount;
}

/**
 * Находит канал статистики в кэше Discord.
 * Проверяет сначала сохранённый ID, потом ищет по имени.
 * @param {Guild} guild
 * @returns {VoiceChannel|null}
 */
function findStatsChannel(guild) {
  const savedId = storage.get(STORAGE_KEY_CHANNEL_ID);

  if (savedId) {
    const channel = guild.channels.cache.get(savedId);
    if (channel) return channel;

    // ID устарел — сбрасываем
    logger.warn('[MemberCounter] Сохранённый ID канала статистики недействителен, сбрасываем...');
    storage.del(STORAGE_KEY_CHANNEL_ID);
  }

  return null;
}

/**
 * Создаёт голосовой канал статистики.
 * @param {Guild} guild
 * @returns {Promise<VoiceChannel>}
 */
async function createStatsChannel(guild) {
  const memberCount = await getMemberCount(guild);
  const category    = await getOrCreateCategory(guild);

  const channelOptions = {
    name: formatChannelName(memberCount),
    type: ChannelType.GuildVoice,
    // Запрещаем всем пользователям подключаться к каналу статистики
    permissionOverwrites: [
      {
        id:    guild.roles.everyone.id,
        deny:  [PermissionFlagsBits.Connect],
        allow: [PermissionFlagsBits.ViewChannel],
      },
    ],
  };

  // Добавляем в категорию, если она есть
  if (category) channelOptions.parent = category.id;

  const channel = await guild.channels.create(channelOptions);

  // Сохраняем ID канала
  storage.set(STORAGE_KEY_CHANNEL_ID, channel.id);
  logger.success(`[MemberCounter] Канал статистики создан: ${channel.name} (ID: ${channel.id})`);

  return channel;
}

/**
 * Обновляет название канала статистики.
 * @param {Guild} guild
 * @returns {Promise<void>}
 */
async function updateStatsChannel(guild) {
  try {
    let channel = findStatsChannel(guild);

    // Если канал не найден — создаём
    if (!channel) {
      logger.info('[MemberCounter] Канал статистики не найден, создаём...');
      channel = await createStatsChannel(guild);
      return;
    }

    const memberCount = await getMemberCount(guild);
    const newName     = formatChannelName(memberCount);

    // Не обновляем, если название не изменилось (экономим API-запросы)
    if (channel.name === newName) {
      logger.debug('[MemberCounter] Название канала не изменилось, пропускаем обновление');
      return;
    }

    await channel.setName(newName);
    logger.info(`[MemberCounter] Канал обновлён: ${newName}`);

  } catch (err) {
    logger.error('[MemberCounter] Ошибка обновления канала:', err.message);
  }
}

/**
 * Запускает сервис: первое обновление + периодический таймер.
 * @param {Guild} guild
 */
async function start(guild) {
  logger.info(`[MemberCounter] Запуск сервиса (интервал: ${UPDATE_INTERVAL / 1000}с)`);

  // Немедленное первое обновление
  await updateStatsChannel(guild);

  // Очищаем старый таймер, если есть
  if (updateTimer) clearInterval(updateTimer);

  // Запускаем периодическое обновление
  updateTimer = setInterval(() => updateStatsChannel(guild), UPDATE_INTERVAL);
}

/**
 * Останавливает таймер обновления.
 */
function stop() {
  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
    logger.info('[MemberCounter] Сервис остановлен');
  }
}

/**
 * Принудительное обновление.
 * @param {Guild} guild
 */
async function forceUpdate(guild) {
  logger.info('[MemberCounter] Принудительное обновление...');
  await updateStatsChannel(guild);
}

/**
 * Сохраняет ID канала статистики (используется при /setup-stats).
 * @param {string} channelId
 */
function setStatsChannelId(channelId) {
  storage.set(STORAGE_KEY_CHANNEL_ID, channelId);
}

module.exports = { start, stop, forceUpdate, createStatsChannel, setStatsChannelId };
