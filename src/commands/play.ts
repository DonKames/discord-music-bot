import ytdl from "ytdl-core";
import { joinVoiceChannel } from "@discordjs/voice";

import { ExtendedClient } from "../ExtendedClient";
import { QueueSong } from "../utils/Music";
import { Command } from "../interfaces/Command";
import { playSong } from "../utils/musicUtils";

const play: Command = {
  name: "play",
  description: "Download and play a song from YouTube",
  execute: async (interaction) => {
    const client = interaction.client as ExtendedClient;

    const linkOption = interaction.options.get("link", true);
    // console.log('🚀 ~ playCommand ~ linkOption:', linkOption);

    // Asegura que el valor es un string
    const link = linkOption.value as string;
    console.log("🚀 ~ playCommand ~ link:", link);

    if (!link) {
      await interaction.reply("Es necesario un link para la reproducción.");

      return;
    }

    // Verifica que interaction.member y interaction.guild no sean nulos
    if (!interaction.member || !interaction.guild || !interaction.guildId) {
      console.error(
        "Error: interaction.member o interaction.guild o interaction.guildId es nulo."
      );
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);

    // Verifica que el miembro esté en un canal de voz
    if (!member.voice.channelId) {
      await interaction.reply(
        "Debes estar en un canal de voz para usar este comando."
      );
      return;
    }

    // Obtiene información del video para el título
    const videoInfo = await ytdl.getInfo(link);
    const videoTitle = videoInfo.videoDetails.title;

    const song: QueueSong = {
      title: videoTitle,
      url: link,
    };

    // Si ya hay música reproduciéndose, añade a la cola y notifica al usuario
    if (client.music.isPlaying) {
      client.music.queue.addToQueue(song);
      await interaction.reply(`Añadido a la cola: **${videoTitle}**`);
    } else {
      // Si no hay música reproduciéndose, comienza a reproducir y establece el estado a reproduciendo
      const connection = joinVoiceChannel({
        channelId: member.voice.channelId,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
      client.music.isPlaying = true;
      client.music.queue.addToQueue(song);
      playSong(
        client,
        interaction,
        connection,
        client.music.queue.getNextItem()!
      );
    }
  },
};

export default play;
