import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { ExtendedClient } from "../ExtendedClient";
import ytdl from "@distube/ytdl-core";

const list = {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("Add a list of songs.")
    .addStringOption((option) =>
      option
        .setName("listLink")
        .setDescription("The link to the list")
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    console.log("ListCommand");
    const client = ExtendedClient.getInstance();

    try {
      const listLink = interaction.options.get("listLink", true);

      let url = listLink.value as string;

      if (!url) {
        await interaction.reply("Proporcione un link de lista valido");

        return;
      }

      if (ytdl.validateURL(url)) {
        if (!url.includes("list=")) {
          await interaction.reply("Proporcione un link de lista valido");

          return;
        }
      }
    } catch (error) {
      console.log("🚀 ~ execute ~ error:", error);
    }
  },
};
