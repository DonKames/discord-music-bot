import {
  ActionRowBuilder,
  CommandInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { searchYouTube } from "./youtubeUtils";

/**
 * The function `searchResultMenuActionRow` handles searching YouTube for a query, displaying search
 * results in a select menu for user selection.
 * @param {CommandInteraction} interaction - The `interaction` parameter in the
 * `searchResultMenuActionRow` function is of type `CommandInteraction`. This parameter represents the
 * interaction that triggered the command, such as a slash command interaction in a Discord bot. It
 * contains information about the user, the command invoked, and any options or arguments provided
 * @param {string} query - The `query` parameter in the `searchResultMenuActionRow` function is a
 * string that represents the search query used to search for YouTube videos. This query is passed as
 * an argument to the function to retrieve search results based on the user's input.
 * @returns The `searchSongResponse` variable is being returned from the `searchResultMenuActionRow`
 * function.
 */
export async function searchResultMenuActionRow(
  interaction: CommandInteraction,
  query: string
) {
  try {
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
        searchResults.map((video) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(video.videoTitle)
            // .setDescription(video.videoTitle)
            .setValue(video.videoUrl)
        )
      );

    const actionRow =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const searchSongResponse = await interaction.followUp({
      content: "Se encontraron varios resultados. Elige uno para reproducir:",
      components: [actionRow],
    });

    return searchSongResponse;
  } catch (error) {
    console.log("🚀 ~ searchResultMenuActionRow ~ error:", error);
    await interaction.followUp("Hubo un error al procesar la búsqueda.");
  }
}

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
