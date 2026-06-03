/**
 * guildMemberUpdate.js — обработчики входа/выхода участников.
 *
 * При изменении числа участников обновляем канал статистики
 * (только если прошло достаточно времени с последнего обновления,
 * чтобы не превышать лимиты Discord API на переименование каналов).
 */

const { Events } = require('discord.js');
const memberCounter = require('../services/memberCounter');
const logger        = require('../utils/logger');

// Discord разрешает переименовывать каналы не чаще 2 раз в 10 минут.
// Устанавливаем задержку 5 минут для безопасности.
const DEBOUNCE_MS = 300_000;
let debounceTimer = null;

/**
 * Обновляет канал с задержкой (debounce), чтобы не спамить API.
 * @param {Guild} guild
 */
function debouncedUpdate(guild) {
  if (debounceTimer) return; // уже ожидает обновление

  debounceTimer = setTimeout(async () => {
    debounceTimer = null;
    await memberCounter.forceUpdate(guild).catch(err => {
      logger.error('[GuildMember] Ошибка обновления:', err.message);
    });
  }, DEBOUNCE_MS);
}

// Экспортируем два обработчика для входа и выхода участников

module.exports = [
  {
    name: Events.GuildMemberAdd,
    execute(member) {
      logger.debug(`[GuildMember] Вошёл: ${member.user.tag}`);
      debouncedUpdate(member.guild);
    },
  },
  {
    name: Events.GuildMemberRemove,
    execute(member) {
      logger.debug(`[GuildMember] Вышел: ${member.user.tag}`);
      debouncedUpdate(member.guild);
    },
  },
];
