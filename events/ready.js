import schedule from 'node-schedule';
import fetch from 'node-fetch';
import { DateTime } from 'luxon';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Bot online como ${client.user.tag}`);

    // Calcular o próximo horário de 08:00 no fuso de Pernambuco
    scheduleNextVerse(client);
  }
};

async function scheduleNextVerse(client) {
  const now = DateTime.now().setZone('America/Recife');
  let next8am = now.set({ hour: 8, minute: 0, second: 0, millisecond: 0 });

  if (now > next8am) {
    next8am = next8am.plus({ days: 1 });
  }

  const delay = next8am.toMillis() - now.toMillis();
  console.log(`⏰ Agendando envio para: ${next8am.toFormat('dd/MM/yyyy HH:mm:ss')}`);

  setTimeout(async () => {
    await sendVerse(client);
    scheduleNextVerse(client); // Reagenda para o próximo dia
  }, delay);
}

async function sendVerse(client) {
  const channelId = process.env.CHANNEL_ID;
  const channel = await client.channels.fetch(channelId).catch(() => null);

  if (!channel || !channel.isTextBased()) {
    console.error('❌ Canal inválido ou não encontrado.');
    return;
  }

  const verse = await getRandomVerse();
  await channel.send(`📖 Versículo do dia:\n> ${verse}`);
}

async function getRandomVerse() {
  try {
    const res = await fetch('https://labs.bible.org/api/?passage=random&type=json');
    const data = await res.json();
    if (!data || !data[0]) return 'Erro ao buscar versículo.';
    const verse = data[0];
    return `${verse.bookname} ${verse.chapter}:${verse.verse} - "${verse.text}"`;
  } catch (err) {
    console.error('Erro ao buscar versículo:', err);
    return 'Erro ao buscar versículo.';
  }
}
