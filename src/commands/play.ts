import { joinVoiceChannel } from "@discordjs/voice";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";

import { ExtendedClient } from "../ExtendedClient";
import { QueueSong } from "../utils/Music";
import {
  fetchPlaylistSongs,
  fetchSongInfo,
  playSong,
} from "../utils/musicUtils";
import { validateInteractionGuildAndMember } from "../utils/interactionUtils";
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

      // Valida si el miembro está en un canal de voz y si interaction.member, interaction.guild y interaction.guildId no son nulos
      const member = await validateInteractionGuildAndMember(interaction);
      if (member === false) {
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
          }
          return;
        } else {
          console.log("incluye lista");

          const playlistSongs = await fetchPlaylistSongs(query);

          console.log("🚀 ~ execute ~ playlistSongs:", playlistSongs);

          for (const song of playlistSongs) {
            client.music.queue.addToQueue(song);
          }

          return;
        }
      } else {
        console.log("no es un URL valido, buscar termino");
        return;
      }

      // !Working
      // // Verificar si es un termino de búsqueda o un link
      // if (!ytdl.validateURL(query)) {
      //   // En caso de que sea un termino de búsqueda.
      //   const searchSongResponse = await searchResultMenuActionRow(
      //     interaction,
      //     query
      //   );

      //   if (!searchSongResponse) {
      //     return;
      //   }

      //   const collectorFilter = (i: any) => i.user.id === interaction.user.id;

      //   try {
      //     const songSelected = (await searchSongResponse.awaitMessageComponent({
      //       filter: collectorFilter,
      //       time: 20_000,
      //     })) as StringSelectMenuInteraction;

      //     console.log("🚀 ~ execute ~ songSelected:", songSelected);

      //     // Almacena la selección del usuario, devolviendo el link de youtube.
      //     query = songSelected.values[0];

      //     songInfo = await fetchSongInfo(query, interaction);
      //     console.log("🚀 ~ execute ~ songInfo:", songInfo);

      //     songSelected.reply({
      //       content: `Canción seleccionada: ${query}`,
      //       components: [],
      //     });

      //     console.log("🚀 ~ execute ~ query:", query);
      //   } catch (error) {
      //     console.log("🚀 ~ execute ~ error:", error);

      //     await interaction.editReply({
      //       content: "Canción no seleccionada.",
      //       components: [],
      //     });
      //   }
      // }

      // // TODO: Check the correct flow on normal link and playlist link
      // // Verificar si el enlace es una lista de reproducción
      // if (ytdl.validateURL(query) && query.includes("list=")) {
      //   const playlistSongs = await fetchPlaylistSongs(query);

      //   if (playlistSongs.length === 0) {
      //     await interaction.followUp(
      //       "No se encontraron canciones en la lista de reproducción."
      //     );

      //     return;
      //   }

      //   for (const song of playlistSongs) {
      //     client.music.queue.addToQueue(song);
      //   }

      //   await interaction.followUp(
      //     `Añadido a la cola ${playlistSongs.length} canciones de una lista de reproducción`
      //   );
      // }

      // const playlistId = extractPlaylistId(query);
      // console.log("🚀 ~ execute ~ query:", query);
      // console.log("🚀 ~ execute ~ list:", playlistId);

      // songInfo = await fetchSongInfo(query, interaction);

      // if (!songInfo) {
      //   await interaction.followUp(`No hay songInfo`);

      //   return;
      // }

      // const song: QueueSong = songInfo;

      // // Si ya hay música reproduciéndose, añade a la cola y notifica al usuario
      // if (client.music.isPlaying) {
      //   client.music.queue.addToQueue(song);
      //   await interaction.followUp(`Añadido a la cola: **${song.title}**`);
      // } else {
      //   // Si no hay música reproduciéndose, comienza a reproducir y establece el estado a reproduciendo
      //   const connection = joinVoiceChannel({
      //     channelId: member.voice.channelId,
      //     guildId: interaction.guildId!,
      //     adapterCreator: interaction.guild!.voiceAdapterCreator,
      //   });

      //   client.music.isPlaying = true;
      //   client.music.queue.addToQueue(song);

      //   playSong(
      //     client,
      //     interaction,
      //     connection,
      //     client.music.queue.getNextItem()!
      //   );
      // }
    } catch (error) {
      console.error("Error al procesar el comando 'play':", error);
      await interaction.followUp(
        "Hubo un error al intentar reproducir la canción."
      );
    }
  },
};

export default play;
