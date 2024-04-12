import { CommandInteraction } from "discord.js";

import { Command } from "../interfaces/Command";
import { ExtendedClient } from "../ExtendedClient";
import { QueueItem } from "../utils/MusicQueue";

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
  if (!nextSong) {
    return;
  }

  // playSong(nextSong.url);
}

export default next;
