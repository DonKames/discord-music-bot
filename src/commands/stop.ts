import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { ExtendedClient } from "../ExtendedClient";
import { getVoiceConnection } from "@discordjs/voice";

const stop = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Detiene la reproducción y detiene y expulsa al bot"),
  async execute(interaction: CommandInteraction) {
    const client = ExtendedClient.getInstance();

    // Verifica que interaction.member y interaction.guild no sean nulos
    if (!interaction.member || !interaction.guild || !interaction.guildId) {
      console.error(
        "Error: interaction.member o interaction.guild o interaction.guildId es nulo."
      );
      await interaction.reply(
        "Ha ocurrido un error al intentar detener la reproducción."
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

    const connection = getVoiceConnection(interaction.guildId);

    if (!connection) {
      await interaction.reply("No estoy conectado a un canal de voz.");
      return;
    }

    // Detiene la reproducción y vacía la cola
    client.music.isPlaying = false;
    client.music.queue.clearQueue();

    // Desconecta el bot del canal de voz
    connection.destroy();

    await interaction.reply(
      "La reproducción se ha detenido y el bot se ha desconectado del canal de voz."
    );
  },
};

export default stop;
