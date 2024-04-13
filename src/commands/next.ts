import { CommandInteraction } from "discord.js";

import { Command } from "../interfaces/Command";
import { ExtendedClient } from "../ExtendedClient";
import { QueueItem } from "../utils/MusicQueue";
import { playSong } from "../utils/musicUtils";
import { getVoiceConnection } from "@discordjs/voice";

const next: Command = {
  name: "next",
  description: "Skip to the next song in the queue",
  execute: async (interaction: CommandInteraction) => {
    const client = interaction.client as ExtendedClient;

    if (!client.musicQueue || client.musicQueue.queue.length === 0) {
      await interaction.reply("No hay canciones en la cola de reproducción.");

      return;
    }

    const nextSong = client.musicQueue.getNextItem();

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
  nextSong: QueueItem
) {
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
}

export default next;
