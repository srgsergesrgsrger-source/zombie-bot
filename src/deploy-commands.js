/**
 * deploy-commands.js — скрипт регистрации слэш-команд в Discord.
 *
 * Запускать один раз после изменения команд:
 *   node src/deploy-commands.js
 *
 * Команды регистрируются только для вашего сервера (GUILD_ID)
 * для мгновенного обновления. Для глобальной регистрации —
 * раскомментируйте глобальный вариант ниже.
 */

require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs     = require('fs');
const path   = require('path');
const logger = require('./utils/logger');

const COMMANDS_DIR = path.join(__dirname, 'commands');

// Собираем все команды из папки commands/
const commandFiles = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.js'));
const commands     = commandFiles.map(file => {
  const command = require(path.join(COMMANDS_DIR, file));
  return command.data.toJSON();
});

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    logger.info(`Регистрация ${commands.length} слэш-команд...`);

    // === Вариант 1: Регистрация для конкретного сервера (мгновенно) ===
    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID || 'YOUR_CLIENT_ID',
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    // === Вариант 2: Глобальная регистрация (до 1 часа задержки) ===
    // const data = await rest.put(
    //   Routes.applicationCommands(process.env.CLIENT_ID),
    //   { body: commands }
    // );

    logger.success(`✅ Зарегистрировано ${data.length} команд:`);
    commands.forEach(cmd => logger.info(`  /${cmd.name} — ${cmd.description}`));

  } catch (err) {
    logger.error('Ошибка регистрации команд:', err.message);
    process.exit(1);
  }
})();
