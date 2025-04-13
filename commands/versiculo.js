import { SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';

export default {
  data: new SlashCommandBuilder()
    .setName('versiculo')
    .setDescription('Envia um versículo aleatório da Bíblia para você ou outro usuário.')
    .addUserOption(option =>
      option.setName('usuário')
        .setDescription('Usuário que vai receber o versículo (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const sender = interaction.user;
    const targetUser = interaction.options.getUser('usuário') || sender;

    try {
      const randomChapter = Math.floor(Math.random() * 21) + 1;
      const url = `https://bible-api.com/joao+${randomChapter}?translation=almeida`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data || !data.verses || data.verses.length === 0) {
        return interaction.editReply('❌ Não foi possível obter um versículo agora.');
      }

      const verse = data.verses[Math.floor(Math.random() * data.verses.length)];

      const message = `📩 ${sender} te mandou um versículo! Toque para ver...\n\n` +
        `||📖 **${verse.book_name} ${verse.chapter}:${verse.verse}** — "${verse.text.trim()}"||`;

      // Envia a mensagem por DM
      const userDM = await targetUser.createDM();
      await userDM.send(message);

      // Feedback para quem usou o comando
      if (targetUser.id === sender.id) {
        await interaction.editReply('✅ Versículo enviado no seu privado.');
      } else {
        await interaction.editReply(`✅ Versículo enviado no privado de ${targetUser.tag}.`);
      }

    } catch (err) {
      console.error('Erro ao buscar ou enviar o versículo:', err);
      await interaction.editReply('❌ Ocorreu um erro ao enviar o versículo.');
    }
  }
};
