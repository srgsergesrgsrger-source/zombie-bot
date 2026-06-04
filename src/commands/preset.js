/**
 * preset.js — слэш-команда /preset
 *
 * Отправляет embed с ссылками на обзор и скачивание пресета.
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Добавляй сюда свои пресеты
const presets = {
  "609 bh gray redux": {
    review: "https://youtu.be/g6B6FbFEaxA",
    dl: "https://drive.google.com/drive/folders/ВАШ_ПУТЬ",
    image: "https://i.imgur.com/example.png"  // необязательно, можно убрать
  },
  "другой пресет": {
    review: "https://youtu.be/ССЫЛКА",
    dl: "https://drive.google.com/...",
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('preset')
    .setDescription('Получить ссылки на пресет')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Название пресета')
        .setRequired(true)
        .addChoices(
          ...Object.keys(presets).map(name => ({ name, value: name }))
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const name = interaction.options.getString('name');
    const p = presets[name];

    if (!p) {
      return interaction.editReply({ content: '❌ Пресет не найден!' });
    }

    const embed = new EmbedBuilder()
      .setTitle(name)
      .setColor('#5865F2')
      .addFields({
        name: 'Ссылки',
        value: `review – [смотреть](${p.review})\ndl – [скачать](${p.dl})`
      });

    if (p.image) embed.setImage(p.image);

    await interaction.editReply({ embeds: [embed] });
  },
};
