/**
 * setup-stats.js — слэш-команда /setup-stats
 *
 * Создаёт голосовой канал статистики участников или указывает боту
 * использовать существующий. Только для администраторов.
 */

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const memberCounter = require('../services/memberCounter');
const storage       = require('../utils/storage');
const logger        = require('../utils/logger');

module.exports = {
  // Описание команды для регистрации в Discord
  data: new SlashCommandBuilder()
    .setName('setup-stats')
    .setDescription('Создать канал статистики участников сервера')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Выбрать существующий канал (необязательно — если не выбрать, канал создастся автоматически)')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(false)
    ),

  /**
   * Обработчик выполнения команды.
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    // Откладываем ответ — операция может занять время
    await interaction.deferReply({ ephemeral: true });

    const guild           = interaction.guild;
    const existingChannel = interaction.options.getChannel('channel');

    try {
      if (existingChannel) {
        // Используем указанный канал
        memberCounter.setStatsChannelId(existingChannel.id);
        await memberCounter.forceUpdate(guild);

        logger.success(`[SetupStats] Настроен существующий канал: ${existingChannel.name}`);
        await interaction.editReply({
          content: `✅ Канал статистики настроен: ${existingChannel}`,
        });
      } else {
        // Создаём новый канал
        const channel = await memberCounter.createStatsChannel(guild);

        logger.success(`[SetupStats] Создан новый канал: ${channel.name}`);
        await interaction.editReply({
          content: `✅ Канал статистики создан: <#${channel.id}>\nОн будет обновляться автоматически каждые 5 минут.`,
        });
      }
    } catch (err) {
      logger.error('[SetupStats] Ошибка:', err.message);
      await interaction.editReply({
        content: `❌ Ошибка: ${err.message}`,
      });
    }
  },
};
