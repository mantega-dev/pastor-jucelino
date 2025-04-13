import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import schedule from 'node-schedule';
import fetch from 'node-fetch';

config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

// Carregar comandos
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.default.data.name, command.default);
  commands.push(command.default.data.toJSON());
}

// Registrar comandos
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
  try {
    console.log('🔁 Registrando comandos...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Comandos registrados.');
  } catch (error) {
    console.error(error);
  }
})();

// Eventos
client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);

  // Agendar envio diário às 8h
  schedule.scheduleJob('0 8 * * *', async () => {
    const verse = await getRandomVerse();
    const guilds = client.guilds.cache;

    for (const guild of guilds.values()) {
      const channel = guild.client.channels.fetch(process.env.CLIENT_ID);
      channel.send(`📖 Versículo do dia:\n> ${verse}`);
    }
  });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '❌ Ocorreu um erro ao executar o comando.', ephemeral: true });
  }
});

async function getRandomVerse() {
  const res = await fetch('https://labs.bible.org/api/?passage=random&type=json');
  const data = await res.json();
  if (!data || !data[0]) return 'Erro ao buscar versículo.';
  const verse = data[0];
  return `${verse.bookname} ${verse.chapter}:${verse.verse} - "${verse.text}"`;
}

client.login(process.env.TOKEN);
