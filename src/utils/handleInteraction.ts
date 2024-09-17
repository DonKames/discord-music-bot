import { CommandInteraction, Interaction } from "discord.js";
import { ExtendedClient } from "../ExtendedClient";
import { errorHandler } from "./errorHandler";
import { fetchSongInfo } from "./musicUtils";
import { replyOrFollowUpInteraction } from "./interactionUtils";

export async function handleInteraction(
  client: ExtendedClient,
  interaction: Interaction
) {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction as CommandInteraction);
    } catch (error) {
      errorHandler(error, interaction);
    }
  }

  if (interaction.isStringSelectMenu()) {
    try {
      const selectedValue = interaction.values[0];

      const songUrl = selectedValue;
      const clientMusic = client.music;

      if (clientMusic && songUrl) {
        const songInfo = await fetchSongInfo(songUrl);

        if (songInfo) {
          clientMusic.queue.addToQueue(songInfo);

          await interaction.reply(`Reproduciendo: **${songInfo.url}**`);
        }
      }
    } catch (error) {
      console.log("🚀 ~ error:", error);

      await interaction.reply({
        content: "Ha ocurrido un error al reproducir la canción",
        ephemeral: true,
      });
    }
  }
}
