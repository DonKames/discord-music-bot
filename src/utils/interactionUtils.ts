import { CommandInteraction, GuildMember } from "discord.js";

export function searchResultMenuActionRow() {}

/**
 * The function `validateInteractionGuildAndMember` checks if the necessary properties are present in a
 * Discord interaction object to ensure the user is in a guild and voice channel before proceeding with
 * a command.
 * @param {CommandInteraction} interaction - The `interaction` parameter in the
 * `validateInteractionGuildAndMember` function is of type `CommandInteraction`. It is used to
 * represent an interaction with a command in Discord, providing information about the user, the
 * command, and the context in which the command was invoked.
 * @returns The function `validateInteractionGuildAndMember` returns a boolean value. It returns `true`
 * if the conditions for interaction member, guild, and guildId are met, and the member is in a voice
 * channel. It returns `false` if any of the conditions are not met or if the member is not in a voice
 * channel.
 */
export async function validateInteractionGuildAndMember(
  interaction: CommandInteraction
): Promise<any> {
  // Verifica que interaction.member, interaction.guild y interaction.guildId no sean nulos
  if (!interaction.member || !interaction.guild || !interaction.guildId) {
    console.error(
      "Error: interaction.member o interaction.guild o interaction.guildId es nulo."
    );

    await interaction.reply(
      "Ha ocurrido un error al intentar reproducir la canción."
    );

    return false;
  }

  // Verifica que el miembro esté en un canal de voz
  const member = await interaction.guild.members.fetch(interaction.user.id);

  // const member = interaction.member as GuildMember;

  if (!member.voice.channelId) {
    await interaction.reply(
      "Debes estar en un canal de voz para usar este comando."
    );
    return false;
  }
  return member;
}
