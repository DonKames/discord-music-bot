import { CommandInteraction } from "discord.js";

export function errorHandler(
  error: any,
  interaction: CommandInteraction | null = null
) {
  console.error("Error:", error);

  if (interaction && (interaction.replied || interaction.deferred)) {
    interaction.followUp("Hubo un error al intentar ejecutar el comando.");
  } else if (interaction) {
    interaction.reply("Hubo un error al intentar ejecutar el comando.");
  }
}
