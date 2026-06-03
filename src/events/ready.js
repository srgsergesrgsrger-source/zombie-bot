/**
 * ready.js — обработчик события "бот готов к работе".
 *
 * Запускается один раз при успешном подключении к Discord.
 * Инициализирует все сервисы.
 */

const { Events, ActivityType } = require('discord.js');
const memberCounter  = require('../services/memberCounter');
const majesticOnline = require('../services/majesticOnline');
const logger         = require('../utils/logger');

module.exports = {
  name: Events.ClientReady,
  once: true, // событие срабатывает только один раз

  /**
   * @param {Client} client
   */
  async execute(client) {
    logger.success(`✅ Бот запущен как: ${client.user.tag}`);
    logger.info(`📊 Серверов: ${client.guilds.cache.size}`);

    // Устанавливаем статус активности
    client.user.setPresence({
      activities: [{
        name: 'Majestic RP',
        type: ActivityType.Watching,
      }],
      status: 'online',
    });

    // Получаем основной сервер (GUILD_ID из .env)
    const guildId = process.env.GUILD_ID;

    if (!guildId) {
      logger.warn('⚠️ GUILD_ID не указан в .env — статистика участников недоступна');
    } else {
      const guild = client.guilds.cache.get(guildId);

      if (!guild) {
        logger.error(`❌ Сервер с ID ${guildId} не найден. Проверьте GUILD_ID в .env`);
      } else {
        logger.info(`🏠 Основной сервер: ${guild.name} (${guild.memberCount} участников)`);

        // Запускаем сервис статистики участников
        await memberCounter.start(guild).catch(err => {
          logger.error('[Ready] Ошибка запуска memberCounter:', err.message);
        });
      }
    }

    // Запускаем сервис онлайна Majestic RP
    await majesticOnline.start(client).catch(err => {
      logger.error('[Ready] Ошибка запуска majesticOnline:', err.message);
    });

    logger.success('🚀 Все сервисы запущены!');
  },
};
