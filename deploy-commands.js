import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const commands = [];
const commandsPath = './commands';
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = (await import(`./commands/${file}`)).default;

  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[⚠️] O comando ${file} está faltando "data" ou "execute".`);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// Substitua isso com o ID do seu servidor (Guild)
const GUILD_ID = process.env.GUILD_ID;

(async () => {
  try {
    console.log(`🚮 Limpando comandos antigos da guilda ${GUILD_ID}...`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
      { body: [] }
    );

    console.log(`✅ Comandos antigos removidos.`);

    console.log(`📦 Registrando ${commands.length} novo(s) comando(s)...`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log('✅ Comandos registrados com sucesso (Guild).');

  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
})();
