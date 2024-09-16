import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { ExtendedClient } from "../ExtendedClient";
import ytdl from "@distube/ytdl-core";
import { fetchPlaylistSongs } from "../utils/musicUtils";

const list = {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("Add a list of songs.")
    .addStringOption((option) =>
      option
        .setName("list-link")
        .setDescription("The link to the list")
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    console.log("ListCommand");
    const client = ExtendedClient.getInstance();

    try {
      const listLink = interaction.options.get("list-link", true);

      let url = listLink.value as string;

      if (!url) {
        await interaction.reply("Proporcione un link de lista valido");

        return;
      }

      if (ytdl.validateURL(url)) {
        if (!url.includes("list=")) {
          await interaction.reply("Proporcione un link de lista valido");

          return;
        }
      } else {
        await interaction.reply("Proporcione un link valido");
        return;
      }

      const playlistSongs = await fetchPlaylistSongs(url);

      for (const song of playlistSongs) {
        client.music.queue.addToQueue(song);
      }

      if (client.music.isPlaying) {
        await interaction.reply(
          `Se agregaron ${playlistSongs.length} canciones a la cola de reproducción.`
        );
      } else {
        // Embed para las canciones agregadas
        const addedSongsEmbed = new EmbedBuilder()
          .setDescription(
            `Se han agregado **${playlistSongs.length}** canciones a la lista de reproducción`
          )
          .setColor("#00FF00"); // Color personalizado

        await interaction.reply({ embeds: [addedSongsEmbed] });

        client.music.playSong(client, interaction);
      }

      return;
    } catch (error) {
      console.log("🚀 ~ execute ~ error:", error);
      await interaction.followUp("Hubo un error al intentar agregar la lista.");
    }
  },
};

export default list;
