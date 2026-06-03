/**
 * force-update.js — слэш-команда /force-update
 *
 * Принудительно обновляет статистику сервера и онлайн Majestic RP.
 * Только для администраторов.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const memberCounter  = require('../services/memberCounter');
const majesticOnline = require('../services/majesticOnline');
const logger         = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('force-update')
    .setDescription('Принудительно обновить статистику и онлайн Majestic RP')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    logger.info(`[ForceUpdate] Запущено пользователем: ${interaction.user.tag}`);

    const results = [];

    // Обновляем статистику участников
    try {
      await memberCounter.forceUpdate(interaction.guild);
      results.push('✅ Статистика участников обновлена');
    } catch (err) {
      logger.error('[ForceUpdate] Ошибка статистики:', err.message);
      results.push(`❌ Статистика участников: ${err.message}`);
    }

    // Обновляем онлайн Majestic RP
    try {
      await majesticOnline.forceUpdate();
      results.push('✅ Онлайн Majestic RP обновлён');
    } catch (err) {
      logger.error('[ForceUpdate] Ошибка онлайна:', err.message);
      results.push(`❌ Онлайн Majestic RP: ${err.message}`);
    }

    await interaction.editReply({
      content: `**Результаты обновления:**\n${results.join('\n')}`,
    });
  },
};
