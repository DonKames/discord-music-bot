import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

import { ExtendedClient } from "../ExtendedClient";
import { QueueSong } from "../utils/Music";
import { fetchPlaylistSongs, fetchSongInfo } from "../utils/musicUtils";
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
    const music = client.music;

    try {
      const linkOption = interaction.options.get("link", true);
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

      let songInfo;

      if (ytdl.validateURL(query)) {
        songInfo = await fetchSongInfo(query, interaction);
        console.log("🚀 ~ execute ~ songInfo:", songInfo);

        if (!songInfo) {
          await interaction.followUp(
            `Hubo un error al recuperar la información de la canción`
          );
          return;
        }

        const song: QueueSong = songInfo;

        console.log("isPlaying", client.music.isPlaying);

        if (music.isPlaying) {
          music.queue.addToQueue(song);
          await interaction.followUp(`Añadido a la cola: **${song.title}**`);
        } else {
          music.queue.addToQueue(song);

          music.playSong(client, interaction);
          console.log("isPlaying 2", client.music.isPlaying);

          await interaction.followUp(`Reproduciendo ahora: **${song.url}**`);
        }
        return;
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
