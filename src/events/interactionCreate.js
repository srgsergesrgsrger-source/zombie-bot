/**
 * interactionCreate.js — обработчик всех взаимодействий с ботом.
 *
 * Обрабатывает слэш-команды, передавая управление соответствующему
 * файлу команды из коллекции client.commands.
 */

const { Events } = require('discord.js');
const logger     = require('../utils/logger');

module.exports = {
  name: Events.InteractionCreate,

  /**
   * @param {Interaction} interaction
   */
  async execute(interaction) {
    // Обрабатываем только слэш-команды
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`[Interactions] Неизвестная команда: /${interaction.commandName}`);
      await interaction.reply({
        content: '❌ Эта команда не найдена.',
        ephemeral: true,
      });
      return;
    }

    try {
      logger.info(`[Interactions] /${interaction.commandName} — ${interaction.user.tag}`);
      await command.execute(interaction);

    } catch (err) {
      logger.error(`[Interactions] Ошибка /${interaction.commandName}:`, err.message);

      const errorMessage = { content: '❌ Произошла ошибка при выполнении команды.', ephemeral: true };

      // Отвечаем на взаимодействие, учитывая его состояние
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage).catch(() => {});
      } else {
        await interaction.reply(errorMessage).catch(() => {});
      }
    }
  },
};
