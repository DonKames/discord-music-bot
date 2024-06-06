import { joinVoiceChannel } from "@discordjs/voice";
import {
  CommandInteraction,
  SlashCommandBuilder,
  StringSelectMenuInteraction,
} from "discord.js";

import { ExtendedClient } from "../ExtendedClient";
import { QueueSong } from "../utils/Music";
import { fetchSongInfo, playSong } from "../utils/musicUtils";
import {
  searchResultMenuActionRow,
  validateInteractionGuildAndMember,
} from "../utils/interactionUtils";
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
        const searchSongResponse = await searchResultMenuActionRow(
          interaction,
          query
        );

        if (!searchSongResponse) {
          return;
        }

        const collectorFilter = (i: any) => i.user.id === interaction.user.id;

        try {
          const songSelected = (await searchSongResponse.awaitMessageComponent({
            filter: collectorFilter,
            time: 20_000,
          })) as StringSelectMenuInteraction;

          // Almacena la selección del usuario, devolviendo el link de youtube.
          query = songSelected.values[0];
        } catch (error) {
          console.log("🚀 ~ execute ~ error:", error);

          await interaction.editReply({
            content: "Canción no seleccionada.",
            components: [],
          });
        }
      }

      const songInfo = await fetchSongInfo(query, interaction);

      if (!songInfo) {
        return;
      }

      const song: QueueSong = songInfo;

      // Si ya hay música reproduciéndose, añade a la cola y notifica al usuario
      if (client.music.isPlaying) {
        client.music.queue.addToQueue(song);
        await interaction.followUp(`Añadido a la cola: **${song.title}**`);
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
