import { CommandInteraction, SlashCommandBuilder } from "discord.js";

import { ExtendedClient } from "../ExtendedClient";
import { QueueSong } from "../utils/Music";
import {
  fetchPlaylistSongs,
  fetchSongInfo,
  playSong,
} from "../utils/musicUtils";
import ytdl from "@distube/ytdl-core";

const play = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Download and play a song from YouTube.")
    .addStringOption((option) =>
      option
        .setName("link")
        .setDescription("The YouTube link or search query")
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    console.log("PlayCommand");
    const client = ExtendedClient.getInstance();

    try {
      // Para todos los flujos
      const linkOption = interaction.options.get("link", true);
      // console.log("🚀 ~ playCommand ~ linkOption:", linkOption);

      // Asegura que el valor es un string
      let query = linkOption.value as string;
      // console.log("🚀 ~ playCommand ~ link:", query);

      if (!query) {
        await interaction.reply(
          "Es necesario un término de búsqueda o un enlace para la reproducción."
        );

        return;
      }

      // Responder de forma diferida
      await interaction.deferReply();

      // let videoInfo, videoTitle, videoUrl;

      let songInfo;

      console.log(query);

      if (ytdl.validateURL(query)) {
        if (!query.includes("list=")) {
          songInfo = await fetchSongInfo(query, interaction);
          console.log("🚀 ~ execute ~ songInfo:", songInfo);

          console.log("no incluye lista");
          if (!songInfo) {
            await interaction.followUp(
              `Hubo un error al recuperar la información de la canción`
            );
            return;
          }

          const song: QueueSong = songInfo;

          if (client.music.isPlaying) {
            client.music.queue.addToQueue(song);
            await interaction.followUp(`Añadido a la cola: **${song.title}**`);
          } else {
            client.music.queue.addToQueue(song);

            playSong(client, interaction);
          }
          return;
        } else {
          console.log("incluye lista");

          const playlistSongs = await fetchPlaylistSongs(query);

          console.log("🚀 ~ execute ~ playlistSongs:", playlistSongs);

          for (const song of playlistSongs) {
            client.music.queue.addToQueue(song);
          }

          playSong(client, interaction);

          return;
        }
      } else {
        console.log("no es un URL valido, buscar termino");
        return;
      }
    } catch (error) {
      console.error("Error al procesar el comando 'play':", error);
      await interaction.followUp(
        "Hubo un error al intentar reproducir la canción."
      );
    }
  },
};

export default play;
