import { joinVoiceChannel } from "@discordjs/voice";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";

import { ExtendedClient } from "../ExtendedClient";
import { QueueSong } from "../utils/Music";
import { playSong } from "../utils/musicUtils";
import { getVideoInfo } from "../utils/youtubeUtils";

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
      const query = linkOption.value as string;
      console.log("🚀 ~ playCommand ~ link:", query);

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

        await interaction.reply(
          "Ha ocurrido un error al intentar reproducir la canción."
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

      // Obtiene información del video para el título
      const videoInfo = await getVideoInfo(query);

      if (!videoInfo) {
        await interaction.followUp(
          "No se pudo obtener la información del video."
        );
        return;
      }

      const { videoTitle, videoUrl } = videoInfo;

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
      console.error("Error al procesar el comando 'play':", error);
      await interaction.followUp(
        "Hubo un error al intentar reproducir la canción."
      );
    }
  },
};

export default play;
