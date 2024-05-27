import { joinVoiceChannel } from "@discordjs/voice";
import {
  ActionRowBuilder,
  CommandInteraction,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from "discord.js";

import { ExtendedClient } from "../ExtendedClient";
import { QueueSong } from "../utils/Music";
import { playSong } from "../utils/musicUtils";
import { searchYouTube } from "../utils/youtubeUtils";
import { validateInteractionGuildAndMember } from "../utils/interactionUtils";
import ytdl from "ytdl-core";

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
      const linkOption = interaction.options.get("link", true);
      console.log("🚀 ~ playCommand ~ linkOption:", linkOption);

      // Asegura que el valor es un string
      let query = linkOption.value as string;
      console.log("🚀 ~ playCommand ~ link:", query);

      if (!query) {
        await interaction.reply(
          "Es necesario un término de búsqueda o un enlace para la reproducción."
        );

        return;
      }

      // Valida si el miembro está en un canal de voz y si interaction.member, interaction.guild y interaction.guildId no son nulos
      const member = await validateInteractionGuildAndMember(interaction);
      if (member === false) {
        return;
      }

      // Responder de forma diferida
      await interaction.deferReply();

      // let videoInfo, videoTitle, videoUrl;

      // Verificar si es un termino de búsqueda o un link
      if (!ytdl.validateURL(query)) {
        // En caso de que sea un termino de búsqueda.
        const searchResults = await searchYouTube(query);

        if (!searchResults) {
          await interaction.followUp(
            "No se encontraron resultados para la búsqueda."
          );
          return;
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("searchSelect")
          .setPlaceholder("Selecciona una opción")
          .addOptions(
            searchResults.map((video) => ({
              label: video.videoTitle,
              value: video.videoUrl,
            }))
          );

        const actionRow =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            selectMenu
          );

        const searchSongResponse = await interaction.followUp({
          content:
            "Se encontraron varios resultados. Elige uno para reproducir:",
          components: [actionRow],
        });

        const collectorFilter = (i: any) => i.user.id === interaction.user.id;

        try {
          const songSelected = (await searchSongResponse.awaitMessageComponent({
            filter: collectorFilter,
            time: 20_000,
          })) as StringSelectMenuInteraction;

          query = songSelected.values[0];
        } catch (error) {
          console.log("🚀 ~ execute ~ error:", error);

          await interaction.editReply({
            content: "Canción no seleccionada.",
            components: [],
          });
        }
      }

      const videoInfo = await ytdl.getInfo(query);
      const videoTitle = videoInfo.videoDetails.title;
      const videoUrl = query;

      if (!videoInfo || !videoTitle || !videoUrl) {
        await interaction.followUp(
          "No se pudo obtener la información del video."
        );
        return;
      }

      const song: QueueSong = {
        title: videoTitle,
        url: videoUrl,
      };

      // Si ya hay música reproduciéndose, añade a la cola y notifica al usuario
      if (client.music.isPlaying) {
        client.music.queue.addToQueue(song);
        await interaction.followUp(`Añadido a la cola: **${videoTitle}**`);
      } else {
        // Si no hay música reproduciéndose, comienza a reproducir y establece el estado a reproduciendo
        const connection = joinVoiceChannel({
          channelId: member.voice.channelId,
          guildId: interaction.guildId!,
          adapterCreator: interaction.guild!.voiceAdapterCreator,
        });

        client.music.isPlaying = true;
        client.music.queue.addToQueue(song);
        playSong(
          client,
          interaction,
          connection,
          client.music.queue.getNextItem()!
        );

        // await interaction.followUp(`Reproduciendo ahora: **${videoTitle}**`);
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
