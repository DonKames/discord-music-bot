import { joinVoiceChannel } from "@discordjs/voice";

import { QueueSong } from "../utils/Music";
import { playSong } from "../utils/musicUtils";
import { getVideoInfo } from "../utils/youtubeUtils";
import {
  CommandInteraction,
  Interaction,
  MessageComponentInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { ExtendedClient } from "../ExtendedClient";

// Comando Principal
const play = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Download and play a song from youtube")
    .addStringOption((option) =>
      option
        .setName("link")
        .setDescription("The YouTube link or search query")
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    const client = ExtendedClient.getInstance();

    const linkOption = interaction.options.get("link", true);
    const query = linkOption.value as string;

    if (!query) {
      await interaction.reply(
        "Es necesario un término de búsqueda o un enlace para la reproducción."
      );
      return;
    }

    // Responder de forma diferida
    await interaction.deferReply();

    try {
      const videoInfo = await getVideoInfo(query);

      if (!videoInfo) {
        await interaction.followUp(
          "No se pudo obtener la información del video."
        );
        return;
      }

      if (Array.isArray(videoInfo)) {
        const options = videoInfo.map((result, index) => ({
          label: `${index + 1}. ${result.videoTitle}`,
          value: result.videoUrl,
          description: `Opción ${index + 1}`,
        }));

        await interaction.followUp({
          content: "Selecciona el video que deseas reproducir:",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 3,
                  customId: "select_menu",
                  options,
                },
              ],
            },
          ],
        });

        const filter = (i: MessageComponentInteraction) =>
          i.isStringSelectMenu() &&
          i.customId === "select_menu" &&
          i.user.id === interaction.user.id;

        const collector = interaction.channel!.createMessageComponentCollector({
          filter,
          time: 30000,
          max: 1,
        });

        collector.on("end", async (collected, reason) => {
          if (reason === "time") {
            await interaction.followUp(
              "No se seleccionó ninguna opción a tiempo."
            );
          }
        });

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
        await interaction.reply(`Añadido a la cola: **${videoTitle}**`);
      } else {
        // Verifica que interaction.member y interaction.guild no sean nulos
        if (!interaction.member || !interaction.guild || !interaction.guildId) {
          console.error(
            "Error: interaction.member o interaction.guild o interaction.guildId es nulo."
          );
          return;
        }

        const member = await interaction.guild.members.fetch(
          interaction.user.id
        );

        // Verifica que el miembro esté en un canal de voz
        if (!member.voice.channelId) {
          await interaction.reply(
            "Debes estar en un canal de voz para usar este comando."
          );
          return;
        }
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
