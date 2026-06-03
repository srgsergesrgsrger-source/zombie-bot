/**
 * setup-online.js — слэш-команда /setup-online
 *
 * Указывает канал, куда бот будет публиковать онлайн Majestic RP.
 * Только для администраторов.
 */

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const majesticOnline = require('../services/majesticOnline');
const logger         = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-online')
    .setDescription('Выбрать канал для публикации онлайна Majestic RP')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Текстовый канал для онлайна')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel('channel');

    try {
      // Сохраняем ID канала и сбрасываем старое сообщение
      majesticOnline.setChannelId(channel.id);

      logger.success(`[SetupOnline] Настроен канал: ${channel.name} (ID: ${channel.id})`);

      await interaction.editReply({
        content: `✅ Канал онлайна настроен: ${channel}\nПервое обновление придёт в течение минуты.`,
      });

      // Немедленно публикуем первое сообщение
      await majesticOnline.forceUpdate();

    } catch (err) {
      logger.error('[SetupOnline] Ошибка:', err.message);
      await interaction.editReply({
        content: `❌ Ошибка: ${err.message}`,
      });
    }
  },
};
