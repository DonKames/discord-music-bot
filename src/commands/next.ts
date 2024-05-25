import { CommandInteraction } from "discord.js";

import { Command } from "../interfaces/Command";
import { ExtendedClient } from "../ExtendedClient";
import { QueueSong } from "../utils/Music";
import { playSong } from "../utils/musicUtils";
import { getVoiceConnection } from "@discordjs/voice";
import { errorHandler } from "../utils/errorHandler";

const next: Command = {
  name: "next",
  description: "Skip to the next song in the queue",
  execute: async (interaction: CommandInteraction) => {
    const client = interaction.client as ExtendedClient;

    if (!client.music || client.music.queue.songs.length === 0) {
      await interaction.reply("No hay canciones en la cola de reproducción.");

      return;
    }

    const nextSong = client.music.queue.getNextItem();

    if (!nextSong) {
      await interaction.reply(
        "No hay mas canciones en la cola de reproducción."
      );

      return;
    }
    playNextSong(client, interaction, nextSong);

    await interaction.reply(`Siguiente canción: ${nextSong.title}`);
  },
};

async function playNextSong(
  client: ExtendedClient,
  interaction: CommandInteraction,
  nextSong: QueueSong
) {
  try {
    const member = await interaction.guild?.members.fetch(interaction.user.id);

    if (!member || !member.voice.channelId) {
      await interaction.reply(
        "Debes estar en un canal de voz para usar este comando."
      );
      return;
    }

    // const connection = client.voice?.adapters.get(interaction.guildId!);

    const connection = getVoiceConnection(interaction.guildId!);
    if (!connection) {
      await interaction.reply("No estoy conectado a un canal de voz.");
      return;
    }

    // Aquí puedes detener la canción actual si es necesario
    // Por ejemplo: connection?.destroy();

    // Reproduce la siguiente canción en la cola
    playSong(client, interaction, connection, nextSong);
  } catch (error) {
    console.log("🚀 ~ next.ts error:", error);

    errorHandler(error, interaction);
  }
}

export default next;
