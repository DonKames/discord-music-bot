import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";

import { ExtendedClient } from "../ExtendedClient";
import { QueueSong } from "../utils/Music";
import { playSong } from "../utils/musicUtils";
import { errorHandler } from "../utils/errorHandler";

const next = {
  data: new SlashCommandBuilder()
    .setName("next")
    .setDescription("Skips the current song"),
  async execute(interaction: CommandInteraction) {
    const client = ExtendedClient.getInstance();

    if (!client.music || client.music.queue.songs.length === 0) {
      await interaction.reply("No hay canciones en la cola de reproducción.");

      return;
    }

    playNextSong(client, interaction);

    // await interaction.reply(`Siguiente canción: ${nextSong.title}`);
  },
};

async function playNextSong(
  client: ExtendedClient,
  interaction: CommandInteraction
) {
  try {
    const member = await interaction.guild?.members.fetch(interaction.user.id);

    if (!member || !member.voice.channelId) {
      await interaction.reply(
        "Debes estar en un canal de voz para usar este comando."
      );
      return;
    }

    // Aquí puedes detener la canción actual si es necesario
    // Por ejemplo: connection?.destroy();

    // Reproduce la siguiente canción en la cola
    playSong(client, interaction);
  } catch (error) {
    console.log("🚀 ~ next.ts error:", error);

    errorHandler(error, interaction);
  }
}

export default next;
