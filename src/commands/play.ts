import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

import { ExtendedClient } from "../ExtendedClient";
import { QueueSong } from "../utils/Music";
import { fetchSongInfo } from "../utils/musicUtils";
import ytdl from "@distube/ytdl-core";
import { errorHandler } from "../utils/errorHandler";
import { searchResultMenuActionRow } from "../utils/interactionUtils";

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

      if (!query) {
        await interaction.reply(
          "Es necesario un término de búsqueda o un enlace para la reproducción."
        );

        return;
      }

      if (ytdl.validateURL(query)) {
        const songInfo = await fetchSongInfo(query);

        if (!songInfo) {
          await interaction.followUp(
            `Hubo un error al recuperar la información de la canción`
          );
          return;
        }

        const song: QueueSong = songInfo;

        if (music.isPlaying) {
          music.queue.addToQueue(song);
          await interaction.reply(`Añadido a la cola: **${song.title}**`);
        } else {
          music.queue.addToQueue(song);

          music.playSong(client, interaction);
        }
        return;
      } else {
        console.log("no es un URL valido, buscar termino");
        // replyOrFollowUpInteraction(interaction, "Se buscara un termino");
        searchResultMenuActionRow(interaction, query);
        return;
      }
    } catch (error) {
      console.error("Error al procesar el comando 'play':", error);
      errorHandler(error, interaction);
      return;
    }
  },
};

export default play;
