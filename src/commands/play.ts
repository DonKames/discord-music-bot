import "dotenv/config";
import ytdl from "ytdl-core";
import { joinVoiceChannel } from "@discordjs/voice";

import { ExtendedClient } from "../ExtendedClient";
import { QueueSong } from "../utils/Music";
import { Command } from "../interfaces/Command";
import { playSong } from "../utils/musicUtils";

const YOUTUBE_TOKEN = process.env.YOUTUBE_KEY;

async function searchYouTube(
  query: string
): Promise<{ videoId: string; videoTitle: string; videoUrl: string } | null> {
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_TOKEN}&part=snippet&q=${encodeURIComponent(
      query
    )}&type=video`;

    const response = await fetch(searchUrl);
    const searchData = await response.json();

    console.log("searchData:", searchData);

    const searchResults = searchData.items;

    if (!searchResults.length) {
      console.log("No se encontraron resultados para la búsqueda.");
      return null;
    }

    const videoId = searchResults[0].id.videoId;
    const videoTitle = searchResults[0].snippet.title;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return { videoId, videoTitle, videoUrl };
  } catch (error) {
    console.error("Error al buscar en YouTube:", error);
    return null;
  }
}

async function getVideoInfo() {}

const play: Command = {
  name: "play",
  description: "Download and play a song from YouTube",
  execute: async (interaction) => {
    const client = ExtendedClient.getInstance();

    const linkOption = interaction.options.get("link", true);
    const query = linkOption.value as string;

    if (!query) {
      await interaction.reply(
        "Es necesario un término de búsqueda o un enlace para la reproducción."
      );
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

    // Responder de forma diferida
    await interaction.deferReply();

    try {
      let videoInfo;
      let videoTitle;
      let link;

      if (ytdl.validateURL(query)) {
        // Obtiene información del video para el título
        videoInfo = await ytdl.getInfo(query);
        videoTitle = videoInfo.videoDetails.title;
        link = query;
      } else {
        videoInfo = await ytdl.getInfo(videoId);
      }

      const song: QueueSong = {
        title: videoTitle!,
        url: link!,
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

        await interaction.followUp(`Reproduciendo ahora: **${videoTitle}**`);
      }
    } catch (error) {
      console.error(
        "Error al obtener información del video o al reproducir la canción:",
        error
      );
      await interaction.followUp(
        "Hubo un error al intentar reproducir la canción."
      );
    }
  },
};

export default play;
